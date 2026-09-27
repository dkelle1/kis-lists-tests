# Przypadki testowe – powiadomienia o komentarzach (KIS List)

Plan testów rozpisany na przypadki: warunki wstępne, kroki, oczekiwany i rzeczywisty rezultat, automatyzacja.
Zgłoszenia błędów: [BUGS.md](BUGS.md). Podsumowanie wyników: [README – sekcja 4](../README.md#4-wyniki).

- **Środowisko:** https://kislist.com, Chrome/Chromium desktop, język polski, wykonanie 2026-09-26.
- **Lista testowa:** „PROJEKT REKRUTACJA / KOSZTORYS”, produkt „Narożnik rozkładany Botse…”.
- **Konta powiązane z listą:**

  | Konto         | Rola w KIS List | Członek zespołu listy |
  | ------------- | --------------- | :-------------------: |
  | Damian Keller | Administrator   |           ✔           |
  | Piotr         | Współpracownik  |           ✔           |
  | Marcin        | Członek zespołu |           ✔           |
  | Klient1       | Gość            |    – (tylko wgląd)    |
  | Klient (link) | –               |           –           |

  Konta nie odwzorowują jeden do jednego czterech osób ze zgłoszenia (Piotr, Anna, Marcin, Michalina) – pokrywają
  wszystkie role z prawem edycji listy dostępne w KIS List, bo wyniki pokazują, że błąd zależy od roli i od oznaczenia „@”.

- **Warunki wstępne wspólne:** wszyscy zalogowani w osobnych przeglądarkach; każdy komentarz zawiera unikalny znacznik
  `[e2e <ID> <losowy>]`; powiadomienia sprawdzane w centrum powiadomień (dzwonek / strona `/inbox`) każdej osoby.
- **Kryterium braku powiadomienia:** 20 s od wysłania komentarza z odświeżaniem co 3 s; każdy brak potwierdzony ręcznie
  po kilkunastu minutach.
- **Legenda:** ✅ zgodnie z wymaganiem · ❌ błąd · ⏳ nie wykonano · 🤖 test automatyczny · ✋ test ręczny.

---

## Scenariusze pozytywne

### P-01 – Klient komentuje propozycję (R1) · ❌ [BUG-02](BUGS.md#bug-02)

- **Warunki wstępne:** propozycja wysłana klientowi z listy testowej („Utwórz propozycję dla klienta” → adres klienta → „Wyślij”);
  link klienta z e-maila: `/proposal/preview/<token>?rk=<klucz odbiorcy>`.
- **Kroki:** 1) klient otwiera link propozycji bez logowania; 2) pod produktem „Napisz komentarz”, treść ze znacznikiem, „Wyślij”; 3) każdy członek zespołu otwiera centrum powiadomień.
- **Oczekiwany rezultat:** Damian, Piotr i Marcin – po jednym powiadomieniu „Klient/ka dodał/a komentarz”.
- **Rzeczywisty rezultat:** Damian ✅, Piotr ✅, **Marcin ❌ – brak powiadomienia** (ręcznie i automatycznie). Gość – brak.
- **Automatyzacja:** 🤖 `tests/notifications/client-comments.spec.ts` › P-01 (`@regression`; wymaga `CLIENT_PROPOSAL_URL`).

### P-02 – Klient komentuje udostępnioną listę (R2) · ❌ [BUG-02](BUGS.md#bug-02)

- **Warunki wstępne:** lista udostępniona linkiem („Udostępnij listę każdemu z linkiem”, komentowanie włączone).
- **Kroki:** 1) klient otwiera `/list-preview/<token>`; 2) pod produktem „Napisz komentarz”, „Wyślij”; 3) centrum powiadomień każdego członka.
- **Oczekiwany rezultat:** Damian, Piotr, Marcin – po jednym „Klient/ka dodał/a komentarz”.
- **Rzeczywisty rezultat:** Damian ✅, Piotr ✅, **Marcin ❌ – brak powiadomienia**. Gość – brak (poza zakresem R2).
- **Automatyzacja:** 🤖 `client-comments.spec.ts` › P-02 (`@regression`).

### P-03 – Administrator komentuje produkt (R3) · ❌ [BUG-01](BUGS.md#bug-01)

- **Kroki:** 1) Damian otwiera listę → ikona komentarzy produktu → zakładka „Prywatne”; 2) komentarz bez oznaczeń, „Wyślij”; 3) centrum powiadomień Piotra, Marcina, Damiana i gościa.
- **Oczekiwany rezultat:** Piotr i Marcin – po jednym „Damian Keller dodał/a komentarz”; Damian i gość – brak (N-01, N-03).
- **Rzeczywisty rezultat:** **Piotr ❌, Marcin ❌** – brak powiadomień; Damian ✅ brak; gość ✅ brak.
- **Automatyzacja:** 🤖 `team-comments.spec.ts` › P-03 + N-01 (`@regression`).

