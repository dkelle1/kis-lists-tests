# Wnioski z sesji – KIS List, powiadomienia o komentarzach

Wiedza zebrana podczas rozpoznania aplikacji, budowy frameworka i wykonania testów (wrzesień 2026).
Każdy punkt jest **zaobserwowany na żywej aplikacji**, chyba że oznaczono inaczej.
Dla zadania „dopisz test” zacznij od [WORKFLOW.md](WORKFLOW.md) i skilli w `.claude/skills/`.

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

### 1.5 Powiadomienia

- Centrum powiadomień: panel pod dzwonkiem (`getByTitle('Pokaż powiadomienia')`) albo **strona `/inbox`** – ta sama lista, dostępna dla każdej roli. **Używaj `/inbox`**:
  - panel jest zawsze w DOM i wysuwa się klasą `.slider.slide-in`, sam się otwiera po przeładowaniu i zasłania dzwonek;
  - strona `/lists` ma **drugi, osadzony panel** → zdublowane wpisy i konflikty trybu ścisłego;
  - `/team` jest tylko dla administratora.
- Wpis: `.notification[data-key]`; nagłówek `.notification-header` (projekt, przy komentarzu klienta także adresy klientów), `.notification-context` („`<autor>` dodał/a komentarz” / „`<autor>` oznaczył/a Ciebie w komentarzu”), autor `.notification-context .user`, treść `.notification-details`, data `.notification-date`; grupa wpisów ma klasę `.group` i licznik `.notification-count .kis-pill`.
- **Wpisy są grupowane** (np. wszystkie „Klient/ka dodał/a komentarz” albo „X oznaczył/a Ciebie” w jednej grupie z licznikiem
  `count=N`); `.notification-details` pokazuje **tylko najnowszy** komentarz grupy. Skutek dla testów: znacznik starszego
  komentarza znika z listy, a **duplikat nie tworzy drugiego wpisu, tylko zwiększa licznik** – „dokładnie 1 wpis ze znacznikiem”
  nie wykryje duplikatu; do tego trzeba porównać licznik grupy przed i po zdarzeniu (do zrobienia).
- Pusto: „Wszystko przeczytane, wszystko ogarnięte.”; zakładki „Inbox / Powiadomienia / Wyczyszczone”.
- Powiadomienie **nie zawiera nazwy produktu ani listy** (tylko projekt, autor, treść).
- W trakcie testów **nie przyszły e-maile o komentarzach**; w ustawieniach konta (Profil → Ustawienia aplikacji) **nie ma opcji powiadomień**.
- Powiadomienia pojawiają się w ciągu kilku sekund (okno 20 s wystarcza); brak powiadomienia potwierdzono ręcznie po ~15 min.

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
- **Port IMAP 993 jest zablokowany**, HTTPS działa → Gmail czytamy przez **Gmail API**, nie IMAP. Mailosaur API też osiągalne.
- **Google blokuje logowanie z automatycznej przeglądarki** („This browser or app may not be secure”) → konfiguracji OAuth/Cloud Console nie da się zrobić automatem; robi ją człowiek.
- `sleep` w pierwszym planie jest blokowany – do czekania na długi proces: `run_in_background` + pętla `until grep …`.
- Skrypty z `| grep` buforują wyjście – przy długich przebiegach zapisuj log do pliku i czytaj plik.
- **GitHub Actions:** artefakty repozytoriów prywatnych liczą się do limitu miejsca konta (Free 500 MB) – przy przekroczeniu `upload-artifact` zwraca „Artifact storage quota has been hit”; publiczne repozytorium nie ma limitu. Akcje w wersji v4 działają na wycofywanym Node 20 → używamy v5.
- `--reporter=list` w CLI **wyłącza Allure** (nadpisuje reportery z konfiguracji) – do sprawdzenia raportu uruchamiaj bez tej flagi.
- Konfiguracja w `.local/` zapisuje `allure-results` względem katalogu roboczego (nie katalogu configu).

---

## 3. Dostęp do poczty i 2FA w testach

- Kolejność pozyskania kodu w `tests/setup/auth.setup.ts`: `devid` (bez kodu) → `<KONTO>_2FA_CODE` → skrzynka (Gmail/Mailosaur) → plik `.auth/<konto>.code`.
- **Zapisuj znacznik czasu przed kliknięciem „Zaloguj”** i szukaj wiadomości po adresacie + czasie – inaczej złapiesz kod z poprzedniego przebiegu.
- **Adresy „+”** (`login+anna@gmail.com`) trafiają do jednej skrzynki; dopasowuj po nagłówkach `To` / `Delivered-To` (w wyszukiwarce `to:` + `after:<epoch>`, a dokładne dopasowanie w kodzie).
- Gmail API: klient OAuth „Desktop app”, zakres `gmail.readonly`, użytkownik dodany jako **Test user** (inaczej `403 access_denied`). W trybie Testing refresh token wygasa po **7 dniach** („Publish app” to usuwa). Token: `npm run gmail:token`.
- Mailpit/lokalny SMTP odpada (SMTP należy do KIS List); Docker + Mailpit miałby sens tylko z własną domeną, MX i publicznym serwerem.
- **Prywatnej skrzynki administratora nie czytamy** – jego konto loguje się przez `ADMIN_DEVICE_ID` (wartość `devid` z przeglądarki: DevTools → Application → Cookies).
- Wartości `devid` nie wypisujemy w logach (logi CI są publiczne) – setup zapisuje ją do `.auth/<konto>.device`.

---

## 4. Framework – decyzje i pułapki

- **Page Objecty bez asercji** (ESLint `no-restricted-imports` blokuje `expect` w `src/pages`); w testach `playwright/no-raw-locators` wymusza Page Objecty.
- **Synchronizacja przez `retryUntil`** z `isVisible()` (nie rzuca) – spodziewane ponowienia nie są „czerwonymi” krokami w Allure.
- **Asercje domenowe** (`src/assertions/notifications.ts`): `toHaveNotification` = dokładnie 1 wpis z unikalnym znacznikiem w oknie liczonym **od zdarzenia** (`since`), `.not` = brak do końca okna, `toKeepNotificationCount` = liczba bez zmian.
- **Asercje miękkie per odbiorca** – raport pokazuje wynik dla każdej osoby, nie tylko pierwszą rozbieżność. Treść sprawdzaj tylko gdy wpis istnieje (inaczej 15 s szumu na każdej asercji).
- **Próby kontrolne** w testach negatywnych (np. oznaczony Marcin musi dostać powiadomienie), inaczej „brak” przechodzi przy zepsutym lokatorze.
- **Testy regresyjne błędów są czerwone** (bez `test.fail()`), mają tag `@regression` i link Allure `issue` → „Błąd: BUG-0x”.
- `failOnFlakyTests: true` + `retries: 1` w CI – przerywany błąd nie może zostać ukryty ponowieniem.
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
