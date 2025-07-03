import { defineConfig } from 'vitest/config'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./web/tests/setup.ts'],
  },
  resolve: {
    conditions: ['development', 'browser'],
  },
})