### P-04 – Współpracownik komentuje produkt (R3) · ❌ [BUG-01](BUGS.md#bug-01)

- **Kroki:** jak P-03, autor: Piotr.
- **Oczekiwany rezultat:** Damian i Marcin – po jednym powiadomieniu; Piotr i gość – brak.
- **Rzeczywisty rezultat:** **Damian ❌, Marcin ❌**; Piotr ✅ brak; gość ✅ brak.
- **Automatyzacja:** 🤖 `team-comments.spec.ts` › P-04 + N-01 (`@regression`).

### P-05 – Członek zespołu komentuje produkt (R3) · ❌ [BUG-01](BUGS.md#bug-01)

- **Kroki:** jak P-03, autor: Marcin.
- **Oczekiwany rezultat:** Damian i Piotr – po jednym powiadomieniu; Marcin i gość – brak.
- **Rzeczywisty rezultat:** **Damian ❌, Piotr ❌**; Marcin ✅ brak; gość ✅ brak.
- **Automatyzacja:** 🤖 `team-comments.spec.ts` › P-05 + N-01 (`@regression`).

### P-06 – Oznaczona osoba dostaje powiadomienie (R3, oznaczenie „@”) · ✅

- **Kroki:** 1) Marcin w zakładce „Prywatne” wpisuje „@”, wybiera „Piotr”, dopisuje treść, „Wyślij”; 2) centrum powiadomień Piotra i Marcina.
- **Oczekiwany rezultat:** Piotr – jedno powiadomienie „Marcin oznaczył/a Ciebie w komentarzu”; Marcin – brak.
- **Rzeczywisty rezultat:** zgodnie z oczekiwaniem.
- **Automatyzacja:** 🤖 `team-comments.spec.ts` › P-06.

### P-07 – Oznaczenie nie zawęża odbiorców (R3) · ❌ [BUG-01](BUGS.md#bug-01)

- **Kroki:** Damian komentuje z oznaczeniem `@Marcin`; centrum powiadomień Marcina, Piotra i Damiana.
- **Oczekiwany rezultat:** Marcin – „oznaczył/a Ciebie”; Piotr – „dodał/a komentarz”; Damian – brak.
- **Rzeczywisty rezultat:** Marcin ✅; **Piotr ❌ – brak powiadomienia**; Damian ✅ brak.
- **Automatyzacja:** 🤖 `team-comments.spec.ts` › P-07 (`@regression`).

### P-08 – Oznaczenie kilku osób bez duplikatów (R3) · ✅

- **Kroki:** Damian komentuje z oznaczeniami `@Marcin @Piotr`.
- **Oczekiwany rezultat:** Marcin i Piotr – dokładnie po jednym powiadomieniu.
- **Rzeczywisty rezultat:** zgodnie z oczekiwaniem.
- **Uwaga:** aplikacja grupuje powiadomienia jednego rodzaju (licznik przy wpisie), więc duplikat mógłby tylko zwiększyć
  licznik – ten przypadek nie jest jeszcze sprawdzany (porównanie licznika przed/po).
- **Automatyzacja:** 🤖 `team-comments.spec.ts` › P-08.

### P-09 – Odpowiedź w istniejącym wątku (R3) · ❌ [BUG-01](BUGS.md#bug-01)

- **Kroki:** 1) Piotr dodaje komentarz (nadrzędny); 2) Marcin pod tym komentarzem klika „odpowiedz” → widok
  „Wątek: Piotr” → treść odpowiedzi, „Wyślij”; 3) centrum powiadomień Piotra, Damiana i Marcina.
- **Oczekiwany rezultat:** pozostali członkowie (Piotr i Damian) dostają powiadomienie o odpowiedzi; Marcin – brak.
- **Rzeczywisty rezultat:** Piotr ✅ „Marcin odpowiedział/a na Twój komentarz”; **Damian ❌ – brak powiadomienia**;
  Marcin ✅ brak. Odpowiedź powiadamia tylko autora komentarza nadrzędnego.
- **Automatyzacja:** 🤖 `team-comments.spec.ts` › P-09 (`@regression`).

### P-10 – Treść powiadomienia (R1–R3) · ✅

