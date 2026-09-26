import 'dotenv/config';
import { z } from 'zod';

/**
 * Konfiguracja walidowana schematem – brakujące lub błędne zmienne kończą test czytelnym błędem
 * zamiast "undefined" w polu logowania. Parsowanie jest leniwe, więc `playwright test --list`,
 * lint i typecheck działają bez pliku .env.
 */
const credentials = { email: z.email(), password: z.string().min(1) };

const schema = z.object({
  BASE_URL: z.url().default('https://kislist.com'),
  /** Id listy testowej z adresu /lists/<id>/edit */
  KIS_LIST_ID: z.string().min(1),
  /** Id produktu, pod którym dodajemy komentarze (atrybut id="item-<id>"); domyślnie pierwszy produkt listy. */
  KIS_ITEM_ID: z.string().min(1).optional(),
  ADMIN_EMAIL: credentials.email,
  ADMIN_PASSWORD: credentials.password,
  PIOTR_EMAIL: credentials.email,
  PIOTR_PASSWORD: credentials.password,
  MARCIN_EMAIL: credentials.email,
  MARCIN_PASSWORD: credentials.password,
  GUEST_EMAIL: credentials.email,
  GUEST_PASSWORD: credentials.password,
  /** Nazwy kont widoczne w aplikacji (autor w powiadomieniu, wybór osoby po "@"); domyślnie – patrz src/data/team.ts. */
  ADMIN_DISPLAY_NAME: z.string().min(1).optional(),
  PIOTR_DISPLAY_NAME: z.string().min(1).optional(),
  MARCIN_DISPLAY_NAME: z.string().min(1).optional(),
  GUEST_DISPLAY_NAME: z.string().min(1).optional(),
  /**
   * Wartość cookie `devid` („zaufane urządzenie”, ważne rok) – z nim logowanie nie wymaga kodu 2FA.
   * Dla kont, których skrzynki testy nie czytają (np. prywatny adres administratora).
   */
  ADMIN_DEVICE_ID: z.string().min(1).optional(),
  PIOTR_DEVICE_ID: z.string().min(1).optional(),
  MARCIN_DEVICE_ID: z.string().min(1).optional(),
  GUEST_DEVICE_ID: z.string().min(1).optional(),
  /** Gmail API (tylko odczyt) – kody 2FA i zaproszenia z jednej skrzynki z adresami „+” (src/support/mail/gmail.ts). */
  GMAIL_CLIENT_ID: z.string().min(1).optional(),
  GMAIL_CLIENT_SECRET: z.string().min(1).optional(),
  GMAIL_REFRESH_TOKEN: z.string().min(1).optional(),
  /** Mailosaur – alternatywne skrzynki testowe <nazwa>@<serverId>.mailosaur.net (src/support/mail/mailosaur.ts). */
  MAILOSAUR_API_KEY: z.string().min(1).optional(),
  MAILOSAUR_SERVER_ID: z.string().min(1).optional(),
  CLIENT_SHARE_URL: z.url(),
  /** Link do propozycji dla klienta (R1); bez niego P-01 jest pomijany. */
  CLIENT_PROPOSAL_URL: z.url().optional(),
  /** Okno (ms), w którym czekamy na powiadomienie – i po którym uznajemy jego brak w testach negatywnych. */
  NOTIFICATION_WINDOW_MS: z.coerce.number().int().positive().default(20_000),
  /** Seed dla faker – ten sam seed = te same dane testowe (odtwarzalność błędów). */
  FAKER_SEED: z.coerce.number().int().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (!cached) {
    // Nieustawiony sekret w GitHub Actions trafia do procesu jako pusty napis – traktujemy go jak brak zmiennej.
    const defined = Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== ''));
    const result = schema.safeParse(defined);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
      throw new Error(`Niepoprawna konfiguracja (.env / sekrety CI):\n${issues}\nPatrz .env.example.`);
    }
    cached = result.data;
  }
  return cached;
}

export const baseURL = process.env.BASE_URL ?? 'https://kislist.com';
