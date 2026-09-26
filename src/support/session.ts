import { BrowserContext, Page, test } from '@playwright/test';
import fs from 'node:fs';
import { attachScreenshot } from '../allure/evidence';
import { baseURL } from '../config/env';
import { Account, storageStatePath } from '../data/team';
import { ListPage } from '../pages/ListPage';
import { LoginPage } from '../pages/LoginPage';
import { TwoFactorPage } from '../pages/TwoFactorPage';
import { mailboxFor, waitForLoginCode } from './mailbox';

/**
 * Sesja konta – wykonywana w kroku „Sesja: <konto>” KAŻDEGO testu, więc raport testu pokazuje ją razem z jego krokami
 * (zrzut „Sprawdź zapisaną sesję”, przy potrzebie logowanie i kod 2FA, na końcu „Sesja aktywna”).
 *
 * Sesja jest zapisywana w .auth/<konto>.json (storageState), więc logowanie z kodem odbywa się tylko w pierwszym teście,
 * który używa konta; kolejne testy tylko potwierdzają zapisaną sesję.
 *
 * KIS List wymaga przy logowaniu kodu 2FA wysłanego e-mailem, chyba że przeglądarka ma cookie `devid`
 * („zaufane urządzenie”, ważne rok – aplikacja ustawia je po pierwszym logowaniu z kodem, a `<KONTO>_DEVICE_ID`
 * pozwala je podać z zewnątrz). Gdy aplikacja poprosi o kod, jest on pobierany w kolejności:
 *   1. zmienna <KONTO>_2FA_CODE,
 *   2. skrzynka e-mail (src/support/mailbox.ts) – Gmail z adresami „+” albo Mailosaur; automatycznie, także w CI,
 *   3. plik .auth/<konto>.code – ręcznie, dla adresu, którego skrzynki testy nie czytają (np. prywatny).
 * Po takim logowaniu wartość `devid` trafia do .auth/<konto>.device (nie do logów – są publiczne).
 */
const CODE_WAIT_MS = 5 * 60_000;
const SIGNED_OUT_PATH = /^\/(login|logowanie|2fa)/;

async function waitForCodeFile(key: string): Promise<string> {
  const file = `.auth/${key}.code`;
  console.log(`[auth] ${key}: wpisz kod 2FA z e-maila do pliku ${file}`);
  const deadline = Date.now() + CODE_WAIT_MS;
  while (Date.now() < deadline) {
    if (fs.existsSync(file)) {
      const code = fs.readFileSync(file, 'utf8').trim();
      fs.unlinkSync(file);
      if (/^\d{4}$/.test(code)) return code;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Brak kodu 2FA dla ${key} w ciągu ${CODE_WAIT_MS / 1000} s`);
}

async function loginCode(who: Account, since: Date): Promise<string> {
  const fromEnv = process.env[`${who.key.toUpperCase()}_2FA_CODE`];
  if (fromEnv) return fromEnv;
  if (await mailboxFor(who.email)) return waitForLoginCode(who.email, since);
  return waitForCodeFile(who.key);
}

const isSignedOut = (page: Page): boolean => SIGNED_OUT_PATH.test(new URL(page.url()).pathname);

/** Opcje kontekstu z zapisaną sesją konta (jeśli jest). */
export function sessionOptions(who: Account): { storageState?: string } {
  const path = storageStatePath(who.key);
  return fs.existsSync(path) ? { storageState: path } : {};
}

/** Zaufane urządzenie z konfiguracji (`<KONTO>_DEVICE_ID`) – logowanie bez kodu 2FA. */
export async function trustDevice(context: BrowserContext, who: Account): Promise<void> {
  if (who.deviceId) await context.addCookies([{ name: 'devid', value: who.deviceId, url: baseURL }]);
}

/** Sprawdza zapisaną sesję, w razie potrzeby loguje się (z 2FA) i zapisuje sesję do .auth/. */
export async function ensureSignedIn(page: Page, who: Account): Promise<void> {
  await new ListPage(page).openHome();
  if (isSignedOut(page)) {
    // Czekanie na kod 2FA może trwać dłużej niż zwykły test.
    test.info().setTimeout(test.info().timeout + CODE_WAIT_MS);
    const login = new LoginPage(page);
    await login.goto();
    const since = new Date(); // przed kliknięciem – mail z kodem może przyjść szybciej niż kolejna linia kodu
    await login.login(who);
    const twoFactor = new TwoFactorPage(page);
    if (twoFactor.isCurrent()) {
      await twoFactor.enterCode(await loginCode(who, since));
      const devid = (await page.context().cookies()).find((cookie) => cookie.name === 'devid');
      fs.mkdirSync('.auth', { recursive: true });
      if (devid) fs.writeFileSync(`.auth/${who.key}.device`, devid.value);
    }
  }
  if (isSignedOut(page)) throw new Error(`${who.name}: logowanie nie powiodło się (strona ${page.url()})`);

  await attachScreenshot(`Ekran: Sesja aktywna – ${who.name}`, page);
  fs.mkdirSync('.auth', { recursive: true });
  await page.context().storageState({ path: storageStatePath(who.key) });
}
