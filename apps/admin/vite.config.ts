import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  base: '/admin/',
  server: {
    port: 5174,
    open: false,
  },
  build: {
    target: 'es2022',
  },
});
