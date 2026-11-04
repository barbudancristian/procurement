import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// "singlefile" mode bundles everything into one HTML file for the design preview.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'singlefile' ? [viteSingleFile()] : [])],
  base: './',
  build: {
    outDir: mode === 'singlefile' ? 'dist-preview' : 'dist',
    chunkSizeWarningLimit: 4000,
  },
}));
