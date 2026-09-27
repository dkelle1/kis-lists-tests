# Wnioski z sesji – KIS List, powiadomienia o komentarzach

Wiedza zebrana podczas rozpoznania aplikacji, budowy frameworka i wykonania testów (wrzesień 2026).
Każdy punkt jest **zaobserwowany na żywej aplikacji**, chyba że oznaczono inaczej.
Dla zadania „dopisz test” zacznij od [WORKFLOW.md](../docs/WORKFLOW.md) i skilli w `.claude/skills/`.

---

## 1. Aplikacja KIS List

### 1.1 Logowanie i sesja

| Co                 | Szczegóły                                                                                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strona logowania   | `/logowanie` (`/login` przekierowuje); pola `#username`, `#password`, `#remember_me`, przycisk `#_submit`                                                                         |
| 2FA                | Zawsze kod **4-cyfrowy z e-maila** (temat „KIS List - Twój kod weryfikacyjny”, treść „Kod weryfikacyjny dla Twojego konta w KIS List to 6217 .”). Nie TOTP.                       |
| Formularz 2FA      | `/2fa`: 4 pola `input[type=text]` + ukryte `#_auth_code`; **wysyła się sam po 4. cyfrze** (nie klikać „Zaloguj”).                                                                 |
| Zaufane urządzenie | Po logowaniu z kodem aplikacja ustawia cookie **`devid`** (ważne rok). Z nim kolejne logowanie **nie prosi o kod** – także po zmianie hasła i wygaśnięciu sesji.                  |
| Sesja              | Cookies `REMEMBERME` (rok), `token_rf` (30 dni), `PHPSESSID`. **Zmiana hasła unieważnia `REMEMBERME`** – zapisany `storageState` przestaje działać, ale `devid` nadal pomija 2FA. |
| Porzucenie `/2fa`  | Przerwanie skryptu na `/2fa` (zamknięcie kontekstu) wymaga ponownego logowania i nowego kodu – wpisz kod i zapisz stan od razu.                                                   |
| Rejestracja        | `/rejestracja` jest chroniona **reCAPTCHA v3** – automatyczna rejestracja zwraca „Nieudana weryfikacja…”. Konta zakłada człowiek. **Nie obchodzić CAPTCHY.**                      |

### 1.2 Role i uprawnienia (okno „Zaproś do współpracy”)

| Rola            | Lista `/lists/<id>/edit`                              | Komentuje | Strona `/team` | Lista „@”           |
| --------------- | ----------------------------------------------------- | --------- | -------------- | ------------------- |
| Administrator   | edycja                                                | tak       | tak            | widoczny            |
| Współpracownik  | edycja                                                | tak       | **403**        | widoczny            |
| Członek zespołu | edycja                                                | tak       | **403**        | widoczny            |
| Gość            | **403**; widzi `/lists/<id>/show` („Lista do wglądu”) | nie       | 403            | nie ma go na liście |

- Plan próbny EXPERT: 5 stanowisk („Wykorzystano 3 z 5 miejsc”).
- Projekt może mieć też **klientów projektu** (adresy widoczne w nagłówku powiadomienia o komentarzu klienta).
- **Dostęp do nowej listy zależy od roli, wbrew opisowi na `/team`** – tekst „Członkowie zespołu mogą udostępniać
  i edytować **wszystkie** listy i ulubione” sugeruje globalny dostęp dla każdego, ale zweryfikowane na żywo (N-05,
  druga lista utworzona przez admina) pokazuje inaczej: rola **„Członek zespołu”** (Marcin) rzeczywiście widzi
  każdą nową listę od razu (i pojawia się w podpowiedziach „@”), a rola **„Współpracownik”** (Piotr) – **nie**,
  dopóki nie zostanie do tej konkretnej listy zaproszony. `/team` (nie `/lists/<id>/team`, tego adresu nie ma – 404)
  pokazuje więc opis trafny tylko dla „Członków zespołu”.
