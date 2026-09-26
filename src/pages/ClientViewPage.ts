import { Locator, Page } from '@playwright/test';
import { step } from '../support/step';
import { CommentForm } from './components/CommentForm';

/**
 * Widok klienta (bez logowania): propozycja (/proposal/preview/…) i udostępniona lista (/list-preview/…) –
 * ten sam układ: produkt .proposal-item#item_<itemId> (podkreślnik – inaczej niż na liście zespołu)
 * z przyciskiem „Napisz komentarz”.
 */
export class ClientViewPage {
  readonly items: Locator;

  constructor(readonly page: Page) {
    this.items = page.locator('.proposal-item');
  }

  @step('Klient otwiera link')
  async goto(url: string): Promise<void> {
    await this.page.goto(url);
    await this.items.first().waitFor();
  }

  item(itemId: string): Locator {
    return this.page.locator(`#item_${itemId}`);
  }

  commentForm(itemId: string): CommentForm {
    return new CommentForm(this.page, this.item(itemId).locator('.kis-comment-form.active'));
  }

  @step('Klient komentuje produkt {0}: „{1}”')
  async sendComment(itemId: string, text: string): Promise<void> {
    await this.item(itemId).hover();
    await this.item(itemId).getByRole('button', { name: 'Napisz komentarz' }).click();
    await this.commentForm(itemId).send(text);
  }
}
