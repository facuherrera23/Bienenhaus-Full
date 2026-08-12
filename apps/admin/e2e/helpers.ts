import { expect , type Page } from '@playwright/test';


export const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? 'e2e-test@bienenhaus.local';
export const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'E2eTestPass2026x';

const LOGIN_RACE_TIMEOUT = 15_000;

/**
 * Asegura una sesión válida en el admin.
 *
 * El proyecto Playwright restaura la sesión vía storageState (auth.setup.ts), así
 * que normalmente la app monta el Dashboard directo. Si la sesión expiró o no es
 * válida, el route guard redirige a /admin/login y este helper hace un login real
 * como fallback.
 *
 * NO se usa un check one-shot post-navegación (siempre daba false mientras la app
 * inicializa auth async): se espera de forma determinista a que aparezca O el
 * Dashboard O el formulario de login, y se actúa según el resultado.
 */
export async function login(page: Page): Promise<void> {
    await page.goto('/admin/#/');

    const dashboard = page.getByRole('heading', { name: 'Dashboard', level: 2 });
    const emailInput = page.getByLabel('Email');

    const outcome = await Promise.race([
        dashboard
            .waitFor({ state: 'visible', timeout: LOGIN_RACE_TIMEOUT })
            .then(() => 'dashboard' as const),
        emailInput
            .waitFor({ state: 'visible', timeout: LOGIN_RACE_TIMEOUT })
            .then(() => 'login' as const),
    ]).catch(() => 'timeout' as const);

    if (outcome === 'dashboard') return;

    if (outcome === 'timeout') {
        throw new Error(
            `login(): ni el Dashboard ni el formulario de login aparecieron en ` +
                `${LOGIN_RACE_TIMEOUT}ms. ¿Está corriendo el dev server y Supabase local?`,
        );
    }

    // Fallback: la sesión restaurada no era válida → login real (la app ya nos
    // redirigió al formulario, no hace falta otra navegación).
    await emailInput.fill(TEST_EMAIL);
    await page.getByLabel('Contraseña').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL((url) => /\/admin\/#\//.test(url.href), { timeout: 20_000 });
    await expect(dashboard).toBeVisible({ timeout: 15_000 });
}
