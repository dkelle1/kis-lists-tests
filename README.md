# KIS List – testy systemu powiadomień o komentarzach

Raport testerski oraz test E2E (Playwright + TypeScript) do zadania rekrutacyjnego KIS List.

> Plan realizacji z podziałem na subtaski: [PLAN.md](PLAN.md).
>
> **Status:** plan testów i automatyzacja są gotowe. Sekcja „Wyniki” jest do uzupełnienia
> po wykonaniu testów na projekcie testowym – wpisane są tylko wyniki faktycznie zaobserwowane.

---

## 1. Kontekst

Zespół biura projektowego (4 osoby), wszyscy powiązani z listą testową:

| Osoba     | Rola                         |
| --------- | ---------------------------- |
| Piotr     | założyciel, właściciel konta |
| Anna      | zarządza projektem           |
| Marcin    | tworzy kosztorys             |
| Michalina | praca w terenie              |

Zgłoszenie: _członkowie zespołu nie zawsze otrzymują powiadomienia o komentarzach na listach_.

### Wymagania

| ID  | Zdarzenie                                  | Kto powinien dostać powiadomienie                  |
| --- | ------------------------------------------ | -------------------------------------------------- |
| R1  | Klient komentuje propozycję                | wszyscy członkowie zespołu powiązani z listą       |
| R2  | Klient komentuje udostępnioną listę (live) | wszyscy członkowie zespołu powiązani z listą       |
| R3  | Członek zespołu komentuje element listy    | **pozostali** członkowie zespołu powiązani z listą |

## 2. Środowisko i dane testowe

