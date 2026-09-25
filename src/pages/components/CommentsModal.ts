import { expect, Locator, Page } from '@playwright/test';
import { CommentForm } from './CommentForm';

/**
 * Modal "Komentarze: <produkt>" otwierany z ikony chmurki na liście (widok członka zespołu).
 * Dwie zakładki: "Prywatne" (czat zespołu) i "Komentarze klienta" (data-testid=comments-public-tab).
 */
export class CommentsModal {
  readonly root: Locator;
  readonly privateTab: Locator;
  readonly clientTab: Locator;
  readonly thread: Locator;
  readonly form: CommentForm;
  private readonly closeButton: Locator;

  constructor(page: Page) {
    this.root = page.getByRole('dialog').filter({ has: page.locator('.comments-modal') });
    this.privateTab = this.root.getByRole('link', { name: /Prywatne/ });
    this.clientTab = this.root.getByTestId('comments-public-tab');
    this.thread = this.root.locator('.kis-comments');
    this.form = new CommentForm(page, this.root.locator('.kis-comment-form.active'));
    this.closeButton = this.root.locator('.kis-dialog-head-cta').getByRole('button');
  }

  async waitForOpen(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  /** Komentarz członka zespołu trafia do zakładki "Prywatne" (czat zespołu). */
  async addTeamComment(text: string, options: { mentions?: string[] } = {}): Promise<void> {
    await this.privateTab.click();
    await this.form.send(text, options);
    await expect(this.thread.getByText(text)).toBeVisible();
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await expect(this.root).toBeHidden();
  }
}
