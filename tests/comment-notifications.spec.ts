import { test } from '@playwright/test';
import { allTeamKeys, env, team, TeamMemberKey, uniqueCommentText } from './support/users';
import { clientComments, expectNotification, loginAs, teamMemberCommentsItem } from './support/kislist';

/**
 * System powiadomień o komentarzach – wymagania:
 *  R1: klient komentuje propozycję        -> powiadomienie dostają wszyscy członkowie zespołu listy
 *  R2: klient komentuje udostępnioną listę -> powiadomienie dostają wszyscy członkowie zespołu listy
 *  R3: członek zespołu komentuje element   -> powiadomienie dostają POZOSTALI członkowie zespołu listy
 *
 * Każdy odbiorca jest sprawdzany osobno (test.step), więc raport pokazuje dokładnie,
 * kto nie dostał powiadomienia – a nie tylko "coś poszło nie tak".
 */

async function assertRecipients(
  browser: import('@playwright/test').Browser,
  commentText: string,
  expected: TeamMemberKey[],
  notExpected: TeamMemberKey[],
) {
  for (const key of allTeamKeys) {
    if (!expected.includes(key) && !notExpected.includes(key)) continue;
    const shouldExist = expected.includes(key);
    await test.step(`${team[key].displayName} ${shouldExist ? 'DOSTAJE' : 'NIE dostaje'} powiadomienia`, async () => {
      const { context, page } = await loginAs(browser, team[key]);
      try {
        await expectNotification(page, commentText, shouldExist);
      } finally {
        await context.close();
      }
    });
  }
}

test.describe('Powiadomienia o komentarzach', () => {
  // R3 – scenariusz regresyjny: komentarz członka zespołu BEZ oznaczenia "@".
  for (const author of allTeamKeys) {
    test(`R3: ${author} komentuje element listy bez @ -> pozostali członkowie dostają powiadomienie`, async ({ browser }) => {
      const text = uniqueCommentText(`R3-${author}`);
      const { context, page } = await loginAs(browser, team[author]);
      await teamMemberCommentsItem(page, env.listName, text);
      await context.close();

      const others = allTeamKeys.filter((k) => k !== author);
      await assertRecipients(browser, text, others, [author]);
    });
  }

  test('R3: komentarz z oznaczeniem @ jednej osoby -> nadal powiadomieni są wszyscy pozostali', async ({ browser }) => {
    const text = uniqueCommentText('R3-mention');
    const { context, page } = await loginAs(browser, team.anna);
    await teamMemberCommentsItem(page, env.listName, text, [team.marcin.displayName]);
    await context.close();

    await assertRecipients(browser, text, ['piotr', 'marcin', 'michalina'], ['anna']);
  });

  test('R2: klient komentuje udostępnioną listę (podgląd na żywo) -> powiadomienie dostają wszyscy', async ({ browser }) => {
    const text = uniqueCommentText('R2-client-share');
    await clientComments(browser, env.clientShareUrl, env.clientName, text);
    await assertRecipients(browser, text, allTeamKeys, []);
  });

  test('R1: klient komentuje propozycję -> powiadomienie dostają wszyscy', async ({ browser }) => {
    const text = uniqueCommentText('R1-client-proposal');
    await clientComments(browser, env.clientProposalUrl, env.clientName, text);
    await assertRecipients(browser, text, allTeamKeys, []);
  });
});
