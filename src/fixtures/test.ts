import { BrowserContext, test as base } from '@playwright/test';
import { attachScreenshot } from '../allure/evidence';
import { env } from '../config/env';
import { Account, account, AccountKey } from '../data/team';
import { ClientViewPage } from '../pages/ClientViewPage';
import { ListPage } from '../pages/ListPage';
import { NotificationCenter } from '../pages/components/NotificationCenter';
import { ensureSignedIn, sessionOptions, trustDevice } from '../support/session';
import { attachVideo, videoOptions } from '../support/video';

export { expect } from '../assertions/notifications';

/** Zalogowane konto – osobny BrowserContext; sesja sprawdzana (i w razie potrzeby odnawiana) w kroku „Sesja: …”. */
export interface Actor {
  account: Account;
  list: ListPage;
  notifications: NotificationCenter;
}

/** Produkt, pod którym testy dodają komentarze. */
export interface TestItem {
  id: string;
  name: string;
}

interface Fixtures {
  /** Zwraca (i cache'uje w obrębie testu) zalogowane konto. */
  actor: (key: AccountKey) => Promise<Actor>;
  /** Niezalogowany klient – osobny kontekst bez sesji. */
  client: ClientViewPage;
  listId: string;
  /** KIS_ITEM_ID albo pierwszy produkt listy; nazwa odczytana z listy (do sprawdzania treści). */
  testItem: TestItem;
}

export const test = base.extend<Fixtures>({
  // Konteksty tworzone przez browser.newContext() w teście dziedziczą ustawienia `use` (baseURL, locale…).
  actor: async ({ browser }, use, testInfo) => {
    const contexts: BrowserContext[] = [];
    const actors = new Map<AccountKey, Actor>();
    await use(async (key) => {
      const cached = actors.get(key);
      if (cached) return cached;
      const who = account(key);
      // Krok widoczny w raporcie testu: sprawdzenie sesji, w razie potrzeby logowanie z 2FA, „Sesja aktywna”.
      return base.step(`Sesja: ${who.name}`, async () => {
        const context = await browser.newContext({ ...sessionOptions(who), ...videoOptions(testInfo) });
        contexts.push(context);
        await trustDevice(context, who);
        const list = new ListPage(await context.newPage());
        await ensureSignedIn(list.page, who);
        const actor = { account: who, list, notifications: list.notifications };
        actors.set(key, actor);
        return actor;
      });
    });
    // Zrzut po teście – stan ekranu każdego użytego konta, jako podpisany krok (również przy sukcesie).
    if (actors.size) {
      await base.step('Stan końcowy – konta', async () => {
        for (const { account: who, list } of actors.values()) {
          await attachScreenshot(`Stan końcowy – ${who.name}`, list.page).catch(() => undefined);
        }
      });
    }
    await Promise.all(contexts.map((context) => context.close()));
    // Wideo jest gotowe dopiero po zamknięciu kontekstu.
    for (const { account: who, list } of actors.values()) {
      await attachVideo(testInfo, who.name, list.page);
    }
  },

  client: async ({ browser }, use, testInfo) => {
    const context = await browser.newContext({ storageState: undefined, ...videoOptions(testInfo) });
    const page = await context.newPage();
    await use(new ClientViewPage(page));
    // Zrzut tylko, jeśli test otworzył widok klienta.
    if (page.url() !== 'about:blank') {
      await base.step('Stan końcowy – klient', () =>
        attachScreenshot('Stan końcowy – klient', page).catch(() => undefined),
      );
    }
    await context.close();
    // Nagranie tylko, jeśli test faktycznie użył widoku klienta.
    await (page.url() === 'about:blank' ? page.video()?.delete() : attachVideo(testInfo, 'klient', page));
  },

  listId: async ({}, use) => {
    await use(env().KIS_LIST_ID);
  },

  testItem: async ({ actor, listId }, use) => {
    const { list } = await actor('admin');
    await list.goto(listId);
    const id = env().KIS_ITEM_ID ?? (await list.readItemId(list.items.first()));
    const name = (await list.itemName(id).innerText()).trim();
    await use({ id, name });
  },
});
