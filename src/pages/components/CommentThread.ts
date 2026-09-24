import { expect, Locator, Page } from '@playwright/test';

/** Komponent wątku komentarzy – ten sam dla członka zespołu i klienta. */
export class CommentThread {
  private readonly toggle: Locator;
  private readonly input: Locator;
  private readonly send: Locator;

  constructor(private readonly page: Page) {
    this.toggle = page.getByRole('button', { name: /komentarz|comment/i }).first();
    this.input = page
      .getByRole('textbox', { name: /komentarz|comment/i })
      .or(page.getByPlaceholder(/komentarz|comment/i))
      .first();
    this.send = page.getByRole('button', { name: /wyślij|dodaj|send|add/i }).last();
  }

  async open(): Promise<void> {
    if (!(await this.input.isVisible())) {
      await this.toggle.click();
    }
    await expect(this.input).toBeVisible();
  }

  /** Oznacza osobę: wpisuje "@" + początek imienia i wybiera ją z podpowiedzi. */
  async mention(displayName: string): Promise<void> {
    await this.input.pressSequentially(`@${displayName.slice(0, 3)}`);
    await this.page
      .getByRole('option', { name: new RegExp(displayName, 'i') })
      .or(this.page.getByRole('listitem').filter({ hasText: displayName }))
      .first()
      .click();
    await this.input.pressSequentially(' ');
  }

  async add(text: string, options: { mentions?: string[] } = {}): Promise<void> {
    await this.input.click();
    for (const name of options.mentions ?? []) {
      await this.mention(name);
    }
    await this.input.pressSequentially(text);
    await this.send.click();
    await expect(this.page.getByText(text).first(), 'komentarz nie pojawił się w wątku').toBeVisible();
  }
}
