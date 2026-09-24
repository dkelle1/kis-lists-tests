import { Page } from '@playwright/test';
import { NotificationCenter } from './components/NotificationCenter';

/**
 * Wspólna baza Page Objectów.
 *
 * Konwencja lokatorów: role/etykiety widoczne dla użytkownika (getByRole, getByLabel, getByPlaceholder),
 * bez selektorów CSS opartych na strukturze DOM. Lokatory są wstępne – zweryfikować je
 * po rozpoznaniu UI (PLAN.md, 1.4 / 5.3); zmiana dotyczy wyłącznie klas w src/pages.
 */
export abstract class BasePage {
  readonly notifications: NotificationCenter;

  constructor(readonly page: Page) {
    this.notifications = new NotificationCenter(page);
  }
}
