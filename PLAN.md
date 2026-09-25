# Plan realizacji zadania

Termin: 3 dni robocze od otrzymania zadania. Legenda: ✅ zrobione · ⬜ do zrobienia · 🔒 zablokowane.

## Etap 0 – Przygotowanie środowiska

| #   | Subtask                                                                                   | Kto | Zależy od | Status |
| --- | ----------------------------------------------------------------------------------------- | --- | --------- | ------ |
| 0.1 | Założyć konto na kislist.com (adres z formularza) – **Piotr**, właściciel                 | Ty  | –         | ✅     |
| 0.2 | Poczekać, aż na koncie pojawi się projekt testowy                                         | Ty  | 0.1       | ✅     |
| 0.3 | Założyć konta z adresami „+”: **Anna**, **Marcin**, **Michalina**                         | Ty  | 0.1       | ⬜     |
| 0.4 | Dodać Annę, Marcina i Michalinę do listy testowej jako członków zespołu                   | Ty  | 0.2, 0.3  | ⬜     |
| 0.5 | Wygenerować linki dla klienta: udostępniona lista (podgląd na żywo) i propozycja          | Ty  | 0.2       | ⬜     |
| 0.6 | Odblokować sieć środowiska Claude (`www.kislist.com`, `app.kislist.com`, ewentualnie API) | Ty  | –         | ✅     |
| 0.7 | Uzupełnić lokalny `.env` na podstawie `.env.example` (bez commitowania)                   | Ty  | 0.3–0.5   | ⬜     |

## Etap 1 – Rozpoznanie aplikacji

| #   | Subtask                                                                                            | Zależy od | Status |
| --- | -------------------------------------------------------------------------------------------------- | --------- | ------ |
| 1.1 | Przejść interfejs jako członek zespołu: lista, elementy, wątek komentarzy, oznaczenie `@`, dzwonek | 0.4       | ⬜     |
| 1.2 | Przejść interfejs jako klient (incognito): komentarz do listy i do propozycji                      | 0.5       | ⬜     |
| 1.3 | Sprawdzić kanały powiadomień: centrum powiadomień w aplikacji, e-mail, ustawienia powiadomień      | 1.1       | ⬜     |
| 1.4 | Zanotować rzeczywiste etykiety i elementy UI (do poprawienia selektorów)                           | 1.1, 1.2  | ✅     |
| 1.5 | Sprawdzić ustawienia powiadomień każdego członka (czy nic nie jest wyłączone przed testami)        | 1.3       | ⬜     |

## Etap 2 – Plan testów (część 1)

| #   | Subtask                                                                                             | Zależy od | Status |
| --- | --------------------------------------------------------------------------------------------------- | --------- | ------ |
| 2.1 | Spisać wymagania R1–R3 i macierz autor × odbiorca                                                   | –         | ✅     |
| 2.2 | Scenariusze pozytywne P-01…P-11                                                                     | 2.1       | ✅     |
| 2.3 | Scenariusze negatywne N-01…N-08                                                                     | 2.1       | ✅     |
| 2.4 | Zweryfikować plan po rozpoznaniu UI (dodać/usunąć scenariusze, np. wątki, role gość/współpracownik) | 1.1–1.3   | ⬜     |

## Etap 3 – Wykonanie testów manualnych

| #   | Subtask                                                                                    | Zależy od | Status |
| --- | ------------------------------------------------------------------------------------------ | --------- | ------ |
| 3.1 | P-01, P-02 – komentarze klienta (propozycja, udostępniona lista)                           | 2.4       | ⬜     |
| 3.2 | P-03…P-06 – komentarz każdej z 4 osób, sprawdzenie pozostałych 3 (12 par nadawca→odbiorca) | 2.4       | ⬜     |
| 3.3 | P-07, P-08 – komentarze z oznaczeniami `@`                                                 | 2.4       | ⬜     |
| 3.4 | P-09…P-11 – odpowiedzi w wątku, treść i link powiadomienia, nowy członek listy             | 2.4       | ⬜     |
| 3.5 | N-01…N-08 – scenariusze negatywne                                                          | 2.4       | ⬜     |
| 3.6 | Powtórzyć przypadki z błędem 2–3 razy (czy to stały, czy losowy problem)                   | 3.1–3.5   | ⬜     |
| 3.7 | Zebrać dowody: zrzuty ekranu i nagrania, godzina, autor, odbiorca                          | 3.1–3.5   | ⬜     |

## Etap 4 – Raport

| #   | Subtask                                                                                  | Zależy od | Status |
| --- | ---------------------------------------------------------------------------------------- | --------- | ------ |
| 4.1 | Uzupełnić tabelę wyników w README (✅/❌ dla każdego odbiorcy)                           | 3.x       | ⬜     |
| 4.2 | Opisać znaleziony błąd według szablonu: kroki, oczekiwany i rzeczywisty rezultat, zakres | 3.6       | ⬜     |
| 4.3 | Wskazać wzorzec błędu (np. zależność od autora, roli albo oznaczenia `@`)                | 4.2       | ⬜     |

## Etap 5 – Framework testów (Playwright + TypeScript)

