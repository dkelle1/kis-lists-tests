import { Locator, Page } from '@playwright/test';
import { step } from '../../support/step';

/**
 * Centrum powiadomień – strona /inbox (ta sama lista, co panel pod dzwonkiem, ale bez animacji
 * i bez drugiego, osadzonego panelu ze strony /lists; dostępna dla każdej roli – /team tylko dla administratora).
 *
 *   .notification[data-key]            wpis (grupa wpisów ma klasę .group i licznik .notification-count)
 *     .notification-header             projekt (+ klienci projektu przy komentarzu klienta)
 *     .notification-context            „<autor> dodał/a komentarz” / „<autor> oznaczył/a Ciebie w komentarzu”
 *       .user                          autor
 *     .notification-details            treść komentarza
 *     .notification-date               data i godzina
 *   „Wszystko przeczytane, wszystko ogarnięte.”   brak powiadomień
 */
export class NotificationCenter {
  readonly entries: Locator;
  /** Wpisy jeszcze bez opisu zdarzenia – lista rysuje najpierw nagłówki, treść dochodzi asynchronicznie. */
  readonly incompleteEntries: Locator;
  readonly emptyState: Locator;

  constructor(readonly page: Page) {
    this.entries = page.locator('.notification[data-key]');
    this.incompleteEntries = this.entries.filter({ hasNot: page.locator('.notification-context') });
    this.emptyState = page.getByText('Wszystko przeczytane, wszystko ogarnięte.');
  }

  entriesWith(text: string): Locator {
    return this.entries.filter({ has: this.page.locator('.notification-details', { hasText: text }) });
  }

  /** Opis zdarzenia, np. „Marcin oznaczył/a Ciebie w komentarzu”. */
  context(entry: Locator): Locator {
    return entry.locator('.notification-context');
  }

  author(entry: Locator): Locator {
    return entry.locator('.notification-context .user');
  }

  project(entry: Locator): Locator {
    return entry.locator('.notification-header');
  }

  /**
   * Wczytuje centrum powiadomień od nowa – powiadomienia powstają w tle, po stronie serwera.
   * Czeka, aż lista się wyrenderuje (wpisy albo komunikat o braku), a potem, aż każdy wpis ma opis zdarzenia i treść –
   * aplikacja rysuje najpierw same nagłówki grup, a liczenie wpisów ze znacznikiem w tym momencie dawało fałszywe „brak”.
   */
  @step('Odśwież centrum powiadomień')
  async refresh(): Promise<void> {
    await this.page.goto('/inbox');
    await this.entries.first().or(this.emptyState).waitFor();
    await this.incompleteEntries.first().waitFor({ state: 'detached' });
  }

  /** Odświeża i liczy wpisy z danym tekstem w treści (np. znacznikiem komentarza). */
  async refreshAndCountWith(text: string): Promise<number> {
    await this.refresh();
    return this.entriesWith(text).count();
  }

  /** Odświeża i liczy wszystkie wpisy. */
  async refreshAndCount(): Promise<number> {
    await this.refresh();
    return this.entries.count();
  }
}
