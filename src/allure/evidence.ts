import { Locator, test } from '@playwright/test';

/** Dowód w raporcie (Playwright HTML i Allure) – zrzut elementu także dla testów zakończonych sukcesem. */
export async function attachScreenshot(name: string, target: Locator): Promise<void> {
  await test.info().attach(name, { body: await target.screenshot(), contentType: 'image/png' });
}

export async function attachText(name: string, text: string): Promise<void> {
  await test.info().attach(name, { body: text, contentType: 'text/plain' });
}
