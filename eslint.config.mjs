import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'node_modules',
      // szablony skryptów rozpoznania uruchamiane poza frameworkiem (kopiowane do .local/)
      '.claude/skills/*/templates',
      'playwright-report',
      'test-results',
      'allure-results',
      'allure-report',
      '.auth',
      '.local',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['tests/**/*.ts', 'src/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Kroki z asercjami (tests/**/steps.ts) liczą się jak `expect`.
      'playwright/expect-expect': [
        'error',
        { assertFunctionNames: ['expect', 'expectNotified', 'expectNotNotified', 'postTeamComment'] },
      ],
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-page-pause': 'error',
      'playwright/prefer-web-first-assertions': 'error',
    },
  },
  {
    // Testy opisują zachowanie przez Page Objecty – bez surowych selektorów CSS/XPath w specyfikacjach.
    files: ['tests/**/*.ts'],
    rules: {
      'playwright/no-raw-locators': 'error',
    },
  },
  {
    // Page Objecty nie weryfikują – asercje należą do testów.
    files: ['src/pages/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              importNames: ['expect'],
              message: 'Page Objecty nie zawierają asercji – przenieś weryfikację do testu.',
            },
          ],
        },
      ],
    },
  },
  {
    rules: {
      'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: true }],
    },
  },
  prettier,
);
