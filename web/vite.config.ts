/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import { copyFileSync } from 'fs';

import pkg from './package.json' with { type: 'json' };

// 本番ビルドにだけ埋め込む Content Security Policy。
// GitHub Pages ではレスポンスヘッダを設定できないため meta タグで指定する。
// - script-src: バンドル済みスクリプトのみ。wasm-bindgen の WebAssembly.instantiateStreaming に 'wasm-unsafe-eval' が必要
// - style-src: index.html のインライン <style> のため 'unsafe-inline' を許可
// 開発サーバーは React Refresh のインラインスクリプトを使うため対象外にしている。
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? `/${pkg.repository.name}/` : '/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'content-security-policy',
      apply: 'build',
      transformIndexHtml: () => [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
          injectTo: 'head-prepend',
        },
      ],
    },
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
      '@': resolve(import.meta.dirname, './src'),
    },
  },

  // Development server configuration
  server: {
    port: 3000,
    host: true,
    // cors: true は任意のオリジンから開発サーバーの内容を読めてしまうため指定しない
    // （Vite 既定の localhost 系オリジンのみ許可に任せる）。
    // WASM は src/assets/pkg にコピーして読み込むので、fs.allow でルート外を公開する必要もない。
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
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