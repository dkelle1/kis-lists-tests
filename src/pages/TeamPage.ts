import { Locator, Page } from '@playwright/test';
import { step } from '../support/step';
import { BasePage } from './BasePage';

/** Zakładka "Zespół" (/team): członkowie zespołu i zapraszanie nowych osób. */
export class TeamPage extends BasePage {
  readonly membersTab: Locator;
  readonly inviteInput: Locator;
  readonly inviteButton: Locator;

  constructor(page: Page) {
    super(page);
    this.membersTab = page.getByRole('link', { name: /^Członkowie zespołu \(\d+\)$/ });
    this.inviteInput = page.getByRole('textbox', { name: 'Zaproś dodatkową osobę przez email' });
    this.inviteButton = page.getByRole('button', { name: 'Zaproś', exact: true });
  }

  @step('Otwórz zakładkę Zespół')
  async goto(): Promise<void> {
    await this.page.goto('/team');
    await this.membersTab.waitFor();
  }

  member(email: string): Locator {
    return this.page.getByText(email, { exact: true });
  }

  /** Wysyła zaproszenie do zespołu (e-mail z linkiem aktywacyjnym trafia do zapraszanej osoby). */
  @step('Zaproś do zespołu {0}')
  async invite(email: string): Promise<void> {
    await this.inviteInput.fill(email);
    await this.inviteButton.click();
  }
}
