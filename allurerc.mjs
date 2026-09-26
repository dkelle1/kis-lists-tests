import { defineConfig } from 'allure';

/**
 * Projekt „setup” (tests/setup/auth.setup.ts) to przygotowanie sesji kont, a nie scenariusz testowy – Playwright
 * raportuje go jak zwykłe testy, więc zawyżałby liczby w raporcie. Ukrywamy go, dopóki przechodzi; nieudane
 * logowanie zostaje w raporcie, bo bez niego wszystkie scenariusze byłyby pominięte bez widocznej przyczyny.
 */
const isPassedSetup = (testResult) =>
  testResult.status === 'passed' &&
  testResult.labels.some((label) => label.name === 'parentSuite' && label.value === 'setup');

export default defineConfig({
  name: 'KIS List – powiadomienia o komentarzach',
  output: './allure-report',
  plugins: {
    awesome: {
      options: {
        singleFile: true,
        reportLanguage: 'pl',
        groupBy: ['epic', 'feature', 'story'],
        filter: (testResult) => !isPassedSetup(testResult),
      },
    },
  },
});
