/**
 * Critical CSS Extraction Plugin for Vite
 *
 * Extracts CSS rules needed for above-the-fold content (Hero + Navbar + global reset
 * + design tokens) and inlines them directly in <head> as a <style> tag, so First
 * Paint is not blocked by the full 230KB stylesheet.
 *
 * The full CSS is loaded asynchronously via the preload + media="print" swap
 * pattern. The media swap runs from an external script (load-deferred-styles.js,
 * emitted by this same plugin) instead of an inline onload="..." attribute —
 * the landing app's CSP (script-src 'self', no 'unsafe-inline') would silently
 * block an inline event handler, which used to leave the full stylesheet
 * (and the fonts declared in it) never applied. A <noscript> fallback covers
 * users without JavaScript.
 *
 * Extraction strategy:
 *   1. All :root blocks (design tokens, legacy aliases, responsive overrides, reduced-motion)
 *   2. Global reset & base rules (*, html, body, img, button, a, ul, :focus-visible,
 *      .skip-link, .skipLink, scrollbar, ::selection, .container)
 *   3. Hero module rules (class names matching /^_hero_[a-z0-9]+/ — CSS Modules hashed)
 *   4. Navbar module rules (class names matching /^_navbar_[a-z0-9]+/)
 *   5. Keyframes used by Hero/Navbar (fadeUp, fadeIn, slideIn, bob)
 *   6. Media queries that contain Hero/Navbar rules OR :root token overrides
 *
 * The plugin uses two hooks:
 *   - generateBundle: extracts critical CSS from the bundled CSS asset (available here)
 *   - transformIndexHtml: injects the critical CSS into the HTML (runs after generateBundle)
 */
import type { Plugin, ResolvedConfig } from 'vite';

// Use structural types for the bundle assets to avoid importing rollup types
// (which may not be a direct dependency).
interface BundleAsset {
    type: 'asset';
    source: string | Uint8Array;
}

interface BundleChunk {
    type: 'chunk';
}

type BundleEntry = BundleAsset | BundleChunk;

interface BundleLike {
    [fileName: string]: BundleEntry;
}

interface CriticalCssOptions {
    /** CSS module class name prefixes to extract (without the leading dot/underscore). */
    modulePrefixes?: string[];
    /** Keyframe names to extract. */
    keyframes?: string[];
    /** Global selectors to extract (exact match on the selector before the first `{`). */
    globalSelectors?: string[];
    /** Whether to also extract @media blocks containing :root overrides. Default: true. */
    extractRootMediaQueries?: boolean;
}

const DEFAULT_KEYFRAMES = ['fadeUp', 'fadeIn', 'slideIn', 'bob'];

const DEFAULT_GLOBAL_SELECTORS = [
    '*',
    '*::before',
    '*::after',
    '*:before',
    '*:after',
    'html',
    'body',
    'img',
    'button',
    'a',
    'ul',
    ':focus-visible',
    '.skip-link',
    '.skip-link:focus',
    '.skipLink',
    '.skipLink:focus',
    '.container',
    '::-webkit-scrollbar',
    '::-webkit-scrollbar-track',
    '::-webkit-scrollbar-thumb',
    '::-webkit-scrollbar-thumb:hover',
    '::selection',
];

/**
 * Parse CSS into top-level rules. A "rule" is either:
 *   - An at-rule block (@media, @keyframes, @supports, etc.) with its full body
 *   - A selector + declaration block
 *   - A top-level at-rule without a body (@import, @charset)
 *
 * Returns an array of { selector, body, full } where:
 *   - selector: the text before the first `{` (trimmed)
 *   - body: the text between the outermost `{` and `}` (for block rules)
 *   - full: the complete original text including braces
 */
interface ParsedRule {
    selector: string;
    body: string;
    full: string;
    isAtRule: boolean;
    atRuleName: string; // e.g. 'media', 'keyframes', '' for regular rules
}