- **Kroki:** sprawdzane przy każdym powiadomieniu z P-02, P-06–P-08.
- **Oczekiwany rezultat:** autor, rodzaj zdarzenia, treść komentarza, miejsce (projekt/lista/produkt).
- **Rzeczywisty rezultat:** autor ✅, rodzaj zdarzenia ✅, sekcja i produkt (np. „Salon / Narożnik…”) ✅, treść ✅, projekt ✅.
- **Automatyzacja:** 🤖 asercje w `tests/notifications/steps.ts` (`expectNotified`).

### P-11 – Członek dodany do listy później (R3) · ⏳

- **Kroki:** dodać nową osobę do zespołu, następnie komentarz innego członka.
- **Oczekiwany rezultat:** nowa osoba dostaje powiadomienia o nowych komentarzach (nie o starszych).
- **Rzeczywisty rezultat:** **zablokowane przez konto, nie przez brak czasu** – przycisk „ZAPROŚ” w `/team` jest
  wyłączony (plan próbny: 3 z 5 miejsc już zajęte). Nowe konto wymaga ręcznej rejestracji (reCAPTCHA – poza zakresem
  automatyzacji). Zespół w KIS List jest **globalny dla konta** (komunikat w `/team`: „Członkowie zespołu mogą
  udostępniać i edytować wszystkie listy i ulubione”) – nie ma osobnego przypisania „ta osoba do tej listy”, więc
  scenariusz wymaga zmiany planu (dodatkowe miejsce) albo nowego, ręcznie założonego konta.

### P-12 – Komentarz członka zespołu w zakładce „Komentarze klienta” (R3) · ❌ [BUG-01](BUGS.md#bug-01)

- **Kroki:** Marcin, a potem Piotr dodają komentarz w zakładce „Komentarze klienta”; centrum powiadomień wszystkich.
- **Oczekiwany rezultat:** pozostali członkowie dostają powiadomienie.
- **Rzeczywisty rezultat:** **nikt** nie dostał powiadomienia.
- **Automatyzacja:** ✋ tylko ręcznie.

### P-13 – Bardzo długi komentarz (R3) · ❌ [BUG-01](BUGS.md#bug-01)

- **Warunki wstępne:** brak dokumentacji limitu długości komentarza.
- **Kroki:** 1) Damian wpisuje w czacie zespołu komentarz o długości ~800 znaków (wpisywany znak po znaku, jak
  realny użytkownik); 2) „Wyślij”; 3) centrum powiadomień Piotra.
- **Oczekiwany rezultat:** komentarz zapisuje się bez błędu serwera i bez obcięcia treści; Piotr dostaje powiadomienie.
- **Rzeczywisty rezultat:** komentarz zapisuje się poprawnie w całości (brak limitu/błędu) ✅; **Piotr ❌ – brak
  powiadomienia** (ten sam wzorzec co P-04: autor Administrator).
- **Automatyzacja:** 🤖 `team-comments.spec.ts` › P-13 (`@regression`).

### P-14 – Seria kolejnych komentarzy pod rząd (R3) · ❌ [BUG-01](BUGS.md#bug-01)

- **Kroki:** 1) Marcin wysyła 3 komentarze z unikalnymi znacznikami jeden po drugim, bez przerwy; 2) sprawdzenie, że
  wszystkie 3 są widoczne w czacie; 3) centrum powiadomień Piotra dla każdego znacznika osobno.
- **Oczekiwany rezultat:** żaden komentarz nie ginie, żaden się nie duplikuje; Piotr dostaje 3 osobne powiadomienia.
- **Rzeczywisty rezultat:** wszystkie 3 komentarze zapisują się poprawnie i są widoczne (brak utraty danych przy
  szybkiej serii) ✅; **Piotr ❌ – brak powiadomienia dla żadnego z 3** (ten sam wzorzec co P-05).
- **Automatyzacja:** 🤖 `team-comments.spec.ts` › P-14 (`@regression`).

---

## Scenariusze negatywne

### N-01 – Autor nie dostaje powiadomienia o własnym komentarzu (R3) · ✅

- **Kroki / wynik:** sprawdzane w P-03, P-04, P-05, P-06, P-07 dla każdej roli autora – autor nie dostał powiadomienia.
- **Automatyzacja:** 🤖 `team-comments.spec.ts` (krok „… nie dostaje powiadomienia (autor komentarza)”).
- **Uwaga:** przy BUG-01 nikt nie dostaje powiadomienia, więc ten wynik jest wiarygodny dzięki próbie kontrolnej w P-06/P-07.

### N-02 – Autor oznacza samego siebie (R3) · ❌ [BUG-03](BUGS.md#bug-03)

