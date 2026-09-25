import MailosaurClient from 'mailosaur';
import { env } from '../../config/env';
import { Mailbox, MailMessage } from './types';

/** Skrzynki Mailosaur (<dowolna-nazwa>@<serverId>.mailosaur.net) – bez własnej skrzynki pocztowej. */
export class MailosaurMailbox implements Mailbox {
  readonly name = 'Mailosaur';
  private readonly client: MailosaurClient;

  static fromEnv(): MailosaurMailbox | undefined {
    const { MAILOSAUR_API_KEY, MAILOSAUR_SERVER_ID } = env();
    if (!MAILOSAUR_API_KEY || !MAILOSAUR_SERVER_ID) return undefined;
    return new MailosaurMailbox(MAILOSAUR_API_KEY, MAILOSAUR_SERVER_ID);
  }

  private constructor(
    apiKey: string,
    private readonly serverId: string,
  ) {
    this.client = new MailosaurClient(apiKey);
  }

  async owns(email: string): Promise<boolean> {
    return email.toLowerCase().endsWith(`@${this.serverId.toLowerCase()}.mailosaur.net`);
  }

  async waitForMessage(email: string, since: Date, timeout: number): Promise<MailMessage> {
    const message = await this.client.messages.get(this.serverId, { sentTo: email }, { timeout, receivedAfter: since });
    return {
      subject: message.subject ?? '',
      receivedAt: message.received ? new Date(message.received) : since,
      text: message.text?.body ?? '',
      links: [...(message.html?.links ?? []), ...(message.text?.links ?? [])].map((link) => link.href ?? ''),
    };
  }
}
