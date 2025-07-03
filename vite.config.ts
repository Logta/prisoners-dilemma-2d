import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: './web',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    fs: {
      allow: ['..']
    }
  },
  optimizeDeps: {
    exclude: ['prisoners_dilemma_2d'],
  },
  assetsInclude: ['**/*.wasm'],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});