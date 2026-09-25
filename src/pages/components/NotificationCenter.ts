import { expect, Locator, Page } from '@playwright/test';

/**
 * Centrum powiadomień – panel wysuwany po kliknięciu dzwonka (button[title="Pokaż powiadomienia"]).
 *
 * DOM: .slider(.slide-in | .slide-out) – panel jest zawsze w DOM, otwarcie/zamknięcie to wysunięcie poza ekran
 *      .slider > button.slider-close[title=Zamknij]   – widoczny przycisk zamknięcia (poza oknem)
 *      .slider > .notifications-window
 *        .notifications-header-tabs > button[title=Powiadomienia] (.kis-pill = licznik), button[title=Wyczyszczone]
 *        .notifications-body   – wpisy
 *        .notifications-empty  – "Wszystko przeczytane, wszystko ogarnięte."
 *
 * UWAGA: struktura pojedynczego wpisu nie była jeszcze widoczna (konto nie miało powiadomień),
 * dlatego wpisy wyszukujemy po tekście w .notifications-body.
 */
export class NotificationCenter {
  readonly bell: Locator;
  readonly slider: Locator;
  readonly panel: Locator;
  readonly notificationsTab: Locator;
  readonly unreadCount: Locator;
  readonly entries: Locator;
  readonly emptyState: Locator;
  private readonly closeButton: Locator;

  constructor(readonly page: Page) {
    this.bell = page.getByTitle('Pokaż powiadomienia', { exact: true });
    this.slider = page.locator('.slider').filter({ has: page.locator('.notifications-window') });
    this.panel = this.slider.locator('.notifications-window');
    this.notificationsTab = this.panel.getByTitle('Powiadomienia', { exact: true });
    this.unreadCount = this.notificationsTab.locator('.kis-pill');
    this.entries = this.panel.locator('.notifications-body');
    this.emptyState = this.panel.locator('.notifications-empty');
    // W nagłówku okna jest drugi, ukryty przycisk "Zamknij" – właściwy jest bezpośrednim dzieckiem .slider.
    this.closeButton = this.slider.locator(':scope > .slider-close');
  }

  async isOpen(): Promise<boolean> {
    return /\bslide-in\b/.test((await this.slider.getAttribute('class')) ?? '');
  }

  /**
   * Aplikacja pamięta otwarty panel po przeładowaniu i wysuwa go chwilę po starcie (zasłania wtedy dzwonek),
   * więc otwieramy tylko gdy panel jest zamknięty – w pętli, bo stan może się zmienić w trakcie ładowania.
   */
  async open(): Promise<void> {
    await expect(async () => {
      if (!(await this.isOpen())) await this.bell.click({ timeout: 2_000 });
      await expect(this.slider).toHaveClass(/\bslide-in\b/, { timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await expect(this.panel).toBeInViewport();
    await this.notificationsTab.click();
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await expect(this.slider).not.toHaveClass(/\bslide-in\b/);
  }

  /** Przeładowuje stronę i otwiera panel, żeby zobaczyć powiadomienia utworzone w tle. */
  async refreshAndOpen(): Promise<void> {
    await this.page.reload();
    await expect(this.bell).toBeAttached();
    await this.open();
  }

  entry(text: string): Locator {
    return this.entries.getByText(text, { exact: false });
  }

  async countFor(text: string): Promise<number> {
    await this.refreshAndOpen();
    return this.entry(text).count();
  }
}
