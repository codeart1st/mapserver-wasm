import { defineConfig } from 'vitest/config'

const SECONDS = 1000

export default defineConfig({
  test: {
    testTimeout: 90 * SECONDS,
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.test.mjs'],
  }
})