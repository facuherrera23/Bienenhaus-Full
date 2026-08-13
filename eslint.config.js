import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,
    importPlugin.flatConfigs.recommended,
    {
        // `vitest/config` es un subpath export (exports map) que el resolver de
        // eslint-plugin-import (node) no resuelve → import/no-unresolved falso
        // positivo. Los configs de vitest (vitest.config.ts, vitest.integration.config.ts)
        // se validan igualmente por tsc y por vitest al ejecutarse.
        settings: {
            'import/core-modules': ['vitest/config'],
        },
    },
    {
        ignores: [
            '**/dist/**',
            '**/node_modules/**',
            '**/*.d.ts',
            '**/coverage/**',
            '**/.vite/**',
            '**/out/**',
            '**/apps/landing/public/**',
            '**/apps/landing/src/main.tsx',
            '**/apps/admin/src/main.tsx',
            '**/supabase/**',
            '**/scripts/**',
        ],
    },
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parserOptions: {
                project: [
                    './tsconfig.base.json',
                    './apps/*/tsconfig.json',
                    './packages/*/tsconfig.json',
                ],
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // TypeScript strict
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/consistent-type-exports': 'error',
            '@typescript-eslint/no-floating-promises': 'warn',
            '@typescript-eslint/no-misused-promises': 'warn',
            '@typescript-eslint/require-await': 'warn',

            // Code quality
            'no-console': ['error', { allow: ['warn', 'error'] }],
            'no-debugger': 'error',
            'no-alert': 'error',
            'import/no-duplicates': ['error', { 'prefer-inline': true }],
            'no-unreachable': 'error',
            'no-constant-condition': 'warn',
            'prefer-const': 'error',
            'no-var': 'error',

            // React/Preact
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/display-name': 'off',

            // Import ordering
            'sort-imports': ['error', { ignoreCase: true, ignoreDeclarationSort: true }],
        },
    },
);