- **Zapraszanie do zespołu:** na `/team` jest pole `input[type=email]` (placeholder „Zaproś dodatkową osobę przez
  email”) obok przycisku „ZAPROŚ” – **przycisk jest `disabled` tylko dopóki pole jest puste**, to zwykła walidacja
  formularza, nie limit planu (mylnie uznane za błąd aplikacji – zgłoszenie BUG-04 zostało wycofane). Po wpisaniu
  adresu i kliknięciu przycisk wysyła e-mail „Zaproszenie do dołączenia do zespołu” z linkiem
  `/register/join/<token>` – **ten formularz rejestracji nie ma reCAPTCHA** (inaczej niż publiczna `/rejestracja`),
  pole e-mail jest już wypełnione i `readonly`, wystarczy podać imię i hasło. Nowa osoba jest zalogowana od razu po
  rejestracji i dostaje rolę „Członek zespołu” (widoczna wtedy na liście „@” każdej listy na koncie – patrz N-05).
- **Usuwanie członka zespołu:** ikona przy wierszu na `/team` (link `a[title="Usuń członka zespołu"]`) → dialog
  „Potwierdź usunięcie” → przycisk „Usuń” (tekst DOM bez wielkich liter, jak przy „Utwórz” – nie używaj `exact` przy
  dopasowaniu). **Pułapka:** administrator (właściciel) nie ma tej ikony, więc `.first()` na stronie z więcej niż
  jednym członkiem trafi w PIERWSZEGO na liście, niekoniecznie w zamierzoną osobę – zawsze zawężaj lokator do
  wiersza z konkretnym adresem e-mail. Po usunięciu osoba natychmiast znika z listy „@”, a próba wejścia na listę
  przekierowuje ją na `/profile` jej własnego (teraz osobnego) konta – traci dostęp do całej listy, nie tylko do
  powiadomień. Zaproszenie tego samego adresu e-mail ponownie przywraca członkostwo od razu (bez ponownej
  rejestracji) – konto samo w sobie nie jest usuwane, tylko jego przypisanie do zespołu.
- **Tworzenie nowej listy:** `/lists` → zielony przycisk „Utwórz” (renderowany wielkimi literami przez CSS – jego
  **prawdziwy tekst DOM to „Utwórz”, nie „UTWÓRZ”**; `getByRole('button', { name: 'UTWÓRZ', exact: true })` nic
  nie znajdzie, bo dopasowanie jest wtedy wrażliwe na wielkość liter mimo że sama nazwa zgadza się case-insensitive
  – używaj samego `'Utwórz'` albo dopasowania po tekście, bez `exact`). Klik otwiera dialog „Podaj nazwę listy” →
  pole tekstowe → przycisk „Utwórz listę” (aktywny dopiero po wpisaniu nazwy).
- **Backend bywa niestabilny** – zaobserwowana raz (2026-09-26 wieczorem) pełna, kilkugodzinna awaria: `kislist.com`
  zwracał **502** na każdej stronie (`/`, `/lists`, `/inbox`, `/lists/<id>/edit`, `/team`), potwierdzone niezależnie
  Playwrightem i czystym `curl` przez to samo proxy (`server: nginx/1.31.4` odpowiadał, ale zwracał 502 – front żyje,
  backend aplikacji nie). Log proxy sandboksa (`$HTTPS_PROXY/__agentproxy/status`) nie pokazywał żadnych odrzuceń dla
  `kislist.com`, więc to nie ograniczenie środowiska. Po ustąpieniu awarii (rano) wszystko wróciło do normy (200).
  Część prób z tamtego okresu (np. tworzenie listy) wisiała w nieskończonym stanie ładowania bez odpowiedzi – ale
  część **faktycznie się zapisała po stronie serwera mimo braku odpowiedzi dla klienta** (osierocone listy pojawiły
  się następnego dnia) – więc po takiej awarii warto sprawdzić `/lists`, zanim uzna się próbę za nieudaną.
