import fs from 'node:fs';
import path from 'node:path';
import { expect, test as setup } from '@playwright/test';
import { TEST_EMAIL, TEST_PASSWORD } from './helpers';

const authFile = './e2e/.auth/user.json';

/**
 * Setup project: hace login real UNA vez y guarda el storageState para que el
 * proyecto `chromium` reutilice la sesión en cada test (sin re-autenticar).
 */
setup('authenticate E2E user once', async ({ page }) => {
    setup.setTimeout(90_000);
    fs.mkdirSync(path.dirname(authFile), { recursive: true });

    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Contraseña').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /entrar/i }).click();

    await page.waitForURL((url) => /\/admin\/?$|\/admin\/#\//.test(url.href), { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 2 })).toBeVisible({
        timeout: 20_000,
    });

    await page.context().storageState({ path: authFile });
});