- **Kroki:** Damian komentuje z oznaczeniami `@Damian Keller @Marcin`.
- **Oczekiwany rezultat:** Marcin – powiadomienie (próba kontrolna); Damian – brak.
- **Rzeczywisty rezultat:** Marcin ✅; **Damian dostaje „oznaczył/a Ciebie w komentarzu”** ❌.
- **Automatyzacja:** 🤖 `team-comments.spec.ts` › N-02.

### N-03 – Gość nie dostaje powiadomień z czatu zespołu · ✅

- **Kroki / wynik:** sprawdzane w P-03, P-04, P-05 – Klient1 (Gość) nie dostał powiadomienia.
- **Automatyzacja:** 🤖 `team-comments.spec.ts` (krok „Klient1 (gość) nie dostaje powiadomienia”).

### N-04 – Członek usunięty z listy · ⏳

- **Oczekiwany rezultat:** po usunięciu z zespołu nie dostaje powiadomień.
- **Rzeczywisty rezultat:** nie wykonano – zależy od P-11 (ta sama blokada: brak wolnego miejsca, żeby najpierw
  kogoś dodać, a potem usunąć).

### N-05 – Komentarz na innej liście · ✅

- **Warunki wstępne:** poprzednia próba (dzień wcześniej) napotkała ogólną, chwilową niedostępność aplikacji
  (`kislist.com` zwracał 502 na każdej stronie – potwierdzone niezależnie Playwrightem i czystym `curl` przez to
  samo proxy). Po ustąpieniu awarii aplikacja odpowiadała normalnie (200) i test wykonano do końca.
- **Kroki:** 1) Administrator tworzy nową, drugą listę („UTWÓRZ” → „Podaj nazwę listy”) i dodaje do niej jeden
  produkt; 2) sprawdzenie listy podpowiedzi „@” w komentarzu na tej liście; 3) Administrator dodaje zwykły komentarz
  (bez oznaczeń) w czacie zespołu; 4) próba kontrolna: Administrator oznacza `@Marcin` w kolejnym komentarzu na tej
  samej liście; 5) centrum powiadomień Piotra i Marcina po obu komentarzach; 6) lista usunięta po teście.
- **Oczekiwany rezultat:** Piotr (nie ma dostępu do tej listy) nie dostaje żadnego powiadomienia z żadnego z dwóch
  komentarzy; Marcin (ma dostęp) dostaje powiadomienie o oznaczeniu „@” (próba kontrolna potwierdzająca, że kanał
  powiadomień na tej liście w ogóle działa – „brak” u Piotra nie jest tylko efektem BUG-01).
- **Rzeczywisty rezultat:** zgodnie z oczekiwaniem. Piotr **nie widniał nawet na liście podpowiedzi „@”** na tej
  liście (widoczni byli tylko Damian Keller i Marcin) – dowód izolacji niezależny od powiadomień. Zwykły komentarz
  (bez „@”) nie powiadomił nikogo (spójne z BUG-01). Komentarz z oznaczeniem `@Marcin` powiadomił Marcina w 14 s;
  Piotr nie dostał niczego po 43 s obserwacji.
- **Uwaga:** rola dostępu do listy ma znaczenie – „Członek zespołu” (Marcin) automatycznie widzi każdą nową listę
  na koncie, a „Współpracownik” (Piotr) tylko te, do których został zaproszony. To koryguje wcześniejszy wniosek
  w `docs/LEARNINGS.md` („zespół jest globalny dla konta”) – dotyczy to tylko roli „Członek zespołu”, nie każdej roli.
- **Automatyzacja:** ✋ jednorazowy skrypt weryfikacyjny (druga lista nie jest częścią stałej konfiguracji `.env`/CI –
  wymagałaby utrzymywania dodatkowego listId wyłącznie dla tego jednego scenariusza).

### N-06 – Pusty komentarz / same spacje · ✅

- **Kroki:** 1) Marcin otwiera komentarze produktu (zakładka „Prywatne”); 2) klika „Wyślij” przy pustym polu; 3) wpisuje same spacje i klika „Wyślij”; 4) próba kontrolna: zwykły komentarz ze znacznikiem.
- **Oczekiwany rezultat:** pusty komentarz i same spacje nie są dodawane (brak komentarza = brak powiadomienia); komentarz kontrolny jest dodany.
- **Rzeczywisty rezultat:** zgodnie z oczekiwaniem – przycisk „Wyślij” jest aktywny, ale nic nie zostaje dodane
  (także po przeładowaniu); spacje zostają w edytorze.
- **Automatyzacja:** 🤖 `team-comments.spec.ts` › N-06.

### N-07 – Edycja / usunięcie komentarza · ⏳

