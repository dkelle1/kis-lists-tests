/** Czasy używane przez framework – w jednym miejscu zamiast "magicznych liczb" w kodzie. */
export const TIMEOUTS = {
  /** Jedna próba interakcji, po której oczekujemy reakcji UI (retryUntil). */
  uiRetry: 2_000,
  uiRetryPoll: 500,
  uiRetryAttempts: 5,
  /** Odstęp między kolejnymi odświeżeniami centrum powiadomień przy odpytywaniu. */
  notificationPoll: 3_000,
  /** Dodatkowe odświeżenie po znalezieniu powiadomienia – wyłapuje duplikaty dochodzące z opóźnieniem. */
  notificationSettle: 3_000,
} as const;
