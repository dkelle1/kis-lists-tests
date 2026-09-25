import { Browser, BrowserContext, test as base } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { env } from '../config/env';
import { buildClient, ClientData } from '../data/factories';
import { displayName, storageStatePath, TeamMemberKey } from '../data/team';
import { ClientViewPage } from '../pages/ClientViewPage';
import { ListPage } from '../pages/ListPage';

export { expect } from '../assertions/notifications';

/** Zalogowany członek zespołu – osobny BrowserContext z sesją zapisaną przez projekt "setup". */
export interface Actor {
  key: TeamMemberKey;
  name: string;
  list: ListPage;
}

/** Niezalogowany klient z danymi z faker. */
export interface Client {
  data: ClientData;
  view: ClientViewPage;
}

interface Fixtures {
  /** Zwraca (i cache'uje) zalogowanego członka zespołu. */
  actor: (key: TeamMemberKey) => Promise<Actor>;
  client: Client;
  listId: string;
  /** Produkt, pod którym testy dodają komentarze (KIS_ITEM_ID albo pierwszy produkt listy). */
  itemId: string;
}

async function newActor(browser: Browser, key: TeamMemberKey, contexts: BrowserContext[]): Promise<Actor> {
  const context = await browser.newContext({ storageState: storageStatePath(key) });
  contexts.push(context);
  const page = await context.newPage();
  return { key, name: displayName(key), list: new ListPage(page) };
}

export const test = base.extend<Fixtures>({
  actor: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];
    const cache = new Map<TeamMemberKey, Actor>();
    await use(async (key) => {
      if (!cache.has(key)) cache.set(key, await newActor(browser, key, contexts));
      return cache.get(key)!;
    });
    await Promise.all(contexts.map((c) => c.close()));
  },

  client: async ({ browser }, use) => {
    const context = await browser.newContext();
    const data = buildClient();
    await allure.parameter('klient', data.name);
    await use({ data, view: new ClientViewPage(await context.newPage()) });
    await context.close();
  },

  listId: async ({}, use) => {
    await use(env().KIS_LIST_ID);
  },

  itemId: async ({ actor, listId }, use) => {
    const configured = env().KIS_ITEM_ID;
    if (configured) return use(configured);
    const { list } = await actor('piotr');
    await list.goto(listId);
    await use(await list.itemId(list.items.first()));
  },
});

/** Metadane Allure dla scenariusza z planu testów (README, sekcja 3). */
export async function scenario(meta: {
  id: string;
  requirement: 'R1' | 'R2' | 'R3';
  story: string;
  severity?: 'blocker' | 'critical' | 'normal' | 'minor';
}): Promise<void> {
  await allure.epic('Powiadomienia');
  await allure.feature('Komentarze');
  await allure.story(`${meta.requirement}: ${meta.story}`);
  await allure.severity(meta.severity ?? 'critical');
  await allure.label('testId', meta.id);
}
