/* eslint-disable playwright/no-conditional-in-test -- logowanie tylko wtedy, gdy zapisana sesja wygasła */
import { expect, test as setup } from '@playwright/test';
import fs from 'node:fs';
import { member, storageStatePath, TEAM, TeamMemberKey } from '../../src/data/team';
import { LoginPage } from '../../src/pages/LoginPage';
import { TwoFactorPage } from '../../src/pages/TwoFactorPage';

/**
 * Sesje członków zespołu (.auth/<osoba>.json) używane przez testy przez storageState.
 *
 * KIS List wymaga przy logowaniu kodu 2FA wysłanego e-mailem, więc:
 *  - jeśli zapisana sesja jest nadal ważna – logowanie jest pomijane;
 *  - w przeciwnym razie setup loguje się i czeka na kod: ze zmiennej <OSOBA>_2FA_CODE
 *    albo z pliku .auth/<osoba>.code (wpisz kod do pliku, gdy przyjdzie e-mail).
 */
const CODE_WAIT_MS = 5 * 60_000;
const LOGIN_PATH = /\/(login|logowanie)/;

async function waitForCode(key: TeamMemberKey): Promise<string> {
  const fromEnv = process.env[`${key.toUpperCase()}_2FA_CODE`];
  if (fromEnv) return fromEnv;
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

for (const key of TEAM) {
  setup(`sesja: ${key}`, async ({ browser }) => {
    setup.setTimeout(CODE_WAIT_MS + 60_000);
    const path = storageStatePath(key);
    const context = await browser.newContext({ storageState: fs.existsSync(path) ? path : undefined });
    const page = await context.newPage();

    await page.goto('/lists');
    if (LOGIN_PATH.test(page.url())) {
      const login = new LoginPage(page);
      await login.goto();
      await login.login(member(key));
      const twoFactor = new TwoFactorPage(page);
      if (twoFactor.isCurrent()) await twoFactor.enterCode(await waitForCode(key));
    }

    await expect(page, `sesja ${key} jest aktywna`).not.toHaveURL(/\/(login|logowanie|2fa)/);
    fs.mkdirSync('.auth', { recursive: true });
    await context.storageState({ path });
    await context.close();
  });
}
