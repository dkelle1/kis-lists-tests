---
name: kis-accounts-2fa
description: Konta testowe KIS List, logowanie z 2FA (kod z e-maila) i sekrety – sesje .auth, cookie zaufanego urządzenia devid, odczyt kodów z Gmail API, konfiguracja .env i sekretów GitHub Actions. Użyj, gdy setup nie może się zalogować, trzeba dodać konto lub rolę, token Gmaila wygasł albo konfigurujesz CI.
---

# Konta, 2FA i sekrety

Szczegóły i uzasadnienia: [.claude/LEARNINGS.md](../../LEARNINGS.md), sekcje 1.1, 1.2 i 3.

## Jak loguje się konto (`src/support/session.ts`, krok „Sesja: <konto>” w każdym teście)

1. Ważna sesja `.auth/<konto>.json` → bez logowania.
2. Logowanie w kontekście z poprzednią sesją lub z `<KONTO>_DEVICE_ID` → cookie `devid` pomija kod 2FA.
3. Jeśli aplikacja poprosi o kod: `<KONTO>_2FA_CODE` → skrzynka Gmail (`src/support/gmail.ts`, adresy właściciela
   skrzynki łącznie z „+”) → plik `.auth/<konto>.code` (5 min).
4. Po logowaniu z kodem wartość `devid` trafia do `.auth/<konto>.device` (nie do logów).

## Typowe problemy

| Objaw                                        | Przyczyna / rozwiązanie                                                                                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sesja z `.auth` nagle nieważna               | zmiana hasła unieważnia `REMEMBERME`; pierwszy test zaloguje się ponownie, `devid` zwykle pomija kod                                                     |
| Test czeka na `.auth/admin.code`             | skrzynki administratora nie czytamy – poproś użytkownika o kod **albo** o `ADMIN_DEVICE_ID` (DevTools → Application → Cookies → `kislist.com` → `devid`) |
| `Gmail: odświeżenie tokenu nie powiodło się` | refresh token wygasł (tryb Testing = 7 dni) lub został cofnięty → użytkownik uruchamia `npm run gmail:token`                                             |
| `403 access_denied` przy `gmail:token`       | konto skrzynki nie jest „Test user” w Google Auth Platform → Audience                                                                                    |
| Kod z poprzedniego przebiegu                 | `since` musi być zapisany **przed** kliknięciem „Zaloguj” (tak robi setup)                                                                               |
| Nowe konto / rola                            | rejestracja ma reCAPTCHA – zakłada człowiek; potem `ACCOUNTS`/`PERSONAS` w `src/data/team.ts`, zmienne w `env.ts`, `.env.example`, `e2e.yml`, README     |

Nie próbuj logować się automatycznie do Google ani obchodzić CAPTCHY.

## Sekrety

- Lokalnie: `.env` (w `.gitignore`), sesje `.auth/` (w `.gitignore`).
- GitHub Actions (Settings → Secrets and variables → Actions): `KIS_LIST_ID`, `CLIENT_SHARE_URL`, `ADMIN_*` (z `ADMIN_DEVICE_ID`),
  `PIOTR_*`, `MARCIN_*`, `GUEST_*`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`; opcjonalnie `KIS_ITEM_ID`,
  `CLIENT_PROPOSAL_URL`, `<KONTO>_DEVICE_ID`. Pusty sekret = brak zmiennej (`env()` odfiltrowuje `''`).
- Nigdy nie commituj ani nie wypisuj: haseł, tokenów, `devid`, id listy, linków udostępnienia. Dane podane w czacie – zalecaj ich zmianę.
