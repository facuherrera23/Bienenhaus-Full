import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? 'e2e-test@bienenhaus.local';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'e2e-test-pass-2026x';

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
    await expect(page.locator('.quick-item').first()).toBeVisible({ timeout: 60000 });

    // KPIs compute from resolved queries — seed inserts exactly 3 published properties.
    await expect(
      page
        .locator('section[aria-labelledby="kpi-title"]')
        .locator('.kpi-card')
        .filter({ hasText: 'Propiedades Publicadas' })
        .locator('.kpi-value'),
    ).toHaveText('3', { timeout: 30000 });
  });

  test('carga la tabla de leads con el agente asignado desplegado', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('/admin/login');

    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Contraseña').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();

    await page.waitForURL((url) => /\/admin\/?$/.test(url.pathname), { timeout: 60000 });

    const leadsLink = page.getByRole('link', { name: 'Leads', exact: true });
    await expect(leadsLink).toBeVisible({ timeout: 30000 });
    await leadsLink.click();
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