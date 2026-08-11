import path from 'path';
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { criticalCss } from './plugins/critical-css';
import { csp } from './plugins/csp';

const DEV_HEADERS = {
    // Security headers para el dev server (sin CSP: rompería el HMR/websocket).
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    plugins: [
        preact(),
        // Extract critical CSS for above-the-fold content (Hero + Navbar + design tokens)
        // and inline it in <head> so First Paint is not blocked by the full 230KB stylesheet.
        // The full CSS loads asynchronously via media="print" onload swap pattern.
        criticalCss({
            // Include ALL class prefixes from Hero.module.css + Navbar.module.css
            // CSS Modules hashes each class separately: _hero_<hash>, _heroContent_<hash>, _eyebrow_<hash>, etc.
            modulePrefixes: [
                'hero', 'heroBg', 'heroContent', 'heroLeft', 'heroDeco', 'eyebrow',
                'heroTitle', 'heroDesc', 'heroDivider', 'heroActions', 'btnPrimary', 'btnVideo',
                'playCircle', 'heroRight', 'statsPanel', 'statRow', 'statIcon', 'statNumber',
                'statLabel', 'statDesc', 'trustTitle', 'trustDesc', 'scrollIndicator',
                'featureBar', 'featureItem', 'featureIcon', 'featureTitle', 'featureDesc',
                'navbar', 'logo', 'navMenu', 'navActions', 'btnPublish', 'iconBtn',
                'hamburgerLines', 'mobileMenu', 'skipLink', 'skipLinkFocus'
            ],
            keyframes: ['fadeUp', 'fadeIn', 'slideIn', 'bob', 'kenBurns', 'floatParticle', 'pulseDot', 'typewriter', 'blinkCursor', 'ringPulse', 'borderGlow', 'pulseBounce', 'navbarGlow', 'mobileLinkIn'],
        }),
        // Inyecta el meta CSP en el HTML del build (GitHub Pages no permite headers).
        csp(),
    ],
    server: {
        port: 5173,
        open: false,
        headers: DEV_HEADERS,
    },
    build: {
        target: 'es2022',
    },
});
