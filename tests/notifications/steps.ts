import { attachScreenshot } from '../../src/allure/evidence';
import { CommentData } from '../../src/data/factories';
import { TeamMember } from '../../src/data/team';
import { expect, TeamActor, test, TestItem } from '../../src/fixtures/test';

/**
 * Kroki testów powiadomień – warstwa TESTÓW (tu są asercje), wspólna dla specyfikacji R1–R3.
 * Page Objecty dostarczają tylko akcje i lokatory.
 */

/**
 * Członek zespołu dodaje komentarz w czacie zespołu.
 * Asercje warunków wstępnych odróżniają "komentarz się nie zapisał" od "powiadomienie nie przyszło".
 * Zwraca moment wysłania – od niego liczone jest okno na dostarczenie powiadomień.
 */
export async function postTeamComment(
  author: TeamActor,
  {
    listId,
    item,
    comment,
    mentions = [],
  }: { listId: string; item: TestItem; comment: CommentData; mentions?: readonly TeamMember[] },
): Promise<number> {
  const mentionInfo = mentions.length ? ` z oznaczeniem ${mentions.map((m) => `@${m.name}`).join(', ')}` : '';
  return test.step(`${author.member.name} komentuje produkt „${item.name}”${mentionInfo}`, async () => {
    await author.list.goto(listId);
    const modal = await author.list.openComments(item.id);
    await expect(modal.productName, 'modal komentarzy dotyczy wybranego produktu').toHaveText(item.name);

    await modal.sendTeamComment(comment.text, { mentions: mentions.map((m) => m.appName) });
    const sentAt = Date.now();

    const posted = modal.comment(comment.marker);
    await expect(posted, 'komentarz jest widoczny w czacie zespołu').toBeVisible();
    await expect(modal.form.editor, 'edytor jest wyczyszczony po wysłaniu').toHaveText('');
    for (const mentioned of mentions) {
      await expect(posted, `komentarz zawiera oznaczenie @${mentioned.appName}`).toContainText(mentioned.appName);
    }
    await attachScreenshot('Komentarz w czacie zespołu', posted);
    return sentAt;
  });
}

/**
 * Odbiorca dostaje DOKŁADNIE jedno powiadomienie o komentarzu (P-08: bez duplikatów),
 * a jego treść zawiera oczekiwane informacje (P-10), np. { produkt: "Narożnik…", autor: "Anna Nowak" }.
 * Treść sprawdzamy asercjami miękkimi: raport pokazuje wszystkie rozbieżności naraz, a test i tak kończy się błędem.
 */
export async function expectNotified(
  recipient: TeamActor,
  { comment, sentAt, content }: { comment: CommentData; sentAt: number; content: Readonly<Record<string, string>> },
): Promise<void> {
  await test.step(`${recipient.member.name} dostaje dokładnie jedno powiadomienie`, async () => {
    await expect(recipient.notifications, `${recipient.member.name}: powiadomienie o komentarzu`).toHaveNotification(
      comment.marker,
      { since: sentAt },
    );

    const entry = recipient.notifications.entriesWith(comment.marker);
    for (const [what, text] of Object.entries(content)) {
      await expect.soft(entry, `P-10: powiadomienie wskazuje: ${what}`).toContainText(text);
    }
    await attachScreenshot(`Powiadomienie – ${recipient.member.name}`, entry);
  });
}

/** Osoba NIE dostaje powiadomienia przez całe okno liczone od wysłania komentarza. */
export async function expectNotNotified(
  person: TeamActor,
  { comment, sentAt, reason }: { comment: CommentData; sentAt: number; reason: string },
): Promise<void> {
  await test.step(`${person.member.name} nie dostaje powiadomienia (${reason})`, async () => {
    await expect(person.notifications, `${person.member.name}: brak powiadomienia`).not.toHaveNotification(
      comment.marker,
      { since: sentAt },
    );
  });
}
