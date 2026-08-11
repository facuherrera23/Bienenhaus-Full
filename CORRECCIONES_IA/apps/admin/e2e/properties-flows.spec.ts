import { test, expect } from '@playwright/test';

test.describe('Properties Critical Flows', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin
        await page.goto('/login');
        await page.fill('[name="email"]', 'admin@bienenhaus.com');
        await page.fill('[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/propiedades/);
    });

    test('Create property with images → reorder → set cover → publish', async ({ page }) => {
        // 1. Go to new property page
        await page.goto('/propiedades/nueva');
        
        // 2. Fill basic tab
        await page.fill('[name="title"]', 'E2E Test Property');
        await page.fill('[name="price"]', '250000');
        await page.selectOption('[name="listing_type"]', 'venta');
        await page.selectOption('[name="currency"]', 'USD');
        await page.selectOption('[name="status"]', 'publicada');
        
        // 3. Fill required location
        await page.selectOption('[name="location_id"]', { index: 1 }); // first available location
        
        // 4. Upload images (mock files)
        await page.setInputFiles('input[type="file"]', [
            'test/fixtures/property-1.jpg',
            'test/fixtures/property-2.jpg',
            'test/fixtures/property-3.jpg',
        ]);
        
        // Wait for uploads
        await expect(page.locator('.image-gallery-item')).toHaveCount(3);
        
        // 5. Drag reorder: drag 3rd to 1st position
        const items = page.locator('.image-gallery-item');
        await items.nth(2).dragTo(items.nth(0));
        
        // Verify reorder persisted (position badge)
        await expect(items.nth(0)).toContainText('3'); // was 3rd, now 1st
        
        // 6. Click star on 2nd image (now 1st after reorder) to set cover
        await items.nth(0).locator('button:has(.lucide-star)').click();
        await expect(items.nth(0)).toHaveClass(/is-cover/);
        
        // 7. Fill remaining required fields
        await page.fill('[name="area_total"]', '200');
        await page.fill('[name="bedrooms"]', '3');
        await page.fill('[name="bathrooms"]', '2');
        
        // 8. Publish
        await page.click('button:has-text("Guardar")');
        
        // Wait for success toast
        await expect(page.locator('.toast-success')).toBeVisible();
        
        // 9. Verify landing shows property
        await page.goto('/');
        await expect(page.locator('.property-card:has-text("E2E Test Property")')).toBeVisible();
    });

    test('Soft delete → Trash → Restore', async ({ page }) => {
        // 1. Go to existing property
        await page.goto('/propiedades');
        const firstProperty = page.locator('.property-card').first();
        await firstProperty.click();
        
        // 2. Click delete → confirm
        await page.click('button:has-text("Papelera")');
        await page.click('button:has-text("Confirmar")');
        
        // 3. Go to trash
        await page.goto('/papelera');
        
        // 4. Verify property in trash
        await expect(page.locator('tr:has-text("E2E Test Property")')).toBeVisible();
        
        // 5. Click restore
        await page.click('button[title="Restaurar"]');
        
        // 6. Verify back in active list
        await page.goto('/propiedades');
        await expect(page.locator('.property-card:has-text("E2E Test Property")')).toBeVisible();
    });

    test('Duplicate property', async ({ page }) => {
        // 1. Go to property detail
        await page.goto('/propiedades');
        const firstProperty = page.locator('.property-card').first();
        await firstProperty.click();
        
        // 2. Click duplicate
        await page.click('button:has-text("Duplicar")');
        
        // 3. Verify redirected to new property
        await expect(page).toHaveURL(/\/propiedades\/.+/);
        
        // 3. Verify title has "(Copia)"
        await expect(page.locator('[name="title"]')).toHaveValue(/\(Copia\)$/);
        
        // 4. Verify status is borrador
        await expect(page.locator('[name="status"]')).toHaveValue('borrador');
        
        // 5. Verify no images in gallery
        await expect(page.locator('.image-gallery-item')).toHaveCount(0);
    });
});