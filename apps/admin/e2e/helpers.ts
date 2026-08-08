import type { Page } from '@playwright/test';

export const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? 'e2e-test@bienenhaus.local';
export const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'e2e-test-pass-2026x';

/**
 * Loguea en el admin (idempotente: si ya hay sesión activa, no re-loguea).
 * Espera la redirección a /admin/#/ y a que la sesión esté persistida en
 * localStorage (los queries de la app dependen del token).
 */
export async function login(page: Page): Promise<void> {
    await page.goto('/admin/login');
    // Si ya estamos logueados, la página de login muestra "Ya tienes una sesión activa" y no redirige
    const yaLogueado = await page
        .locator('text=/Ya tienes una sesión/i')
        .isVisible()
        .catch(() => false);
    if (!yaLogueado) {
        await page.getByLabel('Email').fill(TEST_EMAIL);
        await page.getByLabel('Contraseña').fill(TEST_PASSWORD);
        await page.getByRole('button', { name: /entrar/i }).click();
        // El login redirige a '/' (Dashboard) que en hash routing es /admin/#/
        await page.waitForURL((url) => /\/admin\/#\//.test(url.href), { timeout: 60000 });
    }
    // Esperar a que la sesión y el rol se propaguen completamente
    await page.waitForFunction(
        () => {
            const storage = window.localStorage;
            const authKeys = Object.keys(storage).filter(
                (k) => k.startsWith('sb-') && k.endsWith('-auth-token'),
            );
            if (authKeys.length === 0) return false;
            try {
                const session = JSON.parse(storage.getItem(authKeys[0]));
                return !!session?.user?.email;
            } catch {
                return false;
            }
        },
        { timeout: 15000 },
    );
}
