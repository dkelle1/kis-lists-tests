---
name: kis-explore-app
description: Rozpoznanie żywej aplikacji KIS List przed napisaniem lub poprawą testu – ustalenie selektorów, zachowania UI i powiadomień skryptem Playwrighta na zalogowanych kontach. Użyj, gdy test ma dotyczyć elementu, którego nie ma jeszcze w Page Objectach, gdy lokator przestał działać albo gdy trzeba sprawdzić, kto dostaje powiadomienie.
---

# Rozpoznanie aplikacji KIS List

Cel: **zanim dopiszesz lokator albo asercję, zobacz to na żywo.** Wszystko, co wiadomo, jest w
[docs/LEARNINGS.md](../../../docs/LEARNINGS.md) (sekcja 1) – przeczytaj ją najpierw, żeby nie odkrywać tego samego.

## Przygotowanie (raz na sesję)

1. `.env` musi istnieć (patrz `.env.example`), a sesje kont w `.auth/` – jeśli ich nie ma, uruchom sam setup:
   dowolny test używający kont, np. `npx playwright test -c .local/playwright.sandbox.config.ts --grep "P-03"`
   (loguje administratora, Piotra, Marcina i gościa i zapisuje ich sesje).
2. Skopiuj szablony do ignorowanego katalogu `.local/`:
   ```bash
   mkdir -p .local/explore
   cp .claude/skills/kis-explore-app/templates/lib.mjs .local/explore/lib.mjs
   cp .claude/skills/kis-explore-app/templates/playwright.sandbox.config.ts .local/playwright.sandbox.config.ts
   ```
   Konfiguracja `sandbox` jest potrzebna tylko w środowisku Claude w chmurze (proxy + CA). Lokalnie używaj
   `playwright.config.ts` i zwykłego `chromium.launch()`.

## Skrypt rozpoznania

```js
// .local/explore/<temat>.mjs – uruchom: node .local/explore/<temat>.mjs > .local/explore/<temat>.log 2>&1
import { launch, contextFor, dumpNotifications } from './lib.mjs';
const browser = await launch();
const context = await contextFor(browser, 'marcin'); // admin | piotr | marcin | guest | undefined (klient)
const page = await context.newPage();
await page.goto(`https://kislist.com/lists/${process.env.KIS_LIST_ID}/edit`);
// 1) struktura: data-testid, role, id w obrębie elementu
console.log(await page.locator('[data-testid]').evaluateAll((e) => e.map((x) => x.dataset.testid)));
// 2) widoczne przyciski i ich nazwy
console.log(
  await page.getByRole('button').evaluateAll((e) => e.filter((x) => x.offsetParent).map((x) => x.title || x.innerText)),
);
await page.screenshot({ path: '.local/shots/<temat>.png' });
console.log(await dumpNotifications(browser, 'admin'));
await browser.close();
```

Zasady:

- **Zrzut ekranu i odczyt** (narzędzie Read na PNG) przy każdej niejasności – DOM bywa mylący (np. `#item-…` to notatka sekcji).
- **Wybór lokatora:** `getByRole`/`getByTestId`/`getByTitle`/id nadane przez aplikację → klasy komponentów tylko gdy nie ma nic lepszego. Zapisz źródło w tabeli „Kluczowe selektory” w README.
- **Unikalny znacznik** w każdym tekście, który wysyłasz (`[e2e <temat> <Date.now().toString(36)>]`), żeby znaleźć go w powiadomieniach.
- **Powiadomienia czytaj ze strony `/inbox`** (nie `/team` – 403 dla ról innych niż admin; nie `/lists` – zdublowany panel).
- Długie skrypty (czekanie na powiadomienia) uruchamiaj w tle i zapisuj log do pliku; `sleep` w pierwszym planie jest blokowany, użyj `until grep -q … log; do sleep 5; done`.
- **Działania widoczne dla innych** (udostępnienie listy, zaproszenia, propozycje, e-maile) – tylko po zgodzie użytkownika.
- Nie obchodź zabezpieczeń (reCAPTCHA przy rejestracji, blokada logowania Google) – to robi człowiek.

## Wynik

- Nowe fakty dopisz do `docs/LEARNINGS.md` (sekcja 1) – krótko, z selektorem i warunkiem, w którym to zachodzi.
- Lokatory przenieś do Page Objectu (`src/pages/…`) zgodnie ze skillem `kis-write-e2e-test`.
- Zrzuty i logi zostają w `.local/` (nie commitujemy).
