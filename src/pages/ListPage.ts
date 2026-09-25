import { expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { CommentsModal } from './components/CommentsModal';

/**
 * Lista w widoku członka zespołu: /lists/<listId>/edit
 *
 * Elementy listy mają stabilne identyfikatory z aplikacji:
 *   wiersz produktu     #item-<itemId>
 *   ikona komentarzy    [data-testid="item-comments-<itemId>"]  (renderowana 3× – po jednej na breakpoint)
 */
export class ListPage extends BasePage {
  readonly shareButton = this.page.getByTitle('Udostępnij listę', { exact: true });
  readonly addMemberButton = this.page.getByTitle('Dodaj członka zespołu lub współpracownika', { exact: true });
  readonly proposalButton = this.page.getByTitle('Utwórz propozycję dla klienta', { exact: true });
  readonly items = this.page.locator('[id^="item-"]').filter({ has: this.page.getByTestId(/^item-comments-/) });

  async goto(listId: string): Promise<void> {
    await this.page.goto(`/lists/${listId}/edit`);
    await expect(this.items.first()).toBeVisible();
  }

  item(itemId: string): Locator {
    return this.page.locator(`#item-${itemId}`);
  }

  itemByName(name: string): Locator {
    return this.items.filter({ hasText: name }).first();
  }

  /** Id produktu (z atrybutu id="item-<id>") – przydatne, gdy test wybiera produkt po nazwie. */
  async itemId(item: Locator): Promise<string> {
    const id = await item.getAttribute('id');
    return id!.replace(/^item-/, '');
  }

  /**
   * Otwiera modal komentarzy produktu.
   * Ikona reaguje na zdarzenie click po najechaniu na wiersz; zwykły klik myszą bywa przechwytywany
   * przez obsługę przeciągania wierszy (sortable), dlatego klik jest ponawiany jako zdarzenie DOM.
   */
  async openComments(itemId: string): Promise<CommentsModal> {
    const modal = new CommentsModal(this.page);
    const icon = this.item(itemId).getByTestId(`item-comments-${itemId}`).filter({ visible: true });
    await expect(async () => {
      await icon.hover();
      await icon.dispatchEvent('click');
      await expect(modal.root).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    return modal;
  }
}
