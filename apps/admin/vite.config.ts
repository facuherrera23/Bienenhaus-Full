import { defineConfig, loadEnv } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';
import { csp } from './plugins/csp';

const DEV_HEADERS = {
    // Security headers para el dev server (sin CSP: rompería el HMR/websocket).
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    const base = env.VITE_BASE_PATH ?? '/admin/';

    const isE2E = process.env.PLAYWRIGHT_TESTING === '1';

    return {
        plugins: [preact(), csp()],
        ...(isE2E && {
            define: {
                'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('http://127.0.0.1:54321'),
                'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.A0iDk8e3hXRU9SgwiVvtJRbIbSlj0QHIHIACFTDjHXU',
                ),
            },
        }),
        base,
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
                '@lib': path.resolve(__dirname, 'src/lib'),
                '@components': path.resolve(__dirname, 'src/components'),
                '@pages': path.resolve(__dirname, 'src/pages'),
                '@store': path.resolve(__dirname, 'src/store'),
                '@types': path.resolve(__dirname, 'src/types'),
            },
        },
        server: {
            port: 5174,
            open: false,
            headers: DEV_HEADERS,
        },
        build: {
            target: 'es2022',
            chunkSizeWarningLimit: 600,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (!id.includes('node_modules')) {
                            // App code chunks
                            if (id.includes('/lib/owners/')) return 'owners';
                            return;
                        }

                        // Order matters - more specific matches first
                        if (id.includes('lucide-preact')) return 'vendor-lucide';
                        if (id.includes('leaflet')) return 'vendor-leaflet';
                        if (id.includes('@tanstack')) return 'vendor-tanstack-query';
                        if (id.includes('@supabase')) return 'vendor-supabase';
                        if (id.includes('recharts') || id.includes('d3-')) return 'vendor-recharts';
                        if (id.includes('wouter')) return 'vendor-wouter';
                        if (id.includes('preact') || id.includes('@preact')) return 'vendor-preact';
                        if (id.includes('@preact/signals')) return 'vendor-preact-signals';

                        // Resto de node_modules no clasificado explícitamente
                        return 'vendor-misc';
                    },
                },
            },
        },
    };
});
