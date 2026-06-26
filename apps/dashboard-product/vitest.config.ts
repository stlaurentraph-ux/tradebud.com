import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: './vitest.setup.ts',
    // Playwright specs under e2e/ run via `npm run e2e:golden-paths` (separate CI step),
    // not under vitest — importing @playwright/test's test() in the vitest runner throws.
    exclude: ['.next/**', 'node_modules/**', 'e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
