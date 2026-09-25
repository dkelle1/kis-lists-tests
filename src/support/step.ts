import { test } from '@playwright/test';

const MAX_ARG_LENGTH = 60;

function formatTitle(title: string, args: readonly unknown[]): string {
  return title.replace(/\{(\d+)\}/g, (_, index: string) => {
    const value = String(args[Number(index)] ?? '');
    return value.length > MAX_ARG_LENGTH ? `${value.slice(0, MAX_ARG_LENGTH)}…` : value;
  });
}

/**
 * Zamienia metodę Page Objectu w krok raportu (Playwright HTML + Allure).
 * `{0}`, `{1}`… w tytule są zastępowane argumentami wywołania.
 * `box: true` – błąd wewnątrz kroku jest raportowany w linii testu, który wywołał metodę.
 */
export function step(title: string) {
  return function <This, Args extends unknown[], Result>(method: (this: This, ...args: Args) => Promise<Result>) {
    return function (this: This, ...args: Args): Promise<Result> {
      return test.step(formatTitle(title, args), () => method.call(this, ...args), { box: true });
    };
  };
}
