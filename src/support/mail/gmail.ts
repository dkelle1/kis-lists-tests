import { env } from '../../config/env';
import { Mailbox, MailMessage } from './types';

/**
 * Skrzynka Gmail czytana przez Gmail API (HTTPS, tylko odczyt – zakres gmail.readonly).
 *
 * Wszystkie konta testowe mogą korzystać z jednej skrzynki dzięki adresom „+”
 * (np. jan.kowalski+anna@gmail.com trafia do jan.kowalski@gmail.com), więc wiadomości
 * rozróżniamy po adresacie w nagłówkach To / Delivered-To, a nie tylko po wyszukiwarce Gmaila.
 * Token odświeżania uzyskuje się raz skryptem `npm run gmail:token`.
 */
const API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const POLL_MS = 3_000;
/** Tolerancja różnicy zegarów między maszyną testową a Gmailem. */
const CLOCK_SKEW_MS = 5_000;

interface GmailPart {
  mimeType?: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string };
  parts?: GmailPart[];
}

interface GmailMessage {
  id: string;
  internalDate: string;
  payload: GmailPart;
}

/** Adres Gmail bez kropek, wielkości liter i części „+tag” – tak Gmail dostarcza pocztę. */
function canonical(email: string): string {
  const [local = '', domain = ''] = email.toLowerCase().split('@');
  const normalizedDomain = domain === 'googlemail.com' ? 'gmail.com' : domain;
  return `${local.split('+')[0]?.replaceAll('.', '')}@${normalizedDomain}`;
}

function decode(data: string | undefined): string {
  return data ? Buffer.from(data, 'base64url').toString('utf8') : '';
}

function flatten(part: GmailPart): GmailPart[] {
  return [part, ...(part.parts ?? []).flatMap(flatten)];
}

function htmlToText(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
}

export class GmailMailbox implements Mailbox {
  readonly name = 'Gmail';
  private accessToken?: { value: string; expiresAt: number };
  private address?: string;

  static fromEnv(): GmailMailbox | undefined {
    const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = env();
    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) return undefined;
    return new GmailMailbox(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN);
  }

  private constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly refreshToken: string,
  ) {}

  async owns(email: string): Promise<boolean> {
    this.address ??= (await this.api<{ emailAddress: string }>('/profile')).emailAddress;
    return canonical(email) === canonical(this.address);
  }

  async waitForMessage(email: string, since: Date, timeout: number): Promise<MailMessage> {
    const deadline = Date.now() + timeout;
    const query = `to:${email} after:${Math.floor((since.getTime() - CLOCK_SKEW_MS) / 1000)}`;
    for (;;) {
      const found = await this.newestTo(email, since, query);
      if (found) return found;
      if (Date.now() > deadline) throw new Error(`${this.name}: brak e-maila do ${email} po ${since.toISOString()}`);
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    }
  }

  private async newestTo(email: string, since: Date, query: string): Promise<MailMessage | undefined> {
    const list = await this.api<{ messages?: { id: string }[] }>(
      `/messages?q=${encodeURIComponent(query)}&maxResults=20`,
    );
    const messages = await Promise.all(
      (list.messages ?? []).map(({ id }) => this.api<GmailMessage>(`/messages/${id}?format=full`)),
    );
    const recipient = email.toLowerCase();
    return messages
      .filter((message) => Number(message.internalDate) >= since.getTime() - CLOCK_SKEW_MS)
      .filter((message) =>
        (message.payload.headers ?? []).some(
          (h) => /^(to|delivered-to)$/i.test(h.name) && h.value.toLowerCase().includes(recipient),
        ),
      )
      .sort((a, b) => Number(b.internalDate) - Number(a.internalDate))
      .map((message) => this.toMailMessage(message))[0];
  }

  private toMailMessage(message: GmailMessage): MailMessage {
    const parts = flatten(message.payload);
    const html = parts
      .filter((p) => p.mimeType === 'text/html')
      .map((p) => decode(p.body?.data))
      .join('\n');
    const plain = parts
      .filter((p) => p.mimeType === 'text/plain')
      .map((p) => decode(p.body?.data))
      .join('\n');
    return {
      subject: message.payload.headers?.find((h) => /^subject$/i.test(h.name))?.value ?? '',
      receivedAt: new Date(Number(message.internalDate)),
      text: plain || htmlToText(html),
      links: [...html.matchAll(/href="([^"]+)"/g)].map((m) => (m[1] ?? '').replaceAll('&amp;', '&')),
    };
  }

  private async api<T>(path: string): Promise<T> {
    const response = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${await this.token()}` } });
    if (!response.ok) throw new Error(`Gmail API ${path}: HTTP ${response.status} ${await response.text()}`);
    return (await response.json()) as T;
  }

  private async token(): Promise<string> {
    if (this.accessToken && this.accessToken.expiresAt > Date.now()) return this.accessToken.value;
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
      }),
    });
    if (!response.ok) {
      throw new Error(
        `Gmail: odświeżenie tokenu nie powiodło się (HTTP ${response.status}) – uruchom npm run gmail:token`,
      );
    }
    const { access_token, expires_in } = (await response.json()) as { access_token: string; expires_in: number };
    this.accessToken = { value: access_token, expiresAt: Date.now() + (expires_in - 60) * 1000 };
    return access_token;
  }
}
