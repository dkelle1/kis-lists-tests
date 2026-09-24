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
|-----------|------------------------------|
| Piotr     | założyciel, właściciel konta |
| Anna      | zarządza projektem           |
| Marcin    | tworzy kosztorys             |
| Michalina | praca w terenie              |

Zgłoszenie: *członkowie zespołu nie zawsze otrzymują powiadomienia o komentarzach na listach*.

### Wymagania

| ID | Zdarzenie                                   | Kto powinien dostać powiadomienie                  |
|----|---------------------------------------------|----------------------------------------------------|
| R1 | Klient komentuje propozycję                 | wszyscy członkowie zespołu powiązani z listą        |
| R2 | Klient komentuje udostępnioną listę (live)  | wszyscy członkowie zespołu powiązani z listą        |
| R3 | Członek zespołu komentuje element listy     | **pozostali** członkowie zespołu powiązani z listą  |

## 2. Środowisko i dane testowe

- Aplikacja: https://www.kislist.com, przeglądarka Chrome (desktop) + Chromium w Playwright.
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

| ID    | Wym. | Scenariusz                                                                 | Oczekiwany rezultat                                   |
|-------|------|----------------------------------------------------------------------------|-------------------------------------------------------|
| P-01  | R1   | Klient dodaje komentarz do propozycji                                       | Piotr, Anna, Marcin, Michalina dostają powiadomienie  |
| P-02  | R2   | Klient dodaje komentarz do udostępnionej listy (podgląd na żywo)            | Piotr, Anna, Marcin, Michalina dostają powiadomienie  |
| P-03  | R3   | Piotr (właściciel) komentuje element listy                                  | Anna, Marcin, Michalina dostają powiadomienie         |
| P-04  | R3   | Anna komentuje element listy                                                | Piotr, Marcin, Michalina dostają powiadomienie        |
| P-05  | R3   | Marcin komentuje element listy                                              | Piotr, Anna, Michalina dostają powiadomienie          |
| P-06  | R3   | Michalina komentuje element listy                                           | Piotr, Anna, Marcin dostają powiadomienie             |
| P-07  | R3   | Anna komentuje z oznaczeniem `@Marcin`                                      | Marcin **oraz** Piotr i Michalina dostają powiadomienie (oznaczenie nie zawęża odbiorców) |
| P-08  | R3   | Anna komentuje z oznaczeniem kilku osób (`@Marcin @Michalina`)              | Piotr, Marcin, Michalina – po jednym powiadomieniu (bez duplikatów) |
| P-09  | R3   | Odpowiedź w istniejącym wątku komentarzy (drugi komentarz w tym samym wątku)| Pozostali członkowie dostają powiadomienie również o odpowiedzi |
| P-10  | R1–R3| Treść powiadomienia                                                         | Zawiera autora, nazwę listy/elementu, fragment komentarza; kliknięcie prowadzi do komentarza |
| P-11  | R3   | Członek dodany do listy później (nowy członek zespołu)                      | Po dodaniu do listy otrzymuje powiadomienia o nowych komentarzach |

### 3.2 Scenariusze negatywne

| ID    | Wym. | Scenariusz                                                                  | Oczekiwany rezultat                                   |
|-------|------|-----------------------------------------------------------------------------|-------------------------------------------------------|
| N-01  | R3   | Autor komentarza (dowolny członek zespołu)                                   | Autor **nie** dostaje powiadomienia o własnym komentarzu |
| N-02  | R3   | Autor oznacza samego siebie (`@Anna` w komentarzu Anny)                       | Anna nie dostaje powiadomienia                        |
| N-03  | R1–R3| Członek zespołu konta, który **nie** jest powiązany z listą                   | Nie dostaje powiadomienia                             |
| N-04  | R1–R3| Członek usunięty z listy                                                      | Po usunięciu nie dostaje powiadomień                  |
| N-05  | R1–R3| Komentarz na innej liście (bez wspólnych członków)                            | Brak powiadomienia dla zespołu listy testowej         |
| N-06  | R1–R3| Pusty komentarz / same spacje                                                 | Komentarz nie zostaje dodany, brak powiadomienia      |
| N-07  | R1–R3| Edycja / usunięcie komentarza                                                 | Nie generuje nowego powiadomienia „dodał komentarz” (do potwierdzenia z produktem) |
| N-08  | R2   | Klient otwiera link udostępnienia, ale nie dodaje komentarza                  | Brak powiadomienia                                    |

