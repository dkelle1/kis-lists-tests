import { expect, Locator, Page } from '@playwright/test';

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
    private readonly page: Page,
    readonly root: Locator,
  ) {
    this.editor = root.getByRole('textbox');
    this.submit = root.getByRole('button', { name: 'Wyślij', exact: true });
  }

  /**
   * Oznacza osobę: "@" + początek imienia, wybór z listy podpowiedzi.
   * Lista podpowiedzi TipTap renderuje się poza formularzem (popup), stąd wyszukiwanie w całej stronie.
   * UWAGA: niezweryfikowane na żywo – na koncie nie było jeszcze innych członków zespołu.
   */
  async mention(displayName: string): Promise<void> {
    await this.editor.pressSequentially(`@${displayName.slice(0, 3)}`);
    await this.page
      .getByRole('option', { name: new RegExp(displayName, 'i') })
      .or(this.page.locator('.tippy-box, [data-tippy-root], .mention-list, .suggestion').getByText(displayName))
      .first()
      .click();
  }

  async send(text: string, options: { mentions?: string[] } = {}): Promise<void> {
    await this.editor.click();
    for (const name of options.mentions ?? []) {
      await this.mention(name);
      await this.editor.pressSequentially(' ');
    }
    await this.editor.pressSequentially(text);
    await this.submit.click();
    await expect(this.editor, 'edytor nie wyczyścił się po wysłaniu – komentarz mógł nie zostać zapisany').toHaveText(
      '',
    );
  }
}
