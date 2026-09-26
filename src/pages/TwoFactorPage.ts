import { Locator, Page } from '@playwright/test';
import { step } from '../support/step';

/**
 * Drugi krok logowania /2fa: 4 pola na cyfry kodu wysłanego e-mailem.
 * Po wpisaniu 4. cyfry formularz wysyła się sam.
 */
export class TwoFactorPage {
  readonly digits: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.digits = page.locator('form:has(#_auth_code) input[type=text]');
    this.error = page.getByText('Kod weryfikacyjny jest niepoprawny.');
  }

  isCurrent(): boolean {
    return new URL(this.page.url()).pathname.startsWith('/2fa');
  }

  // Bez zrzutu: kod jednorazowy i adres konta.
  @step('Wpisz kod 2FA', { screenshot: false })
  async enterCode(code: string): Promise<void> {
    for (const [index, digit] of [...code.trim()].entries()) {
      await this.digits.nth(index).fill(digit);
    }
    await this.page.waitForURL((url) => !url.pathname.startsWith('/2fa'));
  }
}
