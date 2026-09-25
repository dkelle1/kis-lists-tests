import { env } from '../../src/config/env';
import { buildComment } from '../../src/data/factories';
import { displayName, TEAM } from '../../src/data/team';
import { expect, scenario, test } from '../../src/fixtures/test';

/**
 * R1/R2: klient komentuje propozycję / udostępnioną listę -> powiadomienie dostają WSZYSCY członkowie zespołu.
 */
const cases = [
  {
    id: 'P-01',
    requirement: 'R1',
    story: 'Klient dodał komentarz do propozycji',
    url: () => env().CLIENT_PROPOSAL_URL,
  },
  {
    id: 'P-02',
    requirement: 'R2',
    story: 'Klient dodał komentarz do udostępnionej listy (podgląd na żywo)',
    url: () => env().CLIENT_SHARE_URL,
  },
] as const;

for (const c of cases) {
  test(
    `${c.id}: ${c.story} -> powiadomienie dostają wszyscy członkowie zespołu`,
    { tag: [`@${c.requirement}`, '@positive', '@regression'] },
    async ({ client, actor }) => {
      await scenario({ id: c.id, requirement: c.requirement, story: c.story });
      const comment = buildComment(c.id);

      await test.step(`Klient (${client.data.name}) dodaje komentarz`, async () => {
        await client.view.goto(c.url());
        await client.view.addComment(comment.text);
      });

      for (const recipient of TEAM) {
        await test.step(`${displayName(recipient)} dostaje powiadomienie`, async () => {
          const { list } = await actor(recipient);
          await expect(list.notifications).toHaveNotification(comment.marker);
        });
      }
    },
  );
}

test(
  'N-08: klient otwiera udostępnioną listę bez komentowania -> brak powiadomienia',
  { tag: ['@R2', '@negative'] },
  async ({ client, actor }) => {
    await scenario({ id: 'N-08', requirement: 'R2', story: 'Brak powiadomienia bez komentarza', severity: 'normal' });

    await test.step('Klient tylko przegląda udostępnioną listę', async () => {
      await client.view.goto(env().CLIENT_SHARE_URL);
    });

    await test.step('Piotr nie dostaje nowego powiadomienia o komentarzu', async () => {
      const { list } = await actor('piotr');
      await expect(list.notifications).not.toHaveNotification('[e2e');
    });
  },
);