- Aplikacja: https://kislist.com, przeglądarka Chrome (desktop) + Chromium w Playwright.
- 4 konta członków zespołu z adresami „+” (np. `mail+piotr@gmail.com`, `mail+anna@gmail.com` …),
  dodane do listy testowej zgodnie z [instrukcją dodawania członka zespołu](https://pomoc.kislist.com/baza-wiedzy/team/jak-dodac-czlonka-zespolu-wspolpracownika-lub-goscia-do-listy-w-kis-list/).
- Klient: niezalogowana sesja (okno incognito) otwierająca link udostępnienia listy / propozycji.
- Każdy komentarz zawiera unikalny znacznik (`[e2e R3-anna] <timestamp>`), dzięki czemu
  powiadomienie da się jednoznacznie przypisać do komentarza.
- Powiadomienia sprawdzane są w centrum powiadomień w aplikacji (ikona dzwonka) każdego odbiorcy;
  dodatkowo, manualnie, w skrzynce e-mail (wszystkie adresy „+” trafiają do jednej skrzynki).

## 3. Plan testów

Zasady wspólne: przed każdym przypadkiem wszyscy odbiorcy mają przeczytane powiadomienia;
dla przypadków negatywnych odczekujemy pełne okno czasowe (≥ 20 s + odświeżenie), zanim uznamy brak powiadomienia.

### 3.1 Scenariusze pozytywne

| ID   | Wym.  | Scenariusz                                                                   | Oczekiwany rezultat                                                                          |
| ---- | ----- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| P-01 | R1    | Klient dodaje komentarz do propozycji                                        | Piotr, Anna, Marcin, Michalina dostają powiadomienie                                         |
| P-02 | R2    | Klient dodaje komentarz do udostępnionej listy (podgląd na żywo)             | Piotr, Anna, Marcin, Michalina dostają powiadomienie                                         |
| P-03 | R3    | Piotr (właściciel) komentuje element listy                                   | Anna, Marcin, Michalina dostają powiadomienie                                                |
| P-04 | R3    | Anna komentuje element listy                                                 | Piotr, Marcin, Michalina dostają powiadomienie                                               |
| P-05 | R3    | Marcin komentuje element listy                                               | Piotr, Anna, Michalina dostają powiadomienie                                                 |
| P-06 | R3    | Michalina komentuje element listy                                            | Piotr, Anna, Marcin dostają powiadomienie                                                    |
| P-07 | R3    | Anna komentuje z oznaczeniem `@Marcin`                                       | Marcin **oraz** Piotr i Michalina dostają powiadomienie (oznaczenie nie zawęża odbiorców)    |
| P-08 | R3    | Anna komentuje z oznaczeniem kilku osób (`@Marcin @Michalina`)               | Piotr, Marcin, Michalina – po jednym powiadomieniu (bez duplikatów)                          |
| P-09 | R3    | Odpowiedź w istniejącym wątku komentarzy (drugi komentarz w tym samym wątku) | Pozostali członkowie dostają powiadomienie również o odpowiedzi                              |
| P-10 | R1–R3 | Treść powiadomienia                                                          | Zawiera autora, nazwę listy/elementu, fragment komentarza; kliknięcie prowadzi do komentarza |
| P-11 | R3    | Członek dodany do listy później (nowy członek zespołu)                       | Po dodaniu do listy otrzymuje powiadomienia o nowych komentarzach                            |

### 3.2 Scenariusze negatywne

| ID   | Wym.  | Scenariusz                                                   | Oczekiwany rezultat                                                                |
| ---- | ----- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| N-01 | R3    | Autor komentarza (dowolny członek zespołu)                   | Autor **nie** dostaje powiadomienia o własnym komentarzu                           |
| N-02 | R3    | Autor oznacza samego siebie (`@Anna` w komentarzu Anny)      | Anna nie dostaje powiadomienia                                                     |
| N-03 | R1–R3 | Członek zespołu konta, który **nie** jest powiązany z listą  | Nie dostaje powiadomienia                                                          |
| N-04 | R1–R3 | Członek usunięty z listy                                     | Po usunięciu nie dostaje powiadomień                                               |
| N-05 | R1–R3 | Komentarz na innej liście (bez wspólnych członków)           | Brak powiadomienia dla zespołu listy testowej                                      |
| N-06 | R1–R3 | Pusty komentarz / same spacje                                | Komentarz nie zostaje dodany, brak powiadomienia                                   |
| N-07 | R1–R3 | Edycja / usunięcie komentarza                                | Nie generuje nowego powiadomienia „dodał komentarz” (do potwierdzenia z produktem) |
| N-08 | R2    | Klient otwiera link udostępnienia, ale nie dodaje komentarza | Brak powiadomienia                                                                 |

### 3.3 Priorytety

Najwyższy priorytet mają P-03…P-07 i N-01 – zgłoszenie dotyczy komentarzy na listach
i „nie zawsze” sugeruje zależność od **autora** (np. właściciel vs. współpracownik)
albo od **oznaczenia @** (np. powiadamiane są tylko osoby oznaczone lub tylko właściciel listy).
Macierz autor × odbiorca (P-03…P-06) pokrywa wszystkie 12 par nadawca→odbiorca.

## 4. Wyniki

> Do uzupełnienia po wykonaniu testów. Legenda: ✅ zgodnie z wymaganiem, ❌ błąd, ⏳ nie wykonano.

| ID        | Piotr | Anna  | Marcin | Michalina | Wynik | Uwagi |
| --------- | :---: | :---: | :----: | :-------: | :---: | ----- |
| P-01      |  ⏳   |  ⏳   |   ⏳   |    ⏳     |  ⏳   |       |
| P-02      |  ⏳   |  ⏳   |   ⏳   |    ⏳     |  ⏳   |       |
| P-03      | autor |  ⏳   |   ⏳   |    ⏳     |  ⏳   |       |
| P-04      |  ⏳   | autor |   ⏳   |    ⏳     |  ⏳   |       |
| P-05      |  ⏳   |  ⏳   | autor  |    ⏳     |  ⏳   |       |
| P-06      |  ⏳   |  ⏳   |   ⏳   |   autor   |  ⏳   |       |
| P-07      |  ⏳   | autor |   ⏳   |    ⏳     |  ⏳   |       |
| P-08…P-11 |       |       |        |           |  ⏳   |       |
| N-01…N-08 |       |       |        |           |  ⏳   |       |

### Zgłoszenie błędu (szablon)

- **Tytuł:**
- **Kroki:**
- **Oczekiwany rezultat:**
- **Rzeczywisty rezultat:**
- **Częstotliwość / środowisko:**
- **Test regresyjny:** `tests/notifications/<plik>.spec.ts` – `<ID i nazwa testu>`

## 5. Test automatyczny (Playwright + TypeScript)

Framework automatyzuje scenariusze R1–R3 z planu: P-01…P-08, P-10 (treść powiadomienia) oraz N-01, N-02, N-08.

> Page Objecty są oparte na rzeczywistym DOM aplikacji i sprawdzone na żywo w trybie tylko do odczytu
> (lista, modal komentarzy, panel powiadomień, podgląd propozycji, zespół, logowanie – bez wysyłania).
> Niezweryfikowane: wybór osoby po „@” (brak innych członków zespołu na koncie), struktura pojedynczego
> powiadomienia i wpisu w wątku komentarzy (konto nie miało jeszcze ani jednego) oraz widok udostępnionej listy.

### Co dokładnie weryfikują testy

| Sprawdzenie                                              | Jak                                                                                                                      | Po co                                                                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Komentarz został zapisany                                | modal dotyczy właściwego produktu, komentarz widoczny w wątku, edytor wyczyszczony, (P-07/N-02) oznaczenie `@` wstawione | brak powiadomienia nie jest mylony z niewysłanym komentarzem                    |
| Każdy odbiorca dostaje **dokładnie jedno** powiadomienie | `toHaveNotification` – osobny krok na osobę; 2 wpisy = błąd (duplikat, P-08)                                             | raport wskazuje, **kto** nie dostał powiadomienia                               |
| Autor **nie** dostaje powiadomienia                      | `not.toHaveNotification` do końca okna liczonego od wysłania komentarza                                                  | „pozostali” w R3 wyklucza autora (N-01, N-02)                                   |
| Treść powiadomienia                                      | asercje miękkie: nazwa produktu i autor (P-10)                                                                           | wszystkie rozbieżności w treści widoczne w jednym przebiegu                     |
| Samo przeglądanie listy nie generuje powiadomień         | liczba wpisów u każdego członka bez zmian (N-08)                                                                         | zamiast szukać znanego tekstu – odporne na wcześniejsze przebiegi               |
| Próby kontrolne w testach negatywnych                    | N-02: Piotr musi dostać powiadomienie; N-08: panel pokazuje wpisy albo komunikat „pusto”                                 | test „braku” nie przechodzi przy zepsutym lokatorze czy niedziałającym systemie |

Powiadomienia powstają asynchronicznie, więc asercje odpytują centrum powiadomień (odświeżenie co 3 s)
w oknie `NOTIFICATION_WINDOW_MS` (domyślnie 20 s) liczonym **od wysłania komentarza**.

### Architektura

```
src/
├── config/                       # env.ts – konfiguracja walidowana (zod); timeouts.ts – czasy w jednym miejscu
├── data/
│   ├── team.ts                   # Piotr, Anna, Marcin, Michalina: osoba z zadania + nazwa konta w aplikacji
│   └── factories.ts              # komentarze z unikalnym znacznikiem (faker)
├── pages/                        # Page Objecty – lokatory i akcje, BEZ asercji
│   ├── LoginPage.ts  TwoFactorPage.ts  ListPage.ts  ClientViewPage.ts  TeamPage.ts
│   └── components/               # CommentsModal, CommentForm (TipTap), NotificationCenter
├── support/                      # @step (metoda Page Objectu = krok raportu), retryUntil (synchronizacja)
├── fixtures/test.ts              # teamMember(osoba), client, listId, testItem
├── assertions/notifications.ts   # asercje domenowe: toHaveNotification, toKeepNotificationCount
└── allure/                       # metadane (adnotacje) i dowody (zrzuty) do raportu
tests/
├── setup/auth.setup.ts           # sesje 4 osób (.auth/), logowanie z 2FA tylko gdy sesja wygasła
└── notifications/
    ├── steps.ts                  # kroki testów z asercjami: postTeamComment, expectNotified, expectNotNotified
    ├── team-comments.spec.ts     # R3: P-03…P-08, N-01, N-02
    └── client-comments.spec.ts   # R1/R2: P-01, P-02, N-08
```

### Zasady pisania testów

- **Asercje tylko w testach.** Page Objecty udostępniają lokatory i akcje; mogą czekać na gotowość UI
  (`waitFor`, `retryUntil`), ale niczego nie weryfikują. Pilnuje tego ESLint (`no-restricted-imports`:
  `expect` jest zabroniony w `src/pages`), a w testach reguła `no-raw-locators` wymusza korzystanie z Page Objectów.
- **Układ testu: akcja z warunkami wstępnymi → weryfikacja per osoba**, każdy etap jako nazwany `test.step`.
- **Asercje web-first i domenowe** – `toBeVisible`, `toHaveText`, `toContainText` oraz własne
  `toHaveNotification` / `toKeepNotificationCount` z czytelnym komunikatem błędu (osoba, znacznik, okno).
- **Asercje miękkie** (`expect.soft`) tylko dla niezależnych cech jednego obiektu (treść powiadomienia).
- **Izolacja danych** – unikalny znacznik w każdym komentarzu; testy nie zależą od kolejności ani od
  wcześniejszych przebiegów (N-08 porównuje liczby „przed/po” zamiast szukać znanego tekstu).
- **Bez sztywnych czekań** – jedyne odczekiwanie to okno w testach negatywnych („brak” wymaga czasu),
  zaszyte w asercji domenowej i opisane.
- **Ponowienia nie ukrywają błędu** – zgłoszony problem jest przerywany („nie zawsze”), więc w CI
  `retries: 1` + `failOnFlakyTests: true`: test, który przejdzie dopiero za drugim razem, i tak kończy przebieg błędem.
- **Fixtures** – `teamMember('anna')` zwraca zalogowaną osobę w osobnym `BrowserContext`; `testItem`
  ustala produkt (`KIS_ITEM_ID` lub pierwszy na liście) i odczytuje jego nazwę do weryfikacji treści.
- **Jakość** – TypeScript `strict`, ESLint (typescript-eslint + eslint-plugin-playwright), Prettier; CI na każdym PR.

### Raport Allure

- **Drzewo:** epic „Powiadomienia o komentarzach” → feature = wymaganie (R1/R2/R3) → story = wariant scenariusza.
- **Metadane przy deklaracji testu** (adnotacje `allure.label.*`), więc są w raporcie także wtedy, gdy test
  upadnie w fixture. Każdy test ma link **„Plan testów: P-xx”** do sekcji 3 i ważność (severity).
- **Kroki biznesowe:** metody Page Objectów oznaczone `@step` („Otwórz komentarze produktu…”, „Wyślij komentarz…”)
  oraz kroki testu („Anna dostaje dokładnie jedno powiadomienie”). Wywołania API są w nich zagnieżdżone,
  a asercje widoczne jako osobne kroki (`detail: true`).
- **Dowody także przy sukcesie:** zrzut dodanego komentarza i zrzut powiadomienia każdego odbiorcy;
  przy błędzie dodatkowo zrzut ekranu, wideo i trace Playwrighta.
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
| Dzwonek / zamknięcie panelu                 | `getByTitle('Pokaż powiadomienia')`, `.slider > .slider-close`                                                                             | title / komponent  |
| Licznik nieprzeczytanych                    | `getByTitle('Powiadomienia') .kis-pill`                                                                                                    | title              |
| Udostępnij / członek zespołu / propozycja   | `getByTitle('Udostępnij listę')`, `getByTitle('Dodaj członka zespołu lub współpracownika')`, `getByTitle('Utwórz propozycję dla klienta')` | title              |
| Produkt w widoku klienta                    | `.proposal-item#item_<itemId>`, `getByRole('button', { name: 'Napisz komentarz' })`                                                        | id / rola          |
| Zaproszenie do zespołu                      | `getByRole('textbox', { name: 'Zaproś dodatkową osobę przez email' })`                                                                     | rola               |

Zachowania aplikacji uwzględnione w Page Objectach:

- **Ikona komentarzy** – pierwsze kliknięcie po wczytaniu listy nie otwiera okna (komponent ładuje się dopiero wtedy),
  kolejne po ok. 1 s – tak; zwykły klik bywa też przechwytywany przez przeciąganie wierszy. `openComments()` wysyła
  zdarzenie `click` i ponawia do skutku, sprawdzając stan bez rzucania błędu (ponowienia nie są „czerwone” w raporcie).
- **Panel powiadomień** jest zawsze w DOM i wysuwa się (`.slider.slide-in` / `.slide-out`), więc stan sprawdzany jest
  klasą. Po przeładowaniu aplikacja sama wysuwa panel (zasłania wtedy dzwonek). Strona `/lists` ma drugi, osadzony
  panel – odświeżanie powiadomień korzysta z `/team`, gdzie jest tylko panel z nagłówka.
- **Logowanie wymaga kodu 2FA z e-maila.** Projekt `setup` używa zapisanych sesji (`.auth/<osoba>.json`,
  „Zapamiętaj mnie”) i loguje się tylko, gdy sesja wygasła – kod podaje się w zmiennej `<OSOBA>_2FA_CODE`
  albo wpisuje do pliku `.auth/<osoba>.code`, na który setup czeka do 5 minut.

### Uruchomienie lokalne

Wymagania: Node.js ≥ 20.

```bash
git clone https://github.com/dkelle1/rekrutacja-kis.git
cd rekrutacja-kis
npm ci
npx playwright install chromium
cp .env.example .env               # loginy/hasła i nazwy kont 4 członków zespołu, id listy, linki klienta
npm test                           # wszystkie scenariusze
npm run test:regression            # tylko @regression (także: test:positive, test:negative)
npx playwright test --grep @R3     # tylko wybrane wymaganie
npm run test:headed                # z widoczną przeglądarką
npm run report:allure              # raport Allure (bez Javy – Allure 3)
npm run report:html                # raport HTML Playwright
npm run check                      # typecheck + lint + format
```

Dane logowania są czytane wyłącznie ze zmiennych środowiskowych (`.env` jest w `.gitignore`) –
w repozytorium nie ma żadnych haseł.

### Uruchomienie w GitHub Actions

- **CI** (`.github/workflows/ci.yml`) – przy każdym pushu i PR: typecheck, lint, format i wczytanie testów.
  Nie wymaga dostępu do aplikacji.
- **E2E** (`.github/workflows/e2e.yml`) – uruchamiane ręcznie: zakładka **Actions → E2E – powiadomienia
  o komentarzach → Run workflow**, z wyborem zestawu (`all`, `positive`, `negative`, `regression`, `R1`–`R3`).
  Raporty Allure i Playwright są dostępne jako artefakty przebiegu (również gdy testy nie przejdą).

Konfiguracja jednorazowa: **Settings → Secrets and variables → Actions** – dodać sekrety o nazwach z
`.env.example`: `KIS_LIST_ID`, `PIOTR_EMAIL`, `PIOTR_PASSWORD`, `ANNA_EMAIL`, `ANNA_PASSWORD`,
`MARCIN_EMAIL`, `MARCIN_PASSWORD`, `MICHALINA_EMAIL`, `MICHALINA_PASSWORD`, `CLIENT_SHARE_URL`,
`CLIENT_PROPOSAL_URL`, opcjonalnie `KIS_ITEM_ID` i `<OSOBA>_DISPLAY_NAME`, oraz sesje `<OSOBA>_STORAGE_STATE`
(base64 z plików `.auth/<osoba>.json` – logowanie wymaga 2FA). Opcjonalnie zmienna `BASE_URL`.
