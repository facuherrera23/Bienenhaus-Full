import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Restore .env.local after E2E tests complete.
// playwright.config.ts renames it → .env.local.bak at import time to prevent
// Vite from loading cloud credentials during test runs.
const adminDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envLocalPath = path.join(adminDir, '.env.local');
const envLocalBakPath = path.join(adminDir, '.env.local.bak');

export default function globalTeardown(): void {
    if (fs.existsSync(envLocalBakPath)) {
        fs.renameSync(envLocalBakPath, envLocalPath);
    }
}
