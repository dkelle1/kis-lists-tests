import { Page } from '@playwright/test';
import { NotificationCenter } from './components/NotificationCenter';

/**
 * Baza Page Objectów zalogowanego członka zespołu (nagłówek z dzwonkiem jest na każdej stronie).
 *
 * Zasady Page Objectów w tym projekcie:
 *  - udostępniają lokatory i akcje biznesowe; NIE zawierają asercji (`expect`) – weryfikacja należy do testów
 *    (pilnuje tego reguła ESLint `no-restricted-imports` dla src/pages);
 *  - mogą czekać na gotowość UI (`locator.waitFor`), bo to synchronizacja akcji, a nie sprawdzenie wyniku;
 *  - akcje są oznaczone `@step`, więc w raporcie widać kroki biznesowe zamiast pojedynczych kliknięć.
 */
export abstract class BasePage {
  readonly notifications: NotificationCenter;

  constructor(readonly page: Page) {
    this.notifications = new NotificationCenter(page);
  }
}
