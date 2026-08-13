import { expect, test } from '@playwright/test';
import { TEST_EMAIL, TEST_PASSWORD } from './helpers';

test.describe('Login', () => {
    test('muestra error con credenciales inválidas', async ({ page }) => {
        await page.goto('/admin/login');
        await page.getByLabel('Email').fill('noexiste@bienenhaus.local');
        await page.getByLabel('Contraseña').fill('password-incorrecta');
        await page.getByRole('button', { name: /entrar/i }).click();

        await expect(page.getByText(/credenciales incorrectas/i)).toBeVisible();
    });

    test('loguea correctamente y redirige al dashboard', async ({ page }) => {
        test.setTimeout(120000);
        await page.goto('/admin/login');

        await page.getByLabel('Email').fill(TEST_EMAIL);
        await page.getByLabel('Contraseña').fill(TEST_PASSWORD);
        await page.getByRole('button', { name: /entrar/i }).click();

        // Wait for redirect to admin dashboard
        await page.waitForURL((url) => /\/admin\/?$/.test(url.pathname), { timeout: 60000 });

        // Wait for dashboard to fully load (heading + data)
        const dashboardHeading = page.getByRole('heading', { name: 'Dashboard', level: 2 });
        await expect(dashboardHeading).toBeVisible({ timeout: 60000 });

        // Wait for data queries to resolve (quick-list renders when properties query returns)
        await expect(page.locator('li[class*="quick-item"]').first()).toBeVisible({
            timeout: 60000,
        });

        // KPIs compute from resolved queries — seed inserts exactly 3 published properties.
        await expect(
            page
                .locator('section[aria-labelledby="kpi-title"]')
                .locator('[class*="kpiCard"]')
                .filter({ hasText: 'Propiedades Publicadas' })
                .locator('[class*="kpiValue"]'),
        ).toHaveText('3', { timeout: 30000 });
    });

    test('carga la tabla de leads con el agente asignado desplegado', async ({ page }) => {
        test.setTimeout(90000);
        await page.goto('/admin/login');

        await page.getByLabel('Email').fill(TEST_EMAIL);
        await page.getByLabel('Contraseña').fill(TEST_PASSWORD);
        await page.getByRole('button', { name: /entrar/i }).click();

        await page.waitForURL((url) => /\/admin\/?$/.test(url.pathname), { timeout: 60000 });

        await page.goto('/admin/#/leads');
        await page.waitForURL((url) => url.hash.includes('/leads'));

        // Seed inserts exactly 5 leads. Row presence proves the list query resolved.
        const rows = page.locator('.table tbody tr');
        await expect(rows).toHaveCount(5, { timeout: 30000 });

        // 'agent' arrives from PostgREST as an embedded object (agent:agents(name));
        // the row mapper must flatten it to a string — otherwise rendering the cell
        // throws "Objects are not valid as a child" and the page crashes.
        // All seeded leads are assigned to María Fernández.
        await expect(rows.first()).toContainText('Fernández');
    });
});
