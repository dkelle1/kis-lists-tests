import { attachScreenshot } from '../../src/allure/evidence';
import { allureMeta } from '../../src/allure/metadata';
import { env } from '../../src/config/env';
import { buildComment } from '../../src/data/factories';
import { personaName, TEAM, TeamMemberKey } from '../../src/data/team';
import { expect, test } from '../../src/fixtures/test';
import { expectNotified } from './steps';

/**
 * R1/R2: klient komentuje propozycję / udostępnioną listę → powiadomienie dostają WSZYSCY członkowie zespołu listy.
 */
const CLIENT_CASES = [
  { scenario: 'P-01', requirement: 'R1', target: 'propozycję', url: () => env().CLIENT_PROPOSAL_URL },
  {
    scenario: 'P-02',
    requirement: 'R2',
    target: 'udostępnioną listę (podgląd na żywo)',
    url: () => env().CLIENT_SHARE_URL,
  },
] as const;

test.describe('R1/R2: komentarz klienta', () => {
  for (const { scenario, requirement, target, url } of CLIENT_CASES) {
    test(
      `${scenario}: klient komentuje ${target} → powiadomienie dostaje cały zespół`,
      {
        tag: [`@${requirement}`, '@positive', '@regression'],
        annotation: allureMeta({ requirement, story: 'Komentarz klienta do produktu', scenarios: [scenario] }),
      },
      async ({ client, teamMember, testItem }) => {
        const comment = buildComment(scenario);

        const sentAt = await test.step(`Klient komentuje produkt „${testItem.name}”`, async () => {
          await client.goto(url());
          await client.sendComment(testItem.id, comment.text);
          const sentAt = Date.now();
          await expect(client.comments(testItem.id), 'komentarz jest widoczny u klienta').toContainText(comment.marker);
          await attachScreenshot('Komentarz klienta', client.item(testItem.id));
          return sentAt;
        });

        for (const key of TEAM) {
          await expectNotified(await teamMember(key), { comment, sentAt, content: { produkt: testItem.name } });
        }
      },
    );
  }

  test(
    'N-08: klient tylko przegląda udostępnioną listę → nikt z zespołu nie dostaje powiadomienia',
    {
      tag: ['@R2', '@negative'],
      annotation: allureMeta({
        requirement: 'R2',
        story: 'Brak powiadomienia bez komentarza',
        scenarios: ['N-08'],
        severity: 'normal',
      }),
    },
    async ({ client, teamMember }) => {
      const baseline = await test.step('Stan początkowy powiadomień zespołu', async () => {
        const counts = {} as Record<TeamMemberKey, number>;
        for (const key of TEAM) {
          const { notifications } = await teamMember(key);
          counts[key] = await notifications.refreshAndCount();
          // Kontrola wiarygodności: panel pokazuje wpisy albo komunikat o braku powiadomień.
          // Bez tego zły lokator wpisów dawałby zawsze 0 i test przechodziłby niezależnie od aplikacji.
          await expect(
            notifications.entries.or(notifications.emptyState).first(),
            `${personaName(key)}: lista powiadomień jest czytelna dla testu`,
          ).toBeVisible();
        }
        return counts;
      });

      const viewedAt = await test.step('Klient otwiera udostępnioną listę i niczego nie komentuje', async () => {
        await client.goto(env().CLIENT_SHARE_URL);
        await expect(client.items.first(), 'lista jest widoczna dla klienta').toBeVisible();
        return Date.now();
      });

      for (const key of TEAM) {
        await test.step(`${personaName(key)}: liczba powiadomień bez zmian`, async () => {
          const { notifications } = await teamMember(key);
          await expect(notifications, `${personaName(key)}: liczba powiadomień`).toKeepNotificationCount(
            baseline[key],
            { since: viewedAt },
          );
        });
      }
    },
  );
});
