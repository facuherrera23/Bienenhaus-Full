/**
 * capturas-landing.mjs
 * --------------------
 * Genera capturas de referencia de cada sección de la landing para
 * docs/design/landing-diseno.md.
 *
 * Las secciones usan CSS Modules (clases hasheadas), por eso este script
 * localiza cada sección por id o aria-label estables (verificados contra
 * el DOM renderizado de la landing).
 *
 * Uso:
 *   node scripts/capturas-landing.mjs [url] [viewportWidth]
 *
 * Ejemplos:
 *   node scripts/capturas-landing.mjs http://localhost:5174 1440
 *   node scripts/capturas-landing.mjs http://localhost:5174 390   (mobile)
 *
 * Requiere: playwright (dep en root), servidor de la landing corriendo.
 * Salida: docs/design/capturas/NN-seccion.png
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '..', 'docs', 'design', 'capturas');

const url = process.argv[2] ?? 'http://localhost:5174';
const width = Number(process.argv[3] ?? 1440);
const viewportHeight = Math.max(Math.round(width * (9 / 16)), 800);

// Selectores estables verificados contra el DOM renderizado (agosto 2026)
const SECTIONS = [
    { file: '01-hero', selector: '#inicio' },
    { file: '02-catalog', selector: '#catalogo' },
    { file: '03-services', selector: 'section[aria-label="Nuestros servicios premium"]' },
    { file: '04-team', selector: 'section[aria-label="Nuestro equipo de expertos"]' },
    { file: '05-stats', selector: 'section[aria-label="Nuestras estad\u00edsticas"]' },
    { file: '06-process', selector: 'section[aria-label="Como trabajamos"]' },
    { file: '07-contact', selector: 'section[aria-label="Contacto"]' },
    { file: '08-transition', selector: 'section[aria-label="Transici\u00f3n"]' },
    { file: '09-footer', selector: 'footer' },
];

const REVEAL_TIMEOUT_MS = 2500;

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width, height: viewportHeight },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce', // animaciones en estado final → capturas deterministas
});

console.log(`→ Navegando a ${url} (viewport ${width}x${viewportHeight})`);
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

await page.waitForSelector('#inicio', { timeout: 20000 }).catch(() => {
    console.warn('  ⚠ #inicio no encontrado tras 20s — ¿cargó la página?');
});
await page.waitForTimeout(1500); // data Supabase / imágenes

let done = 0;
for (const { file, selector } of SECTIONS) {
    const el = page.locator(selector).first();
    const count = await el.count().catch(() => 0);
    if (!count) {
        console.warn(`  ⚠ saltando ${file}: no existe "${selector}"`);
        continue;
    }

    await el.scrollIntoViewIfNeeded();
    await page.evaluate((sel) => {
        const node = document.querySelector(sel);
        if (node) window.scrollTo({ top: node.offsetTop - 24, behavior: 'instant' });
    }, selector);
    await page.waitForTimeout(REVEAL_TIMEOUT_MS); // dejar que reveal/useCountUp terminen

    // Garantizar estado final del reveal: forzar .visible en los targets con data-delay
    await page.evaluate((sel) => {
        const node = document.querySelector(sel);
        if (!node) return;
        node.querySelectorAll('[data-delay]').forEach((e) => e.classList.add('visible'));
    }, selector);
    await page.waitForTimeout(600); // reflow tras reveal forzado

    const outPath = path.join(OUT_DIR, `${file}.png`);
    await el.screenshot({ path: outPath, animations: 'disabled' });
    done++;
    console.log(`  ✓ ${file}.png`);
}

await browser.close();
console.log(`\nListo: ${done}/${SECTIONS.length} capturas en ${OUT_DIR}`);
