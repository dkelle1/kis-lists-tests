import MailosaurClient from 'mailosaur';
import { env } from '../config/env';

/**
 * Skrzynki testowe w Mailosaur – do odczytu kodów 2FA i linków z e-maili KIS List.
 *
 * KIS List to zewnętrzny SaaS (nie kontrolujemy SMTP, więc Mailpit odpada), a 2FA to kod z e-maila,
 * nie TOTP. Konta testowe mają adresy w domenie Mailosaur (np. anna@<serverId>.mailosaur.net),
 * dzięki czemu kod odczytujemy przez API zamiast z Gmaila.
 */
const DEFAULT_WAIT_MS = 60_000;

function mailosaur(): { client: MailosaurClient; serverId: string } {
  const { MAILOSAUR_API_KEY, MAILOSAUR_SERVER_ID } = env();
  if (!MAILOSAUR_API_KEY || !MAILOSAUR_SERVER_ID) {
    throw new Error('Brak MAILOSAUR_API_KEY / MAILOSAUR_SERVER_ID – patrz .env.example');
  }
  return { client: new MailosaurClient(MAILOSAUR_API_KEY), serverId: MAILOSAUR_SERVER_ID };
}

/** Czy adres należy do skrzynki Mailosaur skonfigurowanej w projekcie. */
export function isTestMailbox(email: string): boolean {
  const { MAILOSAUR_API_KEY, MAILOSAUR_SERVER_ID } = env();
  return (
    !!MAILOSAUR_API_KEY &&
    !!MAILOSAUR_SERVER_ID &&
    email.toLowerCase().endsWith(`@${MAILOSAUR_SERVER_ID}.mailosaur.net`)
  );
}

/**
 * Czeka na e-mail do `email` otrzymany po `since` i zwraca 4-cyfrowy kod logowania.
 * `since` zapisz PRZED kliknięciem „Zaloguj się” – inaczej szybki mail może przyjść wcześniej niż znacznik czasu,
 * a filtr po adresacie + czasie nie złapie kodu z poprzedniego przebiegu.
 */
export async function waitForLoginCode(email: string, since: Date, timeout = DEFAULT_WAIT_MS): Promise<string> {
  const { client, serverId } = mailosaur();
  const message = await client.messages.get(serverId, { sentTo: email }, { timeout, receivedAfter: since });
  const text = message.text?.body ?? '';
  const code =
    message.text?.codes?.map((c) => c.value).find((value) => /^\d{4}$/.test(value ?? '')) ??
    text.match(/kod\D{0,60}\b(\d{4})\b/i)?.[1];
  if (!code) throw new Error(`Brak 4-cyfrowego kodu w e-mailu do ${email} (temat: "${message.subject}")`);
  return code;
}

/** Czeka na e-mail do `email` po `since` i zwraca pierwszy link pasujący do wzorca (np. zaproszenie do zespołu). */
export async function waitForLink(
  email: string,
  since: Date,
  pattern: RegExp,
  timeout = DEFAULT_WAIT_MS,
): Promise<string> {
  const { client, serverId } = mailosaur();
  const message = await client.messages.get(serverId, { sentTo: email }, { timeout, receivedAfter: since });
  const href = [...(message.html?.links ?? []), ...(message.text?.links ?? [])]
    .map((link) => link.href ?? '')
    .find((candidate) => pattern.test(candidate));
  if (!href) throw new Error(`Brak linku ${pattern} w e-mailu do ${email} (temat: "${message.subject}")`);
  return href;
}
