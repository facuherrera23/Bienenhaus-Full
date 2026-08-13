import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import path from 'path';

export default defineConfig({
    plugins: [preact()],
    test: {
        environment: 'jsdom',
        globals: true,
        env: { TZ: 'UTC' },
        setupFiles: ['./src/test/setup.tsx'],
        include: ['src/lib/__tests__/**/*.test.ts', 'src/test/**/*.test.ts'],
        exclude: ['src/test/integration/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*'],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 70,
                statements: 80,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@/components': path.resolve(__dirname, './src/components'),
            '@/lib': path.resolve(__dirname, './src/lib'),
            '@/hooks': path.resolve(__dirname, './src/hooks'),
            '@/pages': path.resolve(__dirname, './src/pages'),
            '@/store': path.resolve(__dirname, './src/store'),
            '@/types': path.resolve(__dirname, './src/types'),
        },
    },
});
