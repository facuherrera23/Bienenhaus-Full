import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const adminDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    testDir: './e2e',
    globalSetup: './e2e/global-setup.ts',
    globalTeardown: './e2e/global-teardown.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
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
            testIgnore: /login\.spec\.ts|auth\.setup\.ts/,
            use: { ...devices['Desktop Chrome'], storageState: './e2e/.auth/user.json' },
            dependencies: ['setup'],
        },
        {
            name: 'login',
            testMatch: /login\.spec\.ts/,
            use: { ...devices['Desktop Chrome'], storageState: undefined },
        },
    ],
    webServer: {
        command: 'node scripts/e2e-serve.mjs',
        url: 'http://localhost:5174',
        cwd: adminDir,
        reuseExistingServer: false,
        timeout: 120_000,
    },
});
