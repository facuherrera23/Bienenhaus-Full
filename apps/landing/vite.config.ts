import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { criticalCss } from './plugins/critical-css';

export default defineConfig({
  plugins: [
    preact(),
    // Extract critical CSS for above-the-fold content (Hero + Navbar + design tokens)
    // and inline it in <head> so First Paint is not blocked by the full 230KB stylesheet.
    // The full CSS loads asynchronously via media="print" onload swap pattern.
    criticalCss({
      modulePrefixes: ['hero', 'navbar'],
      keyframes: ['fadeUp', 'fadeIn', 'slideIn', 'bob'],
    }),
  ],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'es2022',
  },
});
