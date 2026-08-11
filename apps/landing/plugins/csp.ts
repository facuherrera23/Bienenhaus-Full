/**
 * Content-Security-Policy plugin for Vite (landing)
 *
 * GitHub Pages no permite headers de servidor → el único CSP efectivo en
 * producción es un <meta http-equiv="Content-Security-Policy"> inyectado en
 * el HTML final del build. Este plugin lo agrega SOLO en build (`apply:
 * 'build'`), nunca en dev: el HMR de Vite usa websockets e inyecta un
 * preamble inline que el CSP bloquearía.
 *
 * Orígenes verificados (2026-08-11):
 *   - script-src 'self'          → módulos propios; JSON-LD es data block (no ejecutable);
 *                                  static.cloudflareinsights.com (beacon de Cloudflare
 *                                  Web Analytics, inyectado automáticamente por Cloudflare
 *                                  cuando el dominio está proxeado)
 *   - style-src + font-src       → Font Awesome desde cdnjs.cloudflare.com (index.html),
 *                                  estilos inline (CSS Modules + estilos en JSX),
 *                                  fonts self-hosted + data: (favicon/OG)
 *   - img-src                    → unsplash (equipo, seed), supabase storage
 *                                  (property_images con storage_path), http2.mlstatic.com
 *                                  (imágenes ML sin storage_path)
 *   - connect-src                → Supabase REST + Realtime (wss), Sentry (error tracking),
 *                                  Cloudflare Insights (reporte de analytics)
 *   - frame-src                  → YouTube embeds (PropertyModal, VideoModal)
 *   - worker-src 'self'          → service worker (sw.js)
 *
 * NOTA sobre "Executing inline event handler" bloqueado en consola:
 *   Ese warning NO viene de nuestro código — lo inyecta Cloudflare junto con
 *   el beacon.min.js (auto-injection de Web Analytics a nivel de proxy/edge,
 *   fuera de nuestro control y del build). El contenido de ese handler es
 *   dinámico, así que no se le puede dar una excepción por hash ni nonce
 *   desde acá. Si se quiere eliminar el warning del todo, hay que desactivar
 *   la auto-inyección del script en el dashboard de Cloudflare (Speed >
 *   Optimization > Web Analytics, o Zaraz si está activo) y, si se lo quiere
 *   seguir usando, cargarlo manualmente vía el snippet oficial sin atributos
 *   de evento inline.
 */
import type { Plugin } from 'vite';

const LANDING_CSP = [
    "default-src 'self'",
    "script-src 'self' https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
    "font-src 'self' https://cdnjs.cloudflare.com data:",
    "img-src 'self' data: https://images.unsplash.com https://*.supabase.co https://http2.mlstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.us.sentry.io https://static.cloudflareinsights.com",
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