- **Dodawanie produktu do nowej (pustej) listy:** ikona „+” w nagłówku → sekcja „Nowa sekcja” z linkiem
  „Dodaj wizualizację, notatkę lub produkt” → „Dodaj produkt” tworzy pusty wiersz z polem nazwy. Pole nazwy to
  placeholder `<i class="text-muted">` wewnątrz elementu z `contentEditable` dziedziczonym z rodzica (nie ma
  atrybutu `placeholder` na `<input>`) – kliknięcie samego `<i>` bywa niestabilne (`element is not visible` przy
  ponownych próbach); nazwa produktu nie jest wymagana, żeby dodać komentarz do wiersza (ikona komentarzy działa
  mimo pustej nazwy).
- **Usuwanie listy:** menu „⋮” na końcu wiersza listy na `/lists` (widoczne po najechaniu) → „Usuń listę” → dialog
  potwierdzenia z przyciskiem „USUŃ”.

### 1.3 Lista i komentarze (widok zespołu)

- Wiersz produktu: `#item-<id>`; ikona komentarzy: `data-testid="item-comments-<id>"` – **renderowana 3×** (po jednej na breakpoint), bierz `.filter({ visible: true })`.
- **Pierwszy element `#item-…` może być notatką sekcji** (np. „Salon”), a nie produktem – nie ma ikony komentarzy. Produkt wybieraj jako wiersz z ikoną komentarzy.
- **Pierwsze kliknięcie ikony nie otwiera okna** (komponent ładuje się leniwie); kolejne po ~1 s tak. Zwykły klik bywa przechwytywany przez sortowanie wierszy → `hover()` + `dispatchEvent('click')` w pętli do skutku.
- Okno komentarzy: `getByRole('dialog')` z `.comments-modal`; nazwa produktu w `.modal-subtitle` – **zawsze sprawdzaj**, że okno dotyczy właściwego produktu.
- Zakładki: „Prywatne” (czat zespołu, `getByRole('link', { name: /Prywatne/ })`) i „Komentarze klienta” (`data-testid="comments-public-tab"`).
- Edytor TipTap: `.kis-comment-form.active` → `getByRole('textbox')`; wysyłka `getByRole('button', { name: 'Wyślij' })`; wątek `.kis-comments`.
- **Oznaczenia „@”:** podpowiedź w `.tippy-box`, opcje to przyciski `.mention-item` (np. „Damian Keller / Marcin / Piotr”).
  - Lista ładuje się asynchronicznie – **pierwsze „@” po otwarciu okna często pokazuje „Nic nie znaleziono.” i się nie odświeża**. Rozwiązanie: Backspace i ponowne „@”.
  - Oznaczenie w edytorze: `span.mention[data-id=<e-mail>]`. Po kilku oznaczeniach drugie dziedziczy `data-email`/`data-name` pierwszego (drobny błąd UI, powiadomienia trafiają poprawnie).

### 1.4 Widok klienta

- Udostępnienie: przycisk `getByTitle('Udostępnij listę')` → okno „Udostępnij listę każdemu z linkiem”; pole e-mail `#email` (placeholder „Adres(y) email”), przycisk „WYŚLIJ I UDOSTĘPNIJ”.
  E-mail „<Imię> zaprasza Cię do listy w KIS List 💜” zawiera link `https://kislist.com/list-preview/<token>?lang=pl`.
- Widok `/list-preview/<token>` (bez logowania): produkt `#item_<id>` (**podkreślnik**, a nie myślnik), notatka sekcji ma klasę `proposal-note`; przycisk „NAPISZ KOMENTARZ” (`<button>`, rola button, dopasowanie nazwy bez rozróżniania wielkości liter).
- Komentarz klienta z linku jest podpisany **„Klient/ka”**.
- **Propozycja:** `getByTitle('Utwórz propozycję dla klienta')` → okno „Wyślij propozycję”: `#proposal_link` (link podglądu już
  wysłanej propozycji), `#proposal_email` (**domyślnie wypełnione przykładem `jan.kowalski@email.pl` – zawsze nadpisuj**),
  `#proposal_subject`, przycisk „WYŚLIJ”. E-mail do klienta ma temat = tytuł propozycji i link
  `/proposal/preview/<token>?lang=pl&rk=<klucz odbiorcy>` (kolejne wysyłki używają tego samego tokenu). Widok klienta jak przy
  udostępnionej liście: `.proposal-item#item_<id>`, „Napisz komentarz”.
