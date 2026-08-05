import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? 'e2e-test@bienenhaus.local';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'e2e-test-password-123';

async function login(page) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(TEST_EMAIL);
  await page.getByLabel('Contraseña').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL((url) => /\/admin\/?$/.test(url.pathname), { timeout: 60000 });
}

async function goToOwners(page) {
  await page.getByRole('link', { name: 'Propietarios', exact: true }).click();
  await page.waitForURL(
    (url) => url.hash.includes('/propietarios') && !url.hash.includes('/propietarios/nuevo'),
  );
}

async function createOwner(page, name) {
  const uniqueId = Date.now().toString().slice(-8);
  await page.getByRole('link', { name: 'Nuevo propietario' }).first().click();
  await page.waitForURL((url) => url.hash.includes('/propietarios/nuevo'));

  await page.getByLabel('Nombre completo').fill(name);
  await page.getByLabel('Email').fill(`e2e.${name.replace(/[^a-zA-Z0-9]/g, '')}@test.local`);
  await page.getByLabel('Teléfono').fill('+54 9 11 5555 1234');
  await page.getByLabel('DNI / CUIT').fill(`301112${uniqueId}`);
  await page.getByLabel('Contacto preferido').selectOption('email');
  await page.getByLabel('Dirección completa').fill('Calle E2E 123, CABA');

  await page.getByRole('button', { name: 'Crear propietario' }).click();
  await page.waitForURL(
    (url) => url.hash.includes('/propietarios') && !url.hash.includes('/propietarios/nuevo'),
    { timeout: 30000 },
  );
}

test.describe('Propietarios - CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('crea un propietario y lo muestra en el grid', async ({ page }) => {
    const name = `E2E Propietario ${Date.now()}`;
    await goToOwners(page);
    await createOwner(page, name);

    const card = page.locator('.owner-card').filter({ hasText: name });
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card).toContainText(`e2e.${name.replace(/[^a-zA-Z0-9]/g, '')}@test.local`);
    await expect(card).toContainText('0 propiedades');
  });

  test('edita un propietario desde el detalle', async ({ page }) => {
    const name = `E2E Editable ${Date.now()}`;
    const newEmail = `editado.${Date.now()}@test.local`;
    await goToOwners(page);
    await createOwner(page, name);

    // Abrir detalle desde la card
    await page.locator('.owner-card').filter({ hasText: name }).click();
    await page.waitForURL((url) => /\/propietarios\/[0-9a-f-]+$/.test(url.hash), {
      timeout: 30000,
    });
    await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();

    // Editar email
    await page.getByRole('button', { name: /editar/i }).click();
    const emailField = page.getByLabel('Email');
    await emailField.fill(newEmail);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    // El detalle refresca con el nuevo email
    await expect(page.getByText('Propietario actualizado')).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`a[href="mailto:${newEmail}"]`)).toBeVisible({ timeout: 10000 });
  });

  test('envía a papelera y restaura', async ({ page }) => {
    const name = `E2E Papelera ${Date.now()}`;
    await goToOwners(page);
    await createOwner(page, name);

    // Detalle → Papelera (confirm) → redirect al listado
    await page.locator('.owner-card').filter({ hasText: name }).click();
    await page.waitForURL((url) => /\/propietarios\/[0-9a-f-]+$/.test(url.hash), {
      timeout: 30000,
    });
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: /papelera/i }).click();
    await page.waitForURL(
      (url) => url.hash.includes('/propietarios') && !url.hash.includes('/propietarios/nuevo'),
      { timeout: 30000 },
    );

    // Ya no está en el grid de activos
    await expect(page.locator('.owner-card').filter({ hasText: name })).toHaveCount(0, {
      timeout: 10000,
    });

    // Toggle papelera → aparece en la tabla de eliminados
    await page.getByRole('button', { name: 'Papelera' }).click();
    const trashRow = page.locator('table.table tbody tr').filter({ hasText: name });
    await expect(trashRow).toBeVisible({ timeout: 10000 });

    // Restaurar
    await trashRow.getByTitle('Restaurar').click();
    await expect(page.getByText('Restaurado')).toBeVisible({ timeout: 10000 });

    // Volver a activos → la card reaparece
    await page.getByRole('button', { name: 'Ver activos' }).click();
    await expect(page.locator('.owner-card').filter({ hasText: name })).toBeVisible({
      timeout: 10000,
    });
  });
});
