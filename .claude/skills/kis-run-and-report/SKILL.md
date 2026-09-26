---
name: kis-run-and-report
description: Uruchomienie testów E2E kis-lists-tests na żywej aplikacji (lokalnie, w chmurze Claude albo w GitHub Actions), odczyt wyników i raportu Allure oraz aktualizacja raportu testerskiego (tabela wyników, zgłoszenia błędów BUG-xx, PLAN.md). Użyj po napisaniu testu, przed PR-em i gdy użytkownik prosi o wyniki.
---

# Uruchomienie testów i raport

## Uruchomienie

| Gdzie          | Polecenie                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Lokalnie       | `npm test`, `npm run test:regression`, `npx playwright test --grep "@R3"`                                      |
| Chmura Claude  | `npx playwright test -c .local/playwright.sandbox.config.ts [--grep …] > .local/run.log 2>&1` (w tle)          |
| GitHub Actions | Actions → „E2E – powiadomienia o komentarzach” → Run workflow (zestaw: all/positive/negative/regression/R1–R3) |

- Pełny przebieg trwa ~7 min (workers = 1, okno 20 s na powiadomienie). Uruchamiaj w tle i czekaj pętlą
  `until grep -qE "^\s+[0-9]+ (passed|failed)" .local/run.log; do sleep 10; done`.
- **Nie dodawaj `--reporter=list`**, jeśli potrzebujesz Allure – nadpisuje reportery z konfiguracji.
- Jeśli setup prosi o kod 2FA – skill `kis-accounts-2fa`.
- W GitHub Actions: podsumowanie na stronie przebiegu, artefakt `allure-report` = jeden plik `index.html` (otwiera się bez serwera), `allure-results`, `playwright-report`.

## Odczyt wyników

```bash
grep -E "^\s+(✓|✘|-) " .local/run.log                        # lista testów
grep -E "Error:|Oczekiwano|Brak powiadomienia" .local/run.log   # kto nie dostał / kto dostał, a nie powinien
npx allure generate allure-results -o allure-report            # raport (Allure 3, bez Javy); npm run report:allure otwiera
```

Komunikaty asercji domenowych mówią wprost: „`<osoba>`: powiadomienie o komentarzu – Brak powiadomienia w ciągu 20 s”
albo „Oczekiwano braku… znaleziono: 1”. Zrzuty: `test-results/**/test-failed-*.png`, dowody sukcesu w Allure.

**Czerwony test ≠ błąd aplikacji.** Zanim wpiszesz ❌:

1. Sprawdź zrzut – czy komentarz się wysłał, czy okno dotyczyło właściwego produktu.
2. Potwierdź ręcznie skryptem (`kis-explore-app`, `dumpNotifications`) – także po kilku minutach.
3. Powtórz 2–3 razy (czy stały, czy przerywany).

## Aktualizacja raportu (README)

1. **Sekcja 4 „Wyniki”** – wiersz na scenariusz, kolumna na konto: ✅ zgodnie z wymaganiem, **❌** błąd, „autor”, ⏳ nie wykonano; w „Uwagach” link `[BUG-0x](#bug-0x)`.
2. **Nowy błąd** – kolejny numer `BUG-0x` w „Zgłoszone błędy”: Tytuł, Priorytet, Kroki, Oczekiwany / Rzeczywisty rezultat, Częstotliwość/środowisko (data), **Test regresyjny** (plik + ID). Obserwacje, które nie łamią wymagań → „Uwagi (U-0x)”.
3. **Sekcja 5** – licznik ostatniego przebiegu i lista testów regresyjnych.
4. **PLAN.md** – statusy etapów (✅ / 🟡 / ⬜).
5. `npx prettier --write README.md PLAN.md && npm run check`.

Nie wpisuj do raportu niczego, czego nie zaobserwowano na żywo, ani danych kont (adresów, haseł, id listy, linków).
