import { expect, test as setup } from '@playwright/test';
import { member, storageStatePath, TEAM } from '../../src/data/team';
import { LoginPage } from '../../src/pages/LoginPage';

/**
 * Logowanie raz na przebieg: sesja każdego członka zespołu trafia do .auth/<osoba>.json
 * i jest używana przez testy (storageState) – testy nie klikają formularza logowania za każdym razem.
 */
for (const key of TEAM) {
  setup(`logowanie: ${key}`, async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAs(member(key));
    await expect(page, `logowanie jako ${key} nie powiodło się`).not.toHaveURL(/login/);
    await context.storageState({ path: storageStatePath(key) });
    await context.close();
  });
}
