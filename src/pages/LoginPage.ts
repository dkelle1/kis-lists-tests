import { Locator, Page } from '@playwright/test';
import { TeamMember } from '../data/team';
import { step } from '../support/step';

/** Formularz logowania /login (id pól nadane przez aplikację). */
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

  @step('Otwórz stronę logowania')
  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  /** Po poprawnych danych aplikacja przechodzi na /2fa (kod z e-maila) – patrz TwoFactorPage. */
  @step('Zaloguj się loginem i hasłem')
  async login(user: TeamMember): Promise<void> {
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.rememberMe.check();
    await this.submit.click();
  }
}
