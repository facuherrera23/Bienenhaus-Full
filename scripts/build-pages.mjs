#!/usr/bin/env node
/**
 * Build de GitHub Pages para BIENENHAUS.
 *
 *   out/            -> landing (raíz del sitio, base /)
 *   out/admin/      -> panel admin (base /admin/)
 *   out/404.html    -> copia del index para deep-links (SPA)
 *   out/.nojekyll   -> desactiva Jekyll en Pages
 *   out/CNAME       -> dominio custom si se define SITE_DOMAIN
 *   out/sitemap.xml -> sitemap para SEO
 *   out/robots.txt  -> robots para crawlers
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
  const pnpmCmd = process.platform === 'win32' ? 'corepack pnpm' : 'pnpm';
  console.log(`[build-pages] building ${app}...`);
  execSync(`${pnpmCmd} --filter ${filter} build`, { cwd: ROOT, stdio: 'inherit' });
}

function generateSitemap(domain) {
  const baseUrl = `https://${domain}`;
  const today = new Date().toISOString().split('T')[0];
  const routes = [
    { url: '', changefreq: 'daily', priority: 1.0 },
    { url: '/catalogo', changefreq: 'daily', priority: 0.9 },
    { url: '/servicios', changefreq: 'weekly', priority: 0.7 },
    { url: '/equipo', changefreq: 'weekly', priority: 0.6 },
    { url: '/proceso', changefreq: 'monthly', priority: 0.5 },
    { url: '/contacto', changefreq: 'monthly', priority: 0.5 },
  ];

  const urls = routes.map(r => `  <url>
    <loc>${baseUrl}${r.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function generateRobots(domain) {
  const baseUrl = `https://${domain}`;
  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 10

# Disallow admin
Disallow: /admin/
Disallow: /api/
`;
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

// SPA fallback for admin sub-routes (/admin/propiedades, /admin/leads, etc.)
cpSync(join(OUT, 'admin', 'index.html'), join(OUT, 'admin', '404.html'));

// Redirect /admin → /admin/ (without trailing slash)
writeFileSync(join(OUT, 'admin.html'), '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/admin/"></head></html>');

cpSync(join(OUT, 'index.html'), join(OUT, '404.html'));
writeFileSync(join(OUT, '.nojekyll'), '');

const domain = (process.env.SITE_DOMAIN || '').trim();
if (domain) {
  writeFileSync(join(OUT, 'CNAME'), `${domain}\n`);
  console.log(`[build-pages] CNAME -> ${domain}`);

  // Generate sitemap.xml and robots.txt
  const sitemap = generateSitemap(domain);
  writeFileSync(join(OUT, 'sitemap.xml'), sitemap);
  console.log(`[build-pages] sitemap.xml generated`);

  const robots = generateRobots(domain);
  writeFileSync(join(OUT, 'robots.txt'), robots);
  console.log(`[build-pages] robots.txt generated`);
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
