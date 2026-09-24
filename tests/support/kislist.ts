import { Browser, BrowserContext, Page, expect } from '@playwright/test';
import { TeamMember } from './users';

/**
 * Wszystkie lokatory aplikacji KIS List w jednym miejscu.
 *
 * UWAGA: lokatory oparte są na widocznych etykietach (role/tekst), a nie na strukturze DOM.
 * Jeżeli interfejs używa innych etykiet, wystarczy poprawić je tutaj – same testy się nie zmieniają.
 */
export const ui = {
  login: {
    email: (p: Page) => p.getByLabel(/e-?mail/i),
    password: (p: Page) => p.getByLabel(/hasło|password/i),
    submit: (p: Page) => p.getByRole('button', { name: /zaloguj|log in|sign in/i }),
  },
  notifications: {
    bell: (p: Page) => p.getByRole('button', { name: /powiadomienia|notifications/i }),
    panel: (p: Page) => p.getByRole('dialog').or(p.locator('[class*="notification" i]')).first(),
  },
  list: {
    open: (p: Page, listName: string) => p.getByRole('link', { name: listName }).first(),
    item: (p: Page, itemName?: string) =>
      itemName ? p.getByText(itemName, { exact: true }).first() : p.locator('[class*="item" i]').first(),
  },
  comments: {
    openThread: (p: Page) => p.getByRole('button', { name: /komentarz|comment/i }).first(),
    input: (p: Page) => p.getByRole('textbox', { name: /komentarz|comment/i }).or(p.getByPlaceholder(/komentarz|comment/i)).first(),
    send: (p: Page) => p.getByRole('button', { name: /wyślij|dodaj|send|add/i }).last(),
    mentionOption: (p: Page, name: string) => p.getByRole('option', { name: new RegExp(name, 'i') }).or(p.getByRole('listitem').filter({ hasText: name })).first(),
  },
  client: {
    nameInput: (p: Page) => p.getByLabel(/imię|name/i).or(p.getByPlaceholder(/imię|name/i)).first(),
  },
};

/** Loguje członka zespołu w osobnym kontekście przeglądarki (osobne cookies = osobny użytkownik). */
export async function loginAs(browser: Browser, user: TeamMember): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/login');
  await ui.login.email(page).fill(user.email);
  await ui.login.password(page).fill(user.password);
  await ui.login.submit(page).click();
  await expect(page).not.toHaveURL(/login/);
  return { context, page };
}

export async function openList(page: Page, listName: string): Promise<void> {
  await page.goto('/');
  await ui.list.open(page, listName).click();
}

/** Dodaje komentarz w otwartym wątku; opcjonalnie oznacza osoby przez "@". */
export async function addComment(page: Page, text: string, mentions: string[] = []): Promise<void> {
  const input = ui.comments.input(page);
  if (!(await input.isVisible())) {
    await ui.comments.openThread(page).click();
  }
  await input.click();
  for (const name of mentions) {
    await input.pressSequentially(`@${name.slice(0, 3)}`);
    await ui.comments.mentionOption(page, name).click();
    await input.pressSequentially(' ');
  }
  await input.pressSequentially(text);
  await ui.comments.send(page).click();
  await expect(page.getByText(text).first()).toBeVisible();
}

/** Komentarz członka zespołu na elemencie listy. */
export async function teamMemberCommentsItem(page: Page, listName: string, text: string, mentions: string[] = []): Promise<void> {
  await openList(page, listName);
  await ui.list.item(page).click();
  await addComment(page, text, mentions);
}

/** Komentarz klienta (niezalogowanego) pod linkiem udostępnienia. */
export async function clientComments(browser: Browser, shareUrl: string, clientName: string, text: string): Promise<void> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(shareUrl);
  await ui.list.item(page).click();
  const input = ui.comments.input(page);
  if (!(await input.isVisible())) {
    await ui.comments.openThread(page).click();
  }
  const nameInput = ui.client.nameInput(page);
  if (await nameInput.isVisible()) {
    await nameInput.fill(clientName);
  }
  await addComment(page, text);
  await context.close();
}

/** Otwiera centrum powiadomień i zwraca lokator wpisu dotyczącego danego komentarza. */
export async function notificationFor(page: Page, commentText: string) {
  await page.goto('/');
  await ui.notifications.bell(page).click();
  return ui.notifications.panel(page).getByText(commentText, { exact: false });
}

/**
 * Powiadomienia mogą być tworzone asynchronicznie – odświeżamy centrum powiadomień do skutku
 * (pozytywne) albo przez pełne okno czasowe (negatywne), zanim uznamy brak powiadomienia.
 */
export async function expectNotification(page: Page, commentText: string, shouldExist: boolean, windowMs = 20_000): Promise<void> {
  if (shouldExist) {
    await expect(async () => {
      const entry = await notificationFor(page, commentText);
      await expect(entry.first()).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: windowMs });
  } else {
    await page.waitForTimeout(windowMs);
    const entry = await notificationFor(page, commentText);
    await expect(entry).toHaveCount(0);
  }
}
