# kis-lists-tests – wskazówki dla Claude Code

Testy E2E (Playwright + TypeScript, Allure 3) powiadomień o komentarzach w KIS List + raport testerski (README).

- **Wiedza o aplikacji, środowisku i pułapkach:** [docs/LEARNINGS.md](docs/LEARNINGS.md) – czytaj przed zmianami.
- **Proces:** [docs/WORKFLOW.md](docs/WORKFLOW.md); skille: `kis-explore-app`, `kis-write-e2e-test`, `kis-run-and-report`,
  `kis-accounts-2fa`; agent: `e2e-test-writer`.
- **Sprawdzenie przed commitem:** `npm run check` (tsc strict + ESLint + Prettier).
- **Uruchomienie w chmurze Claude:** `npx playwright test -c .local/playwright.sandbox.config.ts` (szablon w
  `.claude/skills/kis-explore-app/templates/`); nie uruchamiaj `playwright install`.
- Asercje tylko w testach (`tests/**`), Page Objecty (`src/pages/**`) bez `expect`.
- Sekrety wyłącznie w `.env` / sekretach CI; `.env`, `.auth/`, `.local/` są w `.gitignore`.
- Działania widoczne dla innych (udostępnienie listy, zaproszenia, propozycje) – tylko za zgodą użytkownika.
- Język repozytorium: polski (kod, komentarze, raport).