| #    | Subtask                                                                                                                                                    | Zależy od | Status |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 5.1  | Struktura projektu: `src/` (framework) + `tests/` (specyfikacje), `playwright.config.ts`, `tsconfig.json` (strict)                                         | –         | ✅     |
| 5.2  | Konfiguracja z walidacją (zod): `src/config/env.ts`, `.env.example`, sekrety poza repo                                                                     | 5.1       | ✅     |
| 5.3  | Page Object Model: `LoginPage`/`TwoFactorPage`, `ListPage`, `ClientViewPage`, `TeamPage` + komponenty `CommentsModal`, `CommentForm`, `NotificationCenter` | 5.1       | ✅     |
| 5.4  | Fixtures (`test.extend`): `teamMember(osoba)` – osobny kontekst na osobę, `client`, `listId`, `testItem`                                                   | 5.3       | ✅     |
| 5.5  | Logowanie raz na przebieg: projekt `setup` + `storageState` w `.auth/`                                                                                     | 5.4       | ✅     |
| 5.6  | Dane testowe z faker (odpowiednik Bogus): komentarze z unikalnym znacznikiem, opcjonalny `FAKER_SEED`                                                      | 5.1       | ✅     |
| 5.7  | Asercje domenowe (`expect.extend`): dokładnie 1 powiadomienie / brak do końca okna od wysłania / liczba wpisów bez zmian                                   | 5.3       | ✅     |
| 5.8  | Raportowanie: Allure 3 (metadane w adnotacjach, link do planu, kroki `@step`, dowody przy sukcesie, PL) + HTML Playwright                                  | 5.1       | ✅     |
| 5.9  | Tagi i zestawy: `@positive`, `@negative`, `@regression`, `@R1`–`@R3` + skrypty npm                                                                         | 5.1       | ✅     |
| 5.10 | Jakość kodu: ESLint (typescript-eslint, eslint-plugin-playwright), Prettier, `npm run check`                                                               | 5.1       | ✅     |
| 5.11 | Lokatory na rzeczywistym DOM + smoke tylko do odczytu na żywej aplikacji (brak: „@”, wpis powiadomienia)                                                   | 1.4       | ✅     |
| 5.12 | Uruchomić framework na żywej aplikacji i ustabilizować (okno czasowe, logowanie, zależności między testami)                                                | 5.11, 0.6 | ⬜     |
| 5.13 | Review testów: asercje wyłącznie w testach (ESLint), dokładnie 1 powiadomienie, treść (P-10), próby kontrolne, poprawka N-08                               | 5.11      | ✅     |

## Etap 6 – Automatyzacja scenariuszy i test regresyjny (część 2)

| #   | Subtask                                                                                          | Zależy od | Status |
| --- | ------------------------------------------------------------------------------------------------ | --------- | ------ |
| 6.1 | Scenariusze R1/R2 (klient) – P-01, P-02, N-08                                                    | 5.x       | ✅     |
| 6.2 | Scenariusze R3 (zespół) – P-03…P-08, P-10, N-01, N-02; każdy odbiorca w osobnym `test.step`      | 5.x       | ✅     |
| 6.3 | Wydzielić test regresyjny odtwarzający znaleziony błąd (albo test pozytywny, jeśli błędu brak)   | 4.2, 5.12 | ⬜     |
| 6.4 | Dopisać do README, który test odtwarza błąd i jaki jest jego oczekiwany wynik (obecnie czerwony) | 6.3       | ⬜     |

## Etap 7 – Uruchamianie z GitHub Actions

| #   | Subtask                                                                                                        | Zależy od | Status |
| --- | -------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 7.1 | Workflow `ci.yml`: typecheck, lint, format, `playwright test --list` przy każdym pushu i PR                    | 5.10      | ✅     |
| 7.2 | Workflow `e2e.yml`: ręczne uruchomienie (Actions → Run workflow) z wyborem zestawu (all/positive/negative/R1…) | 5.9       | ✅     |
| 7.3 | Raporty jako artefakty przebiegu: Allure i HTML Playwright (również przy czerwonym wyniku)                     | 5.8, 7.2  | ✅     |
| 7.4 | `concurrency` – jeden przebieg naraz, bo testy współdzielą konta i listę                                       | 7.2       | ✅     |
| 7.5 | Dodać sekrety repozytorium (Settings → Secrets and variables → Actions) – te same nazwy co w `.env.example`    | 0.3–0.5   | ⬜     |
| 7.6 | Pierwsze uruchomienie w Actions i sprawdzenie raportu Allure z artefaktu                                       | 7.5, 5.12 | ⬜     |
| 7.7 | (opcjonalnie) Publikacja raportu Allure na GitHub Pages / uruchamianie według harmonogramu (`schedule`)        | 7.6       | ⬜     |

## Etap 8 – Oddanie

| #   | Subtask                                                                                        | Zależy od | Status |
| --- | ---------------------------------------------------------------------------------------------- | --------- | ------ |
| 8.1 | Sprawdzić uruchomienie od zera: `git clone` → `npm ci` → `npx playwright install` → `npm test` | 6.x       | ⬜     |
| 8.2 | Upewnić się, że w repozytorium nie ma haseł ani `.env`; zmienić hasło podane w czacie          | –         | ⬜     |
| 8.3 | Zmergować PR do `main` i ustawić repozytorium jako publiczne                                   | 8.1, 8.2  | ⬜     |
| 8.4 | Wysłać link do repozytorium rekruterowi                                                        | 8.3       | ⬜     |

## Harmonogram

- **Dzień 1:** etapy 0–2 (konta, rozpoznanie UI, weryfikacja planu).
- **Dzień 2:** etap 3 (testy manualne), etap 4 (raport), 5.11–5.12 (lokatory, stabilizacja).
- **Dzień 3:** etap 6 (test regresyjny), etap 7 (sekrety i przebieg w Actions), etap 8 (oddanie).
