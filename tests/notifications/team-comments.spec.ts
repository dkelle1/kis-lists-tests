import { faker } from '@faker-js/faker';
import { allureMeta } from '../../src/allure/metadata';
import { attachScreenshot } from '../../src/allure/evidence';
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
            expected: { product: testItem.name, author: author.account.appName, action: COMMENT_ADDED },
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
        expected: { product: testItem.name, author: marcin.account.appName, action: MENTIONED },
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
        expected: { product: testItem.name, author: admin.account.appName, action: MENTIONED },
      });
      await expectNotified(await actor('piotr'), {
        comment,
        sentAt,
        expected: { product: testItem.name, author: admin.account.appName, action: COMMENT_ADDED },
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
          expected: { product: testItem.name, author: admin.account.appName, action: MENTIONED },
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
        expected: { product: testItem.name, author: admin.account.appName, action: MENTIONED },
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
        expected: { product: testItem.name, author: marcin.account.appName, action: REPLIED },
      });
      // R3: „pozostali członkowie” – także osoby spoza wątku; rodzaj zdarzenia nie jest określony wymaganiem.
      await expectNotified(await actor('admin'), {
        comment: reply,
        sentAt,
        expected: { product: testItem.name, author: marcin.account.appName, action: ANY_COMMENT_EVENT },
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

  test(
    'N-09: treść z HTML/JS jest pokazana jako zwykły tekst, nigdy wykonana (bezpieczeństwo)',
    {
      tag: ['@negative', '@regression'],
      annotation: allureMeta({
        requirement: 'R3',
        story: 'Bezpieczeństwo treści komentarza',
        scenarios: ['N-09'],
        severity: 'critical',
        bug: 'BUG-01',
      }),
    },
    async ({ actor, listId, testItem }) => {
      const marcin = await actor('marcin');
      // Ładunek nie jest wpisywany przez schowek (paste), tylko znak po znaku – tak jak realny użytkownik pisałby
      // w edytorze; sprawdzamy, że edytor bogatego tekstu (TipTap) nie interpretuje wpisanych znaków jako HTML.
      const payload = '<img src=x onerror=alert(1)>';
      const comment = buildComment('N-09', payload);

      let dialogFired = false;
      marcin.list.page.on('dialog', (dialog) => {
        dialogFired = true;
        void dialog.dismiss();
      });

      await marcin.list.goto(listId);
      const modal = await marcin.list.openComments(testItem.id);
      await modal.sendTeamComment(comment.text);
      const sentAt = Date.now();

      // Znacznik jest unikalny per przebieg – filtrujemy po nim, bo sam ładunek jest identyczny w każdym przebiegu
      // (wcześniejsze przebiegi zostawiają w wątku swoje kopie tego samego tekstu).
      const posted = modal.commentEntry(comment.marker);
      await expect(posted, 'komentarz jest widoczny w czacie zespołu').toBeVisible();
      await expect(posted, 'ładunek HTML jest widoczny jako zwykły tekst (nie wykonany)').toContainText(payload);
      expect(dialogFired, 'wysłanie i wyświetlenie komentarza nie wywołało dialogu (alert)').toBe(false);
      await attachScreenshot('Komentarz z ładunkiem HTML w czacie zespołu', posted);

      await expectNotified(await actor('admin'), {
        comment,
        sentAt,
        expected: { product: testItem.name, author: marcin.account.appName, action: COMMENT_ADDED },
      });
      expect(dialogFired, 'centrum powiadomień też nie wywołało dialogu (alert) przy wyświetleniu treści').toBe(false);
    },
  );

  test(
    'P-13: bardzo długi komentarz zapisuje się i powiadamia (brak limitu/błędu serwera)',
    {
      tag: ['@positive', '@regression'],
      annotation: allureMeta({
        requirement: 'R3',
        story: 'Długa treść komentarza',
        scenarios: ['P-13'],
        bug: 'BUG-01',
      }),
    },
    async ({ actor, listId, testItem }) => {
      const admin = await actor('admin');
      // ~800 znaków – wystarczająco dużo, żeby sprawdzić brak limitu/błędu serwera, a wpisanie znak po znaku
      // (pressSequentially, jak realny użytkownik) mieści się w domyślnym limicie czasu akcji.
      const longBody = faker.lorem.paragraphs(4, ' ').slice(0, 800);
      const comment = buildComment('P-13', longBody);

      const sentAt = await postTeamComment(admin, { listId, item: testItem, comment });

      await expectNotified(await actor('piotr'), {
        comment,
        sentAt,
        expected: { product: testItem.name, author: admin.account.appName, action: COMMENT_ADDED },
      });
    },
  );

  test(
    'P-14: seria kolejnych komentarzy → każdy dostaje osobne powiadomienie (nic nie ginie, nic się nie duplikuje)',
    {
      tag: ['@positive', '@regression'],
      annotation: allureMeta({
        requirement: 'R3',
        story: 'Seria komentarzy pod rząd',
        scenarios: ['P-14'],
        bug: 'BUG-01',
      }),
    },
    async ({ actor, listId, testItem }) => {
      const marcin = await actor('marcin');
      const comments = [buildComment('P-14'), buildComment('P-14'), buildComment('P-14')];

      await marcin.list.goto(listId);
      const modal = await marcin.list.openComments(testItem.id);
      await modal.privateTab.click();

      const sentAt = await test.step('Marcin wysyła 3 komentarze pod rząd', async () => {
        // Kolejne wysyłki czekają tylko na widoczność poprzedniego komentarza (nie na okno powiadomienia) –
        // "pod rząd" znaczy bez przerwy między wysyłkami, nie bez potwierdzenia, że edytor przyjął poprzedni wpis.
        for (const c of comments) {
          await modal.form.send(c.text);
          await expect(modal.comment(c.marker), `komentarz ${c.marker} jest widoczny w czacie`).toBeVisible();
        }
        return Date.now();
      });

      await attachScreenshot('Seria komentarzy w czacie zespołu', modal.thread);

      const piotr = await actor('piotr');
      for (const c of comments) {
        await expectNotified(piotr, {
          comment: c,
          sentAt,
          expected: { product: testItem.name, author: marcin.account.appName, action: COMMENT_ADDED },
        });
      }
    },
  );
});
