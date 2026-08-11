import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

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

const localEnv = loadDotEnv(path.resolve(process.cwd(), '.env'));

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
    use: {
        baseURL: 'http://localhost:5174',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        command: 'npx pnpm dev',
        url: 'http://localhost:5174',
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
