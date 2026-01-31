import { defineConfig, mergeConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json', 'html'],
      reportsDirectory: './coverage',
      all: true,
      include: ['apps/*/src/**/*.{ts,svelte}'],
      exclude: [
        'apps/**/*.test.ts',
        'apps/**/*.spec.ts',
        'apps/client/src/main.ts',
        'apps/client/vitest-setup.ts',
      ],
    },
  },
});
