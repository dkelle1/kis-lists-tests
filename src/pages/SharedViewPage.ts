import { Locator, Page } from '@playwright/test';
import { ClientData } from '../data/factories';
import { CommentThread } from './components/CommentThread';

/** Widok klienta (bez logowania): udostępniona lista na żywo albo propozycja. */
export class SharedViewPage {
  private readonly clientName: Locator;

  constructor(private readonly page: Page) {
    this.clientName = page
      .getByLabel(/imię|name/i)
      .or(page.getByPlaceholder(/imię|name/i))
      .first();
  }

  async goto(shareUrl: string): Promise<void> {
    await this.page.goto(shareUrl);
  }

  async openItemComments(itemName?: string): Promise<CommentThread> {
    const item = itemName
      ? this.page.getByRole('listitem').filter({ hasText: itemName }).first()
      : this.page.getByRole('listitem').first();
    await item.click();
    const thread = new CommentThread(this.page);
    await thread.open();
    return thread;
  }

  /** Część widoków pyta klienta o imię przed pierwszym komentarzem. */
  async identifyIfAsked(client: ClientData): Promise<void> {
    if (await this.clientName.isVisible()) {
      await this.clientName.fill(client.name);
    }
  }
}