- **Odpowiedź w wątku:** pod komentarzem przycisk `.kis-comment-reply` („odpowiedz”) → widok „Wątek: `<autor>`” (strzałka wstecz)
  z własnym formularzem; w głównym wątku komentarz pokazuje „(1) odpowiedzi”. Powiadomienie: „`<autor>` odpowiedział/a na Twój
  komentarz” – **tylko dla autora komentarza nadrzędnego**.
- **Pusty komentarz / same spacje:** „Wyślij” jest aktywny, ale nic nie zostaje dodane; spacje zostają w edytorze.
- **Wątek doczytuje się asynchronicznie** – liczba `.kis-comment` tuż po otwarciu okna bywa niepełna; nie porównuj liczby
  wpisów „przed/po”, sprawdzaj konkretne wpisy (np. brak wpisów bez treści).
- Testy dodają przy każdym przebiegu komentarze – wątek produktu testowego rośnie (kilkadziesiąt wpisów).

### 1.5 Powiadomienia

- Centrum powiadomień: panel pod dzwonkiem (`getByTitle('Pokaż powiadomienia')`) albo **strona `/inbox`** – ta sama lista, dostępna dla każdej roli. **Używaj `/inbox`**:
  - panel jest zawsze w DOM i wysuwa się klasą `.slider.slide-in`, sam się otwiera po przeładowaniu i zasłania dzwonek;
  - strona `/lists` ma **drugi, osadzony panel** → zdublowane wpisy i konflikty trybu ścisłego;
  - `/team` jest tylko dla administratora.
- Wpis: `.notification[data-key]`; nagłówek `.notification-header` (projekt, przy komentarzu klienta także adresy klientów), `.notification-context` („`<autor>` dodał/a komentarz” / „`<autor>` oznaczył/a Ciebie w komentarzu”), autor `.notification-context .user`, treść `.notification-details`, data `.notification-date`; grupa wpisów ma klasę `.group` i licznik `.notification-count .kis-pill`.
- **Lista rysuje się etapami:** najpierw nagłówki grup („KOSZTORYS”, licznik, data), dopiero potem opis zdarzenia
  i treść. Liczenie wpisów ze znacznikiem zaraz po pojawieniu się pierwszego wpisu dawało fałszywe „brak powiadomienia”
  (P-08 czerwony 3 razy na 4, choć powiadomienie było). `NotificationCenter.refresh()` czeka więc, aż żaden wpis nie jest
  bez `.notification-context`. Zmierzony czas dostarczenia powiadomienia: 2–9 s.
- **Wpisy są grupowane** (np. wszystkie „Klient/ka dodał/a komentarz” albo „X oznaczył/a Ciebie” w jednej grupie z licznikiem
  `count=N`); `.notification-details` pokazuje **tylko najnowszy** komentarz grupy. Skutek dla testów: znacznik starszego
  komentarza znika z listy, a **duplikat nie tworzy drugiego wpisu, tylko zwiększa licznik** – „dokładnie 1 wpis ze znacznikiem”
  nie wykryje duplikatu; do tego trzeba porównać licznik grupy przed i po zdarzeniu (do zrobienia).
