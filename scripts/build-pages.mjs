#!/usr/bin/env node
/**
 * Build de GitHub Pages para BIENENHAUS.
 *
 *   out/            -> landing (raíz del sitio, base /)
 *   out/admin/      -> panel admin (base /admin/)
 *   out/404.html    -> copia del index para deep-links (SPA)
 *   out/.nojekyll   -> desactiva Jekyll en Pages
 *   out/CNAME       -> dominio custom si se define SITE_DOMAIN
 *
 * Uso:  node scripts/build-pages.mjs
 * Env:  VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (build de ambas apps)
 *       SITE_DOMAIN                       (opcional, escribe CNAME)
 */
import { execSync } from 'node:child_process';
import { accessSync, cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = join(ROOT, 'out');

function runBuild(app) {
  const filter = app === 'landing' ? '@bienenhaus/landing' : '@bienenhaus/admin';
  console.log(`[build-pages] building ${app}...`);
  execSync(`pnpm --filter ${filter} build`, { cwd: ROOT, stdio: 'inherit' });
}

console.log('[build-pages] root:', ROOT);

runBuild('landing');
runBuild('admin');

const landingDist = join(ROOT, 'apps', 'landing', 'dist');
const adminDist = join(ROOT, 'apps', 'admin', 'dist');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
mkdirSync(join(OUT, 'admin'), { recursive: true });

console.log('[build-pages] assembling out/...');
cpSync(landingDist, OUT, { recursive: true });
cpSync(join(adminDist, 'index.html'), join(OUT, 'admin', 'index.html'));
if (exists(join(adminDist, 'assets'))) {
  cpSync(join(adminDist, 'assets'), join(OUT, 'admin', 'assets'), { recursive: true });
}

cpSync(join(OUT, 'index.html'), join(OUT, '404.html'));
writeFileSync(join(OUT, '.nojekyll'), '');

const domain = (process.env.SITE_DOMAIN || '').trim();
if (domain) {
  writeFileSync(join(OUT, 'CNAME'), `${domain}\n`);
  console.log(`[build-pages] CNAME -> ${domain}`);
}

console.log('[build-pages] listo en', OUT);

function exists(fp) {
  try {
    accessSync(fp);
    return true;
  } catch {
    return false;
  }
}
