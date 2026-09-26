import { Locator, Page } from '@playwright/test';

/** Adres e-mail w tekście strony (np. nagłówek powiadomienia o komentarzu klienta, strona /2fa). */
const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/;

/**
 * Elementy zamazywane na każdym zrzucie: raport i artefakty CI są publiczne, a zrzuty nie mogą ujawniać
 * adresów kont ani danych logowania.
 */
export function privateTextOn(page: Page): Locator {
  return page.getByText(EMAIL);
}
