// Pomocnicze funkcje do rozpoznania żywej aplikacji (skrypty .local/explore/*.mjs).
// Skopiuj do .local/explore/lib.mjs (katalog .local/ jest w .gitignore). Dane logowania tylko z .env.
import 'dotenv/config';
import { chromium } from '@playwright/test';

/** Chromium dla środowiska Claude w chmurze: proxy + certyfikat proxy. Lokalnie wystarczy chromium.launch(). */
export async function launch() {
  return chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    proxy: { server: process.env.HTTPS_PROXY },
    args: ['--ignore-certificate-errors-spki-list=KnP1OnzHv/y42eRQmbGwoYTHcSJF448m6CU5mdngwKk='],
  });
}

/** Kontekst zalogowanego konta z sesji zapisanej przez projekt setup (.auth/<konto>.json). */
export function contextFor(browser, key) {
  return browser.newContext({
    locale: 'pl-PL',
    viewport: { width: 1600, height: 900 },
    ...(key ? { storageState: `.auth/${key}.json` } : {}),
  });
}

async function gmailToken() {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    }),
  });
  return (await response.json()).access_token;
}

/** Najnowszy e-mail do `email` otrzymany po `since` (ms): { headers, body } – body to złączone części tekst/HTML. */
export async function gmail(email, since, timeout = 90_000) {
  const headers = { Authorization: `Bearer ${await gmailToken()}` };
  const api = 'https://gmail.googleapis.com/gmail/v1/users/me';
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const q = `to:${email} after:${Math.floor(since / 1000) - 5}`;
    const list = await (await fetch(`${api}/messages?q=${encodeURIComponent(q)}`, { headers })).json();
    for (const { id } of list.messages ?? []) {
      const m = await (await fetch(`${api}/messages/${id}?format=full`, { headers })).json();
      if (Number(m.internalDate) < since - 5000) continue;
      const hdr = Object.fromEntries(m.payload.headers.map((h) => [h.name.toLowerCase(), h.value]));
      const parts = [];
      const walk = (p) => (parts.push(p), (p.parts ?? []).forEach(walk));
      walk(m.payload);
      const body = parts
        .filter((p) => p.body?.data)
        .map((p) => Buffer.from(p.body.data, 'base64url').toString())
        .join('\n');
      return { headers: hdr, body };
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error(`Brak e-maila do ${email}`);
}

/** Wypisuje wpisy centrum powiadomień konta (strona /inbox). */
export async function dumpNotifications(browser, key) {
  const context = await contextFor(browser, key);
  const page = await context.newPage();
  await page.goto('https://kislist.com/inbox');
  await page.locator('.notification[data-key]').first().or(page.getByText('Wszystko przeczytane')).waitFor();
  const rows = await page
    .locator('.notification[data-key]')
    .evaluateAll((els) =>
      els.map((e) =>
        [
          e.querySelector('.notification-context')?.innerText.trim(),
          e.querySelector('.notification-details')?.innerText.trim().replace(/\n/g, ' '),
          `count=${e.querySelector('.notification-count')?.innerText.trim() || '-'}`,
          e.querySelector('.notification-date')?.innerText.trim(),
        ].join(' | '),
      ),
    );
  await context.close();
  return rows;
}