- Pusto: „Wszystko przeczytane, wszystko ogarnięte.”; zakładki „Inbox / Powiadomienia / Wyczyszczone”.
- Powiadomienie o komentarzu do produktu pokazuje projekt, listę, **sekcję i produkt** („Salon / Narożnik…”), autora i treść
  (starsza grupa „Piotr dodał/a komentarz” z poziomu projektu – bez produktu). Uwaga: `.notification-context` zawiera
  tylko „`<autor>` dodał/a komentarz” – produkt jest w osobnym elemencie wpisu, więc sprawdzaj cały wpis.
- W trakcie testów **nie przyszły e-maile o komentarzach**; w ustawieniach konta (Profil → Ustawienia aplikacji) **nie ma opcji powiadomień**.
  Potwierdzone też skryptem (N-10, Gmail API): po komentarzu Marcina do Piotra żaden e-mail nie przyszedł w ciągu 75 s.
- Powiadomienia pojawiają się w ciągu kilku sekund (okno 20 s wystarcza); brak powiadomienia potwierdzono ręcznie po ~15 min.
- **Wpis w `/inbox` nie jest klikalny** (U-05, `docs/BUGS.md`): `innerHTML` wpisu nie ma ani jednego `<a>`/`href` –
  tylko dwa przyciski akcji („Oznacz jako przeczytane”, „Wyczyść”). Kliknięcie w treść nie nawiguje nigdzie.
- **Bezpieczeństwo treści (N-09):** edytor TipTap i wątek komentarzy nie interpretują wpisanego (nie wklejonego)
  tekstu jako HTML – ładunek typu `<img src=x onerror=alert(1)>` wpisany znak po znaku (`pressSequentially`)
  zostaje pokazany jako zwykły tekst, bez wykonania. Nie sprawdzono wklejania (`paste`) ani Markdown-podobnych
  skrótów edytora.
- **Brak limitu długości komentarza** zaobserwowanego przy ~800 znakach (P-13) – zapisuje się w całości bez błędu.
- **Seria kilku komentarzy pod rząd (P-14)** – wszystkie zapisują się poprawnie i są widoczne, żaden nie ginie.

### 1.6 Zachowanie powiadomień (wyniki z 2026-09-26)

| Zdarzenie                                     |        Admin         | Współpracownik | Członek zespołu | Gość |
| --------------------------------------------- | :------------------: | :------------: | :-------------: | :--: |
| Komentarz klienta (udostępniona lista)        |          ✅          |       ✅       |  **❌ BUG-02**  |  –   |
| Komentarz zespołu bez „@” (każda rola autora) |          ❌          |       ❌       |       ❌        |  –   |
| Komentarz zespołu z „@” – oznaczony           |          ✅          |       ✅       |       ✅        |  –   |
| Komentarz zespołu z „@” – nieoznaczony        |          ❌          |       ❌       |       ❌        |  –   |
| Autor oznacza samego siebie                   | **dostaje (BUG-03)** |                |                 |      |

BUG-01: zespół jest powiadamiany **tylko przez „@”**. Wyjątek do wyjaśnienia: u admina jest starsza grupa „Piotr dodał/a komentarz” (×2) z dnia zakładania kont – nieodtworzona.

---

## 2. Środowisko uruchomieniowe (Claude Code w chmurze)

