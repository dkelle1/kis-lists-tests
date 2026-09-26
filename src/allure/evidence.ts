import { Locator, Page, test } from '@playwright/test';

/**
 * Dowody w raporcie (Playwright HTML i Allure). Wywoływane wewnątrz `test.step`, więc Allure pokazuje
 * je pod tym krokiem (a nie zbiorczo na końcu testu) – także dla testów zakończonych sukcesem.
 */
export async function attachScreenshot(name: string, target: Locator | Page): Promise<void> {
  await test.info().attach(name, { body: await target.screenshot(), contentType: 'image/png' });
}

export async function attachText(name: string, text: string): Promise<void> {
  await test.info().attach(name, { body: text, contentType: 'text/plain' });
}

/**
 * Wykonuje krok i przy błędzie dołącza zrzut ekranu do TEGO kroku, zanim błąd przerwie test.
 * Zastępuje automatyczne zrzuty Playwrighta z końca testu (`screenshot: 'only-on-failure'`),
 * które trafiały do raportu bez podpisu i bez związku z krokiem.
 */
export async function withFailureScreenshot<T>(name: string, page: Page, body: () => Promise<T>): Promise<T> {
  try {
    return await body();
  } catch (error) {
    await attachScreenshot(`${name} – ekran w chwili błędu`, page).catch(() => undefined);
    throw error;
  }
}
