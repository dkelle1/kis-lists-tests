---
name: kis-write-e2e-test
description: Pisanie lub poprawa testu E2E (Playwright + TypeScript) w repozytorium kis-lists-tests – scenariusze powiadomień o komentarzach KIS List, Page Objecty, fixtures, asercje domenowe i metadane Allure. Użyj przy każdym nowym scenariuszu z planu testów (P-xx / N-xx), teście regresyjnym dla znalezionego błędu albo zmianie Page Objectu.
---

# Pisanie testu E2E w kis-lists-tests

Przed pisaniem: scenariusz musi być w planie (README, sekcja 3) i sprawdzony na żywo (skill `kis-explore-app`).
Kontekst aplikacji: [docs/LEARNINGS.md](../../../docs/LEARNINGS.md).

## Gdzie co jest

| Warstwa      | Plik                              | Zasada                                                                                       |
| ------------ | --------------------------------- | -------------------------------------------------------------------------------------------- |
| Konta, role  | `src/data/team.ts`                | `ACCOUNTS` (admin, piotr, marcin, guest), `TEAM` = odbiorcy R1–R3, `account(key)`            |
| Dane testowe | `src/data/factories.ts`           | `buildComment('P-xx')` → `{ marker, text }` z unikalnym znacznikiem                          |
| Page Objecty | `src/pages/**`                    | lokatory + akcje z `@step`; **bez `expect`** (ESLint); synchronizacja `waitFor`/`retryUntil` |
| Fixtures     | `src/fixtures/test.ts`            | `actor(key)`, `client`, `listId`, `testItem` – importuj `test`/`expect` stąd                 |
| Asercje      | `src/assertions/notifications.ts` | `toHaveNotification`, `.not.toHaveNotification`, `toKeepNotificationCount` (okno od `since`) |
| Kroki testów | `tests/notifications/steps.ts`    | `postTeamComment`, `expectNotified`, `expectNotNotified` – tu są asercje                     |
| Specyfikacje | `tests/notifications/*.spec.ts`   | R3 → `team-comments.spec.ts`, R1/R2 → `client-comments.spec.ts`                              |
| Allure       | `src/allure/metadata.ts`          | `allureMeta({ requirement, story, scenarios, severity?, bug? })`                             |

## Szablon testu

```ts
test(
  'P-xx: <kto> <co robi> → <kto dostaje powiadomienie>',
  {
    tag: ['@positive', '@regression'], // @negative dla N-xx; @regression, gdy odtwarza błąd
    annotation: allureMeta({ requirement: 'R3', story: '<wariant>', scenarios: ['P-xx'], bug: 'BUG-0x' }),
  },
  async ({ actor, listId, testItem }) => {
    const author = await actor('marcin');
    const comment = buildComment('P-xx');

    const sentAt = await postTeamComment(author, { listId, item: testItem, comment, mentions: [account('piotr')] });

    for (const key of othersThan('marcin')) {
      await expectNotified(await actor(key), {
        comment,
        sentAt,
        expected: { author: author.account.appName, action: COMMENT_ADDED },
      });
    }
    await expectNotNotified(author, { comment, sentAt, reason: 'autor komentarza' });
  },
);
```

## Reguły (sprawdzane w review)

1. **Asercje tylko w testach / `steps.ts`.** Page Object zwraca lokator albo wykonuje akcję.
2. **Każdy test sprawdza pełny zbiór odbiorców:** kto MA dostać (dokładnie 1 wpis) i kto NIE (autor, gość).
3. **Warunki wstępne jako asercje** (okno dotyczy właściwego produktu, komentarz widoczny, edytor pusty) – żeby „brak powiadomienia” nie był „komentarz się nie wysłał”.
4. **Test negatywny ma próbę kontrolną** (ktoś inny musi dostać powiadomienie albo lista musi być czytelna).
5. **Okno czasu liczone od zdarzenia** (`sentAt` / `since`), nigdy `waitForTimeout` w teście.
6. **Asercje miękkie per odbiorca** (`expect.soft` w `steps.ts`) – raport pokazuje wszystkich, nie pierwszego.
7. **Tytuły bez `env()`** – `personaName(key)` zamiast `account(key).name` (`playwright test --list` działa bez sekretów).
8. **Znany błąd:** test pozostaje czerwony (bez `test.fail()`), tag `@regression`, `bug: 'BUG-0x'` w `allureMeta`, opis błędu w README (sekcja 4) i numer testu w polu „Test regresyjny”.
9. **Lokatory:** role / testid / title / id aplikacji; `playwright/no-raw-locators` w testach wymusza Page Objecty.
10. Zrzut ekranu (JPEG) robi się sam na końcu każdego kroku `@step` (ze strony `this.page`); adresy e-mail są zamazywane zawsze, a pola z danymi (hasło, kod) Page Object wystawia w `sensitive` (`HasSensitiveData`). W krokach testu dołączaj dowód przez `attachScreenshot` (`src/allure/evidence.ts`).
11. Nowa akcja w Page Objecie = metoda z `@step('Opis {0}')` (argumenty tekstowe – obiekt wyrenderuje się jako `[object Object]`).

## Zakończenie

```bash
npm run check                                                         # typecheck + ESLint + Prettier
npx playwright test -c .local/playwright.sandbox.config.ts --grep "P-xx"   # w chmurze; lokalnie: npx playwright test --grep "P-xx"
```

Potem skill `kis-run-and-report` – wynik do README i PLAN.md.
