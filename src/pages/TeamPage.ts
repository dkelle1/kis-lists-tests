import { expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** Zakładka "Zespół" (/team): członkowie zespołu i zapraszanie nowych osób. */
export class TeamPage extends BasePage {
  readonly membersTab: Locator = this.page.getByRole('link', { name: /^Członkowie zespołu \(\d+\)$/ });
  readonly inviteInput: Locator = this.page.getByRole('textbox', { name: 'Zaproś dodatkową osobę przez email' });
  readonly inviteButton: Locator = this.page.getByRole('button', { name: 'Zaproś', exact: true });

  async goto(): Promise<void> {
    await this.page.goto('/team');
    await expect(this.membersTab).toBeVisible();
  }

  member(email: string): Locator {
    return this.page.getByText(email, { exact: true });
  }

  /** Wysyła zaproszenie do zespołu (e-mail z linkiem aktywacyjnym trafia do zapraszanej osoby). */
  async invite(email: string): Promise<void> {
    await this.inviteInput.fill(email);
    await this.inviteButton.click();
  }
}
