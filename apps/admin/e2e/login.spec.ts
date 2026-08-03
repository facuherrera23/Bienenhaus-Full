import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? 'e2e-test@bienenhaus.local';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'e2e-test-password-123';

test.describe('Login', () => {
  test('muestra error con credenciales inválidas', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill('noexiste@bienenhaus.local');
    await page.getByLabel('Contraseña').fill('password-incorrecta');
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page.getByText(/credenciales incorrectas/i)).toBeVisible();
  });

  test('loguea correctamente y redirige al dashboard', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('/admin/login');

    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Contraseña').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();

    // The app redirects to the base URL ('/admin/') + '#/' after SIGNED_IN
    await page.waitForURL((url) => /\/admin\/?$/.test(url.pathname), { timeout: 60000 });

    // Page heading is the h2 — the topbar also renders an h1 "Dashboard", so scope by level
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 2 })).toBeVisible({ timeout: 30000 });

    // Data path: the shell rendered above, but the dashboard must also load data through
    // react-query -> Supabase -> RLS. The quick-list only renders when the properties
    // query returns rows (is_staff passes), so its presence proves the full data path.
    await expect(page.locator('.quick-item').first()).toBeVisible({ timeout: 30000 });

    // KPIs compute from resolved queries — seed inserts exactly 3 published properties.
    // Scope to the "Indicadores Clave" section: DashboardCharts renders a second
    // "Propiedades Publicadas" kpi-card, which would make this locator ambiguous.
    await expect(
      page
        .locator('section[aria-labelledby="kpi-title"]')
        .locator('.kpi-card')
        .filter({ hasText: 'Propiedades Publicadas' })
        .locator('.kpi-value'),
    ).toHaveText('3');
  });

  test('carga la tabla de leads con el agente asignado desplegado', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('/admin/login');

    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Contraseña').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();

    await page.waitForURL((url) => /\/admin\/?$/.test(url.pathname), { timeout: 60000 });

    // Navigate through the sidebar — hash routing lands on '#/leads'.
    // The dashboard also renders a "Ver leads" link, so match the label exactly.
    await page.getByRole('link', { name: 'Leads', exact: true }).click();
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