import { env } from '../config/env';

/**
 * Kody 2FA z Gmaila przez Gmail API (HTTPS, tylko odczyt – zakres gmail.readonly).
 *
 * Wszystkie konta testowe korzystają z jednej skrzynki dzięki adresom „+” (login+piotr@gmail.com trafia do
 * login@gmail.com), więc wiadomość wybieramy po adresacie (nagłówki To / Delivered-To) i czasie otrzymania.
 * Znacznik `since` zapisuj PRZED kliknięciem „Zaloguj” – inaczej można trafić na kod z poprzedniego przebiegu.
 * Token odświeżania uzyskuje się raz skryptem `npm run gmail:token`.
 */
const API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const POLL_MS = 3_000;
const WAIT_MS = 60_000;
/** Tolerancja różnicy zegarów między maszyną testową a Gmailem. */
const CLOCK_SKEW_MS = 5_000;

interface GmailPart {
  mimeType?: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string };
  parts?: GmailPart[];
}

interface GmailMessage {
  internalDate: string;
  payload: GmailPart;
}

let accessToken: { value: string; expiresAt: number } | undefined;
let inboxAddress: string | undefined;

function credentials() {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = env();
  return GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN
    ? { client_id: GMAIL_CLIENT_ID, client_secret: GMAIL_CLIENT_SECRET, refresh_token: GMAIL_REFRESH_TOKEN }
    : undefined;
}

async function token(): Promise<string> {
  if (accessToken && accessToken.expiresAt > Date.now()) return accessToken.value;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({ grant_type: 'refresh_token', ...credentials() }),
  });
  if (!response.ok) {
    throw new Error(
      `Gmail: odświeżenie tokenu nie powiodło się (HTTP ${response.status}) – uruchom npm run gmail:token`,
    );
  }
  const { access_token, expires_in } = (await response.json()) as { access_token: string; expires_in: number };
  accessToken = { value: access_token, expiresAt: Date.now() + (expires_in - 60) * 1000 };
  return access_token;
}

async function api<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${await token()}` } });
  if (!response.ok) throw new Error(`Gmail API ${path}: HTTP ${response.status} ${await response.text()}`);
  return (await response.json()) as T;
}

/** Adres Gmail bez kropek, wielkości liter i części „+tag” – tak Gmail dostarcza pocztę. */
function canonical(email: string): string {
  const [local = '', domain = ''] = email.toLowerCase().split('@');
  return `${local.split('+')[0]?.replaceAll('.', '')}@${domain === 'googlemail.com' ? 'gmail.com' : domain}`;
}

/** Czy e-maile do tego adresu trafiają do skonfigurowanej skrzynki Gmail (także adresy „+”). */
export async function readsInboxOf(email: string): Promise<boolean> {
  if (!credentials()) return false;
  inboxAddress ??= (await api<{ emailAddress: string }>('/profile')).emailAddress;
  return canonical(email) === canonical(inboxAddress);
}

function textOf(message: GmailMessage): string {
  const parts: GmailPart[] = [];
  const walk = (part: GmailPart): void => {
    parts.push(part);
    part.parts?.forEach(walk);
  };
  walk(message.payload);
  const decode = (part: GmailPart) => Buffer.from(part.body?.data ?? '', 'base64url').toString('utf8');
  const plain = parts
    .filter((p) => p.mimeType === 'text/plain')
    .map(decode)
    .join('\n');
  const html = parts
    .filter((p) => p.mimeType === 'text/html')
    .map(decode)
    .join('\n');
  return (
    plain ||
    html
      .replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
  );
}

async function newestMessageTo(email: string, since: Date): Promise<GmailMessage | undefined> {
  const after = Math.floor((since.getTime() - CLOCK_SKEW_MS) / 1000);
  const list = await api<{ messages?: { id: string }[] }>(
    `/messages?q=${encodeURIComponent(`to:${email} after:${after}`)}&maxResults=20`,
  );
  const messages = await Promise.all((list.messages ?? []).map(({ id }) => api<GmailMessage>(`/messages/${id}`)));
  return messages
    .filter((m) => Number(m.internalDate) >= since.getTime() - CLOCK_SKEW_MS)
    .filter((m) =>
      (m.payload.headers ?? []).some(
        (h) => /^(to|delivered-to)$/i.test(h.name) && h.value.toLowerCase().includes(email.toLowerCase()),
      ),
    )
    .sort((a, b) => Number(b.internalDate) - Number(a.internalDate))[0];
}

/** 4-cyfrowy kod logowania z najnowszego e-maila do `email` otrzymanego po `since`. */
export async function waitForLoginCode(email: string, since: Date): Promise<string> {
  const deadline = Date.now() + WAIT_MS;
  for (;;) {
    const message = await newestMessageTo(email, since);
    if (message) {
      const text = textOf(message);
      const code = text.match(/kod\D{0,80}?\b(\d{4})\b/i)?.[1] ?? text.match(/\b\d{4}\b/)?.[0];
      if (!code) throw new Error(`Gmail: brak 4-cyfrowego kodu w e-mailu do ${email}`);
      return code;
    }
    if (Date.now() > deadline) throw new Error(`Gmail: brak e-maila z kodem do ${email} po ${since.toISOString()}`);
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
}
