import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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
    },
    // Increase chunk size warning limit for WASM files
    chunkSizeWarningLimit: 1000,
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
});