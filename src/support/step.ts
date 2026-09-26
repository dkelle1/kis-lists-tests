import { Page, test } from '@playwright/test';

const MAX_ARG_LENGTH = 60;

function formatTitle(title: string, args: readonly unknown[]): string {
  return title.replace(/\{(\d+)\}/g, (_, index: string) => {
    const value = String(args[Number(index)] ?? '');
    return value.length > MAX_ARG_LENGTH ? `${value.slice(0, MAX_ARG_LENGTH)}…` : value;
  });
}

export interface StepOptions {
  /**
   * Zrzut ekranu na końcu kroku (także przy błędzie), dołączony POD tym krokiem. Domyślnie tak.
   * Wyłączone m.in. dla logowania (dane konta, kod 2FA) i odświeżania w pętli odpytywania (dziesiątki identycznych zrzutów).
   */
  screenshot?: boolean;
}

function pageOf(target: unknown): Page | undefined {
  const page = (target as { page?: unknown } | null)?.page;
  return page && typeof (page as Page).screenshot === 'function' ? (page as Page) : undefined;
}

async function attachStepScreenshot(target: unknown, title: string): Promise<void> {
  const page = pageOf(target);
  if (!page || page.isClosed()) return;
  const body = await page.screenshot({ timeout: 5_000 }).catch(() => undefined);
  if (body) await test.info().attach(`Ekran: ${title}`, { body, contentType: 'image/png' });
}

/**
 * Zamienia metodę Page Objectu w krok raportu (Playwright HTML + Allure) ze zrzutem ekranu na końcu kroku.
 * `{0}`, `{1}`… w tytule są zastępowane argumentami wywołania.
 * `box: true` – błąd wewnątrz kroku jest raportowany w linii testu, który wywołał metodę.
 * Zrzut robi się ze strony `this.page` Page Objectu.
 */
export function step(title: string, { screenshot = true }: StepOptions = {}) {
  return function <This, Args extends unknown[], Result>(method: (this: This, ...args: Args) => Promise<Result>) {
    return function (this: This, ...args: Args): Promise<Result> {
      const stepTitle = formatTitle(title, args);
      return test.step(
        stepTitle,
        async () => {
          try {
            return await method.call(this, ...args);
          } finally {
            if (screenshot) await attachStepScreenshot(this, stepTitle);
          }
        },
        { box: true },
      );
    };
  };
}
