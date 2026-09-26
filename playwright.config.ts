import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { bugUrl, TEST_PLAN_URL } from './src/allure/metadata';
import { baseURL } from './src/config/env';

const isCI = !!process.env.CI;
/** Okno czekania na powiadomienie (NOTIFICATION_WINDOW_MS, domyślnie 20 s) – od niego zależy limit czasu testu. */
const notificationWindowMs = Number(process.env.NOTIFICATION_WINDOW_MS ?? 20_000);

export default defineConfig({
  testDir: './tests',
  // Scenariusze współdzielą listę testową i centra powiadomień tych samych kont, więc wykonują się
  // sekwencyjnie – jeden test nie może "zjeść" ani podrzucić powiadomień drugiemu.
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  // Bez ponowień: zgłoszony błąd jest przerywany ("nie zawsze dostają powiadomienia"), więc ponowienie mogłoby go
  // ukryć, a testy regresyjne znanych błędów i tak nie przechodzą – ponowienie tylko wydłużało przebieg i raport.
  retries: 0,
  // Każdy test czeka najwyżej jedno okno liczone od wysłania komentarza (reszta to logowanie i akcje w UI).
  timeout: 3 * 60_000 + notificationWindowMs,
  expect: { timeout: 15_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    [
      // allure-playwright bez trace – trace jest w raporcie HTML Playwrighta (src/allure/reporter.ts).
      path.join(__dirname, 'src/allure/reporter.ts'),
      {
        resultsDir: 'allure-results',
        // detail: true pokazuje w raporcie także asercje (expect). Pojedyncze wywołania API (click, goto…)
        // są zagnieżdżone w krokach biznesowych (test.step / @step w Page Objectach), więc nie zaśmiecają widoku.
        detail: true,
        suiteTitle: true,
        links: {
          tms: { urlTemplate: () => TEST_PLAN_URL, nameTemplate: 'Plan testów: %s' },
          issue: { urlTemplate: bugUrl, nameTemplate: 'Błąd: %s' },
        },
        environmentInfo: {
          BASE_URL: baseURL,
          PRZEGLĄDARKA: 'Chromium (Desktop Chrome)',
          OKNO_NA_POWIADOMIENIE_S: String(notificationWindowMs / 1000),
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
    // Zrzuty dołączają kroki testów i fixture'y (src/allure/evidence.ts): pod właściwym krokiem oraz „Stan końcowy”
    // po każdym teście – z podpisem, dla każdego konta. Automatyczne zrzuty Playwrighta (bez podpisu) są wyłączone.
    screenshot: 'off',
    // Wideo całego testu: VIDEO=on (każdy test) – domyślnie tylko testy zakończone błędem.
    video: process.env.VIDEO === 'on' ? 'on' : 'retain-on-failure',
  },
  // Bez osobnego projektu „setup”: logowanie kont jest krokiem „Sesja: <konto>” w każdym teście (fixture `actor`),
  // więc raport testu pokazuje je razem z jego krokami, a statystyki liczą tylko scenariusze.
  projects: [{ name: 'chromium', testMatch: /.*\.spec\.ts/, use: { ...devices['Desktop Chrome'] } }],
});
