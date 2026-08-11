import { test, expect } from '@playwright/test';

test.describe('Leads Critical Flows', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin
        await page.goto('/login');
        await page.fill('[name="email"]', 'admin@bienenhaus.com');
        await page.fill('[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/leads/);
    });

    test('Create lead → Kanban → Status flow → Won', async ({ page }) => {
        // 1. Go to leads list
        await page.goto('/leads');
        await expect(page.locator('h2')).toContainText('Leads');

        // 2. Create new lead
        await page.click('a:has-text("Nuevo lead")');
        await page.fill('[name="name"]', 'E2E Test');
        await page.fill('[name="last_name"]', 'Lead');
        await page.fill('[name="email"]', 'e2e@test.com');
        await page.fill('[name="phone"]', '+54 9 11 1234-5678');
        await page.fill('[name="city"]', 'Córdoba');
        await page.selectOption('[name="intent"]', 'comprar');
        await page.selectOption('[name="source"]', 'landing_form');
        await page.fill('[name="message"]', 'Quiero comprar una casa en zona norte');
        await page.click('button:has-text("Guardar")');

        // Wait for redirect to detail page
        await expect(page).toHaveURL(/\/leads\/.+/);
        await expect(page.locator('.toast-success')).toBeVisible();

        // 3. Verify lead appears in "nuevo" column in Kanban
        await page.goto('/leads');
        await page.click('button:has-text("Kanban")');
        await expect(page.locator('[data-status="nuevo"] .kanban-card:has-text("E2E Test")')).toBeVisible();

        // 4. Drag to "contactado"
        const nuevoColumn = page.locator('[data-status="nuevo"]');
        const contactadoColumn = page.locator('[data-status="contactado"]');
        const card = nuevoColumn.locator('.kanban-card:has-text("E2E Test")');
        await card.dragTo(contactadoColumn);

        // Wait for toast and verify
        await expect(page.locator('.toast-success')).toBeVisible();

        // 5. Advance through pipeline: contactado → calificado → en_proceso → cerrado_ganado
        const statuses = ['calificado', 'en_proceso', 'cerrado_ganado'];
        for (const status of statuses) {
            const currentColumn = page.locator(`[data-status="${status === 'calificado' ? 'contactado' : statuses[statuses.indexOf(status) - 1]}"]`);
            const targetColumn = page.locator(`[data-status="${status}"]`);
            const card = currentColumn.locator('.kanban-card:has-text("E2E Test")');
            await card.dragTo(targetColumn);
            await expect(page.locator('.toast-success')).toBeVisible();
        }

        // 6. Verify in "cerrado_ganado" column
        await expect(page.locator('[data-status="cerrado_ganado"] .kanban-card:has-text("E2E Test")')).toBeVisible();
    });

    test('Bulk auto-assign leads', async ({ page }) => {
        // 1. Go to leads list
        await page.goto('/leads');

        // 2. Select multiple leads (checkboxes)
        const checkboxes = page.locator('input[type="checkbox"][aria-label^="Seleccionar"]');
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();

        // 3. Open bulk actions dropdown
        await page.click('button:has-text("Acciones")');
        await page.click('li:has-text("Auto-asignar")');

        // 4. Confirm
        await page.click('button:has-text("Confirmar")');

        // 5. Verify toast
        await expect(page.locator('.toast-success')).toBeVisible();
        await expect(page.locator('.toast-success')).toContainText('asignado');

        // 6. Verify leads have assigned agent
        await page.goto('/leads');
        await expect(page.locator('td:has-text("E2E Test") + td + td:has-text("Agente")')).toBeVisible();
    });

    test('CSV import with deduplication', async ({ page }) => {
        // 1. Go to leads list
        await page.goto('/leads');

        // 2. Click import CSV
        await page.click('label:has-text("Importar CSV")');
        await page.setInputFiles('input[type="file"]', 'test/fixtures/leads-import.csv');

        // 3. Wait for preview
        await expect(page.locator('strong:has-text("Válidos")')).toBeVisible();
        await expect(page.locator('strong:has-text("Errores")')).toBeVisible();

        // 4. Confirm import
        await page.click('button:has-text("Importar")');
        await expect(page.locator('.toast-success')).toBeVisible();

        // 5. Verify imported leads appear
        await expect(page.locator('.property-card:has-text("CSV Test Lead")')).toBeVisible();
    });

    test('Lead detail → WhatsApp click', async ({ page }) => {
        // 1. Go to lead detail
        await page.goto('/leads');
        const firstLead = page.locator('.kanban-card').first();
        await firstLead.click();

        // 2. Verify detail page loaded
        await expect(page).toHaveURL(/\/leads\/.+/);
        await expect(page.locator('h2')).toContainText('Detalle del lead');

        // 3. Click WhatsApp button
        const whatsappButton = page.locator('button:has-text("WhatsApp")');
        await expect(whatsappButton).toBeVisible();
        
        // Mock the window.open to verify URL
        page.on('popup', (popup) => {
            expect(popup.url()).toContain('wa.me');
            expect(popup.url()).toContain('54');
        });
        
        await whatsappButton.click();
    });
});