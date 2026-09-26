/** Wiadomość e-mail w postaci potrzebnej testom – niezależnie od dostawcy skrzynki. */
export interface MailMessage {
  subject: string;
  receivedAt: Date;
  /** Treść tekstowa (text/plain albo tekst wyciągnięty z HTML). */
  text: string;
  links: string[];
}

/** Skrzynka, z której testy czytają e-maile wysłane przez KIS List. */
export interface Mailbox {
  readonly name: string;
  /** Czy skrzynka odbiera pocztę kierowaną na ten adres. */
  owns(email: string): Promise<boolean>;
  /** Najnowsza wiadomość do `email` otrzymana po `since`; czeka do `timeout` ms. */
  waitForMessage(email: string, since: Date, timeout: number): Promise<MailMessage>;
}
