import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'renderer/node_modules'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['main/**/*.ts'],
      exclude: [
        'node_modules',
        'dist',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/types.ts',
        '**/__tests__/**',
      ],
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'renderer/src'),
    },
  },
})
