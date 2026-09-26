import { Locator, Page } from '@playwright/test';
import { Account } from '../data/team';
import { HasSensitiveData, step } from '../support/step';

/** Formularz logowania /logowanie (id pól nadane przez aplikację). */
export class LoginPage implements HasSensitiveData {
  readonly email: Locator;
  readonly password: Locator;
  readonly rememberMe: Locator;
  readonly submit: Locator;
  /** Zamazywane na zrzutach kroków: adres konta i hasło. */
  readonly sensitive: readonly Locator[];

  constructor(readonly page: Page) {
    this.email = page.locator('#username');
    this.password = page.locator('#password');
    this.rememberMe = page.locator('#remember_me');
    this.submit = page.locator('#_submit');
    this.sensitive = [this.email, this.password];
  }

  @step('Otwórz stronę logowania')
  async goto(): Promise<void> {
    await this.page.goto('/logowanie');
  }

  /**
   * Po poprawnych danych aplikacja przechodzi na /2fa (kod z e-maila) – patrz TwoFactorPage –
   * chyba że przeglądarka ma cookie `devid` zaufanego urządzenia; wtedy od razu na listy.
   */
  @step('Zaloguj się loginem i hasłem')
  async login(user: Account): Promise<void> {
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.rememberMe.check();
    await this.submit.click();
    // Zrzut kroku ma pokazać stronę, na którą trafia logowanie (/2fa albo listy), a nie przejście.
    await this.page.waitForURL((url) => !/\/(login|logowanie)/.test(url.pathname));
    await this.page.waitForLoadState('load');
  }
}
