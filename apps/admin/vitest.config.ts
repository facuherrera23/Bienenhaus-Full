import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import path from 'path';

export default defineConfig({
    plugins: [preact()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.tsx'],
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        // Valores dummy: los módulos validan env vars al importarse y en CI no hay .env (el cliente real está mockeado en setup.tsx).
        env: {
            VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
            VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            // Medir TODO src/ (no solo lo que los tests importan): si un archivo
            // no aparece en el reporte, cuenta como 0% y baja el total real.
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/test/**',
                'src/**/*.d.ts',
                'src/main.tsx',
                'src/**/*.stories.{ts,tsx}',
            ],
            // Gate real de coverage en CI (pnpm test:coverage): por debajo de
            // estos umbrales el job falla. Los valores reflejan la cobertura
            // actual de la suite + margen de estabilidad.
            thresholds: {
                lines: 60,
                functions: 55,
                statements: 60,
                branches: 45,
            },
        },
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
