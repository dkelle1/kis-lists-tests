import { Locator, Page } from '@playwright/test';
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
    private readonly page: Page,
    readonly root: Locator,
  ) {
    this.editor = root.getByRole('textbox');
    this.submit = root.getByRole('button', { name: 'Wyślij', exact: true });
  }

  /**
   * Podpowiedź po wpisaniu "@". Niezweryfikowane na żywo (na koncie nie było jeszcze innych członków
   * zespołu): lista TipTap renderuje się poza formularzem, stąd wyszukiwanie w całej stronie.
   */
  mentionSuggestion(appName: string): Locator {
    return this.page
      .getByRole('option', { name: appName })
      .or(this.page.locator('.kis-dropdown-item').filter({ hasText: appName }))
      .first();
  }

  @step('Oznacz osobę @{0}')
  async mention(appName: string): Promise<void> {
    await this.editor.pressSequentially(`@${appName.slice(0, 3)}`);
    await this.mentionSuggestion(appName).click();
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
