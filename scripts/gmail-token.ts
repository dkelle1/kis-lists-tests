/**
 * Jednorazowe uzyskanie tokenu odświeżania Gmail API (zakres tylko do odczytu).
 *
 *   GMAIL_CLIENT_ID=… GMAIL_CLIENT_SECRET=… npm run gmail:token
 *
 * Otwórz wypisany link, zaloguj się na skrzynkę testową i zatwierdź dostęp – skrypt odbierze kod
 * na http://127.0.0.1:<port> i wypisze GMAIL_REFRESH_TOKEN do wklejenia w .env / sekrety CI.
 */
import 'dotenv/config';
import http from 'node:http';
import type { AddressInfo } from 'node:net';

const SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;
if (!clientId || !clientSecret)
  throw new Error('Ustaw GMAIL_CLIENT_ID i GMAIL_CLIENT_SECRET (klient OAuth typu „Desktop app”)');

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', redirectUri());
  const code = url.searchParams.get('code');
  if (!code) {
    response.writeHead(400).end('Brak parametru code');
    return;
  }
  const token = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri(),
    }),
  });
  const body = (await token.json()) as { refresh_token?: string; error_description?: string };
  response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Gotowe – wróć do terminala.');
  console.log(body.refresh_token ? `\nGMAIL_REFRESH_TOKEN=${body.refresh_token}\n` : `Błąd: ${body.error_description}`);
  server.close();
});

function redirectUri(): string {
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

server.listen(0, '127.0.0.1', () => {
  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  auth.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
  }).toString();
  console.log(`Otwórz w przeglądarce:\n${auth.toString()}`);
});
