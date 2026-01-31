import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';
import sveltePlugin from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...sveltePlugin.configs['flat/recommended'],
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.ts',
      'pnpm-lock.yaml',
    ],
  },
  {
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        {
          type: 'client',
          pattern: 'apps/client/**/*',
        },
        {
          type: 'server',
          pattern: 'apps/server/**/*',
        },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: 'client',
              allow: ['client'],
            },
            {
              from: 'server',
              allow: ['server'],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/client/**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
      },
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['apps/client/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['apps/server/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
