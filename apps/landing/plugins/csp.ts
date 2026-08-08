/**
 * Content-Security-Policy plugin for Vite (landing)
 *
 * GitHub Pages no permite headers de servidor → el único CSP efectivo en
 * producción es un <meta http-equiv="Content-Security-Policy"> inyectado en
 * el HTML final del build. Este plugin lo agrega SOLO en build (`apply:
 * 'build'`), nunca en dev: el HMR de Vite usa websockets e inyecta un
 * preamble inline que el CSP bloquearía.
 *
 * Orígenes verificados (2026-08-07):
 *   - script-src 'self'          → módulos propios; JSON-LD es data block (no ejecutable)
 *   - style-src + font-src       → Font Awesome desde cdnjs.cloudflare.com (index.html),
 *                                  estilos inline (CSS Modules + estilos en JSX),
 *                                  fonts self-hosted + data: (favicon/OG)
 *   - img-src                    → unsplash (equipo, seed), supabase storage
 *                                  (property_images con storage_path), http2.mlstatic.com
 *                                  (imágenes ML sin storage_path)
 *   - connect-src                → Supabase REST + Realtime (wss)
 *   - frame-src                  → YouTube embeds (PropertyModal, VideoModal)
 *   - worker-src 'self'          → service worker (sw.js)
 */
import type { Plugin } from 'vite';

const LANDING_CSP = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
    "font-src 'self' https://cdnjs.cloudflare.com data:",
    "img-src 'self' data: https://images.unsplash.com https://*.supabase.co https://http2.mlstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-src https://www.youtube.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "worker-src 'self'",
].join('; ');

export function csp(): Plugin {
    return {
        name: 'bienenhaus-landing-csp',
        apply: 'build',

        transformIndexHtml(html) {
            const metaTag =
                `<meta http-equiv="Content-Security-Policy" content="${LANDING_CSP}">`;
            const result = html.replace(/<head>/i, `<head>\n    ${metaTag}`);
            this.info(`[csp] CSP inyectado en index.html (landing)`);
            return result;
        },
    };
}

export default csp;
