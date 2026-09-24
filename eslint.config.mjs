import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['node_modules', 'playwright-report', 'test-results', 'allure-results', 'allure-report', '.auth'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['tests/**/*.ts', 'src/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Asercje żyją w Page Objectach i w asercjach domenowych (expect.extend).
      'playwright/expect-expect': ['warn', { assertFunctionNames: ['expect'] }],
      // Pętle po odbiorcach są celowe – każdy odbiorca to osobny test.step.
      'playwright/no-conditional-in-test': 'off',
      'playwright/no-wait-for-timeout': 'warn',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: true }],
    },
  },
  prettier,
);
