import { Locator, Page } from '@playwright/test';
import { step } from '../../support/step';
import { CommentForm } from './CommentForm';

/**
 * Modal "Komentarze: <produkt>" otwierany ikoną chmurki na liście (widok członka zespołu).
 * Zakładki: "Prywatne" (czat zespołu) i "Komentarze klienta" (data-testid=comments-public-tab).
 */
export class CommentsModal {
  readonly root: Locator;
  /** Nazwa produktu w nagłówku modala. */
  readonly productName: Locator;
  readonly privateTab: Locator;
  readonly clientTab: Locator;
  readonly thread: Locator;
  /** Wpisy w wątku (`.kis-comment`) – głównym albo w widoku odpowiedzi „Wątek: <autor>”. */
  readonly comments: Locator;
  /** Wpisy bez treści (pusta albo z samych białych znaków) – nie powinny istnieć (N-06). */
  readonly emptyComments: Locator;
  /** Nagłówek widoku odpowiedzi, np. „Wątek: Damian Keller”. */
  readonly replyThreadTitle: Locator;
  readonly form: CommentForm;
  readonly closeButton: Locator;

  constructor(readonly page: Page) {
    this.root = page.getByRole('dialog').filter({ has: page.locator('.comments-modal') });
    this.productName = this.root.locator('.modal-subtitle');
    this.privateTab = this.root.getByRole('link', { name: /Prywatne/ });
    this.clientTab = this.root.getByTestId('comments-public-tab');
    this.thread = this.root.locator('.kis-comments');
    this.comments = this.thread.locator('.kis-comment');
    this.emptyComments = this.comments.filter({
      has: page.locator('.kis-comment-body').filter({ hasNotText: /\S/ }),
    });
    this.replyThreadTitle = this.root.getByText(/^Wątek:/);
    this.form = new CommentForm(page, this.root.locator('.kis-comment-form.active'));
    this.closeButton = this.root.locator('.kis-dialog-head-cta').getByRole('button');
  }

  /**
   * Treść wysłanego komentarza – najmniejszy element z danym tekstem (akapit wiadomości). Oznaczenie "@"
   * jest w TipTap elementem w tym samym akapicie, więc asercje na tym lokatorze nie "pożyczą" oznaczenia
   * z innego komentarza w wątku.
   */
  comment(text: string): Locator {
    return this.thread.getByText(text);
  }

  /** Wpis wątku zawierający tekst (np. znacznik komentarza). */
  commentEntry(text: string): Locator {
    return this.comments.filter({ hasText: text });
  }

  /** Przycisk „odpowiedz” pod komentarzem. */
  replyButton(parentText: string): Locator {
    return this.commentEntry(parentText).getByRole('button', { name: 'odpowiedz' });
  }

  /** Komentarz członka zespołu trafia do zakładki "Prywatne" (czat zespołu). */
  @step('Wyślij komentarz w czacie zespołu')
  async sendTeamComment(text: string, options: { mentions?: readonly string[] } = {}): Promise<void> {
    await this.privateTab.click();
    await this.form.send(text, options);
  }

  /** „odpowiedz” otwiera widok „Wątek: <autor>” z własnym formularzem – odpowiedź trafia do tego wątku. */
  @step('Odpowiedz na komentarz „{0}”')
  async replyTo(parentText: string, text: string): Promise<void> {
    await this.privateTab.click();
    await this.replyButton(parentText).click();
    await this.replyThreadTitle.waitFor();
    await this.form.send(text);
  }

  @step('Zamknij komentarze')
  async close(): Promise<void> {
    await this.closeButton.click();
    await this.root.waitFor({ state: 'hidden' });
  }
}
