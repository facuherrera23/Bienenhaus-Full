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
 *   Tenía DOS orígenes posibles, no uno solo:
 *   1) Cloudflare inyecta su propio beacon.min.js a nivel de proxy/edge junto
 *      con Web Analytics (fuera de nuestro control y del build); si ese script
 *      usa un handler inline, no se le puede dar excepción por hash/nonce
 *      desde acá porque su contenido es dinámico. Si se quiere eliminar del
 *      todo, hay que desactivar la auto-inyección en el dashboard de
 *      Cloudflare (Speed > Optimization > Web Analytics, o Zaraz si está
 *      activo) y, si se lo sigue queriendo usar, cargarlo manualmente vía el
 *      snippet oficial sin atributos de evento inline.
 *   2) plugins/critical-css.ts generaba un `onload="this.media='all'"` propio
 *      para el swap async del CSS completo — ESE SÍ era nuestro, y quedaba
 *      bloqueado por esta misma política (script-src sin 'unsafe-inline').
 *      Ya se corrigió: ahora usa un <script src> externo (load-deferred-
 *      styles.js) en vez de un atributo de evento inline, así que no
 *      necesita ninguna excepción en el CSP.
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