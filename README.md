# KIS List – testy systemu powiadomień o komentarzach

Raport testerski oraz test E2E (Playwright + TypeScript) do zadania rekrutacyjnego KIS List.

> Wiedza o aplikacji i pułapkach: [.claude/LEARNINGS.md](.claude/LEARNINGS.md);
> proces dopisywania testów: [docs/WORKFLOW.md](docs/WORKFLOW.md) (skille i agent Claude Code w `.claude/`).
>
> **Status:** testy wykonane 2026-09-26–27 na https://kislist.com (ręcznie i automatycznie, także w GitHub Actions).
> Znalezione błędy: [BUG-01](docs/BUGS.md#bug-01), [BUG-02](docs/BUGS.md#bug-02), [BUG-03](docs/BUGS.md#bug-03) –
> każdy odtwarza test regresyjny; [BUG-04](docs/BUGS.md#bug-04) – poza zakresem powiadomień, bez automatyzacji.
>
> - Przypadki testowe (kroki, oczekiwany i rzeczywisty rezultat): **[docs/TEST_CASES.md](docs/TEST_CASES.md)**
> - Zgłoszenia błędów: **[docs/BUGS.md](docs/BUGS.md)**

### Zgodność z zadaniem

| Wymaganie zadania                                                             | Gdzie                                                                                                          |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Przejście interfejsu jako członkowie zespołu i jako klient                    | sekcja 2, [.claude/LEARNINGS.md](.claude/LEARNINGS.md) (role, lista, komentarze, widok klienta, powiadomienia) |
| Plan testów: scenariusze pozytywne i negatywne                                | sekcja 3, [docs/TEST_CASES.md](docs/TEST_CASES.md) – 14 pozytywnych, 10 negatywnych                            |
| Wykonanie testów i opis wyników                                               | sekcja 4, [docs/TEST_CASES.md](docs/TEST_CASES.md), [docs/BUGS.md](docs/BUGS.md)                               |
| Test E2E w Playwright (TypeScript) odtwarzający znaleziony problem (regresja) | `tests/notifications/*.spec.ts` – tag `@regression` (BUG-01…03); sekcja 5                                      |
| Publiczne repozytorium: README (raport + instrukcja), `/tests`, konfiguracja  | ten plik, `tests/`, `playwright.config.ts`, `package.json`, `tsconfig.json`, `.env.example`, `.github/`        |
| Uruchomienie po sklonowaniu                                                   | sekcja 5 „Uruchomienie lokalne” (`npm ci` → `.env` → `npm test`) i „Uruchomienie w GitHub Actions”             |

Zakres nieobjęty wykonaniem (⏳): P-11, N-04 (zablokowane przez [BUG-04](docs/BUGS.md#bug-04)), N-07 – opisane
w [docs/TEST_CASES.md](docs/TEST_CASES.md).

---

## 1. Kontekst

Zgłoszenie: _członkowie zespołu nie zawsze otrzymują powiadomienia o komentarzach na listach_. Zespół biura
projektowego ze zgłoszenia: Piotr (założyciel), Anna (zarządza projektem), Marcin (kosztorys), Michalina (praca
w terenie). Konta testowe odwzorowują **role** dostępne w KIS List (sekcja 2), a nie cztery osoby jeden do jednego –
wyniki pokazują, że błąd zależy od roli odbiorcy i od oznaczenia „@”.

### Wymagania

| ID  | Zdarzenie                                  | Kto powinien dostać powiadomienie                  |
| --- | ------------------------------------------ | -------------------------------------------------- |
| R1  | Klient komentuje propozycję                | wszyscy członkowie zespołu powiązani z listą       |
| R2  | Klient komentuje udostępnioną listę (live) | wszyscy członkowie zespołu powiązani z listą       |
| R3  | Członek zespołu komentuje element listy    | **pozostali** członkowie zespołu powiązani z listą |

## 2. Środowisko i dane testowe

- Aplikacja: https://kislist.com (plan EXPERT – wersja próbna), Chrome/Chromium desktop, język polski.
- Lista testowa „PROJEKT REKRUTACJA / KOSZTORYS”; komentarze dodawane pod produktem „Narożnik rozkładany Botse…”.
- Konta powiązane z listą – role nadane w oknie „Zaproś do współpracy”:

  | Konto w teście          | Rola w KIS List | Adres                                   | Członek zespołu listy¹ |
  | ----------------------- | --------------- | --------------------------------------- | :--------------------: |
  | Damian Keller („admin”) | Administrator   | adres z formularza (prywatna skrzynka)  |           ✔            |
  | Piotr                   | Współpracownik  | adres „+” skrzynki testowej             |           ✔            |
  | Marcin                  | Członek zespołu | adres „+” skrzynki testowej             |           ✔            |
  | Klient1 („gość”)        | Gość            | adres „+” skrzynki testowej             |    – (tylko wgląd)     |
  | Klient (link)           | –               | link udostępnienia listy, bez logowania |           –            |

  ¹ Za „członków zespołu powiązanych z listą” uznaję konta z prawem edycji listy (administrator, współpracownik,
  członek zespołu). Gość ma listę tylko do wglądu (bez komentowania) – służy jako kontrola negatywna: czat zespołu
  jest prywatny, więc gość nie powinien dostawać o nim powiadomień.

- Każdy komentarz zawiera unikalny znacznik (`[e2e P-03 1a2b3c4d]`), dzięki czemu powiadomienie da się
  jednoznacznie przypisać do komentarza.
- Powiadomienia sprawdzane są w centrum powiadomień w aplikacji (dzwonek / strona `/inbox`) każdego odbiorcy.
  W trakcie testów na adresy „+” nie przyszedł żaden e-mail o komentarzu, a w ustawieniach konta nie ma opcji
  powiadomień, które mogłyby je wyłączać.

## 3. Plan testów

Zasady wspólne: każdy komentarz ma unikalny znacznik; powiadomienie sprawdzane jest u **każdego** odbiorcy
osobno; dla przypadków negatywnych odczekujemy pełne okno czasowe (20 s od wysłania komentarza, z odświeżaniem
co 3 s), zanim uznamy brak powiadomienia. Wyniki automatyczne potwierdzono ręcznie po kilkunastu minutach.

### 3.1 Scenariusze pozytywne

| ID   | Wym.  | Scenariusz                                                       | Oczekiwany rezultat                                                                 |
| ---- | ----- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| P-01 | R1    | Klient dodaje komentarz do propozycji                            | Damian, Piotr, Marcin dostają powiadomienie                                         |
| P-02 | R2    | Klient dodaje komentarz do udostępnionej listy (podgląd na żywo) | Damian, Piotr, Marcin dostają powiadomienie                                         |
| P-03 | R3    | Administrator (Damian) komentuje produkt w czacie zespołu        | Piotr, Marcin dostają powiadomienie                                                 |
| P-04 | R3    | Współpracownik (Piotr) komentuje produkt                         | Damian, Marcin dostają powiadomienie                                                |
| P-05 | R3    | Członek zespołu (Marcin) komentuje produkt                       | Damian, Piotr dostają powiadomienie                                                 |
| P-06 | R3    | Komentarz z oznaczeniem `@Piotr`                                 | Piotr dostaje powiadomienie „oznaczył/a Ciebie w komentarzu”                        |
| P-07 | R3    | Administrator komentuje z oznaczeniem `@Marcin`                  | Marcin **oraz** Piotr dostają powiadomienie (oznaczenie nie zawęża odbiorców)       |
| P-08 | R3    | Oznaczenie kilku osób (`@Marcin @Piotr`)                         | Każda z osób – dokładnie jedno powiadomienie (bez duplikatów)                       |
| P-09 | R3    | Odpowiedź w istniejącym wątku komentarzy                         | Pozostali członkowie dostają powiadomienie również o odpowiedzi                     |
| P-10 | R1–R3 | Treść powiadomienia (autor, zdarzenie, produkt, treść, projekt)  | Powiadomienie zawiera komplet informacji – sprawdzane przy każdym innym scenariuszu |
| P-11 | R3    | Członek dodany do listy później                                  | Po dodaniu do listy otrzymuje powiadomienia o nowych komentarzach                   |
| P-12 | R3    | Komentarz członka zespołu w zakładce „Komentarze klienta”        | Pozostali członkowie dostają powiadomienie                                          |
| P-13 | R3    | Bardzo długi komentarz (~800 znaków)                             | Zapisuje się bez błędu/limitu; pozostali dostają powiadomienie                      |
| P-14 | R3    | Seria 3 komentarzy pod rząd                                      | Każdy dostaje osobne powiadomienie – nic nie ginie, nic się nie duplikuje           |

### 3.2 Scenariusze negatywne

| ID   | Wym.  | Scenariusz                                                    | Oczekiwany rezultat                                                                |
| ---- | ----- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| N-01 | R3    | Autor komentarza (każda rola)                                 | Autor **nie** dostaje powiadomienia o własnym komentarzu                           |
| N-02 | R3    | Autor oznacza samego siebie                                   | Autor nie dostaje powiadomienia                                                    |
| N-03 | R3    | Gość (lista tylko do wglądu) przy komentarzu w czacie zespołu | Nie dostaje powiadomienia (czat zespołu jest prywatny)                             |
| N-04 | R1–R3 | Członek usunięty z listy                                      | Po usunięciu nie dostaje powiadomień                                               |
| N-05 | R1–R3 | Komentarz na innej liście (bez wspólnych członków)            | Brak powiadomienia dla zespołu listy testowej                                      |
| N-06 | R1–R3 | Pusty komentarz / same spacje                                 | Komentarz nie zostaje dodany, brak powiadomienia                                   |
| N-07 | R1–R3 | Edycja / usunięcie komentarza                                 | Nie generuje nowego powiadomienia „dodał komentarz” (do potwierdzenia z produktem) |
| N-08 | R2    | Klient otwiera link udostępnienia, ale nie dodaje komentarza  | Brak powiadomienia                                                                 |
| N-09 | R3    | Komentarz z ładunkiem HTML/JS (`<img onerror=alert(1)>`)      | Treść pokazana jako zwykły tekst (bez wykonania); pozostali dostają powiadomienie  |
| N-10 | R3    | E-mail jako zapasowy kanał powiadomienia                      | E-mail o komentarzu przychodzi, jeśli powiadomienie w aplikacji nie dotarło        |

### 3.3 Priorytety

Najwyższy priorytet mają P-02…P-07 i N-01: zgłoszenie „nie zawsze” sugeruje zależność od **roli**
(autora albo odbiorcy) lub od **oznaczenia @**. Dlatego macierz autor × odbiorca obejmuje wszystkie trzy role
z prawem edycji, a warianty z `@` sprawdzają, czy oznaczenie nie zawęża odbiorców.

## 4. Wyniki

Legenda: ✅ zgodnie z wymaganiem · ❌ błąd · „autor” – autor komentarza · ⏳ nie wykonano.
Wyniki automatyczne (Playwright) zgodne z wykonaniem ręcznym.

| ID          | Damian (admin) | Piotr (współpr.) | Marcin (członek) | Klient1 (gość) | Wynik | Uwagi                                                                                     |
| ----------- | :------------: | :--------------: | :--------------: | :------------: | :---: | ----------------------------------------------------------------------------------------- |
| P-01        |       ✅       |        ✅        |      **❌**      |    – (brak)    |  ❌   | [BUG-02](#bug-02) – członek zespołu nie dostaje powiadomienia o komentarzu do propozycji  |
| P-02        |       ✅       |        ✅        |      **❌**      |    – (brak)    |  ❌   | [BUG-02](#bug-02) – członek zespołu nie dostaje powiadomienia o komentarzu klienta        |
| P-03 + N-01 |    autor ✅    |      **❌**      |      **❌**      |   ✅ (brak)    |  ❌   | [BUG-01](#bug-01)                                                                         |
| P-04 + N-01 |     **❌**     |     autor ✅     |      **❌**      |   ✅ (brak)    |  ❌   | [BUG-01](#bug-01)                                                                         |
| P-05 + N-01 |     **❌**     |      **❌**      |     autor ✅     |   ✅ (brak)    |  ❌   | [BUG-01](#bug-01)                                                                         |
| P-06        |       –        |        ✅        |      autor       |       –        |  ✅   | oznaczony dostaje „Marcin oznaczył/a Ciebie w komentarzu”                                 |
| P-07        |    autor ✅    |      **❌**      |        ✅        |       –        |  ❌   | [BUG-01](#bug-01) – powiadomiony tylko oznaczony                                          |
| P-08        |     autor      |        ✅        |        ✅        |       –        |  ✅   | po jednym powiadomieniu, bez duplikatów                                                   |
| P-10        |       ✅       |        ✅        |        ✅        |       –        |  ✅   | autor, rodzaj zdarzenia, treść, projekt; **brak nazwy produktu** (uwaga U-01)             |
| P-12        |     **❌**     |      **❌**      |      **❌**      |       –        |  ❌   | ręcznie: komentarze Marcina i Piotra w „Komentarze klienta” – brak powiadomień            |
| N-02        | **❌** (jest)  |        –         |   ✅ (kontr.)    |       –        |  ❌   | [BUG-03](#bug-03) – autor oznaczający siebie dostaje powiadomienie                        |
| N-03        |       –        |        –         |        –         |   ✅ (brak)    |  ✅   | sprawdzane w P-03…P-05                                                                    |
| N-08        |       ✅       |        ✅        |        ✅        |       –        |  ✅   | liczba powiadomień bez zmian                                                              |
| P-09        |     **❌**     | ✅ (autor wątku) |     autor ✅     |       –        |  ❌   | [BUG-01](#bug-01) – o odpowiedzi dowiaduje się tylko autor komentarza nadrzędnego         |
| N-06        |       –        |        –         |        ✅        |       –        |  ✅   | pusty komentarz i same spacje nie są dodawane                                             |
| P-13        |    autor ✅    |      **❌**      |        –         |       –        |  ❌   | [BUG-01](#bug-01) – długi komentarz (~800 zn.) zapisuje się poprawnie, powiadomienia brak |
| P-14        |       –        |      **❌**      |     autor ✅     |       –        |  ❌   | [BUG-01](#bug-01) – 3 komentarze pod rząd zapisują się poprawnie, powiadomień brak        |
| N-09        |     **❌**     |        –         |     autor ✅     |       –        |  ❌   | [BUG-01](#bug-01) – ładunek HTML bezpieczny (brak `alert`), powiadomienia brak            |
| N-10        |       –        |      **❌**      |        –         |       –        |  ❌   | [BUG-01](#bug-01) – brak e-maila do Piotra w 75 s; e-mail nie jest zapasowym kanałem      |
| N-05        |    autor ✅    |    ✅ (brak)     | ✅ (kontr. „@”)  |       –        |  ✅   | druga lista: Piotr (brak dostępu) – nic; Marcin (ma dostęp) – powiadomienie o „@” w 14 s  |
| P-11, N-04  |                |                  |                  |                |  ⏳   | [BUG-04](#bug-04) – nie da się dodać nikogo do zespołu mimo wolnych miejsc                |
| N-07        |                |                  |                  |                |  ⏳   | poza zakresem tego przebiegu (patrz docs/TEST_CASES.md)                                   |

### Zgłoszone błędy

Pełne zgłoszenia (środowisko, kroki, obserwacje): [docs/BUGS.md](docs/BUGS.md).

#### BUG-01

- **Tytuł:** Komentarz członka zespołu na liście nie wysyła powiadomień pozostałym członkom zespołu – powiadamiane są tylko osoby oznaczone `@` (a przy odpowiedzi – tylko autor komentarza nadrzędnego).
- **Priorytet:** wysoki (narusza R3 – główna przyczyna zgłoszenia „nie zawsze dostają powiadomienia”).
- **Kroki:**
  1. Zaloguj się jako członek zespołu listy (np. Marcin – „Członek zespołu”).
  2. Na liście kliknij ikonę komentarzy produktu, zakładka „Prywatne”, wpisz komentarz **bez** oznaczeń, „Wyślij”.
  3. Zaloguj się jako pozostali członkowie (Administrator, Współpracownik) i otwórz powiadomienia (dzwonek / `/inbox`).
- **Oczekiwany rezultat:** każdy z pozostałych członków zespołu dostaje powiadomienie „Marcin dodał/a komentarz”.
- **Rzeczywisty rezultat:** nikt nie dostaje powiadomienia (sprawdzone także po 15 minutach). To samo dla komentarzy
  administratora i współpracownika oraz dla zakładki „Komentarze klienta”. Po oznaczeniu `@Osoba` powiadomienie
  („oznaczył/a Ciebie w komentarzu”) dostaje wyłącznie oznaczona osoba – pozostali nie.
- **Częstotliwość / środowisko:** zawsze (wszystkie role autora), kislist.com, Chrome, 2026-09-26.
- **Uwaga:** na koncie administratora jest starsza grupa powiadomień „Piotr dodał/a komentarz” (×2, z dnia
  przygotowania kont). Tamtej sytuacji nie udało się odtworzyć – żaden z kilkunastu komentarzy bez oznaczeń
  w trakcie testów nie wygenerował powiadomienia. To pasuje do zgłoszenia „nie zawsze”: warto sprawdzić
  po stronie serwera, od czego zależy wybór odbiorców.
- **Testy regresyjne:** `tests/notifications/team-comments.spec.ts` – P-03, P-04, P-05, P-07, P-09.

#### BUG-02

- **Tytuł:** Członek zespołu (rola „Członek zespołu”) nie dostaje powiadomienia o komentarzu klienta – do propozycji ani na udostępnionej liście.
- **Priorytet:** wysoki (narusza R1 i R2).
- **Kroki:** klient otwiera link „Udostępnij listę”, pod produktem „Napisz komentarz”, wysyła komentarz;
  sprawdzamy powiadomienia Administratora, Współpracownika i Członka zespołu.
- **Oczekiwany rezultat:** wszyscy trzej dostają „Klient/ka dodał/a komentarz”.
- **Rzeczywisty rezultat:** Administrator i Współpracownik – tak; **Członek zespołu (Marcin) – nie**.
- **Częstotliwość / środowisko:** zawsze, kislist.com, Chrome, 2026-09-26.
- **Testy regresyjne:** `tests/notifications/client-comments.spec.ts` – P-01, P-02.

#### BUG-03

- **Tytuł:** Autor, który oznaczy w komentarzu samego siebie, dostaje powiadomienie o własnym komentarzu.
- **Priorytet:** niski.
- **Kroki:** Administrator dodaje komentarz z oznaczeniem `@Damian Keller @Marcin`.
- **Oczekiwany rezultat:** Marcin dostaje powiadomienie, autor – nie (R3: „pozostali”).
- **Rzeczywisty rezultat:** Marcin – tak; autor również dostaje „oznaczył/a Ciebie w komentarzu”.
- **Test regresyjny:** `tests/notifications/team-comments.spec.ts` – N-02.

#### BUG-04

- **Tytuł:** Nie można zaprosić nikogo do zespołu, mimo że plan pokazuje wolne miejsca.
- **Priorytet:** średni (poza zakresem R1–R3, ale blokuje podstawową funkcję opłaconego planu i uniemożliwiło
  wykonanie P-11 i N-04).
- **Kroki:** Administrator otwiera `/team`; licznik pokazuje „Wykorzystano 3 z 5 miejsc” (2 wolne); kliknięcie
  „ZAPROŚ”.
- **Oczekiwany rezultat:** przycisk pozwala dodać kolejną osobę (mamy 2 wolne miejsca), a jeśli mimo to nie można –
  komunikat wyjaśnia dlaczego.
- **Rzeczywisty rezultat:** przycisk „ZAPROŚ” jest trwale `disabled`, bez żadnego komunikatu o przyczynie – jego
  `title` to zwykły opis funkcji, nie informacja o blokadzie.
- **Częstotliwość / środowisko:** zawsze, reprodukowane niezależnie dwa dni z rzędu (2026-09-26 i 2026-09-27),
  kislist.com, Chrome.
- **Test regresyjny:** brak – wymagałby ingerencji w plan/płatności konta, poza zakresem automatyzacji.

#### Uwagi (nie-błędy)

- **U-01:** komentarz klienta z linku jest podpisany „Klient/ka”, a nagłówek powiadomienia pokazuje adresy wszystkich
  klientów projektu – nie wiadomo, który klient napisał.
- **U-02:** w edytorze po oznaczeniu kilku osób drugie oznaczenie dostaje atrybuty pierwszego
  (`data-email`/`data-name` = poprzednia osoba, `data-id` = właściwa) – powiadomienia trafiają do właściwych osób,
  ale warto to poprawić.
- **U-03:** strona `/team` zwraca 403 dla ról innych niż administrator, a lista „@” ładuje się z opóźnieniem
  (pierwsze „@” po otwarciu okna pokazuje „Nic nie znaleziono.”).

## 5. Test automatyczny (Playwright + TypeScript)

Framework automatyzuje scenariusze R1–R3: P-01…P-10, P-13, P-14 oraz N-01, N-02, N-03, N-06, N-08, N-09.
Testy odtwarzające błędy (**@regression**): P-01 i P-02 (BUG-02), P-03…P-05, P-07, P-09, P-13, P-14 i N-09 (BUG-01),
N-02 (BUG-03) – **obecnie czerwone** i zmienią się na zielone po poprawce. P-06, P-08, N-06 i N-08 przechodzą.

Ostatni przebieg (2026-09-26): 4 ✅ (P-06, P-08, N-06, N-08), 11 ❌ (P-01, P-02, P-03, P-04, P-05, P-07, P-09, P-13,
P-14, N-02, N-09 – każdy z powodu opisanego błędu). P-13, P-14 i N-09 dodatkowo potwierdzają, że komentarze (długie,
w serii, z ładunkiem HTML) zapisują się poprawnie – czerwony wynik dotyczy wyłącznie brakującego powiadomienia.

**N-10 (kanał e-mail)** to jednorazowy skrypt diagnostyczny (Gmail API), nie stały test w tym zestawie – potwierdził,
że po komentarzu Marcina do Piotra nie przyszedł żaden e-mail w ciągu 75 s; e-mail nie jest więc zapasowym kanałem
powiadomienia. Szczegóły: [docs/TEST_CASES.md](docs/TEST_CASES.md) (N-10).

**N-05 (komentarz na innej liście)** – też jednorazowy skrypt weryfikacyjny, wykonany na osobnej, tymczasowej liście
testowej (utworzonej i usuniętej w ramach weryfikacji – druga lista nie jest częścią stałej konfiguracji `.env`/CI).
Wynik: ✅ zgodnie z wymaganiem – Piotr (bez dostępu do tej listy) nie dostał żadnego powiadomienia, a próba
kontrolna (Marcin, który ma dostęp, oznaczony „@”) potwierdziła, że kanał powiadomień na tej liście działa. Szczegóły:
[docs/TEST_CASES.md](docs/TEST_CASES.md) (N-05).

### Co dokładnie weryfikują testy

| Sprawdzenie                                              | Jak                                                                                                  | Po co                                                                            |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Komentarz został zapisany                                | modal dotyczy właściwego produktu, komentarz widoczny w wątku, edytor wyczyszczony, oznaczenia `@`   | brak powiadomienia nie jest mylony z niewysłanym komentarzem                     |
| Każdy odbiorca dostaje **dokładnie jedno** powiadomienie | `toHaveNotification` – osobny krok na osobę; 2 wpisy = błąd (duplikat, P-08)¹                        | raport wskazuje, **kto** nie dostał powiadomienia                                |
| Autor i gość **nie** dostają powiadomienia               | `not.toHaveNotification` do końca okna liczonego od wysłania komentarza                              | „pozostali” w R3 wyklucza autora (N-01, N-02); czat zespołu jest prywatny (N-03) |
| Treść powiadomienia                                      | autor (`.notification-context .user`) i rodzaj zdarzenia („dodał/a komentarz” / „oznaczył/a Ciebie”) | P-10                                                                             |
| Samo przeglądanie listy nie generuje powiadomień         | liczba wpisów u każdego członka bez zmian (N-08)                                                     | zamiast szukać znanego tekstu – odporne na wcześniejsze przebiegi                |
| Próby kontrolne w testach negatywnych                    | N-02: oznaczony Marcin musi dostać powiadomienie; N-08: widać wpisy albo komunikat „pusto”           | test „braku” nie przechodzi przy zepsutym lokatorze czy niedziałającym systemie  |

¹ Aplikacja grupuje powiadomienia tego samego rodzaju (licznik przy wpisie), więc duplikat mógłby tylko zwiększyć licznik
grupy – wykrycie tego wymaga porównania licznika przed i po (planowane, patrz .claude/LEARNINGS.md).

Asercje per odbiorca są **miękkie** (`expect.soft`): przy macierzy nadawca → odbiorcy raport pokazuje wynik dla
każdej osoby (kto dostał, kto nie), a nie tylko pierwszą rozbieżność.

Powiadomienia powstają asynchronicznie, więc asercje odpytują centrum powiadomień (odświeżenie co 3 s)
w oknie `NOTIFICATION_WINDOW_MS` (domyślnie 20 s) liczonym **od wysłania komentarza**. Zmierzony czas dostarczenia
to 2–9 s. Żeby wykluczyć, że „brak powiadomienia” to w rzeczywistości duże opóźnienie, okno można wydłużyć
(`NOTIFICATION_WINDOW_MS=300000 npm test` albo opcja „Czas czekania na powiadomienie” w GitHub Actions) – limit czasu
testu rośnie razem z oknem, a odświeżeń jest najwyżej ~20 na okno.

### Architektura

```
src/
├── config/                       # env.ts – konfiguracja walidowana (zod); timeouts.ts – czasy w jednym miejscu
├── data/
│   ├── team.ts                   # Piotr, Anna, Marcin, Michalina: osoba z zadania + nazwa konta w aplikacji
│   └── factories.ts              # komentarze z unikalnym znacznikiem (faker)
├── pages/                        # Page Objecty – lokatory i akcje, BEZ asercji
│   ├── LoginPage.ts  TwoFactorPage.ts  ListPage.ts  ClientViewPage.ts
│   └── components/               # CommentsModal, CommentForm (TipTap), NotificationCenter
├── support/                      # @step (krok raportu + zrzut), retryUntil, session (logowanie z 2FA), gmail (kody 2FA), video, privacy
├── fixtures/test.ts              # actor(konto), client, listId, testItem
├── assertions/notifications.ts   # asercje domenowe: toHaveNotification, toKeepNotificationCount
└── allure/                       # metadane (adnotacje) i dowody (zrzuty) do raportu
tests/
└── notifications/
    ├── steps.ts                  # kroki testów z asercjami: postTeamComment, expectNotified, expectNotNotified
    ├── team-comments.spec.ts     # R3: P-03…P-09, P-13, P-14, N-01…N-03, N-06, N-09
    └── client-comments.spec.ts   # R1/R2: P-01, P-02, N-08
```

### Zasady pisania testów

- **Asercje tylko w testach.** Page Objecty udostępniają lokatory i akcje; mogą czekać na gotowość UI
  (`waitFor`, `retryUntil`), ale niczego nie weryfikują. Pilnuje tego ESLint (`no-restricted-imports`:
  `expect` jest zabroniony w `src/pages`), a w testach reguła `no-raw-locators` wymusza korzystanie z Page Objectów.
- **Układ testu: akcja z warunkami wstępnymi → weryfikacja per osoba**, każdy etap jako nazwany `test.step`.
- **Asercje web-first i domenowe** – `toBeVisible`, `toHaveText`, `toContainText` oraz własne
  `toHaveNotification` / `toKeepNotificationCount` z czytelnym komunikatem błędu (osoba, znacznik, okno).
- **Asercje miękkie** (`expect.soft`) dla niezależnych sprawdzeń: wynik per odbiorca i treść powiadomienia.
- **Izolacja danych** – unikalny znacznik w każdym komentarzu; testy nie zależą od kolejności ani od
  wcześniejszych przebiegów (N-08 porównuje liczby „przed/po” zamiast szukać znanego tekstu).
- **Bez sztywnych czekań** – jedyne odczekiwanie to okno w testach negatywnych („brak” wymaga czasu),
  zaszyte w asercji domenowej i opisane.
- **Bez ponowień** (`retries: 0`) – zgłoszony problem jest przerywany („nie zawsze”), więc ponowienie mogłoby go ukryć,
  a testy regresyjne znanych błędów i tak nie przechodzą.
- **Fixtures** – `actor('marcin')` zwraca zalogowane konto w osobnym `BrowserContext`; `testItem`
  ustala produkt (`KIS_ITEM_ID` lub pierwszy wiersz z ikoną komentarzy) i odczytuje jego nazwę.
- **Znane błędy w raporcie** – testy odtwarzające błąd mają link „Błąd: BUG-0x” (Allure `issue`) do sekcji 4.
- **Jakość** – TypeScript `strict`, ESLint (typescript-eslint + eslint-plugin-playwright), Prettier; CI na każdym PR.

### Raport Allure

- **Drzewo:** epic „Powiadomienia o komentarzach” → feature = wymaganie (R1/R2/R3) → story = wariant scenariusza.
- **Metadane przy deklaracji testu** (adnotacje `allure.label.*`), więc są w raporcie także wtedy, gdy test
  upadnie w fixture. Każdy test ma link **„Plan testów: P-xx”** do sekcji 3 i ważność (severity).
- **Kroki biznesowe:** metody Page Objectów oznaczone `@step` („Otwórz komentarze produktu…”, „Wyślij komentarz…”)
  oraz kroki testu („Marcin (członek zespołu) dostaje dokładnie jedno powiadomienie”). Wywołania API są w nich zagnieżdżone,
  a asercje widoczne jako osobne kroki (`detail: true`).
- **Zrzut ekranu (JPEG) w każdym kroku**, pod tym krokiem (także przy sukcesie i przy błędzie): każda akcja Page Objectu
  (`@step`, łącznie z logowaniem i odświeżaniem centrum powiadomień), centrum powiadomień każdej sprawdzanej osoby,
  „Stan końcowy” każdego konta po teście oraz kroki przygotowania sesji („Sprawdź zapisaną sesję”, „Sesja aktywna”).
- **Zamazane dane:** na każdym zrzucie adresy e-mail, a na krokach logowania także hasło i kod 2FA (raport jest publiczny).
- **Wideo całego testu** – osobne nagranie dla każdego konta i klienta: domyślnie tylko przy błędzie, dla wszystkich
  testów po ustawieniu `VIDEO=on` (w Actions: opcja „Wideo z całego testu”).
- **Trace Playwrighta tylko w raporcie HTML Playwrighta** (artefakt `playwright-report`) – raport Allure go nie zawiera
  (`src/allure/reporter.ts`), dzięki czemu jest kilkukrotnie mniejszy.
- **Logowanie widoczne w teście:** krok „Sesja: <konto>” (fixture `actor`) pokazuje sprawdzenie zapisanej sesji,
  w razie potrzeby logowanie z kodem 2FA i „Sesja aktywna” – ze zrzutami. Nie ma osobnego projektu „setup”,
  więc statystyki raportu liczą tylko scenariusze.
- Interfejs raportu po polsku (`reportLanguage: 'pl'`), informacje o środowisku (URL, przeglądarka, okno czasowe).

### Kluczowe selektory

| Element                                     | Selektor                                                                                                                                   | Źródło             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| Login / hasło / „Zaloguj się”               | `#username`, `#password`, `#_submit`                                                                                                       | id z aplikacji     |
| Kod 2FA (4 pola, auto-wysyłka po 4. cyfrze) | `form:has(#_auth_code) input[type=text]`                                                                                                   | id ukrytego pola   |
| Produkt na liście                           | `#item-<itemId>`                                                                                                                           | id z aplikacji     |
| Ikona komentarzy produktu                   | `getByTestId('item-comments-<itemId>')`                                                                                                    | data-testid        |
| Modal komentarzy                            | `getByRole('dialog')` z `.comments-modal`                                                                                                  | rola + komponent   |
| Zakładki modala                             | `getByRole('link', { name: /Prywatne/ })`, `getByTestId('comments-public-tab')`                                                            | rola / data-testid |
| Edytor + wysłanie                           | `getByRole('textbox')`, `getByRole('button', { name: 'Wyślij' })`                                                                          | rola               |
| Centrum powiadomień                         | strona `/inbox`; wpis `.notification[data-key]`, autor `.notification-context .user`, treść `.notification-details`                        | komponent          |
| Wybór osoby po „@”                          | `.tippy-box .mention-item` (przycisk z nazwą konta)                                                                                        | komponent TipTap   |
| Udostępnij / członek zespołu / propozycja   | `getByTitle('Udostępnij listę')`, `getByTitle('Dodaj członka zespołu lub współpracownika')`, `getByTitle('Utwórz propozycję dla klienta')` | title              |
| Produkt w widoku klienta                    | `.proposal-item#item_<itemId>`, `getByRole('button', { name: 'Napisz komentarz' })`                                                        | id / rola          |
| Zaproszenie do zespołu                      | `getByRole('textbox', { name: 'Zaproś dodatkową osobę przez email' })`                                                                     | rola               |

Zachowania aplikacji uwzględnione w Page Objectach:

- **Ikona komentarzy** – pierwsze kliknięcie po wczytaniu listy nie otwiera okna (komponent ładuje się dopiero wtedy),
  kolejne po ok. 1 s – tak; zwykły klik bywa też przechwytywany przez przeciąganie wierszy. `openComments()` wysyła
  zdarzenie `click` i ponawia do skutku, sprawdzając stan bez rzucania błędu (ponowienia nie są „czerwone” w raporcie).
- **Centrum powiadomień** jest czytane ze strony `/inbox`: ta sama lista co panel pod dzwonkiem, ale bez animacji
  wysuwania, bez drugiego, osadzonego panelu ze strony `/lists` i dostępna dla każdej roli (`/team` – tylko administrator).
- **Wybór osoby po „@”** – lista ładuje się asynchronicznie; jeśli pierwsze „@” pokaże „Nic nie znaleziono.”,
  `mention()` usuwa znak i wpisuje go ponownie.
- **Pierwszy element `#item-…` na liście bywa notatką sekcji** (bez ikony komentarzy) – `ListPage.items` to wiersze
  z ikoną komentarzy, a test sprawdza, że okno komentarzy dotyczy właściwego produktu.
- **Logowanie wymaga 4-cyfrowego kodu 2FA z e-maila** (nie TOTP, więc generator kodów odpada; SMTP należy do
  KIS List, więc lokalna skrzynka typu Mailpit też). Krok „Sesja: <konto>” w teście (`src/support/session.ts`)
  loguje konto tylko wtedy, gdy zapisana sesja (`.auth/<konto>.json`, „Zapamiętaj mnie”) jest nieważna, i zapisuje nową –
  logowanie z kodem odbywa się więc najwyżej raz na przebieg, w pierwszym teście używającym konta.
  - **Zaufane urządzenie:** po pierwszym logowaniu z kodem aplikacja ustawia cookie `devid` (ważne rok) i kolejne
    logowania z tej przeglądarki nie wymagają kodu. Jego wartość trafia do `.auth/<konto>.device`;
    podana jako `<KONTO>_DEVICE_ID` (np. sekret w CI) pozwala logować się bez kodu – tak działa konto administratora
    z prywatną skrzynką, której testy nie czytają. Wartość można też skopiować z własnej przeglądarki
    (DevTools → Application → Cookies → `kislist.com` → `devid`).
  - Gdy aplikacja poprosi o kod, jest on pobierany w kolejności:
  1. zmienna `<KONTO>_2FA_CODE`;
  2. **skrzynka Gmail** (`src/support/gmail.ts`, Gmail API, zakres tylko do odczytu), automatycznie, także w CI –
     jedna skrzynka dla wszystkich kont; wiadomość wybierana po adresacie „+” (nagłówki `To`/`Delivered-To`) i czasie.

     Znacznik czasu zapisywany jest _przed_ kliknięciem „Zaloguj”, więc kod z poprzedniego przebiegu nie
     zostanie użyty. IMAP nie jest używany – Gmail API działa po HTTPS, także za proxy;

  3. plik `.auth/<konto>.code`, na który test czeka do 5 minut (gdy skrzynka nie jest czytana).

#### Dostęp do Gmaila (jednorazowo)

1. [Google Cloud Console](https://console.cloud.google.com/): nowy projekt → włączyć **Gmail API** →
   ekran zgody OAuth (typ _External_, adres skrzynki testowej jako _Test user_) → dane logowania
   **OAuth client ID** typu **Desktop app**.
2. `GMAIL_CLIENT_ID` i `GMAIL_CLIENT_SECRET` wpisać do `.env`, uruchomić `npm run gmail:token`, otworzyć link,
   zalogować się na skrzynkę testową i zatwierdzić dostęp. Wypisany `GMAIL_REFRESH_TOKEN` wpisać do `.env`
   i do sekretów repozytorium.
3. Aplikacja w trybie _Testing_ dostaje token ważny 7 dni – po wygaśnięciu wystarczy powtórzyć krok 2.

Zalecana jest osobna skrzynka tylko do testów: token pozwala czytać całą skrzynkę (bez wysyłania i zmian).

### Uruchomienie lokalne

Wymagania: Node.js ≥ 20.

```bash
git clone https://github.com/dkelle1/kis-lists-tests.git
cd kis-lists-tests
npm ci
npx playwright install chromium
cp .env.example .env               # konta (admin, piotr, marcin, guest), id listy, link klienta, dostęp do Gmaila
npm test                           # wszystkie scenariusze
npm run test:regression            # tylko @regression (także: test:positive, test:negative)
npx playwright test --grep @R3     # tylko wybrane wymaganie
npm run test:headed                # z widoczną przeglądarką
VIDEO=on npm test                  # wideo z całego testu dla każdego testu (domyślnie tylko przy błędzie)
NOTIFICATION_WINDOW_MS=300000 npm test   # czekanie na powiadomienie 5 min zamiast 20 s (wykluczenie opóźnień)
npm run report:allure              # raport Allure (bez Javy – Allure 3)
npm run report:html                # raport HTML Playwright
npm run check                      # typecheck + lint + format
```

Dane logowania są czytane wyłącznie ze zmiennych środowiskowych (`.env` jest w `.gitignore`) –
w repozytorium nie ma żadnych haseł.

### Uruchomienie w Dockerze

Obraz z `Dockerfile` (oficjalny obraz Playwrighta w tej samej wersji co `@playwright/test`, z przeglądarkami) – bez
instalowania Node i przeglądarek; ten sam obraz uruchamia testy w GitHub Actions.

```bash
npm run docker:build                               # docker build -t kis-lists-tests .
npm run docker:test                                # wszystkie testy; wyniki w allure-results/, playwright-report/, test-results/
docker run --rm --env-file .env kis-lists-tests npx playwright test --grep @R3    # wybrany zestaw
docker run --rm -v "$PWD/allure-results:/app/allure-results" -v "$PWD/allure-report:/app/allure-report" \
  kis-lists-tests npx allure generate allure-results                             # raport Allure (jeden plik)
```

- `.env` jest przekazywany przy uruchomieniu (`--env-file`) i **nie trafia do obrazu** (`.dockerignore`: `.env`, `.auth/`, `.local/`).
  Plik musi mieć wartości bez cudzysłowów i bez komentarzy w tej samej linii (tak jak `.env.example`).
- Za proxy z własnym certyfikatem: `docker build --secret id=ca,src=<plik.crt> …` (certyfikat nie trafia do warstw obrazu).

**Dla recenzenta:** testy działają na prawdziwych kontach KIS List, więc potrzebują danych w `.env` (konta z rolami
Administrator / Współpracownik / Członek zespołu / Gość powiązane z listą, link udostępnienia listy, dostęp do skrzynki
z kodami 2FA). Bez nich:

- `npm ci && npm run check && npx playwright test --list` działa od razu po sklonowaniu (typy, lint, lista testów);
- `npm test` zatrzymuje się na starcie z listą brakujących zmiennych;
- wyniki przebiegu na kontach autora: zakładka **Actions → „E2E – powiadomienia o komentarzach”** (podsumowanie
  i artefakt `allure-report` z raportem w jednym pliku `index.html`). Dane kont testowych mogę udostępnić na prośbę.

### Uruchomienie w GitHub Actions

- **CI** (`.github/workflows/ci.yml`) – przy każdym pushu i PR: typecheck, lint, format i wczytanie testów.
  Nie wymaga dostępu do aplikacji.
- **Docker** (`.github/workflows/docker.yml`) – przy zmianie `Dockerfile`, `.dockerignore` lub zależności: budowanie obrazu
  oraz typecheck, lint, format i wczytanie testów w kontenerze.
- **E2E** (`.github/workflows/e2e.yml`) – uruchamiane ręcznie: zakładka **Actions → E2E – powiadomienia
  o komentarzach → Run workflow**, z wyborem zestawu (`all`, `positive`, `negative`, `regression`, `R1`–`R3`),
  czasu czekania na powiadomienie (20 s – 10 min) i opcjonalnego wideo z każdego testu.
  Buduje obraz z `Dockerfile` (warstwy cache'owane między przebiegami) i uruchamia w nim testy oraz generowanie raportu
  Allure; sekrety trafiają do kontenera jako zmienne środowiskowe (`-e NAZWA`), a wyniki – przez zamontowane katalogi.
  Na starcie sprawdza, czy są wszystkie wymagane sekrety; na końcu dodaje podsumowanie (liczby testów) do strony przebiegu.
  Artefakty (również gdy testy nie przejdą):
  - **`allure-report`** (7 dni) – raport Allure jako **jeden plik `index.html`** (otwiera się bez serwera, po polsku,
    ze zrzutami JPEG z każdego kroku i wideo przy błędach),
  - `playwright-report` (7 dni, tylko przy błędach) – raport HTML Playwrighta z **trace** (`npx playwright show-report <katalog>`).

  Artefakty repozytoriów **prywatnych** liczą się do limitu miejsca konta GitHub (plan Free: 500 MB). Po jego
  przekroczeniu wysyłka kończy się błędem „Artifact storage quota has been hit” – pomaga usunięcie starych artefaktów
  (Actions → przebieg → Artifacts) albo ustawienie repozytorium jako publicznego (bez limitu); limit przeliczany jest co 6–12 h.

Konfiguracja jednorazowa: **Settings → Secrets and variables → Actions** – sekrety o nazwach z `.env.example`:

| Sekret                                                          | Wymagany | Opis                                                         |
| --------------------------------------------------------------- | :------: | ------------------------------------------------------------ |
| `KIS_LIST_ID`, `CLIENT_SHARE_URL`                               |    ✔     | lista testowa i jej link udostępnienia                       |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_DEVICE_ID`              |    ✔     | administrator; `devid` zaufanego urządzenia zamiast kodu 2FA |
| `PIOTR_*`, `MARCIN_*`, `GUEST_*` (`_EMAIL`, `_PASSWORD`)        |    ✔     | pozostałe konta (adresy „+” skrzynki Gmail)                  |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` |    ✔     | odczyt kodów 2FA z Gmaila (tylko do odczytu)                 |
| `CLIENT_PROPOSAL_URL`                                           |    ✔     | link klienta do propozycji (R1, P-01)                        |
| `KIS_ITEM_ID`, `<KONTO>_DEVICE_ID`                              |          | produkt do komentarzy, logowanie bez kodu                    |

Najszybciej: uzupełnij lokalny `.env` i wyślij wszystkie wartości jednym poleceniem
[GitHub CLI](https://cli.github.com/): `gh secret set -f .env --repo dkelle1/kis-lists-tests`.

Opcjonalnie zmienna (Variables): `BASE_URL`. Sekrety nie trafiają do logów ani do przebiegów
z forków, a workflow E2E uruchamia się tylko ręcznie.

Testy dodają prawdziwe komentarze na liście testowej (z unikalnym znacznikiem `[e2e …]`) – lista służy wyłącznie testom.