function parseCssRules(css: string): ParsedRule[] {
    const rules: ParsedRule[] = [];
    let i = 0;
    const len = css.length;

    while (i < len) {
        // Skip whitespace
        while (i < len && /\s/.test(css[i])) i++;
        if (i >= len) break;

        // Check for at-rule
        if (css[i] === '@') {
            // Find the at-rule name
            let nameEnd = i + 1;
            while (nameEnd < len && /[a-zA-Z-]/.test(css[nameEnd])) nameEnd++;
            const atRuleName = css.substring(i + 1, nameEnd);

            // Find the next `{` or `;`
            let braceOrSemi = nameEnd;
            while (braceOrSemi < len && css[braceOrSemi] !== '{' && css[braceOrSemi] !== ';') {
                braceOrSemi++;
            }

            if (braceOrSemi < len && css[braceOrSemi] === ';') {
                // At-rule without body (e.g., @import, @charset)
                const full = css.substring(i, braceOrSemi + 1);
                rules.push({
                    selector: full,
                    body: '',
                    full,
                    isAtRule: true,
                    atRuleName,
                });
                i = braceOrSemi + 1;
                continue;
            }

            if (braceOrSemi < len && css[braceOrSemi] === '{') {
                // At-rule with body — find matching closing brace
                const selector = css.substring(i, braceOrSemi).trim();
                let depth = 1;
                let j = braceOrSemi + 1;
                while (j < len && depth > 0) {
                    if (css[j] === '{') depth++;
                    else if (css[j] === '}') depth--;
                    j++;
                }
                const body = css.substring(braceOrSemi + 1, j - 1);
                const full = css.substring(i, j);
                rules.push({
                    selector,
                    body,
                    full,
                    isAtRule: true,
                    atRuleName,
                });
                i = j;
                continue;
            }
        }

        // Regular rule: selector { declarations }
        let braceIdx = i;
        while (braceIdx < len && css[braceIdx] !== '{') braceIdx++;

        if (braceIdx >= len) break;

        const selector = css.substring(i, braceIdx).trim();
        let depth = 1;
        let j = braceIdx + 1;
        while (j < len && depth > 0) {
            if (css[j] === '{') depth++;
            else if (css[j] === '}') depth--;
            j++;
        }
        const body = css.substring(braceIdx + 1, j - 1);
        const full = css.substring(i, j);
        rules.push({
            selector,
            body,
            full,
            isAtRule: false,
            atRuleName: '',
        });
        i = j;
    }

    return rules;
}

/**
 * Check if a selector matches one of the CSS module prefixes.
 * CSS Modules produce class names like `._hero_4f0qc` or `._hero_4f0qc._visible_4f0qc`.
 * We match if any class in the selector starts with `_<prefix>_`.
 */
function selectorMatchesModule(selector: string, prefixes: string[]): boolean {
    // Split on combinators and commas to check individual selectors
    const parts = selector.split(/[,\s>+~]+/);
    for (const part of parts) {
        // Match class names like ._hero_4f0qc
        for (const prefix of prefixes) {
            const pattern = new RegExp(`^\\._${prefix}_[a-z0-9]+`);
            if (pattern.test(part)) return true;
        }
    }
    return false;
}

/**
 * Check if a selector is a global selector we want to extract.
 */
function selectorIsGlobal(selector: string, globalSelectors: string[]): boolean {
    // Normalize selector: take the first comma-separated part
    const parts = selector.split(',').map((s) => s.trim());
    for (const part of parts) {
        if (globalSelectors.includes(part)) return true;
    }
    return false;
}

/**
 * Check if an at-rule body contains :root (for token overrides in media queries).
 */
function bodyContainsRoot(body: string): boolean {
    return body.includes(':root');
}

/**
 * Check if an at-rule body contains rules matching module prefixes.
 */
