import { expect, test } from '@playwright/test';
import { login } from './helpers';

test.describe('Tasación - formulario completo', () => {
    // Los tests comparten el estado del módulo (borradores en DB): correr en serie
    test.describe.configure({ mode: 'serial', retries: 2 });

    test('valida que se requiera superficie para finalizar', async ({ page }) => {
        await login(page);
        await page.goto('/admin/#/tasar/nueva');
        await expect(page.locator('h1')).toContainText('Nueva tasación', { timeout: 30000 });

        // Sin borrador previo no se puede finalizar
        await page.getByRole('button', { name: /finalizar/i }).first().click();
        await expect(page.getByText(/no hay borrador/i)).toBeVisible({ timeout: 10000 });

        // Datos mínimos de cliente + borrador explícito
        await page.getByLabel('Solicitante', { exact: true }).fill('E2E Cliente');
        await page.getByLabel('Teléfono', { exact: true }).fill('+54 9 11 5555 6789');
        await page.getByRole('button', { name: /guardar borrador/i }).first().click();
        await expect(page.getByText(/borrador guardado/i)).toBeVisible({ timeout: 15000 });

        // Finalizar sin superficie → toast de error del schema y no navega
        await page.getByRole('button', { name: /finalizar/i }).first().click();
        await expect(page.getByText(/datos incompletos/i)).toBeVisible({ timeout: 10000 });
        await expect(
            page.getByText(/se requiere al menos superficie terreno o superficie construida/i),
        ).toBeVisible({ timeout: 10000 });
        await expect(page.locator('h1')).toContainText('Nueva tasación', { timeout: 10000 });
    });

    test('crea una tasación completa, la guarda como borrador y la finaliza', async ({ page }) => {
        await login(page);
        await page.goto('/admin/#/tasar/nueva');
        await expect(page.locator('h1')).toContainText('Nueva tasación', { timeout: 30000 });

        // Datos del cliente
        await page.getByLabel('Solicitante', { exact: true }).fill('E2E Cliente');
        await page.getByLabel('Teléfono', { exact: true }).fill('+54 9 11 5555 6789');

        // Datos del inmueble (superficies requeridas por el schema)
        await page.getByLabel('Dirección', { exact: true }).fill('Calle E2E 123');
        await page.getByLabel('Sup. terreno (m²)', { exact: true }).fill('500');
        await page.getByLabel('Sup. construida (m²)', { exact: true }).fill('250');

        // Descripción propiedad (select de ejemplo)
        await page.locator('#des-tipoconstr').selectOption('Ladrillo');

        // Ambientes (1 campo + total calculado)
        await page.getByLabel('Cocina', { exact: true }).fill('1');
        await expect(page.locator('[class*="ambient-total"] strong')).toHaveText('1', {
            timeout: 10000,
        });

        // Comodidades (select)
        await page.locator('#com-doble').selectOption('Si');

        // Barrio (uso de suelo)
        await page.getByLabel('% uso residencial', { exact: true }).fill('80');

        // Análisis: agregar comparable + observaciones
        await page.getByRole('button', { name: /agregar comparable/i }).click();
        // CSS Modules: el contenedor es el único que contiene un head (evita head/title)
        const comparable = page.locator('[class*="comparable-card"]:has([class*="comparable-card-head"])');
        await expect(comparable).toHaveCount(1, { timeout: 10000 });
        await comparable.getByLabel('Precio (USD)', { exact: true }).fill('125000');
        await comparable.getByLabel('Sup. cubierta (m²)', { exact: true }).fill('250');
        await page.getByLabel('Observaciones', { exact: true }).fill('Test E2E tasación completa');

        // Guardar borrador explícito → toast de confirmación
        await page.getByRole('button', { name: /guardar borrador/i }).first().click();
        await expect(page.getByText(/borrador guardado/i)).toBeVisible({ timeout: 15000 });

        // Finalizar → toast + redirect a /tasar (hash #/tasar, sin /nueva)
        await page.getByRole('button', { name: /finalizar/i }).first().click();
        await expect(page.getByText(/tasación finalizada/i)).toBeVisible({ timeout: 15000 });
        await page.waitForURL(
            (url) => url.hash.includes('/tasar') && !url.hash.includes('/tasar/nueva'),
            { timeout: 15000 },
        );

        // El listado ordena por updated_at desc; .first() = la recién finalizada
        // (corridas previas acumulan filas de E2E Cliente en la DB local).
        await expect(page.locator('h1')).toContainText('Tasaciones', { timeout: 30000 });
        const row = page.locator('table tbody tr').filter({ hasText: 'E2E Cliente' }).first();
        await expect(row).toContainText('Finalizada');
    });
});
