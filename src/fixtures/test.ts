import { Browser, BrowserContext, test as base } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { env } from '../config/env';
import { buildClient, ClientData } from '../data/factories';
import { displayName, storageStatePath, TeamMemberKey } from '../data/team';
import { DashboardPage } from '../pages/DashboardPage';
import { SharedViewPage } from '../pages/SharedViewPage';

export { expect } from '../assertions/notifications';

/** Zalogowany członek zespołu – osobny BrowserContext, sesja z projektu "setup". */
export interface Actor {
  key: TeamMemberKey;
  name: string;
  dashboard: DashboardPage;
}

/** Niezalogowany klient z danymi z faker. */
export interface Client {
  data: ClientData;
  view: SharedViewPage;
}

interface Fixtures {
  /** Zwraca (i cache'uje) zalogowanego członka zespołu. */
  actor: (key: TeamMemberKey) => Promise<Actor>;
  client: Client;
  listName: string;
}

async function newActor(browser: Browser, key: TeamMemberKey, contexts: BrowserContext[]): Promise<Actor> {
  const context = await browser.newContext({ storageState: storageStatePath(key) });
  contexts.push(context);
  const page = await context.newPage();
  return { key, name: displayName(key), dashboard: new DashboardPage(page) };
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
    await use({ data, view: new SharedViewPage(await context.newPage()) });
    await context.close();
  },

  listName: async ({}, use) => {
    await use(env().KIS_LIST_NAME);
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
