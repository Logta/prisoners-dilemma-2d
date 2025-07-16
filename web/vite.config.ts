/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { copyFileSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/2D-Prisoners-Dilemma/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'github-pages-spa',
      apply: 'build',
      closeBundle() {
        // Create 404.html for GitHub Pages SPA support
        copyFileSync('dist/index.html', 'dist/404.html');
      },
    },
  ],
  
  // Include WASM files as assets
  assetsInclude: ['**/*.wasm'],
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },

  // Development server configuration
  server: {
    port: 3000,
    host: true,
    cors: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: undefined,
      },
    },
    // Increase chunk size warning limit for WASM files
    chunkSizeWarningLimit: 1000,
    // Ensure WASM files are properly handled
    assetsInlineLimit: 0,
    // Ensure proper file extensions for GitHub Pages
    assetsDir: 'assets',
  },

  // WASM support
  optimizeDeps: {
    exclude: ['@prisoners_dilemma_2d/wasm'],
  },

  // Worker support for potential future use
  worker: {
    format: 'es',
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },

  // CSS configuration
  css: {
    devSourcemap: true,
  },

  // Preview configuration
  preview: {
    port: 3000,
    host: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },

  // Test configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});