- **Oczekiwany rezultat:** brak nowego powiadomienia „dodał komentarz”. **Rzeczywisty rezultat:** nie wykonano.

### N-08 – Klient tylko przegląda udostępnioną listę (R2) · ✅

- **Kroki:** 1) liczba powiadomień każdego członka; 2) klient otwiera link i niczego nie komentuje; 3) ponowne liczenie po 20 s.
- **Oczekiwany rezultat:** liczba powiadomień bez zmian.
- **Rzeczywisty rezultat:** zgodnie z oczekiwaniem.
- **Automatyzacja:** 🤖 `client-comments.spec.ts` › N-08.

### N-09 – Treść komentarza z HTML/JS (bezpieczeństwo) · ❌ [BUG-01](BUGS.md#bug-01)

- **Kroki:** 1) Marcin wpisuje w czacie zespołu ładunek `<img src=x onerror=alert(1)>` znak po znaku (nie przez
  schowek); 2) „Wyślij”; 3) sprawdzenie treści w czacie i centrum powiadomień Damiana.
- **Oczekiwany rezultat:** treść jest pokazana jako zwykły tekst (nie jako wykonany HTML/JS – brak dialogu `alert`);
  Damian dostaje powiadomienie o komentarzu.
- **Rzeczywisty rezultat:** treść jest poprawnie pokazana jako tekst, żaden `alert` się nie uruchomił (edytor i
  wątek nie interpretują wpisanego tekstu jako HTML) ✅ – **komentarz jest bezpieczny**; **Damian ❌ – brak
  powiadomienia** (ten sam wzorzec co P-05: autor Członek zespołu).
- **Automatyzacja:** 🤖 `team-comments.spec.ts` › N-09 (`@regression`).

### N-10 – Kanał e-mail jako alternatywa dla powiadomienia w aplikacji · ❌ [BUG-01](BUGS.md#bug-01)

- **Warunki wstępne:** w ustawieniach konta nie ma opcji powiadomień e-mail (sprawdzone ręcznie – U-03/BUG-01);
  hipoteza: może aplikacja i tak wysyła e-mail przy komentarzu, niezależnie od panelu `/inbox`.
- **Kroki:** 1) zapisz `since` = czas przed wysłaniem; 2) Marcin dodaje komentarz w czacie zespołu (bez oznaczeń); 3) odpytaj skrzynkę Gmail Piotra (Gmail API, `to:` + `after:<since>`) przez 75 s.
- **Oczekiwany rezultat:** skoro w aplikacji nie ma ustawień powiadomień e-mail, brak e-maila jest zgodny z UI –
  ale warto to zweryfikować, bo mógłby to być dodatkowy, nieudokumentowany kanał łagodzący BUG-01.
- **Rzeczywisty rezultat:** **żaden e-mail nie przyszedł** do Piotra w ciągu 75 s od komentarza Marcina –
  potwierdza to, że e-mail **nie jest** działającym zamiennikiem powiadomienia w aplikacji; BUG-01 dotyka
  użytkownika całkowicie (żaden kanał go nie ostrzega o komentarzu).
- **Automatyzacja:** ✋ jednorazowy skrypt diagnostyczny (Gmail API), nie wchodzi na stałe do zestawu CI – wymagałby
  utrzymywania dodatkowej, kosztownej zależności (odpytywanie Gmaila) dla scenariusza, który nie jest osobnym
  wymaganiem R1–R3, tylko dodatkowym potwierdzeniem zasięgu BUG-01.

---

## Podsumowanie

| Status      | Liczba | Przypadki                                                                    |
| ----------- | :----: | ---------------------------------------------------------------------------- |
| ✅ zgodnie  |   8    | P-06, P-08, P-10, N-01, N-03, N-05, N-06, N-08                               |
| ❌ błąd     |   13   | P-01, P-02, P-03, P-04, P-05, P-07, P-09, P-12, P-13, P-14, N-02, N-09, N-10 |
| ⏳ nie wyk. |   3    | P-11, N-04, N-07                                                             |

P-13, P-14 i N-09 każdorazowo **potwierdzają, że treść komentarza zapisuje się poprawnie** (długi tekst, seria
komentarzy, ładunek HTML/JS pokazany bezpiecznie jako tekst) – czerwony wynik dotyczy wyłącznie brakującego
powiadomienia (BUG-01), nie utraty ani uszkodzenia danych. N-10 potwierdza, że e-mail nie jest zapasowym kanałem
powiadomienia – BUG-01 dotyka użytkownika w każdym kanale.

Uruchomienie testów automatycznych: [README – sekcja 5](../README.md#5-test-automatyczny-playwright--typescript).
