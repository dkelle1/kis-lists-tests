import { Locator, Page } from '@playwright/test';
import { retryUntil } from '../support/retry';
import { step } from '../support/step';
import { CommentsModal } from './components/CommentsModal';
import { NotificationCenter } from './components/NotificationCenter';

/**
 * Lista w widoku członka zespołu: /lists/<listId>/edit (+ centrum powiadomień zalogowanego konta).
 *
 * Page Objecty udostępniają lokatory i akcje (`@step` = krok raportu ze zrzutem ekranu); nie zawierają asercji –
 * weryfikacja należy do testów (pilnuje tego reguła ESLint `no-restricted-imports` dla src/pages).
 *
 * Stabilne identyfikatory nadawane przez aplikację:
 *   wiersz produktu     #item-<itemId>
 *   ikona komentarzy    [data-testid="item-comments-<itemId>"]  (renderowana 3× – po jednej na breakpoint)
 */
export class ListPage {
  readonly items: Locator;
  readonly notifications: NotificationCenter;

  constructor(readonly page: Page) {
    this.items = page.locator('[id^="item-"]').filter({ has: page.getByTestId(/^item-comments-/) });
    this.notifications = new NotificationCenter(page);
  }

  /** Strona startowa zalogowanego użytkownika (/lists) – bez ważnej sesji aplikacja przekierowuje na logowanie. */
  @step('Sprawdź zapisaną sesję')
  async openHome(): Promise<void> {
    await this.page.goto('/lists');
  }

  @step('Otwórz listę {0}')
  async goto(listId: string): Promise<void> {
    await this.page.goto(`/lists/${listId}/edit`);
    await this.items.first().waitFor();
  }

  item(itemId: string): Locator {
    return this.page.locator(`#item-${itemId}`);
  }

  /** Nazwa produktu – widoczny wariant (wiersz renderuje nazwę osobno dla różnych szerokości ekranu). */
  itemName(itemId: string): Locator {
    return this.item(itemId).locator('.ws-pre').filter({ visible: true }).first();
  }

  async readItemId(item: Locator): Promise<string> {
    const id = await item.getAttribute('id');
    if (!id?.startsWith('item-')) throw new Error(`Element nie jest wierszem produktu (id="${id}")`);
    return id.slice('item-'.length);
  }

  /**
   * Pierwsze kliknięcie ikony po wczytaniu listy nie otwiera okna (komponent komentarzy ładuje się dopiero
   * wtedy); otwiera je dopiero kolejne, po ok. 1 s. Zwykły klik myszą bywa dodatkowo przechwytywany przez
   * przeciąganie wierszy (sortable), dlatego wysyłamy zdarzenie click i ponawiamy do skutku.
   */
  @step('Otwórz komentarze produktu {0}')
  async openComments(itemId: string): Promise<CommentsModal> {
    const modal = new CommentsModal(this.page);
    const icon = this.item(itemId).getByTestId(`item-comments-${itemId}`).filter({ visible: true });
    await retryUntil(
      `Otwarcie komentarzy produktu ${itemId}`,
      async () => {
        await icon.hover();
        await icon.dispatchEvent('click');
      },
      () => modal.root.isVisible(),
    );
    return modal;
  }
}
