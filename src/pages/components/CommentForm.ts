import { Locator, Page } from '@playwright/test';
import { retryUntil } from '../../support/retry';
import { step } from '../../support/step';

/**
 * Formularz komentarza (edytor TipTap/ProseMirror) – ten sam komponent u członka zespołu
 * (modal komentarzy na liście) i u klienta (propozycja / udostępniona lista).
 *
 * DOM: .kis-comment-form.active > form > [contenteditable][role=textbox] + button[type=submit] "Wyślij"
 */
export class CommentForm {
  readonly editor: Locator;
  readonly submit: Locator;

  constructor(
    readonly page: Page,
    readonly root: Locator,
  ) {
    this.editor = root.getByRole('textbox');
    this.submit = root.getByRole('button', { name: 'Wyślij', exact: true });
  }

  /**
   * Podpowiedź po wpisaniu "@" (TipTap, renderowana w .tippy-box poza formularzem):
   * przyciski .mention-item z nazwami kont powiązanych z listą.
   */
  mentionOption(appName: string): Locator {
    return this.page.locator('.tippy-box .mention-item').filter({ hasText: appName }).first();
  }

  /**
   * Lista osób ładuje się asynchronicznie – pierwsze "@" po otwarciu okna często pokazuje „Nic nie znaleziono.”
   * i już się nie odświeża. Wtedy usuwamy "@" i wpisujemy je ponownie.
   */
  @step('Oznacz osobę @{0}')
  async mention(appName: string): Promise<void> {
    const option = this.mentionOption(appName);
    let typed = false;
    await retryUntil(
      `Podpowiedź "@${appName}"`,
      async () => {
        if (typed) await this.editor.press('Backspace');
        await this.editor.pressSequentially('@');
        typed = true;
      },
      () => option.isVisible(),
    );
    await option.click();
    await this.editor.pressSequentially(' ');
  }

  @step('Wyślij komentarz: „{0}”')
  async send(text: string, options: { mentions?: readonly string[] } = {}): Promise<void> {
    await this.editor.click();
    for (const appName of options.mentions ?? []) {
      await this.mention(appName);
    }
    await this.editor.pressSequentially(text);
    await this.submit.click();
  }
}