### 3.3 Priorytety

Najwyższy priorytet mają P-03…P-07 i N-01 – zgłoszenie dotyczy komentarzy na listach
i „nie zawsze” sugeruje zależność od **autora** (np. właściciel vs. współpracownik)
albo od **oznaczenia @** (np. powiadamiane są tylko osoby oznaczone lub tylko właściciel listy).
Macierz autor × odbiorca (P-03…P-06) pokrywa wszystkie 12 par nadawca→odbiorca.

## 4. Wyniki

> Do uzupełnienia po wykonaniu testów. Legenda: ✅ zgodnie z wymaganiem, ❌ błąd, ⏳ nie wykonano.

| ID    | Piotr | Anna | Marcin | Michalina | Wynik | Uwagi |
|-------|:-----:|:----:|:------:|:---------:|:-----:|-------|
| P-01  | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| P-02  | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| P-03  | autor | ⏳ | ⏳ | ⏳ | ⏳ | |
| P-04  | ⏳ | autor | ⏳ | ⏳ | ⏳ | |
| P-05  | ⏳ | ⏳ | autor | ⏳ | ⏳ | |
| P-06  | ⏳ | ⏳ | ⏳ | autor | ⏳ | |
| P-07  | ⏳ | autor | ⏳ | ⏳ | ⏳ | |
| P-08…P-11 | | | | | ⏳ | |
| N-01…N-08 | | | | | ⏳ | |

### Zgłoszenie błędu (szablon)

- **Tytuł:**
- **Kroki:**
- **Oczekiwany rezultat:**
- **Rzeczywisty rezultat:**
- **Częstotliwość / środowisko:**
- **Test regresyjny:** `tests/comment-notifications.spec.ts` – `<nazwa testu>`

## 5. Test automatyczny (Playwright)

`tests/comment-notifications.spec.ts` automatyzuje R1, R2, R3 (każdy członek zespołu jako autor)
oraz wariant z oznaczeniem `@`. Każdy odbiorca jest weryfikowany w osobnym `test.step`,
więc raport wskazuje dokładnie, **kto** nie dostał powiadomienia. W tych samych testach
sprawdzany jest też scenariusz negatywny N-01 (autor nie dostaje powiadomienia o własnym komentarzu).

Struktura:

```
tests/
├── comment-notifications.spec.ts   # scenariusze R1–R3
└── support/
    ├── kislist.ts                  # akcje w aplikacji + wszystkie lokatory w jednym obiekcie `ui`
    └── users.ts                    # konta członków zespołu i dane z .env
```

### Uruchomienie

Wymagania: Node.js ≥ 18.

```bash
git clone https://github.com/dkelle1/rekrutacja-kis.git
cd rekrutacja-kis
npm ci
npx playwright install chromium
cp .env.example .env               # uzupełnij loginy/hasła 4 członków zespołu, nazwę listy i linki klienta
npm test                           # wszystkie scenariusze
npm run test:headed                # z widoczną przeglądarką
npx playwright test -g "R3"        # tylko wybrane scenariusze
npm run report                     # raport HTML (z trace/screenshotem/wideo przy błędzie)
```

Dane logowania są czytane wyłącznie ze zmiennych środowiskowych (`.env` jest w `.gitignore`) –
w repozytorium nie ma żadnych haseł.
