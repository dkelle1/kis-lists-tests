import { attachScreenshot, withFailureScreenshot } from '../../src/allure/evidence';
import { allureMeta } from '../../src/allure/metadata';
import { env } from '../../src/config/env';
import { buildComment } from '../../src/data/factories';
import { personaName, TEAM, TeamMemberKey } from '../../src/data/team';
import { expect, test } from '../../src/fixtures/test';
import { COMMENT_ADDED, expectNotified } from './steps';

/**
 * R1/R2: klient komentuje propozycję / udostępnioną listę → powiadomienie dostają WSZYSCY członkowie zespołu listy.
 * Klient otwiera link bez logowania, więc aplikacja podpisuje go „Klient/ka”.
 */
const CLIENT_AUTHOR = 'Klient/ka';

const CLIENT_CASES = [
  { scenario: 'P-01', requirement: 'R1', target: 'propozycję', url: () => env().CLIENT_PROPOSAL_URL, bug: 'BUG-02' },
  {
    scenario: 'P-02',
    requirement: 'R2',
    target: 'udostępnioną listę (podgląd na żywo)',
    url: () => env().CLIENT_SHARE_URL,
    bug: 'BUG-02',
  },
] as const;

test.describe('R1/R2: komentarz klienta', () => {
  for (const { scenario, requirement, target, url, bug } of CLIENT_CASES) {
    test(
      `${scenario}: klient komentuje ${target} → powiadomienie dostaje cały zespół`,
      {
        tag: [`@${requirement}`, '@positive', '@regression'],
        annotation: allureMeta({ requirement, story: 'Komentarz klienta do produktu', scenarios: [scenario], bug }),
      },
      async ({ client, actor, testItem }) => {
        const link = url();
        // eslint-disable-next-line playwright/no-skipped-test -- R1 wymaga linku do propozycji, który tworzy się ręcznie
        test.skip(!link, 'Brak CLIENT_PROPOSAL_URL – propozycja dla klienta nie została jeszcze utworzona');
        const comment = buildComment(scenario);

        const sentAt = await test.step(`Klient komentuje produkt „${testItem.name}”`, () =>
          withFailureScreenshot('Klient', client.page, async () => {
            await client.goto(link!);
            await client.sendComment(testItem.id, comment.text);
            const sentAt = Date.now();
            await expect(client.item(testItem.id), 'komentarz jest widoczny u klienta').toContainText(comment.marker);
            await attachScreenshot('Komentarz klienta', client.item(testItem.id));
            return sentAt;
          }));

        for (const key of TEAM) {
          await expectNotified(await actor(key), {
            comment,
            sentAt,
            expected: { product: testItem.name, author: CLIENT_AUTHOR, action: COMMENT_ADDED },
          });
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
    async ({ client, actor }) => {
      const baseline = await test.step('Stan początkowy powiadomień zespołu', async () => {
        const counts = {} as Record<TeamMemberKey, number>;
        for (const key of TEAM) {
          const { notifications } = await actor(key);
          counts[key] = await notifications.refreshAndCount();
          // Kontrola wiarygodności: centrum pokazuje wpisy albo komunikat o braku powiadomień.
          // Bez tego zły lokator wpisów dawałby zawsze 0 i test przechodziłby niezależnie od aplikacji.
          await expect(
            notifications.entries.or(notifications.emptyState).first(),
            `${personaName(key)}: lista powiadomień jest czytelna dla testu`,
          ).toBeVisible();
          await attachScreenshot(`Centrum powiadomień przed – ${personaName(key)}`, notifications.page);
        }
        return counts;
      });

      const viewedAt = await test.step('Klient otwiera udostępnioną listę i niczego nie komentuje', async () => {
        await client.goto(env().CLIENT_SHARE_URL);
        await expect(client.items.first(), 'lista jest widoczna dla klienta').toBeVisible();
        await attachScreenshot('Widok klienta', client.page);
        return Date.now();
      });

      for (const key of TEAM) {
        await test.step(`${personaName(key)}: liczba powiadomień bez zmian`, async () => {
          const { notifications } = await actor(key);
          await expect(notifications, `${personaName(key)}: liczba powiadomień`).toKeepNotificationCount(
            baseline[key],
            { since: viewedAt },
          );
          await attachScreenshot(`Centrum powiadomień po – ${personaName(key)}`, notifications.page);
        });
      }
    },
  );
});
