import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'www/**',
      'coverage/**',
      'node_modules/**',
      'src/environments/**',
      'src/generated/**',
    ],
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: js.configs.recommended.languageOptions,
    rules: js.configs.recommended.rules,
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  }
);
