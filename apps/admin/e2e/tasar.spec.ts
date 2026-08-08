import { expect, test } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? 'e2e-test@bienenhaus.local';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'E2eTestPass2026x';

async function login(page) {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Contraseña').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL((url) => /\/admin\/?$/.test(url.pathname), { timeout: 60000 });
}

test.describe('Tasación - wizard completo', () => {
    // Los tests comparten el estado del módulo (borradores en DB): correr en serie
    test.describe.configure({ mode: 'serial' });
    test.use({ retries: 2 });

    test('valida que se requiera superficie para avanzar del paso 2', async ({ page }) => {
        await login(page);
        await page.goto('/admin/#/tasar/nueva');
        await expect(page.locator('h1')).toContainText('Nueva tasación', { timeout: 30000 });

        // Paso 1 (cliente) sin datos → avanza sin validación
        await page.getByRole('button', { name: /siguiente/i }).click();
        await expect(page.locator('.valuation-step-count')).toContainText('Paso 2 de 8', {
            timeout: 10000,
        });

        // Paso 2 (inmueble) sin superficies → toast de error y no avanza
        await page.getByRole('button', { name: /siguiente/i }).click();
        await expect(page.getByText(/falta superficie/i)).toBeVisible({ timeout: 10000 });
        await expect(page.locator('.valuation-step-count')).toContainText('Paso 2 de 8');
    });

    test('crea una tasación completa, la guarda como borrador y la finaliza', async ({ page }) => {
        await login(page);
        await page.goto('/admin/#/tasar/nueva');
        await expect(page.locator('h1')).toContainText('Nueva tasación', { timeout: 30000 });

        // Paso 1 — Datos del cliente
        await page.getByLabel('Solicitante', { exact: true }).fill('E2E Cliente');
        await page.getByLabel('Teléfono', { exact: true }).fill('+54 9 11 5555 6789');
        await page.getByRole('button', { name: /siguiente/i }).click();
        await expect(page.locator('.valuation-step-count')).toContainText('Paso 2 de 8', {
            timeout: 10000,
        });

        // Paso 2 — Datos del inmueble
        await page.getByLabel('Dirección', { exact: true }).fill('Calle E2E 123');
        await page.getByLabel('Sup. terreno (m²)', { exact: true }).fill('500');
        await page.getByLabel('Sup. construida (m²)', { exact: true }).fill('250');
        await page.getByRole('button', { name: /siguiente/i }).click();
        await expect(page.locator('.valuation-step-count')).toContainText('Paso 3 de 8', {
            timeout: 10000,
        });

        // Paso 3 — Descripción propiedad (select de ejemplo)
        await page.locator('#des-tipoconstr').selectOption('Ladrillo');
        await page.getByRole('button', { name: /siguiente/i }).click();
        await expect(page.locator('.valuation-step-count')).toContainText('Paso 4 de 8', {
            timeout: 10000,
        });

        // Paso 4 — Ambientes (1 campo + total calculado)
        await page.getByLabel('Cocina', { exact: true }).fill('1');
        await expect(page.locator('.ambient-total strong')).toHaveText('1', { timeout: 10000 });
        await page.getByRole('button', { name: /siguiente/i }).click();
        await expect(page.locator('.valuation-step-count')).toContainText('Paso 5 de 8', {
            timeout: 10000,
        });

        // Paso 5 — Comodidades (select)
        await page.locator('#com-doble').selectOption('Si');
        await page.getByRole('button', { name: /siguiente/i }).click();
        await expect(page.locator('.valuation-step-count')).toContainText('Paso 6 de 8', {
            timeout: 10000,
        });

        // Paso 6 — Servicios (rubros; defaults válidos, avanzar directo)
        await page.getByRole('button', { name: /siguiente/i }).click();
        await expect(page.locator('.valuation-step-count')).toContainText('Paso 7 de 8', {
            timeout: 10000,
        });

        // Paso 7 — Barrio (uso de suelo)
        await page.getByLabel('% uso residencial', { exact: true }).fill('80');
        await page.getByRole('button', { name: /siguiente/i }).click();
        await expect(page.locator('.valuation-step-count')).toContainText('Paso 8 de 8', {
            timeout: 10000,
        });

        // Paso 8 — Análisis: agregar comparable + observaciones
        await page.getByRole('button', { name: /agregar comparable/i }).click();
        const comparable = page.locator('.comparable-card');
        await expect(comparable).toHaveCount(1, { timeout: 10000 });
        await comparable.getByLabel('Precio (USD)', { exact: true }).fill('125000');
        await comparable.getByLabel('Sup. cubierta (m²)', { exact: true }).fill('250');
        await page.getByLabel('Observaciones', { exact: true }).fill('Test E2E tasación completa');

        // Guardar borrador explícito → toast de confirmación
        await page.getByRole('button', { name: /guardar borrador/i }).click();
        await expect(page.getByText(/borrador guardado/i)).toBeVisible({ timeout: 15000 });

        // Finalizar → toast + redirect a /tasar (hash #/tasar, sin /nueva)
        await page
            .locator('.valuation-nav')
            .getByRole('button', { name: /finalizar/i })
            .click();
        await expect(page.getByText(/tasación finalizada/i)).toBeVisible({ timeout: 15000 });
        await page.waitForURL(
            (url) => url.hash.includes('/tasar') && !url.hash.includes('/tasar/nueva'),
            { timeout: 15000 },
        );

        // La tasación finalizada quedó bloqueada: el módulo vuelve a un formulario limpio
        await expect(page.locator('h1')).toContainText('Nueva tasación', { timeout: 30000 });
        await expect(page.getByText(/borrador automático activo/i)).toBeVisible({
            timeout: 10000,
        });
    });
});
