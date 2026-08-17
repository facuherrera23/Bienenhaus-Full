/**
 * Content-Security-Policy plugin for Vite (admin)
 *
 * GitHub Pages no permite headers de servidor → el único CSP efectivo en
 * producción es un <meta http-equiv="Content-Security-Policy"> inyectado en
 * el HTML final del build. Este plugin lo agrega SOLO en build (`apply:
 * 'build'`), nunca en dev: el HMR de Vite usa websockets e inyecta un
 * preamble inline que el CSP bloquearía.
 *
 * Orígenes verificados (2026-08-07):
 *   - script-src 'self'          → bundle propio; Sentry se importa vía npm (no CDN)
 *   - style-src 'self' 'unsafe-inline' → estilos inline en componentes + CSS Modules
 *   - font-src 'self' data:      → fonts empaquetadas (sin googleapis/gstatic)
 *   - img-src blob:              → previews de imágenes vía createObjectURL
 *                                  (properties.ts, AgentFormPage, csv.ts, hooks.ts, OwnersPage)
 *   - img-src tiles              → Leaflet (PropertyFormPage): {s}.tile.openstreetmap.org
 *   - img-src mlstatic           → imágenes ML sin storage_path (url directa)
 *   - connect-src                → Supabase REST/functions + Realtime (wss) + Sentry ingest
 *   - frame-src 'self'           → SitePage iframe src="/" (preview same-origin)
 *   - worker-src 'self' blob:    → Sentry Replay crea worker desde blob URL
 */
import type { Plugin } from 'vite';

const ADMIN_CSP = [
    "default-src 'self'",
    "script-src 'self' https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org https://http2.mlstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://api.mercadolibre.com https://auth.mercadolibre.com.ar",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "worker-src 'self' blob:",
].join('; ');

export function csp(): Plugin {
    return {
        name: 'bienenhaus-admin-csp',
        apply: 'build',

        transformIndexHtml(html) {
            const metaTag = `<meta http-equiv="Content-Security-Policy" content="${ADMIN_CSP}">`;
            const result = html.replace(/<head>/i, `<head>\n    ${metaTag}`);
            this.info(`[csp] CSP inyectado en index.html (admin)`);
            return result;
        },
    };
}

export default csp;
