import { buildComment } from '../../src/data/factories';
import { displayName, othersThan } from '../../src/data/team';
import { expect, scenario, test } from '../../src/fixtures/test';

/**
 * R3: członek zespołu komentuje element listy -> powiadomienie dostają POZOSTALI członkowie zespołu.
 * Każdy odbiorca jest weryfikowany w osobnym kroku, więc raport wskazuje, KTO nie dostał powiadomienia.
 */
test.describe('R3: komentarz członka zespołu', { tag: ['@R3'] }, () => {
  const authors = [
    { author: 'piotr', id: 'P-03' },
    { author: 'anna', id: 'P-04' },
    { author: 'marcin', id: 'P-05' },
    { author: 'michalina', id: 'P-06' },
  ] as const;

  for (const { author, id } of authors) {
    test(
      `${id}: ${displayName(author)} komentuje element -> pozostali dostają powiadomienie`,
      { tag: ['@positive', '@regression'] },
      async ({ actor, listName }) => {
        await scenario({ id, requirement: 'R3', story: 'Członek zespołu dodał komentarz' });
        const comment = buildComment(id);

        await test.step(`${displayName(author)} dodaje komentarz bez oznaczeń`, async () => {
          const { dashboard } = await actor(author);
          const list = await dashboard.openList(listName);
          const thread = await list.openItemComments();
          await thread.add(comment.text);
        });

        for (const recipient of othersThan(author)) {
          await test.step(`${displayName(recipient)} dostaje powiadomienie`, async () => {
            const { dashboard } = await actor(recipient);
            await expect(dashboard.notifications).toHaveNotification(comment.marker);
          });
        }

        await test.step(`N-01: ${displayName(author)} (autor) NIE dostaje powiadomienia`, async () => {
          const { dashboard } = await actor(author);
          await expect(dashboard.notifications).not.toHaveNotification(comment.marker);
        });
      },
    );
  }

  test(
    'P-07: komentarz z oznaczeniem @ jednej osoby -> powiadomieni są wszyscy pozostali, nie tylko oznaczony',
    { tag: ['@positive', '@regression'] },
    async ({ actor, listName }) => {
      await scenario({ id: 'P-07', requirement: 'R3', story: 'Członek zespołu dodał komentarz z oznaczeniem' });
      const comment = buildComment('P-07');

      await test.step('Anna dodaje komentarz z oznaczeniem @Marcin', async () => {
        const { dashboard } = await actor('anna');
        const thread = await (await dashboard.openList(listName)).openItemComments();
        await thread.add(comment.text, { mentions: [displayName('marcin')] });
      });

      for (const recipient of othersThan('anna')) {
        await test.step(`${displayName(recipient)} dostaje powiadomienie`, async () => {
          const { dashboard } = await actor(recipient);
          await expect(dashboard.notifications).toHaveNotification(comment.marker);
        });
      }
    },
  );

  test(
    'N-02: autor oznaczający samego siebie nie dostaje powiadomienia',
    { tag: ['@negative'] },
    async ({ actor, listName }) => {
      await scenario({ id: 'N-02', requirement: 'R3', story: 'Brak powiadomienia dla autora', severity: 'normal' });
      const comment = buildComment('N-02');

      const { dashboard } = await actor('anna');
      const thread = await (await dashboard.openList(listName)).openItemComments();
      await thread.add(comment.text, { mentions: [displayName('anna')] });

      await expect(dashboard.notifications).not.toHaveNotification(comment.marker);
    },
  );
});
