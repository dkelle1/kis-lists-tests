import { expect, Locator, Page } from '@playwright/test';
import { TeamMember } from '../data/team';

/** Formularz logowania: /login (id pól nadane przez aplikację: #username, #password, #_submit). */
export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly rememberMe: Locator;
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.email = page.locator('#username');
    this.password = page.locator('#password');
    this.rememberMe = page.locator('#remember_me');
    this.submit = page.locator('#_submit');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  /** Wysyła login i hasło. Po nim aplikacja przechodzi na /2fa (kod z e-maila) – patrz TwoFactorPage. */
  async submitCredentials(user: TeamMember): Promise<void> {
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.rememberMe.check();
    await this.submit.click();
  }
}

/**
 * Drugi krok logowania: /2fa – 4 pola na cyfry kodu wysłanego e-mailem.
 * Po wpisaniu 4. cyfry formularz wysyła się sam (przycisk "Zaloguj" nie jest potrzebny).
 */
export class TwoFactorPage {
  readonly digits: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.digits = page.locator('form:has(#_auth_code) input[type=text]');
    this.error = page.getByText('Kod weryfikacyjny jest niepoprawny.');
  }

  async isShown(): Promise<boolean> {
    return /\/2fa/.test(this.page.url());
  }

  async enter(code: string): Promise<void> {
    await expect(this.digits).toHaveCount(4);
    for (const [i, digit] of [...code.trim()].entries()) {
      await this.digits.nth(i).fill(digit);
    }
    await expect(this.page, 'kod 2FA nie został przyjęty').not.toHaveURL(/\/2fa/);
  }
}
