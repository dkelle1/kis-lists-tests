import { expect as baseExpect } from '@playwright/test';
import { env } from '../config/env';
import { TIMEOUTS } from '../config/timeouts';
import type { NotificationCenter } from '../pages/components/NotificationCenter';

/**
 * Asercje domenowe dla powiadomień (wywoływane w testach, nie w Page Objectach).
 *
 *   await expect(center).toHaveNotification(marker, { since })
 *       dokładnie JEDNO powiadomienie ze znacznikiem w oknie liczonym od zdarzenia (duplikat = błąd)
 *   await expect(center).not.toHaveNotification(marker, { since })
 *       brak powiadomienia aż do końca okna (fail od razu, gdy się pojawi)
 *   await expect(center).toKeepNotificationCount(baseline, { since })
 *       liczba wpisów nie zmienia się do końca okna
 *
 * Powiadomienia powstają asynchronicznie po stronie serwera, więc asercje odpytują centrum powiadomień
 * (odświeżenie aplikacji co TIMEOUTS.notificationPoll). Okno (NOTIFICATION_WINDOW_MS) liczymy od `since`
 * – momentu wysłania komentarza – a nie od wywołania asercji, żeby kolejne sprawdzenia w tym samym teście
 * nie wydłużały go bez potrzeby.
 */
export interface NotificationWindow {
  /** Date.now() z chwili zdarzenia (np. wysłania komentarza). */
  since: number;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));

async function pollUntil(
  probe: () => Promise<number>,
  isSettled: (value: number) => boolean,
  deadline: number,
): Promise<number> {
  let value = await probe();
  while (!isSettled(value) && Date.now() < deadline) {
    await sleep(Math.min(TIMEOUTS.notificationPoll, deadline - Date.now()));
    value = await probe();
  }
  return value;
}

const seconds = (ms: number): string => `${Math.round(ms / 1000)} s`;

export const expect = baseExpect.extend({
  async toHaveNotification(center: NotificationCenter, marker: string, { since }: NotificationWindow) {
    const name = 'toHaveNotification';
    const window = env().NOTIFICATION_WINDOW_MS;
    const probe = () => center.refreshAndCountWith(marker);

    let count = await pollUntil(probe, (found) => found > 0, since + window);
    if (!this.isNot && count > 0) {
      await sleep(TIMEOUTS.notificationSettle);
      count = await probe();
    }

    const pass = this.isNot ? count > 0 : count === 1;
    const details = this.isNot
      ? `Oczekiwano braku powiadomienia przez ${seconds(window)} od zdarzenia, znaleziono: ${count}.`
      : count === 0
        ? `Brak powiadomienia w ciągu ${seconds(window)} od zdarzenia.`
        : `Oczekiwano dokładnie 1 powiadomienia, znaleziono: ${count} (duplikaty).`;

    return {
      name,
      pass,
      expected: this.isNot ? 0 : 1,
      actual: count,
      message: () =>
        `${this.utils.matcherHint(name, 'centrumPowiadomień', 'znacznik', { isNot: this.isNot })}\n\n` +
        `Znacznik: ${this.utils.printExpected(marker)}\n${details}`,
    };
  },

  async toKeepNotificationCount(center: NotificationCenter, baseline: number, { since }: NotificationWindow) {
    const name = 'toKeepNotificationCount';
    if (this.isNot) throw new Error(`${name} nie obsługuje .not`);
    const window = env().NOTIFICATION_WINDOW_MS;

    const count = await pollUntil(
      () => center.refreshAndCount(),
      (current) => current !== baseline,
      since + window,
    );

    return {
      name,
      pass: count === baseline,
      expected: baseline,
      actual: count,
      message: () =>
        `${this.utils.matcherHint(name, 'centrumPowiadomień', 'liczbaWpisów')}\n\n` +
        `Liczba powiadomień zmieniła się w ciągu ${seconds(window)}: ` +
        `${this.utils.printExpected(baseline)} → ${this.utils.printReceived(count)}`,
    };
  },
});
