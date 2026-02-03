import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // ===== 核心規則（ERROR）：這些會導致事故 =====
      // 禁止忘記 await（防止 2026-02-02 事故重演）
      '@typescript-eslint/no-floating-promises': 'error',
      // 防止 Promise 誤用
      '@typescript-eslint/no-misused-promises': 'error',

      // ===== 次要規則（WARN）：逐步改善，不阻擋 commit =====
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-useless-escape': 'warn',
      'prefer-const': 'warn',

      // Disable rules that conflict with TypeScript
      'no-undef': 'off', // TypeScript handles this
    },
  },
  {
    ignores: ['node_modules/', 'dist/', 'scripts/', '*.js', '*.cjs', '*.mjs'],
  }
);
