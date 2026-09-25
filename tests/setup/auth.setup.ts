/* eslint-disable playwright/no-conditional-in-test -- logowanie tylko wtedy, gdy zapisana sesja wygasła */
import { expect, test as setup } from '@playwright/test';
import fs from 'node:fs';
import { member, storageStatePath, TEAM, TeamMember } from '../../src/data/team';
import { LoginPage } from '../../src/pages/LoginPage';
import { TwoFactorPage } from '../../src/pages/TwoFactorPage';
import { mailboxFor, waitForLoginCode } from '../../src/support/mailbox';

/**
 * Sesje członków zespołu (.auth/<osoba>.json) używane przez testy przez storageState.
 *
 * KIS List wymaga przy logowaniu kodu 2FA wysłanego e-mailem, więc:
 *  - jeśli zapisana sesja jest nadal ważna – logowanie jest pomijane (każda osoba loguje się najwyżej raz
 *    na przebieg, więc nie ma wielu kodów naraz ani limitów wysyłki);
 *  - w przeciwnym razie setup loguje się i pobiera kod, w kolejności:
 *      1. zmienna <OSOBA>_2FA_CODE,
 *      2. skrzynka e-mail (src/support/mailbox.ts) – Gmail z adresami „+” albo Mailosaur; automatycznie, także w CI,
 *      3. plik .auth/<osoba>.code – ręcznie, gdy żadna skrzynka nie jest skonfigurowana.
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

async function loginCode(user: TeamMember, since: Date): Promise<string> {
  const fromEnv = process.env[`${user.key.toUpperCase()}_2FA_CODE`];
  if (fromEnv) return fromEnv;
  if (await mailboxFor(user.email)) return waitForLoginCode(user.email, since);
  return waitForCodeFile(user.key);
}

for (const key of TEAM) {
  setup(`sesja: ${key}`, async ({ browser }) => {
    setup.setTimeout(CODE_WAIT_MS + 60_000);
    const path = storageStatePath(key);
    const context = await browser.newContext({ storageState: fs.existsSync(path) ? path : undefined });
    const page = await context.newPage();

    await page.goto('/lists');
    if (LOGIN_PATH.test(page.url())) {
      const user = member(key);
      const login = new LoginPage(page);
      await login.goto();
      const since = new Date(); // przed kliknięciem – mail z kodem może przyjść szybciej niż kolejna linia testu
      await login.login(user);
      const twoFactor = new TwoFactorPage(page);
      if (twoFactor.isCurrent()) await twoFactor.enterCode(await loginCode(user, since));
    }

    await expect(page, `sesja ${key} jest aktywna`).not.toHaveURL(/\/(login|logowanie|2fa)/);
    fs.mkdirSync('.auth', { recursive: true });
    await context.storageState({ path });
    await context.close();
  });
}
