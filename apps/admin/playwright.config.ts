import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Vite's loadEnv gives `.env.local` precedence over `.env`, so a developer's
// local override pointing at the cloud project would silently make the E2E
// stack log in against production. Explicitly feed the webServer the local
// `.env` values as process env (which Vite always honors first), while CI's
// env vars keep priority when present.
function loadDotEnv(file: string): Record<string, string> {
    const vars: Record<string, string> = {};
    if (!fs.existsSync(file)) return vars;
    for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
        const line = raw.trim();
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq === -1) continue;
        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (key) vars[key] = value;
    }
    return vars;
}

// adminDir = apps/admin. process.cwd() NO sirve acá: al correr
// `npx playwright test --config apps/admin/...` desde el root del repo, cwd =
// root y `.env` no existe → el webServer no inyectaría nada y Vite caería en
// `.env.local` (que apunta al cloud en este repo).
const adminDir = path.dirname(fileURLToPath(import.meta.url));
const localEnv = loadDotEnv(path.resolve(adminDir, '.env'));

export default defineConfig({
    testDir: './e2e',
    globalSetup: './e2e/global-setup.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    // Los specs comparten una sola base local (fixtures vía global-setup):
    // workers=1 evita carreras entre specs que insertan/borran los mismos datos.
    workers: 1,
    reporter: process.env.CI ? 'github' : 'html',
    timeout: 60_000,
    expect: {
        timeout: 10_000,
    },
    use: {
        baseURL: 'http://localhost:5174',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        actionTimeout: 10_000,
        navigationTimeout: 20_000,
    },
    projects: [
        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
        },
        {
            name: 'chromium',
            // auth.setup.ts ya corre en el proyecto `setup`; excluirlo acá evita
            // que se ejecute dos veces (y falle por el auto-redirect del login).
            testIgnore: /login\.spec\.ts|auth\.setup\.ts/,
            use: { ...devices['Desktop Chrome'], storageState: './e2e/.auth/user.json' },
            dependencies: ['setup'],
        },
        {
            // login.spec.ts prueba login válido/inválido REAL: sin storageState.
            name: 'login',
            testMatch: /login\.spec\.ts/,
            use: { ...devices['Desktop Chrome'], storageState: undefined },
        },
    ],
    webServer: {
        command: 'pnpm dev',
        url: 'http://localhost:5174',
        cwd: adminDir,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
            ...localEnv,
            VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? localEnv.VITE_SUPABASE_URL,
            VITE_SUPABASE_ANON_KEY:
                process.env.VITE_SUPABASE_ANON_KEY ?? localEnv.VITE_SUPABASE_ANON_KEY,
        },
    },
});
