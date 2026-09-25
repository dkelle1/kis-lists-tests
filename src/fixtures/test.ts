import { BrowserContext, test as base } from '@playwright/test';
import { env } from '../config/env';
import { member, storageStatePath, TeamMember, TeamMemberKey } from '../data/team';
import { ClientViewPage } from '../pages/ClientViewPage';
import { ListPage } from '../pages/ListPage';
import { NotificationCenter } from '../pages/components/NotificationCenter';

export { expect } from '../assertions/notifications';

/** Zalogowany członek zespołu – osobny BrowserContext z sesją zapisaną przez projekt "setup". */
export interface TeamActor {
  member: TeamMember;
  list: ListPage;
  notifications: NotificationCenter;
}

/** Produkt, pod którym testy dodają komentarze. */
export interface TestItem {
  id: string;
  name: string;
}

interface Fixtures {
  /** Zwraca (i cache'uje w obrębie testu) zalogowanego członka zespołu. */
  teamMember: (key: TeamMemberKey) => Promise<TeamActor>;
  /** Niezalogowany klient – osobny kontekst bez sesji. */
  client: ClientViewPage;
  listId: string;
  /** KIS_ITEM_ID albo pierwszy produkt listy; nazwa odczytana z listy (do sprawdzania treści powiadomień). */
  testItem: TestItem;
}

export const test = base.extend<Fixtures>({
  // Konteksty tworzone przez browser.newContext() w teście dziedziczą ustawienia `use` (baseURL, locale…).
  teamMember: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];
    const actors = new Map<TeamMemberKey, TeamActor>();
    await use(async (key) => {
      const cached = actors.get(key);
      if (cached) return cached;
      const teamMember = member(key);
      return base.step(
        `Sesja: ${teamMember.name}`,
        async () => {
          const context = await browser.newContext({ storageState: storageStatePath(key) });
          contexts.push(context);
          const list = new ListPage(await context.newPage());
          const actor = { member: teamMember, list, notifications: list.notifications };
          actors.set(key, actor);
          return actor;
        },
        { box: true },
      );
    });
    await Promise.all(contexts.map((context) => context.close()));
  },

  client: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: undefined });
    await use(new ClientViewPage(await context.newPage()));
    await context.close();
  },

  listId: async ({}, use) => {
    await use(env().KIS_LIST_ID);
  },

  testItem: async ({ teamMember, listId }, use) => {
    const { list } = await teamMember('piotr');
    await list.goto(listId);
    const id = env().KIS_ITEM_ID ?? (await list.readItemId(list.items.first()));
    const name = (await list.itemName(id).innerText()).trim();
    await use({ id, name });
  },
});
