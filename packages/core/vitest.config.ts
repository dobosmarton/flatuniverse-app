import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Without this, Vite walks up and picks up the legacy Next.js app's
  // postcss.config.js at the repository root.
  css: { postcss: {} },
  test: {
    globals: true,
    include: ['test/**/*.test.ts'],
  },
});
