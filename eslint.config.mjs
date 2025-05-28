import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import path from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a compatibility instance
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    files: ['**/*.{ts,tsx}'],

    languageOptions: {
      parser: tsparser,
      sourceType: 'module',
      ecmaVersion: 'latest',
      globals: globals.browser,
    },

    plugins: {
      '@typescript-eslint': tseslintPlugin,
      'jsx-a11y': jsxA11y,
      react: reactPlugin,
      'react-hooks': reactHooks,
      '@next/next': nextPlugin,
      prettier: prettierPlugin,
    },

    settings: {
      react: {
        version: 'detect',
      },
    },

    rules: {
      ...js.configs.recommended.rules,
      ...tseslintPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...prettierConfig.rules,
      'no-console': 'warn',
      'prettier/prettier': 'error',
      'react-hooks/react-compiler': 'error',
    },
  },
];
