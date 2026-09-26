import { Locator, Page, test } from '@playwright/test';
import { SCREENSHOT } from '../allure/evidence';
import { privateTextOn } from './privacy';

const MAX_ARG_LENGTH = 60;

function formatTitle(title: string, args: readonly unknown[]): string {
  return title.replace(/\{(\d+)\}/g, (_, index: string) => {
    const value = String(args[Number(index)] ?? '');
    return value.length > MAX_ARG_LENGTH ? `${value.slice(0, MAX_ARG_LENGTH)}…` : value;
  });
}

/**
 * Page Object z danymi, których nie może być widać na zrzutach (raport i artefakty są publiczne),
 * np. adres e-mail, hasło, kod 2FA – te elementy są zamazywane.
 */
export interface HasSensitiveData {
  readonly sensitive: readonly Locator[];
}

/** Page Object, którego metody są krokami: ma stronę (do zrzutu) i opcjonalnie dane do zamazania. */
type StepTarget = { readonly page: Page } & Partial<HasSensitiveData>;

async function attachStepScreenshot({ page, sensitive = [] }: StepTarget, title: string): Promise<void> {
  if (page.isClosed()) return;
  const mask = [privateTextOn(page), ...sensitive];
  const body = await page.screenshot({ ...SCREENSHOT, mask, timeout: 5_000 }).catch(() => undefined);
  if (body) await test.info().attach(`Ekran: ${title}`, { body, contentType: 'image/jpeg' });
}

/**
 * Zamienia metodę Page Objectu w krok raportu (Playwright HTML + Allure) ze zrzutem ekranu (`this.page`)
 * na końcu kroku – także przy błędzie – dołączonym POD tym krokiem. Zamazane: adresy e-mail i dane z `sensitive`.
 * `{0}`, `{1}`… w tytule są zastępowane argumentami wywołania.
 * `box: true` – błąd wewnątrz kroku jest raportowany w linii testu, który wywołał metodę.
 */
export function step(title: string) {
  return function <This extends StepTarget, Args extends unknown[], Result>(
    method: (this: This, ...args: Args) => Promise<Result>,
  ) {
    return function (this: This, ...args: Args): Promise<Result> {
      const stepTitle = formatTitle(title, args);
      return test.step(
        stepTitle,
        async () => {
          try {
            return await method.call(this, ...args);
          } finally {
            await attachStepScreenshot(this, stepTitle);
          }
        },
        { box: true },
      );
    };
  };
}