function bodyContainsModule(body: string, prefixes: string[]): boolean {
    for (const prefix of prefixes) {
        const pattern = new RegExp(`\\._${prefix}_[a-z0-9]+`);
        if (pattern.test(body)) return true;
    }
    return false;
}

/**
 * Check if an at-rule body contains keyframe names we want.
 */
function bodyContainsKeyframes(body: string, keyframes: string[]): boolean {
    for (const kf of keyframes) {
        if (body.includes(`@keyframes ${kf}`) || body.includes(`@keyframes ${kf} `)) {
            return true;
        }
    }
    return false;
}

/**
 * Extract critical CSS from the full bundled CSS.
 */
function extractCriticalCss(
    fullCss: string,
    modulePrefixes: string[],
    keyframes: string[],
    globalSelectors: string[],
    extractRootMediaQueries: boolean,
): string {
    const rules = parseCssRules(fullCss);
    const criticalParts: string[] = [];

    for (const rule of rules) {
        if (!rule.isAtRule && rule.selector === ':root') {
            criticalParts.push(rule.full);
            continue;
        }

        if (!rule.isAtRule && selectorIsGlobal(rule.selector, globalSelectors)) {
            criticalParts.push(rule.full);
            continue;
        }

        if (!rule.isAtRule && selectorMatchesModule(rule.selector, modulePrefixes)) {
            criticalParts.push(rule.full);
            continue;
        }

        if (rule.isAtRule && rule.atRuleName === 'keyframes') {
            const kfName = rule.selector.replace('@keyframes', '').trim();
            if (keyframes.includes(kfName)) {
                criticalParts.push(rule.full);
                continue;
            }
        }

        if (rule.isAtRule && rule.atRuleName === 'media') {
            const hasRoot = bodyContainsRoot(rule.body);
            const hasModule = bodyContainsModule(rule.body, modulePrefixes);
            const hasKeyframes = bodyContainsKeyframes(rule.body, keyframes);

            if (!hasRoot && !hasModule && !hasKeyframes) continue;

            if (hasRoot && !hasModule && !hasKeyframes) {
                criticalParts.push(rule.full);
            } else if (hasModule) {
                const innerRules = parseCssRules(rule.body);
                const relevantInner: string[] = [];
                for (const inner of innerRules) {
                    if (
                        (inner.selector === ':root' && extractRootMediaQueries) ||
                        (!inner.isAtRule &&
                            selectorMatchesModule(inner.selector, modulePrefixes)) ||
                        (!inner.isAtRule && selectorIsGlobal(inner.selector, globalSelectors))
                    ) {
                        relevantInner.push(inner.full);
                    }
                }
                if (relevantInner.length > 0) {
                    criticalParts.push(`${rule.selector}{${relevantInner.join('')}}`);
                }
            }
        }
    }

    return criticalParts.join('');
}

/**
 * Minify CSS by removing unnecessary whitespace (lightweight minification).
 * The CSS from Vite is already minified, but our extraction may introduce
 * extra whitespace from joining rules.
 */
function minifyCss(css: string): string {
    return css
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}:;,])\s*/g, '$1')
        .replace(/;}/g, '}')
        .trim();
}

