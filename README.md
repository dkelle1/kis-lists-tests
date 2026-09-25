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

Framework automatyzuje scenariusze R1–R3 z planu (P-01…P-07, N-01, N-02, N-08). Każdy odbiorca
jest sprawdzany w osobnym `test.step`, więc raport wskazuje dokładnie, **kto** nie dostał powiadomienia.

> Page Objecty są oparte na rzeczywistym DOM aplikacji i sprawdzone na żywo w trybie tylko do odczytu
> (otwarcie list, modala komentarzy, panelu powiadomień, podglądu propozycji, zespołu, logowania – bez wysyłania).
> Niezweryfikowane: wybór osoby po „@” (brak innych członków zespołu na koncie), struktura pojedynczego
> powiadomienia (konto nie miało jeszcze powiadomień) i widok udostępnionej listy.

### Architektura

```
src/
├── config/env.ts                 # konfiguracja z .env / sekretów CI, walidowana (zod)
├── data/
│   ├── team.ts                   # Piotr, Anna, Marcin, Michalina – dane kont, ścieżki storageState
│   └── factories.ts              # dane testowe z faker (komentarze z unikalnym znacznikiem, klient)
├── pages/                        # Page Object Model
│   ├── LoginPage.ts              # /login + TwoFactorPage (/2fa – kod z e-maila)
│   ├── ListPage.ts               # /lists/<id>/edit – produkty, otwieranie komentarzy
│   ├── ClientViewPage.ts         # widok klienta: propozycja / udostępniona lista
│   ├── TeamPage.ts               # /team – członkowie i zaproszenia
│   └── components/
│       ├── CommentsModal.ts      # modal "Komentarze" (zakładki Prywatne / Komentarze klienta)
│       ├── CommentForm.ts        # edytor komentarza (TipTap) – wspólny dla zespołu i klienta
│       └── NotificationCenter.ts # dzwonek + panel powiadomień
├── fixtures/test.ts              # test.extend: actor(osoba), client, listId, itemId + metadane Allure
└── assertions/notifications.ts   # expect.extend: toHaveNotification / not.toHaveNotification
tests/
├── setup/auth.setup.ts           # sesje 4 osób (storageState w .auth/), logowanie z 2FA tylko gdy sesja wygasła
└── notifications/
    ├── client-comments.spec.ts   # R1, R2 (P-01, P-02, N-08)
    └── team-comments.spec.ts     # R3 (P-03…P-07, N-01, N-02)
```

Zastosowane praktyki:

- **Page Object Model + komponenty** – testy opisują zachowanie („Anna komentuje element”), a nie kliknięcia.
  Kolejność wyboru lokatorów: `data-testid` i stabilne `id` nadane przez aplikację → role i dostępne nazwy
  (`getByRole`, `getByTitle`) → klasy komponentów (`.kis-comment-form`, `.notifications-window`) tylko tam,
  gdzie aplikacja nie daje nic lepszego. Bez XPath, bez pozycji w DOM i bez klas stylów (Bootstrap).
- **Fixtures** – `actor('anna')` zwraca zalogowaną osobę w osobnym `BrowserContext` (osobne cookies),
  kontekstami zarządza fixture (sprzątanie po teście).
- **Logowanie raz** – projekt `setup` zapisuje sesje (`storageState`), testy od nich zależą (`dependencies`).
- **Dane testowe (faker)** – każdy komentarz ma unikalny znacznik, więc testy nie mylą powiadomień z różnych
  przebiegów; `FAKER_SEED` pozwala odtworzyć te same dane.
- **Asercje domenowe** – `expect(center).toHaveNotification(marker)` odpytuje centrum powiadomień w oknie
  czasowym; wariant `.not` czeka **całe** okno, zanim uzna brak powiadomienia (powiadomienia mogą być asynchroniczne).
- **Raportowanie** – Allure 3 (epic → feature → story, severity, `testId` z planu, kroki, zrzuty, wideo, trace)
  oraz raport HTML Playwright.
- **Tagi** – `@positive`, `@negative`, `@regression`, `@R1`, `@R2`, `@R3`.
- **Jakość** – TypeScript `strict`, ESLint (typescript-eslint + eslint-plugin-playwright), Prettier.
- **Sekwencyjne wykonanie** – testy współdzielą konta i listę, więc `workers: 1`.

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

- **Ikona komentarzy** – zwykły klik myszą bywa przechwytywany przez przeciąganie wierszy (sortable);
  `ListPage.openComments()` najeżdża na ikonę i wysyła zdarzenie `click`, ponawiając do otwarcia modala.
- **Panel powiadomień** jest zawsze w DOM i wysuwa się (`.slider.slide-in` / `.slide-out`), więc stan
  sprawdzany jest klasą, nie widocznością. Po przeładowaniu strony aplikacja pamięta otwarty panel
  (zasłania wtedy dzwonek) – `open()` otwiera tylko, gdy panel jest zamknięty.
- **Logowanie wymaga kodu 2FA z e-maila.** Projekt `setup` używa zapisanych sesji (`.auth/<osoba>.json`,
  „Zapamiętaj mnie”) i loguje się tylko, gdy sesja wygasła – kod podaje się w zmiennej `<OSOBA>_2FA_CODE`
  albo wpisuje do pliku `.auth/<osoba>.code`, na który test czeka do 5 minut.

### Uruchomienie lokalne

Wymagania: Node.js ≥ 20.

```bash
git clone https://github.com/dkelle1/rekrutacja-kis.git
cd rekrutacja-kis
npm ci
npx playwright install chromium
cp .env.example .env               # uzupełnij loginy/hasła 4 członków zespołu, id listy i linki klienta
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
`CLIENT_PROPOSAL_URL` (opcjonalnie zmienna `BASE_URL`).
