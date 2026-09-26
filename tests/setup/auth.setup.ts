/* eslint-disable playwright/no-conditional-in-test -- logowanie tylko wtedy, gdy zapisana sesja wygasła */
import { expect, test as setup } from '@playwright/test';
import fs from 'node:fs';
import { baseURL } from '../../src/config/env';
import { Account, account, ACCOUNTS, storageStatePath } from '../../src/data/team';
import { LoginPage } from '../../src/pages/LoginPage';
import { TwoFactorPage } from '../../src/pages/TwoFactorPage';
import { mailboxFor, waitForLoginCode } from '../../src/support/mailbox';

/**
 * Sesje kont (.auth/<konto>.json) używane przez testy przez storageState.
 *
 * KIS List wymaga przy logowaniu kodu 2FA wysłanego e-mailem, chyba że przeglądarka ma cookie `devid`
 * („zaufane urządzenie”, ważne rok – aplikacja ustawia je po pierwszym logowaniu z kodem). Dlatego:
 *  - jeśli zapisana sesja jest nadal ważna – logowanie jest pomijane;
 *  - w przeciwnym razie setup loguje się w kontekście z poprzednią sesją albo z `<KONTO>_DEVICE_ID`,
 *    więc zaufane urządzenie zwykle pomija kod 2FA;
 *  - gdy aplikacja jednak poprosi o kod, jest on pobierany w kolejności:
 *      1. zmienna <KONTO>_2FA_CODE,
 *      2. skrzynka e-mail (src/support/mailbox.ts) – Gmail z adresami „+” albo Mailosaur; automatycznie, także w CI,
 *      3. plik .auth/<konto>.code – ręcznie, dla adresu, którego skrzynki testy nie czytają (np. prywatny).
 *    Po takim logowaniu setup zapisuje wartość `devid` do .auth/<konto>.device (do sekretu <KONTO>_DEVICE_ID).
 */
const CODE_WAIT_MS = 5 * 60_000;
const LOGIN_PATH = /\/(login|logowanie)/;

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

async function loginCode(user: Account, since: Date): Promise<string> {
  const fromEnv = process.env[`${user.key.toUpperCase()}_2FA_CODE`];
  if (fromEnv) return fromEnv;
  if (await mailboxFor(user.email)) return waitForLoginCode(user.email, since);
  return waitForCodeFile(user.key);
}

for (const key of ACCOUNTS) {
  setup(`sesja: ${key}`, async ({ browser }) => {
    setup.setTimeout(CODE_WAIT_MS + 60_000);
    const user = account(key);
    const path = storageStatePath(key);
    const context = await browser.newContext({ storageState: fs.existsSync(path) ? path : undefined });
    if (user.deviceId) {
      await context.addCookies([{ name: 'devid', value: user.deviceId, url: baseURL }]);
    }
    const page = await context.newPage();

    await page.goto('/lists');
    fs.mkdirSync('.auth', { recursive: true });
    if (LOGIN_PATH.test(page.url())) {
      const login = new LoginPage(page);
      await login.goto();
      const since = new Date(); // przed kliknięciem – mail z kodem może przyjść szybciej niż kolejna linia testu
      await login.login(user);
      const twoFactor = new TwoFactorPage(page);
      await page.waitForURL((url) => !LOGIN_PATH.test(url.pathname));
      if (twoFactor.isCurrent()) {
        await twoFactor.enterCode(await loginCode(user, since));
        // Wartości nie wypisujemy (logi CI są publiczne) – trafia do ignorowanego pliku obok sesji.
        const devid = (await context.cookies()).find((cookie) => cookie.name === 'devid');
        if (devid) fs.writeFileSync(`.auth/${key}.device`, devid.value);
        console.log(`[auth] ${key}: urządzenie zaufane – wartość ${key.toUpperCase()}_DEVICE_ID w .auth/${key}.device`);
      }
    }

    await expect(page, `sesja ${key} jest aktywna`).not.toHaveURL(/\/(login|logowanie|2fa)/);
    await context.storageState({ path });
    await context.close();
  });
}
