import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration.
 *
 * The `base` path is relative (`./`) so the built bundle works both at
 * https://derdienstag.github.io/Kostenrechner/ (GitHub Pages, served from
 * a sub-path) and when opened locally as a static file.
 */
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
