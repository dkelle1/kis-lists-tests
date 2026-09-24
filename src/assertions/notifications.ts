import { expect as baseExpect } from '@playwright/test';
import { env } from '../config/env';
import { NotificationCenter } from '../pages/components/NotificationCenter';

/**
 * Asercje domenowe dla powiadomień.
 *
 *   await expect(center).toHaveNotification(marker);      // pojawia się w oknie czasowym (polling)
 *   await expect(center).not.toHaveNotification(marker);  // brak przez CAŁE okno czasowe
 *
 * Wariant negatywny celowo czeka pełne okno: powiadomienia mogą powstawać asynchronicznie,
 * więc natychmiastowe "0 wpisów" nie dowodzi, że powiadomienie nie przyjdzie.
 */
export const expect = baseExpect.extend({
  async toHaveNotification(center: NotificationCenter, marker: string, options: { timeout?: number } = {}) {
    const name = 'toHaveNotification';
    const timeout = options.timeout ?? env().NOTIFICATION_WINDOW_MS;
    const pollEvery = 3_000;
    const deadline = Date.now() + timeout;
    let count = 0;

    if (this.isNot) {
      // Negatywny: czekamy pełne okno i sprawdzamy na końcu (oraz po drodze – wczesne wykrycie błędu).
      while (Date.now() < deadline) {
        count = await center.countFor(marker);
        if (count > 0) break;
        // eslint-disable-next-line playwright/no-wait-for-timeout -- celowy odstęp między odpytaniami centrum powiadomień
        await center.page.waitForTimeout(Math.min(pollEvery, Math.max(0, deadline - Date.now())));
      }
      if (count === 0) count = await center.countFor(marker);
    } else {
      while (true) {
        count = await center.countFor(marker);
        if (count > 0 || Date.now() >= deadline) break;
        // eslint-disable-next-line playwright/no-wait-for-timeout -- celowy odstęp między odpytaniami centrum powiadomień
        await center.page.waitForTimeout(pollEvery);
      }
    }

    const pass = count > 0;
    return {
      name,
      pass,
      expected: this.isNot ? 0 : '>= 1',
      actual: count,
      message: () =>
        this.utils.matcherHint(name, 'notificationCenter', 'marker', { isNot: this.isNot }) +
        `\n\nZnacznik: ${marker}\nOkno czasowe: ${timeout} ms\n` +
        (this.isNot
          ? `Oczekiwano braku powiadomienia, znaleziono ${count}.`
          : 'Oczekiwano powiadomienia, nie pojawiło się w oknie czasowym.'),
    };
  },
});
