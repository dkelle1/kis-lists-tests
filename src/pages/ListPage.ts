import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { CommentThread } from './components/CommentThread';

/** Widok listy dla zalogowanego członka zespołu. */
export class ListPage extends BasePage {
  private item(name?: string): Locator {
    return name
      ? this.page.getByRole('listitem').filter({ hasText: name }).first()
      : this.page.getByRole('listitem').first();
  }

  /** Otwiera element listy (domyślnie pierwszy) i zwraca jego wątek komentarzy. */
  async openItemComments(itemName?: string): Promise<CommentThread> {
    await this.item(itemName).click();
    const thread = new CommentThread(this.page);
    await thread.open();
    return thread;
  }
}
