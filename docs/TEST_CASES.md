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

### P-10 – Treść powiadomienia (R1–R3) · ✅ (z uwagą U-01)

- **Kroki:** sprawdzane przy każdym powiadomieniu z P-02, P-06–P-08.
- **Oczekiwany rezultat:** autor, rodzaj zdarzenia, treść komentarza, miejsce (projekt/lista/produkt).
- **Rzeczywisty rezultat:** autor ✅, rodzaj zdarzenia ✅, treść ✅, projekt ✅; **brak nazwy produktu i listy** ([U-01](BUGS.md#uwagi)).
- **Automatyzacja:** 🤖 asercje w `tests/notifications/steps.ts` (`expectNotified`).

### P-11 – Członek dodany do listy później (R3) · ⏳

- **Kroki:** dodać nową osobę do listy, następnie komentarz innego członka.
- **Oczekiwany rezultat:** nowa osoba dostaje powiadomienie.
- **Rzeczywisty rezultat:** nie wykonano (plan: 3 z 5 miejsc zajęte; nowe konto wymaga ręcznej rejestracji – reCAPTCHA).

### P-12 – Komentarz członka zespołu w zakładce „Komentarze klienta” (R3) · ❌ [BUG-01](BUGS.md#bug-01)

- **Kroki:** Marcin, a potem Piotr dodają komentarz w zakładce „Komentarze klienta”; centrum powiadomień wszystkich.
- **Oczekiwany rezultat:** pozostali członkowie dostają powiadomienie.
- **Rzeczywisty rezultat:** **nikt** nie dostał powiadomienia.
- **Automatyzacja:** ✋ tylko ręcznie.

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

- **Oczekiwany rezultat:** po usunięciu z listy nie dostaje powiadomień. **Rzeczywisty rezultat:** nie wykonano.

### N-05 – Komentarz na innej liście · ⏳

- **Oczekiwany rezultat:** zespół listy testowej nie dostaje powiadomienia. **Rzeczywisty rezultat:** nie wykonano.

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

---

## Podsumowanie

| Status      | Liczba | Przypadki                                            |
| ----------- | :----: | ---------------------------------------------------- |
| ✅ zgodnie  |   7    | P-06, P-08, P-10, N-01, N-03, N-06, N-08             |
| ❌ błąd     |   9    | P-01, P-02, P-03, P-04, P-05, P-07, P-09, P-12, N-02 |
| ⏳ nie wyk. |   4    | P-11, N-04, N-05, N-07                               |

Uruchomienie testów automatycznych: [README – sekcja 5](../README.md#5-test-automatyczny-playwright--typescript).
