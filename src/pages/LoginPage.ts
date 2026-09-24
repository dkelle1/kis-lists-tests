import { Locator, Page } from '@playwright/test';
import { TeamMember } from '../data/team';

export class LoginPage {
  private readonly email: Locator;
  private readonly password: Locator;
  private readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel(/e-?mail/i);
    this.password = page.getByLabel(/hasło|password/i);
    this.submit = page.getByRole('button', { name: /zaloguj|log in|sign in/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async loginAs(user: TeamMember): Promise<void> {
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.submit.click();
  }
}
