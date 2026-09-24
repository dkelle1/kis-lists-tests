import { Locator, Page } from '@playwright/test';

/** Centrum powiadomień w aplikacji (ikona dzwonka). */
export class NotificationCenter {
  private readonly bell: Locator;
  private readonly panel: Locator;

  constructor(readonly page: Page) {
    this.bell = page.getByRole('button', { name: /powiadomienia|notifications/i });
    this.panel = page
      .getByRole('dialog')
      .or(page.getByRole('region', { name: /powiadomienia|notifications/i }))
      .first();
  }

  /** Przeładowuje stronę i otwiera panel, żeby zobaczyć powiadomienia utworzone w tle. */
  async refreshAndOpen(): Promise<void> {
    await this.page.reload();
    await this.bell.click();
    await this.panel.waitFor();
  }

  entry(marker: string): Locator {
    return this.panel.getByText(marker, { exact: false });
  }

  async countFor(marker: string): Promise<number> {
    await this.refreshAndOpen();
    return this.entry(marker).count();
  }
}
