# Zgłoszenia błędów – powiadomienia o komentarzach (KIS List)

Błędy znalezione podczas wykonania planu testów ([TEST_CASES.md](TEST_CASES.md)) 2026-09-26.
Każdy błąd odtwarza test regresyjny (`@regression`) – czerwony do czasu poprawki; w raporcie Allure ma link „Błąd: BUG-0x”
oraz zrzut centrum powiadomień każdej osoby pod krokiem weryfikacji.

| ID                | Tytuł                                                                                                                  | Wymaganie | Priorytet | Test regresyjny              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- | :-------: | :-------: | ---------------------------- |
| [BUG-01](#bug-01) | Komentarz członka zespołu powiadamia tylko osoby oznaczone „@” (przy odpowiedzi – tylko autora wątku), nie cały zespół |    R3     |  wysoki   | P-03, P-04, P-05, P-07, P-09 |
| [BUG-02](#bug-02) | Rola „Członek zespołu” nie dostaje powiadomienia o komentarzu klienta (propozycja i udostępniona lista)                |  R1, R2   |  wysoki   | P-01, P-02                   |
| [BUG-03](#bug-03) | Autor oznaczający samego siebie dostaje powiadomienie o własnym komentarzu                                             |    R3     |   niski   | N-02                         |

**Środowisko (wszystkie błędy):** https://kislist.com (plan EXPERT – wersja próbna), Chrome/Chromium desktop, język polski,
lista „PROJEKT REKRUTACJA / KOSZTORYS”. Konta: Damian Keller (Administrator), Piotr (Współpracownik), Marcin (Członek
zespołu), Klient1 (Gość); klient – link udostępnienia bez logowania.

**Uruchomienie testów regresyjnych:** `npm run test:regression` (lokalnie) albo Actions → „E2E – powiadomienia
o komentarzach” → zestaw `regression`.

---

## BUG-01

**Komentarz członka zespołu na liście nie wysyła powiadomień pozostałym członkom zespołu – powiadamiane są tylko osoby oznaczone „@”.**

| Pole          | Wartość                                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Wymaganie     | R3 – „gdy członek zespołu komentuje element listy, powiadomienie powinni otrzymać pozostali członkowie zespołu powiązani z listą” |
| Priorytet     | **wysoki** – najbardziej prawdopodobna przyczyna zgłoszenia „nie zawsze dostają powiadomienia”                                    |
| Częstotliwość | zawsze – dla każdej roli autora (Administrator, Współpracownik, Członek zespołu)                                                  |
| Przypadki     | P-03, P-04, P-05, P-07, P-09, P-12                                                                                                |

**Kroki:**

1. Zaloguj się jako członek zespołu listy, np. Marcin („Członek zespołu”).
2. Na liście kliknij ikonę komentarzy produktu → zakładka „Prywatne”.
3. Wpisz komentarz **bez** oznaczeń „@” i kliknij „Wyślij”.
4. Zaloguj się jako pozostali członkowie (Administrator, Współpracownik) i otwórz centrum powiadomień (dzwonek / `/inbox`).

**Oczekiwany rezultat:** każdy z pozostałych członków zespołu dostaje powiadomienie „Marcin dodał/a komentarz”.

**Rzeczywisty rezultat:** nikt nie dostaje powiadomienia – także po 15 minutach i po przeładowaniu.

**Dodatkowe obserwacje:**

- To samo dla komentarzy Administratora i Współpracownika oraz dla zakładki „Komentarze klienta” (P-12).
- Po oznaczeniu `@Osoba` powiadomienie „`<autor>` oznaczył/a Ciebie w komentarzu” dostaje **wyłącznie** oznaczona
  osoba (P-06 ✅), pozostali członkowie – nie (P-07 ❌). Oznaczenie zawęża odbiorców zamiast być dodatkiem.
- **Odpowiedź w wątku** (P-09): powiadomienie „Marcin odpowiedział/a na Twój komentarz” dostaje tylko autor komentarza
  nadrzędnego; pozostali członkowie zespołu – nie.
- Na koncie Administratora jest starsza grupa „Piotr dodał/a komentarz” (×2) z dnia przygotowania kont – tamtej
  sytuacji nie udało się odtworzyć. Wskazuje to, że powiadomienia bez „@” były kiedyś (w jakichś warunkach) wysyłane,
  co pasuje do zgłoszenia „nie zawsze”; warto sprawdzić po stronie serwera logikę wyboru odbiorców.
- W trakcie testów nie przyszły też e-maile o komentarzach, a w ustawieniach konta nie ma opcji powiadomień, które
  mogłyby je wyłączać.

**Testy regresyjne:** `tests/notifications/team-comments.spec.ts` – P-03, P-04, P-05 (+ N-01, N-03), P-07, P-09.

---

## BUG-02

**Członek zespołu (rola „Członek zespołu”) nie dostaje powiadomienia o komentarzu klienta – ani do propozycji, ani na udostępnionej liście.**

| Pole          | Wartość                                                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Wymaganie     | R1 i R2 – „gdy klient komentuje propozycję / udostępnioną listę, powiadomienie powinni otrzymać wszyscy członkowie zespołu powiązani z listą” |
| Priorytet     | **wysoki**                                                                                                                                    |
| Częstotliwość | zawsze (3 przebiegi ręczne i automatyczne, także w GitHub Actions)                                                                            |
| Przypadki     | P-01 (propozycja), P-02 (udostępniona lista)                                                                                                  |

**Kroki (udostępniona lista – P-02; propozycja – P-01 analogicznie, link `/proposal/preview/<token>` z e-maila):**

1. Administrator udostępnia listę linkiem („Udostępnij listę” → „Wyślij i udostępnij”, komentowanie włączone).
2. Klient otwiera link `/list-preview/<token>` (bez logowania).
3. Pod produktem klika „Napisz komentarz”, wpisuje treść, „Wyślij”.
4. Sprawdź centrum powiadomień Administratora, Współpracownika i Członka zespołu.

**Oczekiwany rezultat:** wszyscy trzej dostają „Klient/ka dodał/a komentarz”.

**Rzeczywisty rezultat:** Administrator ✅, Współpracownik ✅, **Członek zespołu (Marcin) – brak powiadomienia** ❌ – tak samo dla komentarza do propozycji (P-01) i do udostępnionej listy (P-02).

**Testy regresyjne:** `tests/notifications/client-comments.spec.ts` – P-01, P-02.

---

## BUG-03

**Autor, który oznaczy w komentarzu samego siebie, dostaje powiadomienie o własnym komentarzu.**

| Pole          | Wartość                                                     |
| ------------- | ----------------------------------------------------------- |
| Wymaganie     | R3 – powiadomienie dostają **pozostali** członkowie zespołu |
| Priorytet     | niski                                                       |
| Częstotliwość | zawsze                                                      |
| Przypadki     | N-02                                                        |

**Kroki:**

1. Zaloguj się jako Administrator (Damian Keller).
2. Dodaj komentarz z oznaczeniami `@Damian Keller @Marcin`.
3. Sprawdź centrum powiadomień Administratora i Marcina.

**Oczekiwany rezultat:** Marcin dostaje powiadomienie (próba kontrolna), Administrator – nie.

**Rzeczywisty rezultat:** Marcin ✅; Administrator również dostaje „Damian Keller oznaczył/a Ciebie w komentarzu” ❌.

**Test regresyjny:** `tests/notifications/team-comments.spec.ts` – N-02.

---

## Uwagi

Obserwacje, które nie naruszają wymagań R1–R3, ale warto je przekazać zespołowi produktu.

| ID   | Obserwacja                                                                                                                                                                        |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U-01 | Powiadomienie nie zawiera nazwy produktu ani listy – tylko projekt, autora i treść; przy wielu produktach trudno ustalić, czego dotyczy komentarz.                                |
| U-02 | Komentarz klienta z linku jest podpisany „Klient/ka”, a nagłówek powiadomienia pokazuje adresy wszystkich klientów projektu – nie wiadomo, który klient napisał.                  |
| U-03 | W edytorze po oznaczeniu kilku osób drugie oznaczenie dostaje atrybuty pierwszego (`data-email`/`data-name`); powiadomienia trafiają do właściwych osób.                          |
| U-04 | Lista „@” ładuje się z opóźnieniem – pierwsze „@” po otwarciu okna pokazuje „Nic nie znaleziono.” i nie odświeża się; strona `/team` zwraca 403 dla ról innych niż administrator. |
| U-05 | Powiadomienia jednego rodzaju są grupowane (licznik przy wpisie, widoczna tylko najnowsza treść) – starsze komentarze znikają z listy powiadomień.                                |
