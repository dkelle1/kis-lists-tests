import { defineConfig, devices } from '@playwright/test';
import { TEST_PLAN_URL } from './src/allure/metadata';
import { baseURL } from './src/config/env';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  // Scenariusze współdzielą listę testową i centra powiadomień tych samych kont, więc wykonują się
  // sekwencyjnie – jeden test nie może "zjeść" ani podrzucić powiadomień drugiemu.
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  // Zgłoszony błąd jest przerywany ("nie zawsze dostają powiadomienia"), więc ponowienie nie może go ukryć:
  // test, który przejdzie dopiero za drugim razem, jest oznaczany jako flaky I kończy przebieg błędem.
  retries: isCI ? 1 : 0,
  failOnFlakyTests: true,
  timeout: 3 * 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        // detail: true pokazuje w raporcie także asercje (expect). Pojedyncze wywołania API (click, goto…)
        // są zagnieżdżone w krokach biznesowych (test.step / @step w Page Objectach), więc nie zaśmiecają widoku.
        detail: true,
        suiteTitle: true,
        links: {
          tms: { urlTemplate: () => TEST_PLAN_URL, nameTemplate: 'Plan testów: %s' },
        },
        environmentInfo: {
          BASE_URL: baseURL,
          PRZEGLĄDARKA: 'Chromium (Desktop Chrome)',
          OKNO_NA_POWIADOMIENIE_MS: process.env.NOTIFICATION_WINDOW_MS ?? '20000',
          NODE: process.version,
          CI: String(isCI),
        },
      },
    ],
    ...(isCI ? ([['github']] as const) : []),
  ],
  use: {
    baseURL,
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
