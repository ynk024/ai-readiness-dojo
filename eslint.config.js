import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.ts',
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
    files: ['apps/client/**/*.ts', 'apps/client/**/*.svelte'],
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
