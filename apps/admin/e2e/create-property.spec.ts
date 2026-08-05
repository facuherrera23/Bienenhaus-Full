import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? 'e2e-test@bienenhaus.local';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'e2e-test-pass-2026x';

async function login(page) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(TEST_EMAIL);
  await page.getByLabel('Contraseña').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL((url) => /\/admin\/?$/.test(url.pathname), { timeout: 60000 });
}

test.describe('Propiedades - creación', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('valida que el título sea obligatorio', async ({ page }) => {
    await page.getByRole('link', { name: 'Propiedades', exact: true }).click();
    await page.waitForURL((url) => url.hash.includes('/propiedades'));
    await page.getByRole('link', { name: 'Nueva propiedad' }).click();
    await page.waitForURL((url) => url.hash.includes('/propiedades/nueva'));

    // Guardar sin título → toast de error y sin navegación
    await page.getByRole('button', { name: /guardar/i }).click();
    await expect(page.getByText(/falta el título/i)).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/admin\/#\/propiedades\/nueva$/);
  });

  test('crea una propiedad, la lista en el catálogo y la limpia al final', async ({ page }) => {
    const title = `E2E Casa ${Date.now()}`;

    await page.getByRole('link', { name: 'Propiedades', exact: true }).click();
    await page.waitForURL((url) => url.hash.includes('/propiedades'));
    await page.getByRole('link', { name: 'Nueva propiedad' }).click();
    await page.waitForURL((url) => url.hash.includes('/propiedades/nueva'));

    // Formulario: título + precio (el resto queda con defaults)
    await page.getByPlaceholder('Ej: Casa en Villa Belgrano').fill(title);
    await page.getByPlaceholder('Ej: 285000').fill('285000');
    await page.getByRole('button', { name: /guardar/i }).click();

    // Redirige al listado
    await page.waitForURL(
      (url) => url.hash.includes('/propiedades') && !url.hash.includes('/propiedades/nueva'),
      { timeout: 30000 },
    );

    // Aparece en la tabla con estado Borrador (default)
    await page.getByPlaceholder('Buscar por título o zona…').fill(title);
    await page.waitForTimeout(500);
    const row = page.locator('table.table tbody tr').filter({ hasText: title });
    await expect(row).toHaveCount(1, { timeout: 10000 });
    await expect(row).toContainText('Borrador');

    // Cleanup: abrir el detalle y mover a papelera (soft delete) para no
    // alterar el estado del seed para otros specs (admin-pages espera 3).
    await row.getByText(title).click();
    await page.waitForURL((url) => /\/propiedades\/[0-9a-f-]+$/.test(url.hash), {
      timeout: 30000,
    });
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: /mover a papelera/i }).click();
    await page.waitForURL(
      (url) => url.hash.includes('/propiedades') && !url.hash.includes('/propiedades/nueva'),
      { timeout: 30000 },
    );
    await expect(
      page.locator('table.table tbody tr').filter({ hasText: title }),
    ).toHaveCount(0, { timeout: 10000 });
  });
});
