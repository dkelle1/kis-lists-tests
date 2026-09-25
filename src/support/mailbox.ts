import { GmailMailbox } from './mail/gmail';
import { MailosaurMailbox } from './mail/mailosaur';
import { Mailbox, MailMessage } from './mail/types';

/**
 * Odczyt e-maili KIS List (kody 2FA, zaproszenia) ze skrzynki skonfigurowanej w .env:
 *   - Gmail (GMAIL_*) – jedna skrzynka dla wszystkich kont dzięki adresom „+”;
 *   - Mailosaur (MAILOSAUR_*) – skrzynki testowe <nazwa>@<serverId>.mailosaur.net.
 *
 * Znacznik `since` zapisuj PRZED akcją wysyłającą e-mail – wiadomości szukamy po adresacie i czasie,
 * więc kod z poprzedniego przebiegu nie zostanie użyty, a szybki e-mail nie zostanie pominięty.
 */
const DEFAULT_WAIT_MS = 60_000;

let mailboxes: Mailbox[] | undefined;

/** Skrzynka obsługująca adres albo undefined (wtedy kod trzeba podać ręcznie). */
export async function mailboxFor(email: string): Promise<Mailbox | undefined> {
  mailboxes ??= [GmailMailbox.fromEnv(), MailosaurMailbox.fromEnv()].filter((box) => box !== undefined);
  for (const box of mailboxes) {
    if (await box.owns(email)) return box;
  }
  return undefined;
}

async function waitForMessage(email: string, since: Date, timeout: number): Promise<MailMessage> {
  const box = await mailboxFor(email);
  if (!box) throw new Error(`Brak skrzynki dla ${email} – skonfiguruj GMAIL_* lub MAILOSAUR_* (patrz .env.example)`);
  return box.waitForMessage(email, since, timeout);
}

/** 4-cyfrowy kod logowania z e-maila do `email` otrzymanego po `since`. */
export async function waitForLoginCode(email: string, since: Date, timeout = DEFAULT_WAIT_MS): Promise<string> {
  const message = await waitForMessage(email, since, timeout);
  const code = message.text.match(/kod\D{0,80}?\b(\d{4})\b/i)?.[1] ?? message.text.match(/\b\d{4}\b/)?.[0];
  if (!code) throw new Error(`Brak 4-cyfrowego kodu w e-mailu do ${email} (temat: "${message.subject}")`);
  return code;
}

/** Pierwszy link pasujący do wzorca (np. zaproszenie do zespołu) z e-maila do `email` otrzymanego po `since`. */
export async function waitForLink(
  email: string,
  since: Date,
  pattern: RegExp,
  timeout = DEFAULT_WAIT_MS,
): Promise<string> {
  const message = await waitForMessage(email, since, timeout);
  const href = message.links.find((candidate) => pattern.test(candidate));
  if (!href) throw new Error(`Brak linku ${pattern} w e-mailu do ${email} (temat: "${message.subject}")`);
  return href;
}