- Ruch wychodzi przez **proxy** (`$HTTPS_PROXY`) z własnym CA. Chromium z Playwrighta: `executablePath: '/opt/pw-browsers/chromium'`, `proxy: { server: process.env.HTTPS_PROXY }` i `--ignore-certificate-errors-spki-list=<SPKI>` – gotowa konfiguracja w `.claude/skills/kis-explore-app/templates/`.
- **Nie uruchamiać `playwright install`.** Node 22 ma `fetch` działający przez proxy; `node plik.ts` działa (usuwanie typów), ale importy typów muszą być `import type`.
- **Port IMAP 993 jest zablokowany**, HTTPS działa → Gmail czytamy przez **Gmail API**, nie IMAP.
- **Google blokuje logowanie z automatycznej przeglądarki** („This browser or app may not be secure”) → konfiguracji OAuth/Cloud Console nie da się zrobić automatem; robi ją człowiek.
- `sleep` w pierwszym planie jest blokowany – do czekania na długi proces: `run_in_background` + pętla `until grep …`.
- Skrypty z `| grep` buforują wyjście – przy długich przebiegach zapisuj log do pliku i czytaj plik.
- **GitHub Actions:** artefakty repozytoriów prywatnych liczą się do limitu miejsca konta (Free 500 MB) – przy przekroczeniu `upload-artifact` zwraca „Artifact storage quota has been hit”; publiczne repozytorium nie ma limitu. Akcje w wersji v4 działają na wycofywanym Node 20 → używamy v5.
- **Wideo dla `browser.newContext()`:** `use.video` nagrywa tylko wbudowany kontekst Playwrighta – konteksty kont z fixture'ów trzeba nagrywać przez `recordVideo` i dołączać po `context.close()` (`src/support/video.ts`). Trace działa dla wszystkich kontekstów.
- **Zrzuty w Allure:** `testInfo.attach()` wywołane wewnątrz `test.step` trafia pod ten krok; automatyczne `screenshot: 'only-on-failure'` ląduje na poziomie testu bez podpisu (po jednym na kontekst) – dlatego zrzuty robi dekorator `@step` i kroki testów.
- **Trace w Allure:** allure-playwright zawsze dołącza trace (kilka–kilkanaście MB na test); nie ma opcji, więc `src/allure/reporter.ts` odfiltrowuje go w `onTestEnd` – trace zostaje w raporcie HTML Playwrighta. Ścieżka reportera musi być bezwzględna (`path.join(__dirname, …)`), bo względną Playwright liczy od pliku konfiguracji.
- **Zrzuty:** JPEG (`quality: 70`) i `mask` dla adresów e-mail (`page.getByText(/…@…/)`) oraz pól logowania; zrzut po kliknięciu „Zaloguj” wymaga czekania na nową stronę (`waitForURL`), inaczej pokazuje pół-wyrenderowaną stronę.
- **Logowanie w teście zamiast projektu „setup”:** projekt `setup` Playwrighta jest raportowany jak testy (zawyża statystyki), a jego kroki są „obok” scenariuszy. Logowanie jest więc w fixture `actor` (krok „Sesja: <konto>”), a sesja w `.auth/` sprawia, że kod 2FA potrzebny jest tylko w pierwszym teście konta.
- **Docker:** obraz `mcr.microsoft.com/playwright:v<wersja>-noble` musi mieć tę samą wersję co `@playwright/test` (inaczej brak
  przeglądarek). `docker run --env-file` nie obsługuje komentarzy w linii ani cudzysłowów (wartość zawierałaby komentarz),
  a `source .env` w bashu psuje wartości z `&` (link propozycji) – do lokalnych skryptów wczytuj `.env` linia po linii.
  W chmurze Claude demon Dockera trzeba uruchomić ręcznie (`dockerd &`), a `npm ci` w obrazie wymaga certyfikatu proxy
  (`--secret id=ca,src=/root/.ccr/ca-bundle.crt`) i sieci hosta z proxy przy `docker run`.
- `--reporter=list` w CLI **wyłącza Allure** (nadpisuje reportery z konfiguracji) – do sprawdzenia raportu uruchamiaj bez tej flagi.
- Konfiguracja w `.local/` zapisuje `allure-results` względem katalogu roboczego (nie katalogu configu).

---

## 3. Dostęp do poczty i 2FA w testach

