import { Locator, Page } from '@playwright/test';
import { TIMEOUTS } from '../../config/timeouts';
import { retryUntil } from '../../support/retry';
import { step } from '../../support/step';

/**
 * Centrum powiadomień – panel wysuwany dzwonkiem (button[title="Pokaż powiadomienia"]).
 *
 *   .slider(.slide-in | .slide-out)       panel jest zawsze w DOM; otwarcie = wysunięcie na ekran
 *   .slider > button.slider-close         widoczny przycisk zamknięcia (w nagłówku okna jest drugi, ukryty)
 *   .notifications-window
 *     button[title=Powiadomienia] .kis-pill   licznik
 *     .notifications-body > span > *          wpisy (struktura wywnioskowana z pustego panelu – do potwierdzenia)
 *     .notifications-empty                    "Wszystko przeczytane, wszystko ogarnięte."
 *
 * Aplikacja pamięta otwarty panel po przeładowaniu i wysuwa go chwilę po starcie (zasłania wtedy dzwonek).
 * Strona /lists ma dodatkowo własny, osadzony panel powiadomień – ten Page Object obsługuje panel z nagłówka.
 */
export class NotificationCenter {
  readonly bell: Locator;
  readonly slider: Locator;
  readonly openedSlider: Locator;
  readonly panel: Locator;
  readonly notificationsTab: Locator;
  readonly counter: Locator;
  readonly entries: Locator;
  readonly emptyState: Locator;
  readonly closeButton: Locator;

  constructor(private readonly page: Page) {
    const window = page.locator('.notifications-window');
    this.bell = page.getByTitle('Pokaż powiadomienia', { exact: true });
    this.slider = page.locator('.slider').filter({ has: window });
    this.openedSlider = page.locator('.slider.slide-in').filter({ has: window });
    this.panel = this.slider.locator('.notifications-window');
    this.notificationsTab = this.panel.getByTitle('Powiadomienia', { exact: true });
    this.counter = this.notificationsTab.locator('.kis-pill');
    this.entries = this.panel.locator('.notifications-body > span > *');
    this.emptyState = this.panel.locator('.notifications-empty');
    this.closeButton = this.slider.locator(':scope > .slider-close');
  }

  entriesWith(text: string): Locator {
    return this.entries.filter({ hasText: text });
  }

  @step('Otwórz centrum powiadomień')
  async open(): Promise<void> {
    await retryUntil(
      'Otwarcie centrum powiadomień',
      async () => {
        if (await this.openedSlider.isVisible()) return;
        // Panel mógł się właśnie sam wysunąć i zasłonić dzwonek – wtedy następna próba zastanie go otwartego.
        await this.bell.click({ timeout: TIMEOUTS.uiRetry }).catch(() => undefined);
      },
      () => this.openedSlider.isVisible(),
    );
    await this.notificationsTab.click();
  }

  @step('Zamknij centrum powiadomień')
  async close(): Promise<void> {
    await this.closeButton.click();
    await this.openedSlider.waitFor({ state: 'detached' });
  }

  /**
   * Wczytuje aplikację od nowa i otwiera panel – powiadomienia powstają w tle, po stronie serwera.
   * Używamy /team: lekka strona z samym panelem w nagłówku (na /lists pulpit ma drugi, osadzony panel).
   */
  @step('Odśwież centrum powiadomień')
  async refresh(): Promise<void> {
    await this.page.goto('/team');
    await this.open();
  }

  /** Odświeża panel i liczy wpisy zawierające tekst (np. znacznik komentarza). */
  async refreshAndCountWith(text: string): Promise<number> {
    await this.refresh();
    return this.entriesWith(text).count();
  }

  /** Odświeża panel i liczy wszystkie wpisy. */
  async refreshAndCount(): Promise<number> {
    await this.refresh();
    return this.entries.count();
  }
}
