import { test, expect } from '@playwright/test';

test.describe('Visits Critical Flows', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin
        await page.goto('/login');
        await page.fill('[name="email"]', 'admin@bienenhaus.com');
        await page.fill('[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/visitas/);
    });

    test('Create visit with conflict detection → QR check-in → complete', async ({ page }) => {
        // 1. Go to new visit page
        await page.goto('/visitas/nueva');

        // 2. Fill basic info
        await page.fill('[name="title"]', 'E2E Test Visit');
        await page.fill('[name="starts_at"]', '2024-01-15T10:00:00');
        await page.fill('[name="ends_at"]', '2024-01-15T11:00:00');
        await page.selectOption('[name="agent_id"]', { index: 1 });
        await page.selectOption('[name="status"]', 'programada');
        
        // 3. Try to create conflicting visit
        await page.fill('[name="title"]', 'Conflicting Visit');
        await page.fill('[name="starts_at"]', '2024-01-15T10:30:00');
        await page.fill('[name="ends_at"]', '2024-01-15T11:30:00');
        await page.click('button:has-text("Guardar")');
        
        // Should show conflict error
        await expect(page.locator('.toast-error')).toBeVisible();
        await expect(page.locator('.toast-error')).toContainText('Conflicto con');

        // 4. Fix timing to avoid conflict
        await page.fill('[name="starts_at"]', '2024-01-15T14:00:00');
        await page.fill('[name="ends_at"]', '2024-01-15T15:00:00');
        await page.click('button:has-text("Guardar")');
        await expect(page.locator('.toast-success')).toBeVisible();

        // 5. Generate QR code
        await page.goto('/visitas');
        const firstVisit = page.locator('.day-visit-chip').first();
        await firstVisit.locator('button.chip-qr-btn').click();
        
        // Wait for QR modal
        await expect(page.locator('.modal-card')).toBeVisible();
        await expect(page.locator('.qr-display img')).toBeVisible();

        // 5. Simulate QR check-in (mock geolocation)
        await page.evaluate(() => {
            navigator.geolocation.getCurrentPosition = (success) => {
                success({
                    coords: { latitude: -34.6037, longitude: -58.3816 }
                });
            };
        });
        
        // Click check-in button (would be in mobile app, here we simulate)
        // In real app, agent would scan QR with mobile app
        await page.click('button:has-text("Check-in")');
        
        // Wait for success
        await expect(page.locator('.toast-success')).toContainText('Check-in registrado');

        // 6. Verify visit status changed to "en_curso"
        await page.reload();
        const visitCard = page.locator('.visit-card:has-text("E2E Test Visit")');
        await expect(visitCard).toContainText('en_curso');

        // 7. Complete visit
        await page.click('[data-status="en_curso"] .visit-card:has-text("E2E Test Visit") button:has-text("Completar")');
        await expect(page.locator('.toast-success')).toContainText('completada');

        // Verify status changed
        await expect(page.locator('[data-status="completada"] .visit-card:has-text("E2E Test Visit")')).toBeVisible();
    });

    test('Create recurring visit with exceptions', async ({ page }) => {
        // 1. Create base visit
        await page.goto('/visitas/nueva');
        await page.fill('[name="title"]', 'Weekly Team Meeting');
        await page.fill('[name="starts_at"]', '2024-01-15T10:00:00');
        await page.fill('[name="ends_at"]', '2024-01-15T11:00:00');
        await page.selectOption('[name="agent_id"]', { index: 1 });
        await page.selectOption('[name="status"]', 'programada');
        
        // 5. Enable recurring
        await page.click('button:has-text("Crear recurrente")');
        
        // Configure recurrence
        await page.selectOption('[name="frequency"]', 'weekly');
        await page.fill('[name="interval"]', '1');
        await page.check('[name="days_of_week"][value="1"]'); // Monday
        await page.fill('[name="end_date"]', '2024-03-15');
        
        // Add exceptions (holidays)
        await page.fill('[name="exceptions"]', '2024-01-29'); // Holiday
        
        await page.click('button:has-text("Crear recurrente")');
        
        // Verify occurrences generated (skipping exception)
        await expect(page.locator('.toast-success')).toBeVisible();
        
        // Navigate to exception date - should not have visit
        await page.goto('/visitas?view=month&date=2024-01-29');
        await expect(page.locator('.day-visit-chip:has-text("Weekly Team Meeting")')).not.toBeVisible();
    });

    test('Drag-drop move visit between days', async ({ page }) => {
        // 1. Go to week view
        await page.goto('/visitas');
        await page.click('button:has-text("Semana")');
        
        // 2. Find visit and drag to another day
        const visitCard = page.locator('.week-visit:has-text("E2E Test Visit")');
        const targetDay = page.locator('.week-day-column').nth(3); // Wednesday
        
        await visitCard.dragTo(targetDay);
        
        // 3. Verify toast and position updated
        await expect(page.locator('.toast-success')).toContainText('actualizada');
        
        // 4. Verify visit moved in calendar
        await page.reload();
        const wednesdayColumn = page.locator('.week-day-column').nth(3);
        await expect(wednesdayColumn.locator('.week-visit:has-text("E2E Test Visit")')).toBeVisible();
    });

    test('QR check-in with geofencing', async ({ page }) => {
        // 1. Generate QR for a visit
        await page.goto('/visitas');
        const visitCard = page.locator('.day-visit-chip').first();
        await visitCard.locator('button.chip-qr-btn').click();
        
        // 2. Wait for QR modal
        await expect(page.locator('.modal-card')).toBeVisible();
        
        // 3. Mock geolocation for check-in (inside valid range)
        await page.evaluate(() => {
            navigator.geolocation.getCurrentPosition = (success) => {
                success({
                    coords: { latitude: -34.6037, longitude: -58.3816 }
                });
            };
        });
        
        // 4. Simulate check-in via QR scan (would be done via mobile app)
        // Here we directly call the check-in endpoint
        const qrCode = await page.evaluate(() => {
            const img = document.querySelector('.qr-display img');
            return img?.src || '';
        });
        
        // Extract visit ID from QR code URL
        const visitIdMatch = qrCode.match(/visitId=([^&]+)/);
        if (visitIdMatch) {
            const response = await page.request.post(`${process.env.VITE_SUPABASE_URL}/functions/v1/qr-checkin`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
                data: {
                    visitId: visitIdMatch[1],
                    agentLat: -34.6037,
                    agentLng: -58.3816,
                }
            });
            
            expect(response.ok()).toBeTruthy();
            const result = await response.json();
            expect(result.success).toBe(true);
        }
    });
});