/**
 * E2E dev-server wrapper.
 *
 * Strategy:
 * 1. Rename .env.local → .env.local.bak (removes cloud creds from Vite's loadEnv)
 * 2. Set process.env overrides so Vite picks up local Supabase
 * 3. Clear Vite's transform cache to prevent stale module cached env
 * 4. Spawn `vite` via spawn (not execSync) for proper signal forwarding
 * 5. Restore .env.local on exit (via global-teardown.ts as safety net)
 *
 * Used by playwright.config.ts webServer.command.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const adminDir = resolve(__dirname, '..');

// ── 1. Remove .env.local so Vite only reads .env (local Supabase) ──
const envLocal = resolve(adminDir, '.env.local');
const envLocalBak = resolve(adminDir, '.env.local.bak');

if (fs.existsSync(envLocal)) {
    fs.renameSync(envLocal, envLocalBak);
    console.log(`[e2e-serve] Renamed .env.local → .env.local.bak`);
}

// ── 2. Set env overrides for Vite's loadEnv + define ──────────────
process.env.PLAYWRIGHT_TESTING = '1';
process.env.VITE_SUPABASE_URL = 'http://127.0.0.1:54321';
process.env.VITE_SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.A0iDk8e3hXRU9SgwiVvtJRbIbSlj0QHIHIACFTDjHXU';

// ── 3. Clear Vite transform cache (prevents stale env in cached modules) ──
const viteCache = resolve(adminDir, 'node_modules', '.vite');
if (fs.existsSync(viteCache)) {
    fs.rmSync(viteCache, { recursive: true });
    console.log(`[e2e-serve] Cleared Vite cache`);
}

console.log(`[e2e-serve] PLAYWRIGHT_TESTING=1`);
console.log(`[e2e-serve] VITE_SUPABASE_URL=${process.env.VITE_SUPABASE_URL}`);
console.log(`[e2e-serve] Starting Vite dev server from ${adminDir} …`);

// ── 4. Spawn Vite with proper signal handling ─────────────────────
// Using spawn (not execSync) so signals from Playwright propagate correctly.
const child = spawn('pnpm', ['dev'], {
    cwd: adminDir,
    stdio: 'inherit',
    shell: true,
    env: process.env,
});

// Forward exit code to parent
child.on('exit', (code) => {
    process.exitCode = code ?? 1;
});
