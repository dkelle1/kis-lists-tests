# Plan realizacji zadania

Termin: 3 dni robocze od otrzymania zadania. Legenda: ✅ zrobione · ⬜ do zrobienia · 🔒 zablokowane.

## Etap 0 – Przygotowanie środowiska

| #   | Subtask                                                                                          | Kto   | Zależy od | Status |
|-----|--------------------------------------------------------------------------------------------------|-------|-----------|--------|
| 0.1 | Założyć konto na kislist.com (adres z formularza) – **Piotr**, właściciel                       | Ty    | –         | ✅ |
| 0.2 | Poczekać, aż na koncie pojawi się projekt testowy                                                | Ty    | 0.1       | ⬜ |
| 0.3 | Założyć konta z adresami „+”: **Anna**, **Marcin**, **Michalina**                               | Ty    | 0.1       | ⬜ |
| 0.4 | Dodać Annę, Marcina i Michalinę do listy testowej jako członków zespołu                          | Ty    | 0.2, 0.3  | ⬜ |
| 0.5 | Wygenerować linki dla klienta: udostępniona lista (podgląd na żywo) i propozycja                 | Ty    | 0.2       | ⬜ |
| 0.6 | Odblokować sieć środowiska Claude (`www.kislist.com`, `app.kislist.com`, ewentualnie API)         | Ty    | –         | 🔒 |
| 0.7 | Uzupełnić lokalny `.env` na podstawie `.env.example` (bez commitowania)                          | Ty    | 0.3–0.5   | ⬜ |

## Etap 1 – Rozpoznanie aplikacji

| #   | Subtask                                                                                          | Zależy od | Status |
|-----|--------------------------------------------------------------------------------------------------|-----------|--------|
| 1.1 | Przejść interfejs jako członek zespołu: lista, elementy, wątek komentarzy, oznaczenie `@`, dzwonek | 0.4       | ⬜ |
| 1.2 | Przejść interfejs jako klient (incognito): komentarz do listy i do propozycji                     | 0.5       | ⬜ |
| 1.3 | Sprawdzić kanały powiadomień: centrum powiadomień w aplikacji, e-mail, ustawienia powiadomień     | 1.1       | ⬜ |
| 1.4 | Zanotować rzeczywiste etykiety i elementy UI (do poprawienia selektorów)                          | 1.1, 1.2  | ⬜ |
| 1.5 | Sprawdzić ustawienia powiadomień każdego członka (czy nic nie jest wyłączone przed testami)       | 1.3       | ⬜ |

## Etap 2 – Plan testów (część 1)

| #   | Subtask                                                                                          | Zależy od | Status |
|-----|--------------------------------------------------------------------------------------------------|-----------|--------|
| 2.1 | Spisać wymagania R1–R3 i macierz autor × odbiorca                                                 | –         | ✅ |
| 2.2 | Scenariusze pozytywne P-01…P-11                                                                   | 2.1       | ✅ |
| 2.3 | Scenariusze negatywne N-01…N-08                                                                   | 2.1       | ✅ |
| 2.4 | Zweryfikować plan po rozpoznaniu UI (dodać/usunąć scenariusze, np. wątki, role gość/współpracownik) | 1.1–1.3   | ⬜ |

## Etap 3 – Wykonanie testów manualnych

| #   | Subtask                                                                                          | Zależy od | Status |
|-----|--------------------------------------------------------------------------------------------------|-----------|--------|
| 3.1 | P-01, P-02 – komentarze klienta (propozycja, udostępniona lista)                                  | 2.4       | ⬜ |
| 3.2 | P-03…P-06 – komentarz każdej z 4 osób, sprawdzenie pozostałych 3 (12 par nadawca→odbiorca)         | 2.4       | ⬜ |
| 3.3 | P-07, P-08 – komentarze z oznaczeniami `@`                                                         | 2.4       | ⬜ |
| 3.4 | P-09…P-11 – odpowiedzi w wątku, treść i link powiadomienia, nowy członek listy                     | 2.4       | ⬜ |
| 3.5 | N-01…N-08 – scenariusze negatywne                                                                  | 2.4       | ⬜ |
| 3.6 | Powtórzyć przypadki z błędem 2–3 razy (czy to stały, czy losowy problem)                           | 3.1–3.5   | ⬜ |
| 3.7 | Zebrać dowody: zrzuty ekranu i nagrania, godzina, autor, odbiorca                                  | 3.1–3.5   | ⬜ |

## Etap 4 – Raport

| #   | Subtask                                                                                          | Zależy od | Status |
|-----|--------------------------------------------------------------------------------------------------|-----------|--------|
| 4.1 | Uzupełnić tabelę wyników w README (✅/❌ dla każdego odbiorcy)                                     | 3.x       | ⬜ |
| 4.2 | Opisać znaleziony błąd według szablonu: kroki, oczekiwany i rzeczywisty rezultat, zakres          | 3.6       | ⬜ |
| 4.3 | Wskazać wzorzec błędu (np. zależność od autora, roli albo oznaczenia `@`)                          | 4.2       | ⬜ |

## Etap 5 – Test automatyczny (część 2)

| #   | Subtask                                                                                          | Zależy od | Status |
|-----|--------------------------------------------------------------------------------------------------|-----------|--------|
| 5.1 | Szkielet projektu: Playwright + TypeScript, config, `.env.example`, `tests/`                      | –         | ✅ |
| 5.2 | Testy R1–R3 z weryfikacją każdego odbiorcy w osobnym kroku                                        | 5.1       | ✅ |
| 5.3 | Poprawić selektory w `tests/support/kislist.ts` (obiekt `ui`) na rzeczywiste                      | 1.4       | ⬜ |
| 5.4 | Uruchomić testy na żywej aplikacji i ustabilizować (czekanie na powiadomienia, logowanie)          | 5.3, 0.6  | ⬜ |
| 5.5 | Wydzielić test regresyjny odtwarzający znaleziony błąd (albo test pozytywny, jeśli błędu brak)    | 4.2, 5.4  | ⬜ |
| 5.6 | Dopisać do README, który test odtwarza błąd i jaki jest jego oczekiwany wynik (obecnie czerwony)  | 5.5       | ⬜ |

## Etap 6 – Oddanie

| #   | Subtask                                                                                          | Zależy od | Status |
|-----|--------------------------------------------------------------------------------------------------|-----------|--------|
| 6.1 | Sprawdzić uruchomienie od zera: `git clone` → `npm ci` → `npx playwright install` → `npm test`    | 5.x       | ⬜ |
| 6.2 | Upewnić się, że w repozytorium nie ma haseł ani `.env`; zmienić hasło podane w czacie              | –         | ⬜ |
| 6.3 | Zmergować PR do `main` i ustawić repozytorium jako publiczne                                      | 6.1, 6.2  | ⬜ |
| 6.4 | Wysłać link do repozytorium rekruterowi                                                           | 6.3       | ⬜ |

## Harmonogram

- **Dzień 1:** etapy 0–2 (konta, rozpoznanie UI, weryfikacja planu).
- **Dzień 2:** etap 3 (testy manualne) i etap 4 (raport).
- **Dzień 3:** etap 5 (automatyzacja i test regresyjny) i etap 6 (oddanie).
