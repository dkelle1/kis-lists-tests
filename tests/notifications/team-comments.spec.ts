import { allureMeta } from '../../src/allure/metadata';
import { buildComment } from '../../src/data/factories';
import { member, othersThan, personaName, TeamMemberKey } from '../../src/data/team';
import { test } from '../../src/fixtures/test';
import { expectNotified, expectNotNotified, postTeamComment } from './steps';

/**
 * R3: członek zespołu komentuje element listy → powiadomienie dostają POZOSTALI członkowie zespołu listy.
 *
 * "Pozostali" oznacza dwie rzeczy naraz, więc każdy test sprawdza pełny zbiór odbiorców:
 * każdy inny członek dostaje dokładnie jedno powiadomienie, a autor – żadnego.
 */
const AUTHORS: ReadonlyArray<{ author: TeamMemberKey; scenario: string }> = [
  { author: 'piotr', scenario: 'P-03' },
  { author: 'anna', scenario: 'P-04' },
  { author: 'marcin', scenario: 'P-05' },
  { author: 'michalina', scenario: 'P-06' },
];

test.describe('R3: komentarz członka zespołu', { tag: '@R3' }, () => {
  for (const { author: authorKey, scenario } of AUTHORS) {
    test(
      `${scenario} + N-01: ${personaName(authorKey)} komentuje produkt → powiadomieni pozostali członkowie, autor nie`,
      {
        tag: ['@positive', '@negative', '@regression'],
        annotation: allureMeta({ requirement: 'R3', story: 'Komentarz bez oznaczeń', scenarios: [scenario, 'N-01'] }),
      },
      async ({ teamMember, listId, testItem }) => {
        const author = await teamMember(authorKey);
        const comment = buildComment(scenario);

        const sentAt = await postTeamComment(author, { listId, item: testItem, comment });

        for (const recipientKey of othersThan(authorKey)) {
          await expectNotified(await teamMember(recipientKey), {
            comment,
            sentAt,
            content: { produkt: testItem.name, autor: author.member.appName },
          });
        }
        await expectNotNotified(author, { comment, sentAt, reason: 'autor komentarza' });
      },
    );
  }

  test(
    'P-07: Anna oznacza @Marcin → powiadomieni wszyscy pozostali (nie tylko oznaczony), Marcin tylko raz',
    {
      tag: ['@positive', '@regression'],
      annotation: allureMeta({ requirement: 'R3', story: 'Komentarz z oznaczeniem @', scenarios: ['P-07', 'P-08'] }),
    },
    async ({ teamMember, listId, testItem }) => {
      const anna = await teamMember('anna');
      const comment = buildComment('P-07');

      const sentAt = await postTeamComment(anna, { listId, item: testItem, comment, mentions: [member('marcin')] });

      // expectNotified wymaga dokładnie jednego wpisu – u Marcina wykrywa też osobne powiadomienie o oznaczeniu.
      for (const recipientKey of othersThan('anna')) {
        await expectNotified(await teamMember(recipientKey), {
          comment,
          sentAt,
          content: { produkt: testItem.name, autor: anna.member.appName },
        });
      }
      await expectNotNotified(anna, { comment, sentAt, reason: 'autorka komentarza' });
    },
  );

  test(
    'N-02: Anna oznacza samą siebie → nie dostaje powiadomienia (kontrola: Piotr dostaje)',
    {
      tag: ['@negative'],
      annotation: allureMeta({
        requirement: 'R3',
        story: 'Brak powiadomienia dla autora',
        scenarios: ['N-02'],
        severity: 'normal',
      }),
    },
    async ({ teamMember, listId, testItem }) => {
      const anna = await teamMember('anna');
      const comment = buildComment('N-02');

      const sentAt = await postTeamComment(anna, { listId, item: testItem, comment, mentions: [anna.member] });

      // Próba kontrolna: bez niej "brak powiadomienia" przechodziłby także przy zepsutym lokatorze
      // albo niedziałającym systemie powiadomień.
      await expectNotified(await teamMember('piotr'), {
        comment,
        sentAt,
        content: { produkt: testItem.name, autor: anna.member.appName },
      });
      await expectNotNotified(anna, { comment, sentAt, reason: 'oznaczyła samą siebie' });
    },
  );
});
