import { Locator, Page } from '@playwright/test';
import { step } from '../support/step';
import { CommentForm } from './components/CommentForm';

/**
 * Widok klienta (bez logowania): propozycja (/proposal/...) lub udostępniona lista.
 *
 *   produkt              .proposal-item#item_<itemId>   (podkreślnik – inaczej niż na liście zespołu)
 *   kolumna komentarzy   .proposal-item-comments z przyciskiem "Napisz komentarz"
 *
 * Zweryfikowane na podglądzie propozycji; widok udostępnionej listy do potwierdzenia po jej udostępnieniu.
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

  comments(itemId: string): Locator {
    return this.item(itemId).locator('.proposal-item-comments');
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
