import { expect, Locator, Page } from '@playwright/test';
import { CommentForm } from './components/CommentForm';

/**
 * Widok klienta (bez logowania): propozycja (/proposal/...) lub udostępniona lista.
 *
 * DOM propozycji:
 *   produkt              .proposal-item#item_<itemId>   (podkreślnik – inaczej niż na liście zespołu)
 *   kolumna komentarzy   .proposal-item-comments > button "Napisz komentarz"
 *   formularz            .kis-comment-form.active (ten sam komponent co u zespołu)
 *
 * UWAGA: zweryfikowane na podglądzie propozycji; widok udostępnionej listy do potwierdzenia po jej udostępnieniu.
 */
export class ClientViewPage {
  readonly items: Locator;

  constructor(private readonly page: Page) {
    this.items = page.locator('.proposal-item');
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
    await expect(this.items.first()).toBeVisible();
  }

  item(itemId?: string): Locator {
    return itemId ? this.page.locator(`#item_${itemId}`) : this.items.first();
  }

  async openComments(itemId?: string): Promise<CommentForm> {
    const item = this.item(itemId);
    await item.hover();
    await item.getByRole('button', { name: 'Napisz komentarz' }).click();
    const form = new CommentForm(this.page, item.locator('.kis-comment-form.active'));
    await expect(form.editor).toBeVisible();
    return form;
  }

  async addComment(text: string, itemId?: string): Promise<void> {
    const form = await this.openComments(itemId);
    await form.send(text);
    await expect(this.item(itemId).locator('.proposal-item-comments').getByText(text)).toBeVisible();
  }
}
