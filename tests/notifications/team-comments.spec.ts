import { allureMeta } from '../../src/allure/metadata';
import { buildComment } from '../../src/data/factories';
import { account, othersThan, personaName, TeamMemberKey } from '../../src/data/team';
import { test } from '../../src/fixtures/test';
import { COMMENT_ADDED, expectNotified, expectNotNotified, MENTIONED, postTeamComment } from './steps';

/**
 * R3: członek zespołu komentuje element listy → powiadomienie dostają POZOSTALI członkowie zespołu listy.
 *
 * "Pozostali" oznacza dwie rzeczy naraz, więc każdy test sprawdza pełny zbiór odbiorców:
 * każdy inny członek dostaje dokładnie jedno powiadomienie, a autor – żadnego.
 * Gość (lista tylko do wglądu) nie należy do zespołu, a czat zespołu jest prywatny – też nie może dostać powiadomienia.
 */
const AUTHORS: ReadonlyArray<{ author: TeamMemberKey; scenario: string }> = [
  { author: 'admin', scenario: 'P-03' },
  { author: 'piotr', scenario: 'P-04' },
  { author: 'marcin', scenario: 'P-05' },
];

test.describe('R3: komentarz członka zespołu', { tag: '@R3' }, () => {
  for (const { author: authorKey, scenario } of AUTHORS) {
    test(
      `${scenario} + N-01: ${personaName(authorKey)} komentuje produkt → powiadomieni pozostali członkowie, autor i gość nie`,
      {
        tag: ['@positive', '@negative', '@regression'],
        annotation: allureMeta({
          requirement: 'R3',
          story: 'Komentarz bez oznaczeń',
          scenarios: [scenario, 'N-01', 'N-03'],
          bug: 'BUG-01',
        }),
      },
      async ({ actor, listId, testItem }) => {
        const author = await actor(authorKey);
        const comment = buildComment(scenario);

        const sentAt = await postTeamComment(author, { listId, item: testItem, comment });

        for (const recipientKey of othersThan(authorKey)) {
          await expectNotified(await actor(recipientKey), {
            comment,
            sentAt,
            expected: { author: author.account.appName, action: COMMENT_ADDED },
          });
        }
        await expectNotNotified(author, { comment, sentAt, reason: 'autor komentarza' });
        await expectNotNotified(await actor('guest'), { comment, sentAt, reason: 'gość spoza zespołu' });
      },
    );
  }

  test(
    'P-06: oznaczona osoba dostaje powiadomienie „oznaczył/a Ciebie w komentarzu”',
    {
      tag: ['@positive'],
      annotation: allureMeta({ requirement: 'R3', story: 'Komentarz z oznaczeniem @', scenarios: ['P-06', 'P-10'] }),
    },
    async ({ actor, listId, testItem }) => {
      const marcin = await actor('marcin');
      const comment = buildComment('P-06');

      const sentAt = await postTeamComment(marcin, { listId, item: testItem, comment, mentions: [account('piotr')] });

      await expectNotified(await actor('piotr'), {
        comment,
        sentAt,
        expected: { author: marcin.account.appName, action: MENTIONED },
      });
      await expectNotNotified(marcin, { comment, sentAt, reason: 'autor komentarza' });
    },
  );

  test(
    'P-07: administrator oznacza @Marcin → powiadomieni wszyscy pozostali (nie tylko oznaczony)',
    {
      tag: ['@positive', '@regression'],
      annotation: allureMeta({
        requirement: 'R3',
        story: 'Komentarz z oznaczeniem @',
        scenarios: ['P-07'],
        bug: 'BUG-01',
      }),
    },
    async ({ actor, listId, testItem }) => {
      const admin = await actor('admin');
      const comment = buildComment('P-07');

      const sentAt = await postTeamComment(admin, { listId, item: testItem, comment, mentions: [account('marcin')] });

      await expectNotified(await actor('marcin'), {
        comment,
        sentAt,
        expected: { author: admin.account.appName, action: MENTIONED },
      });
      await expectNotified(await actor('piotr'), {
        comment,
        sentAt,
        expected: { author: admin.account.appName, action: COMMENT_ADDED },
      });
      await expectNotNotified(admin, { comment, sentAt, reason: 'autor komentarza' });
    },
  );

  test(
    'P-08: oznaczenie kilku osób → każda dostaje dokładnie jedno powiadomienie (bez duplikatów)',
    {
      tag: ['@positive'],
      annotation: allureMeta({ requirement: 'R3', story: 'Komentarz z oznaczeniem @', scenarios: ['P-08'] }),
    },
    async ({ actor, listId, testItem }) => {
      const admin = await actor('admin');
      const comment = buildComment('P-08');
      const mentions = [account('marcin'), account('piotr')];

      const sentAt = await postTeamComment(admin, { listId, item: testItem, comment, mentions });

      for (const mentioned of mentions) {
        await expectNotified(await actor(mentioned.key), {
          comment,
          sentAt,
          expected: { author: admin.account.appName, action: MENTIONED },
        });
      }
    },
  );

  test(
    'N-02: administrator oznacza samego siebie → nie dostaje powiadomienia (kontrola: oznaczony Marcin dostaje)',
    {
      tag: ['@negative'],
      annotation: allureMeta({
        requirement: 'R3',
        story: 'Brak powiadomienia dla autora',
        scenarios: ['N-02'],
        severity: 'normal',
      }),
    },
    async ({ actor, listId, testItem }) => {
      const admin = await actor('admin');
      const comment = buildComment('N-02');

      const sentAt = await postTeamComment(admin, {
        listId,
        item: testItem,
        comment,
        mentions: [admin.account, account('marcin')],
      });

      // Próba kontrolna: bez niej "brak powiadomienia" przechodziłby także przy zepsutym lokatorze
      // albo niedziałającym systemie powiadomień.
      await expectNotified(await actor('marcin'), {
        comment,
        sentAt,
        expected: { author: admin.account.appName, action: MENTIONED },
      });
      await expectNotNotified(admin, { comment, sentAt, reason: 'oznaczył samego siebie' });
    },
  );
});
