import { defineConfig, loadEnv } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const base = env.VITE_BASE_PATH ?? '/admin/';

  return {
    plugins: [preact()],
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
