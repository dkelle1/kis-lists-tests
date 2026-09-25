import { TIMEOUTS } from '../config/timeouts';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Synchronizacja w Page Objectach (bez asercji): powtarza akcję, aż `isSettled` zwróci true.
 * Stan sprawdzamy nierzucającym `isVisible()` zamiast `waitFor`, żeby spodziewane ponowienia
 * nie wyglądały w raporcie jak błędy. Jeśli żadna próba się nie powiedzie – rzuca czytelny błąd.
 */
export async function retryUntil(
  description: string,
  action: () => Promise<void>,
  isSettled: () => Promise<boolean>,
): Promise<void> {
  for (let attempt = 1; attempt <= TIMEOUTS.uiRetryAttempts; attempt++) {
    await action();
    const deadline = Date.now() + TIMEOUTS.uiRetry;
    while (Date.now() < deadline) {
      if (await isSettled()) return;
      await sleep(TIMEOUTS.uiRetryPoll);
    }
  }
  throw new Error(`${description}: brak efektu po ${TIMEOUTS.uiRetryAttempts} próbach`);
}
