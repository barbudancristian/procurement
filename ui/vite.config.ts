import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The desktop build only talks to Microsoft Graph. Styles are injected at runtime
// by Fluent UI, which needs 'unsafe-inline' for styles (not for scripts).
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  'connect-src https://graph.microsoft.com',
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-src 'none'",
].join('; ');

const contentSecurityPolicy = (): Plugin => ({
  name: 'content-security-policy',
  apply: 'build',
  transformIndexHtml: (html) => html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`),
});

// "singlefile" mode bundles everything into one HTML file for the design preview.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'singlefile' ? [viteSingleFile()] : [contentSecurityPolicy()])],
  base: './',
  build: {
    outDir: mode === 'singlefile' ? 'dist-preview' : 'dist',
    chunkSizeWarningLimit: 4000,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
}));
