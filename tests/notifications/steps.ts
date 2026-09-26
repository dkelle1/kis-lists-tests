import { attachScreenshot } from '../../src/allure/evidence';
import { CommentData } from '../../src/data/factories';
import { Account } from '../../src/data/team';
import { Actor, expect, test, TestItem } from '../../src/fixtures/test';

/**
 * Kroki testów powiadomień – warstwa TESTÓW (tu są asercje), wspólna dla specyfikacji R1–R3.
 * Page Objecty dostarczają tylko akcje i lokatory.
 */

/** Czego oczekujemy w treści powiadomienia (P-10). */
export interface ExpectedNotification {
  /** Opis zdarzenia, np. „dodał/a komentarz” albo „oznaczył/a Ciebie w komentarzu”. */
  action: string;
  /** Nazwa autora w aplikacji; komentarz klienta z linku jest podpisany „Klient/ka”. */
  author: string;
}

export const COMMENT_ADDED = 'dodał/a komentarz';
export const MENTIONED = 'oznaczył/a Ciebie w komentarzu';

/**
 * Członek zespołu dodaje komentarz w czacie zespołu (zakładka „Prywatne”).
 * Asercje warunków wstępnych odróżniają "komentarz się nie zapisał" od "powiadomienie nie przyszło".
 * Zwraca moment wysłania – od niego liczone jest okno na dostarczenie powiadomień.
 */
export async function postTeamComment(
  author: Actor,
  {
    listId,
    item,
    comment,
    mentions = [],
  }: { listId: string; item: TestItem; comment: CommentData; mentions?: readonly Account[] },
): Promise<number> {
  const mentionInfo = mentions.length ? ` z oznaczeniem ${mentions.map((m) => `@${m.appName}`).join(', ')}` : '';
  return test.step(`${author.account.name} komentuje produkt „${item.name}”${mentionInfo}`, async () => {
    await author.list.goto(listId);
    const modal = await author.list.openComments(item.id);
    await expect(modal.productName, 'modal komentarzy dotyczy wybranego produktu').toHaveText(item.name);

    await modal.sendTeamComment(comment.text, { mentions: mentions.map((m) => m.appName) });
    const sentAt = Date.now();

    const posted = modal.comment(comment.marker);
    await expect(posted, 'komentarz jest widoczny w czacie zespołu').toBeVisible();
    await expect(modal.form.editor, 'edytor jest wyczyszczony po wysłaniu').toHaveText('');
    for (const mentioned of mentions) {
      await expect(posted, `komentarz zawiera oznaczenie @${mentioned.appName}`).toContainText(`@${mentioned.appName}`);
    }
    await attachScreenshot('Komentarz w czacie zespołu', posted);
    return sentAt;
  });
}

/**
 * Odbiorca dostaje DOKŁADNIE jedno powiadomienie o komentarzu (P-08: bez duplikatów),
 * a jego treść wskazuje autora i rodzaj zdarzenia (P-10).
 *
 * Asercje są miękkie: przy macierzy nadawca → odbiorcy raport pokazuje wynik dla KAŻDEJ osoby
 * (kto dostał, kto nie), a nie tylko pierwszą rozbieżność – test i tak kończy się błędem.
 */
export async function expectNotified(
  recipient: Actor,
  { comment, sentAt, expected }: { comment: CommentData; sentAt: number; expected: ExpectedNotification },
): Promise<void> {
  await test.step(`${recipient.account.name} dostaje dokładnie jedno powiadomienie`, async () => {
    const { notifications } = recipient;
    await expect
      .soft(notifications, `${recipient.account.name}: powiadomienie o komentarzu`)
      .toHaveNotification(comment.marker, { since: sentAt });

    const entry = notifications.entriesWith(comment.marker);
    // eslint-disable-next-line playwright/no-conditional-in-test -- treść sprawdzamy tylko, gdy wpis istnieje
    if ((await entry.count()) !== 1) return;
    await expect.soft(notifications.author(entry), 'P-10: powiadomienie wskazuje autora').toHaveText(expected.author);
    await expect.soft(notifications.context(entry), 'P-10: rodzaj zdarzenia').toContainText(expected.action);
    await attachScreenshot(`Powiadomienie – ${recipient.account.name}`, entry);
  });
}

/** Osoba NIE dostaje powiadomienia przez całe okno liczone od wysłania komentarza. */
export async function expectNotNotified(
  person: Actor,
  { comment, sentAt, reason }: { comment: CommentData; sentAt: number; reason: string },
): Promise<void> {
  await test.step(`${person.account.name} nie dostaje powiadomienia (${reason})`, async () => {
    await expect
      .soft(person.notifications, `${person.account.name}: brak powiadomienia (${reason})`)
      .not.toHaveNotification(comment.marker, { since: sentAt });
  });
}
