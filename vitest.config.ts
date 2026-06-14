import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    env: {
      NEXT_PUBLIC_EVE_CLIENT_ID: 'test-client-id',
      NEXT_PUBLIC_EVE_CALLBACK_URL: 'http://localhost:3000/auth/callback',
    },
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    mockReset: true,
    restoreMocks: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    coverage: {
      provider: 'v8',
      include: ['src/utils/thresholds.ts'],
      thresholds: {
        statements: 100,
        branches: 100,
      }
    },
  },
})