export function criticalCss(options: CriticalCssOptions = {}): Plugin {
    const modulePrefixes = options.modulePrefixes ?? ['hero', 'navbar'];
    const keyframes = options.keyframes ?? DEFAULT_KEYFRAMES;
    const globalSelectors = options.globalSelectors ?? DEFAULT_GLOBAL_SELECTORS;
    const extractRootMediaQueries = options.extractRootMediaQueries ?? true;

    // Shared state between hooks: extracted in generateBundle, consumed in transformIndexHtml
    let extractedCriticalCss = '';
    let cssAssetName = '';
    let loaderFileName = '';
    let base = '/';

    return {
        name: 'bienenhaus-critical-css',
        apply: 'build',

        configResolved(resolvedConfig: ResolvedConfig) {
            base = resolvedConfig.base;
        },

        generateBundle(_rollupOptions, bundle: BundleLike) {
            let cssAsset: BundleAsset | undefined;

            for (const [fileName, asset] of Object.entries(bundle)) {
                if (asset.type !== 'asset') continue;
                if (fileName.endsWith('.css')) {
                    cssAsset = asset;
                    cssAssetName = fileName;
                }
            }

            if (!cssAsset) {
                this.warn('Critical CSS plugin: no CSS asset found in bundle. Skipping.');
                return;
            }

            const fullCss =
                typeof cssAsset.source === 'string'
                    ? cssAsset.source
                    : new TextDecoder().decode(cssAsset.source as Uint8Array);

            const criticalCssContent = extractCriticalCss(
                fullCss,
                modulePrefixes,
                keyframes,
                globalSelectors,
                extractRootMediaQueries,
            );
            extractedCriticalCss = minifyCss(criticalCssContent);

            const criticalSize = Buffer.byteLength(extractedCriticalCss, 'utf8');
            const fullSize = Buffer.byteLength(fullCss, 'utf8');
            const reduction = ((1 - criticalSize / fullSize) * 100).toFixed(1);
            this.info(
                `Critical CSS extracted: ${criticalSize} bytes (${reduction}% reduction from ${fullSize} bytes)`,
            );

            // Loader externo para el swap media="print" -> media="all". Va como
            // <script src> en vez de onload="..." inline porque nuestra CSP
            // (script-src 'self') no tiene 'unsafe-inline' ni hash/nonce para
            // atributos de evento — un onload inline quedaría bloqueado
            // silenciosamente y el CSS completo nunca se aplicaría.
            const loaderSrc = [
                '(function () {',
                '  var links = document.querySelectorAll("link[data-deferred-style]");',
                '  for (var i = 0; i < links.length; i++) {',
                '    links[i].media = "all";',
                '  }',
                '})();',
            ].join('\n');

            const loaderReferenceId = this.emitFile({
                type: 'asset',
                name: 'load-deferred-styles.js',
                source: loaderSrc,
            });
            // getFileName solo existe en el PluginContext completo (disponible acá,
            // en generateBundle) — NO en el contexto que Vite pasa a
            // transformIndexHtml, por eso se resuelve a string ya en este hook.
            loaderFileName = this.getFileName(loaderReferenceId);
        },

        transformIndexHtml(html) {
            if (!extractedCriticalCss || !cssAssetName) return html;

            let result = html;

            const criticalStyleTag = `<style id="critical-css">${extractedCriticalCss}</style>`;
            result = result.replace(/<head>/i, `<head>\n    ${criticalStyleTag}`);

            const cssLinkPattern = new RegExp(
                `<link\\s+rel="stylesheet"[^>]*href="([^"]*${cssAssetName.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    '\\$&',
                )})"[^>]*>`,
                'i',
            );

            const cssLinkMatch = result.match(cssLinkPattern);
            if (cssLinkMatch) {
                const fullLinkTag = cssLinkMatch[0];
                const cssHref = cssLinkMatch[1];
                // Sin onload inline: el swap de media lo hace el script externo
                // emitido en generateBundle (compatible con script-src 'self').
                const asyncLink = `<link rel="preload" as="style" href="${cssHref}">\n    <link rel="stylesheet" href="${cssHref}" media="print" data-deferred-style>`;
                const noscriptFallback = `<noscript><link rel="stylesheet" href="${cssHref}"></noscript>`;
                result = result.replace(fullLinkTag, `${asyncLink}\n    ${noscriptFallback}`);
            } else {
                this.warn(
                    'Critical CSS plugin: could not find CSS <link> tag in HTML to convert to async.',
                );
            }

            if (loaderFileName) {
                const loaderTag = `<script src="${base}${loaderFileName}" defer></script>`;
                result = result.replace(/<\/body>/i, `    ${loaderTag}\n</body>`);
            }

            return result;
        },
    };
}

export default criticalCss;