- Kolejność pozyskania kodu w `src/support/session.ts` (krok „Sesja: <konto>” w każdym teście): `devid` (bez kodu) → `<KONTO>_2FA_CODE` → skrzynka Gmail → plik `.auth/<konto>.code`.
- **Zapisuj znacznik czasu przed kliknięciem „Zaloguj”** i szukaj wiadomości po adresacie + czasie – inaczej złapiesz kod z poprzedniego przebiegu.
- **Adresy „+”** (`login+anna@gmail.com`) trafiają do jednej skrzynki; dopasowuj po nagłówkach `To` / `Delivered-To` (w wyszukiwarce `to:` + `after:<epoch>`, a dokładne dopasowanie w kodzie).
- Gmail API: klient OAuth „Desktop app”, zakres `gmail.readonly`, użytkownik dodany jako **Test user** (inaczej `403 access_denied`). W trybie Testing refresh token wygasa po **7 dniach** („Publish app” to usuwa). Token: `npm run gmail:token`.
- Mailpit/lokalny SMTP odpada (SMTP należy do KIS List); Docker + Mailpit miałby sens tylko z własną domeną, MX i publicznym serwerem.
- **Prywatnej skrzynki administratora nie czytamy** – jego konto loguje się przez `ADMIN_DEVICE_ID` (wartość `devid` z przeglądarki: DevTools → Application → Cookies).
- Wartości `devid` nie wypisujemy w logach (logi CI są publiczne) – trafia do `.auth/<konto>.device`.

---

## 4. Framework – decyzje i pułapki

- **Page Objecty bez asercji** (ESLint `no-restricted-imports` blokuje `expect` w `src/pages`); w testach `playwright/no-raw-locators` wymusza Page Objecty.
- **Synchronizacja przez `retryUntil`** z `isVisible()` (nie rzuca) – spodziewane ponowienia nie są „czerwonymi” krokami w Allure.
- **Asercje domenowe** (`src/assertions/notifications.ts`): `toHaveNotification` = dokładnie 1 wpis z unikalnym znacznikiem w oknie liczonym **od zdarzenia** (`since`), `.not` = brak do końca okna, `toKeepNotificationCount` = liczba bez zmian.
- **Asercje miękkie per odbiorca** – raport pokazuje wynik dla każdej osoby, nie tylko pierwszą rozbieżność. Treść sprawdzaj tylko gdy wpis istnieje (inaczej 15 s szumu na każdej asercji).
- **Próby kontrolne** w testach negatywnych (np. oznaczony Marcin musi dostać powiadomienie), inaczej „brak” przechodzi przy zepsutym lokatorze.
- **Testy regresyjne błędów są czerwone** (bez `test.fail()`), mają tag `@regression` i link Allure `issue` → „Błąd: BUG-0x”.
- `retries: 0` – przerywany błąd nie może zostać ukryty ponowieniem, a znane błędy i tak nie przechodzą.
- **Tytuły testów nie mogą czytać `.env`** (`playwright test --list` w CI działa bez sekretów) – używaj `personaName()`.
- Sekret nieustawiony w GitHub Actions trafia do procesu jako **pusty napis** → `env()` odfiltrowuje `''` przed walidacją zod.
- `browser.newContext()` w fixture dziedziczy opcje `use` (baseURL, locale, launchOptions) – potwierdzone w źródłach Playwrighta.
- TC39 dekorator `@step('… {0}')` opakowuje metody w `test.step(..., { box: true })`; argument obiektowy w szablonie renderuje się jako `[object Object]` – przekazuj teksty.
- Workers = 1: testy współdzielą listę i centra powiadomień.
- Allure 3 (`allure-playwright`): metadane jako adnotacje przy deklaracji testu (`allure.label.*`, `tms`, `issue`), `reportLanguage: 'pl'`, bez Javy.

---

## 5. Proces i współpraca

- Dane logowania **tylko w `.env` / sekretach**; nic z haseł, tokenów, `devid`, linków udostępnienia ani id listy nie trafia do repozytorium.
  Hasła i dane OAuth podane w czacie należy po zadaniu zmienić.
- Działania wychodzące (zaproszenia, udostępnienie listy, propozycja) – **tylko za zgodą użytkownika**.
- Nie obchodzić zabezpieczeń (CAPTCHA, blokada logowania Google).
- Każde twierdzenie w raporcie potwierdzone na żywo; najpierw ręczne rozpoznanie (skrypty w `.local/explore`), potem automatyzacja.
