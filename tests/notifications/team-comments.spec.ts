import { allureMeta } from '../../src/allure/metadata';
import { buildComment } from '../../src/data/factories';
import { account, othersThan, personaName, TeamMemberKey } from '../../src/data/team';
import { expect, test } from '../../src/fixtures/test';
import {
  ANY_COMMENT_EVENT,
  COMMENT_ADDED,
  expectNotified,
  expectNotNotified,
  MENTIONED,
  postReply,
  postTeamComment,
  REPLIED,
} from './steps';

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

  test(
    'P-09: odpowiedź w wątku → powiadomieni pozostali członkowie (nie tylko autor komentarza nadrzędnego)',
    {
      tag: ['@positive', '@regression'],
      annotation: allureMeta({ requirement: 'R3', story: 'Odpowiedź w wątku', scenarios: ['P-09'], bug: 'BUG-01' }),
    },
    async ({ actor, listId, testItem }) => {
      const piotr = await actor('piotr');
      const marcin = await actor('marcin');
      const parent = buildComment('P-09');
      const reply = buildComment('P-09');

      await postTeamComment(piotr, { listId, item: testItem, comment: parent });
      const sentAt = await postReply(marcin, { listId, item: testItem, parent, comment: reply });

      await expectNotified(piotr, {
        comment: reply,
        sentAt,
        expected: { author: marcin.account.appName, action: REPLIED },
      });
      // R3: „pozostali członkowie” – także osoby spoza wątku; rodzaj zdarzenia nie jest określony wymaganiem.
      await expectNotified(await actor('admin'), {
        comment: reply,
        sentAt,
        expected: { author: marcin.account.appName, action: ANY_COMMENT_EVENT },
      });
      await expectNotNotified(marcin, { comment: reply, sentAt, reason: 'autor odpowiedzi' });
    },
  );

  test(
    'N-06: pusty komentarz i same spacje nie są dodawane (kontrola: zwykły komentarz jest dodany)',
    {
      tag: ['@negative'],
      annotation: allureMeta({
        requirement: 'R3',
        story: 'Pusty komentarz',
        scenarios: ['N-06'],
        severity: 'normal',
      }),
    },
    async ({ actor, listId, testItem }) => {
      const marcin = await actor('marcin');
      await marcin.list.goto(listId);
      const modal = await marcin.list.openComments(testItem.id);
      await modal.privateTab.click();

      await test.step('Marcin wysyła pusty komentarz i komentarz z samych spacji', async () => {
        await modal.form.send('');
        await modal.form.send('     ');
      });

      // Próba kontrolna: dopiero widoczny zwykły komentarz daje pewność, że wcześniejsze wysyłki zostały już
      // obsłużone. Liczby wpisów nie porównujemy – wątek doczytuje się asynchronicznie, więc stan „przed” bywa niepełny.
      const control = buildComment('N-06');
      await modal.sendTeamComment(control.text);
      await expect(modal.comment(control.marker), 'komentarz kontrolny jest widoczny').toBeVisible();
      await expect(modal.emptyComments, 'w wątku nie ma wpisów bez treści').toHaveCount(0);
    },
  );
});
