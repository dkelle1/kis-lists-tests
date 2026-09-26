import { Locator, Page } from '@playwright/test';
import { HasSensitiveData, step } from '../support/step';

/**
 * Drugi krok logowania /2fa: 4 pola na cyfry kodu wysłanego e-mailem.
 * Po wpisaniu 4. cyfry formularz wysyła się sam.
 */
export class TwoFactorPage implements HasSensitiveData {
  readonly digits: Locator;
  /** Zamazywane na zrzutach kroków: kod jednorazowy i adres konta. */
  readonly sensitive: readonly Locator[];

  constructor(readonly page: Page) {
    this.digits = page.locator('form:has(#_auth_code) input[type=text]');
    this.sensitive = [this.digits];
  }

  isCurrent(): boolean {
    return new URL(this.page.url()).pathname.startsWith('/2fa');
  }

  @step('Wpisz kod 2FA')
  async enterCode(code: string): Promise<void> {
    for (const [index, digit] of [...code.trim()].entries()) {
      await this.digits.nth(index).fill(digit);
    }
    await this.page.waitForURL((url) => !url.pathname.startsWith('/2fa'));
  }
}
