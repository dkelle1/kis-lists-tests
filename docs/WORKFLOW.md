# Workflow – od scenariusza do testu i raportu

Proces używany w tym repozytorium; każdy krok ma skill w `.claude/skills/` (dla Claude Code) i opis dla człowieka.
Całość może wykonać agent `e2e-test-writer` (`.claude/agents/e2e-test-writer.md`).

```
 plan ──► rozpoznanie ──► Page Object ──► test ──► check + przebieg ──► potwierdzenie ──► raport ──► PR
 (README §3)  (kis-explore-app)         (kis-write-e2e-test)   (kis-run-and-report)
```

## 1. Plan

- Scenariusz ma ID w README (sekcja 3): `P-xx` pozytywny, `N-xx` negatywny, wymaganie `R1`–`R3`.
- Określ **autora**, **kto MA** dostać powiadomienie, **kto NIE MA** (autor, gość, konto spoza listy) i **próbę kontrolną**
  dla przypadku negatywnego.

## 2. Rozpoznanie na żywo — `kis-explore-app`

- Skrypt w `.local/explore/` na zalogowanych kontach (`.auth/`), zrzut ekranu, lokatory.
- Wykonaj scenariusz ręcznie (skryptem) i sprawdź powiadomienia wszystkich kont na `/inbox`.
- Nowe fakty → `docs/LEARNINGS.md`.

## 3. Page Object

- Lokatory i akcje (`@step`) w `src/pages/**`; bez asercji; synchronizacja przez `waitFor` / `retryUntil`.
- Selektor → tabela „Kluczowe selektory” w README.

## 4. Test — `kis-write-e2e-test`

- `tests/notifications/*.spec.ts`, kroki z `steps.ts`, metadane `allureMeta`, tagi `@positive` / `@negative` / `@regression` / `@R1–R3`.

## 5. Sprawdzenie i przebieg — `kis-run-and-report`

```bash
npm run check
npx playwright test --grep "P-xx"                       # lokalnie
npx playwright test -c .local/playwright.sandbox.config.ts --grep "P-xx"   # chmura Claude
```

Przed PR: cały zestaw. W CI: Actions → „E2E – powiadomienia o komentarzach”.

## 6. Potwierdzenie

Czerwony test potwierdź ręcznie (zrzut, skrypt, powtórzenie 2–3 razy, sprawdzenie po kilku minutach) – dopiero wtedy
to błąd aplikacji, a nie testu.

## 7. Raport

- README §4: tabela wyników, zgłoszenie `BUG-0x` z polem „Test regresyjny”, uwagi `U-0x`.
- README §5: licznik przebiegu; docs/TEST_CASES.md: status przypadku.
- Test regresyjny zostaje czerwony do czasu poprawki (link „Błąd” w Allure).

## 8. PR

- Gałąź robocza, `npm run check` zielone, opis: co automatyzuje, wynik przebiegu, jakie błędy odtwarza.
- CI (`ci.yml`) sprawdza typy, lint, format i wczytanie testów; E2E uruchamia się ręcznie (sekrety).
