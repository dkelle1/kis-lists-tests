import { Locator, Page, test } from '@playwright/test';
import { privateTextOn } from '../support/privacy';

/** Zrzuty jako JPEG – kilkukrotnie mniejsze niż PNG, a raport ma zrzut z każdego kroku. */
export const SCREENSHOT = { type: 'jpeg', quality: 70 } as const;

/**
 * Dowody w raporcie (Playwright HTML i Allure). Wywoływane wewnątrz `test.step`, więc Allure pokazuje
 * je pod tym krokiem (a nie zbiorczo na końcu testu) – także dla testów zakończonych sukcesem.
 */
export async function attachScreenshot(name: string, target: Locator | Page): Promise<void> {
  const page = 'context' in target ? target : target.page();
  const body = await target.screenshot({ ...SCREENSHOT, mask: [privateTextOn(page)] });
  await test.info().attach(name, { body, contentType: 'image/jpeg' });
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
