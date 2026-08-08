import { expect, test } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? 'e2e-test@bienenhaus.local';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'e2e-test-pass-2026x';

async function login(page) {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Contraseña').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL((url) => /\/admin\/?$/.test(url.pathname), { timeout: 60000 });
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 2 })).toBeVisible({
        timeout: 60000,
    });
    await expect(page.locator('.quick-item').first()).toBeVisible({ timeout: 60000 });
    await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible({
        timeout: 30000,
    });
}

test.describe('Visual Regression', () => {
    test.use({ storageState: undefined });

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test.skip('Dashboard - KPI section', async ({ page }) => {
        const kpiSection = page.locator('section[aria-labelledby="kpi-title"]');
        await expect(kpiSection).toBeVisible();
        await expect(kpiSection).toHaveScreenshot('dashboard-kpi.png', {
            threshold: 0.1,
            maxDiffPixels: 5000,
        });
    });

    test.skip('Dashboard - Charts section', async ({ page }) => {
        const chartsSection = page.locator('section[aria-labelledby="charts-title"]');
        await expect(chartsSection).toBeVisible();
        await expect(chartsSection).toHaveScreenshot('dashboard-charts.png', {
            threshold: 0.15,
            maxDiffPixels: 50000,
        });
    });

    test.skip('Propiedades - list view', async ({ page }) => {
        await page.goto('/admin/#/propiedades');
        await page.waitForURL((url) => url.hash.includes('/propiedades'));
        await page.waitForLoadState('networkidle');
        await expect(page.locator('.table tbody tr').first()).toBeVisible({ timeout: 30000 });
        await expect(page).toHaveScreenshot('propiedades-list.png', {
            fullPage: true,
            threshold: 0.15,
            maxDiffPixels: 50000,
        });
    });

    test.skip('Leads - list view', async ({ page }) => {
        await page.goto('/admin/#/leads');
        await page.waitForURL((url) => url.hash.includes('/leads'));
        await page.waitForLoadState('networkidle');
        await expect(page.locator('.table tbody tr').first()).toBeVisible({ timeout: 30000 });
        await expect(page).toHaveScreenshot('leads-list.png', {
            fullPage: true,
            threshold: 0.1,
            maxDiffPixels: 10000,
        });
    });

    test.skip('Agentes - grid view', async ({ page }) => {
        await page.goto('/admin/#/agentes');
        await page.waitForURL((url) => url.hash.includes('/agentes'));
        await page.waitForLoadState('networkidle');
        await expect(page.locator('.agent-card').first()).toBeVisible({ timeout: 30000 });
        await expect(page).toHaveScreenshot('agentes-grid.png', {
            fullPage: true,
            threshold: 0.1,
            maxDiffPixels: 10000,
        });
    });
});
