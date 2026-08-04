import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'remove-crossorigin',
      transformIndexHtml(html) {
        return html.replace(/\s+crossorigin(=["']?["']?)?/g, '');
      },
    },
  ],
  base: './',
  build: {
    outDir: 'dist-react',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
