import { BrowserContextOptions, Page, TestInfo } from '@playwright/test';

/**
 * Wideo dla kontekstów tworzonych w fixture'ach przez `browser.newContext()`.
 * Playwright nagrywa automatycznie (`use.video`) tylko swój wbudowany kontekst, więc tu odtwarzamy to samo
 * zachowanie: ten sam tryb (`on` / `retain-on-failure` / `off`), jedno nagranie na konto, podpisane w raporcie.
 */
type VideoMode = 'off' | 'on' | 'retain-on-failure' | 'on-first-retry';

function videoMode(testInfo: TestInfo): VideoMode {
  const video = testInfo.project.use.video as VideoMode | { mode: VideoMode } | undefined;
  return (typeof video === 'object' ? video.mode : video) ?? 'off';
}

/** Opcje kontekstu z nagrywaniem, jeśli tryb wideo je przewiduje. */
export function videoOptions(testInfo: TestInfo): Pick<BrowserContextOptions, 'recordVideo'> {
  const mode = videoMode(testInfo);
  const record = mode === 'on' || mode === 'retain-on-failure' || (mode === 'on-first-retry' && testInfo.retry === 1);
  return record ? { recordVideo: { dir: testInfo.outputPath('videos'), size: { width: 1280, height: 720 } } } : {};
}

/** Po zamknięciu kontekstu: dołącza nagranie (tryb `on`) albo tylko przy błędzie (`retain-on-failure`). */
export async function attachVideo(testInfo: TestInfo, name: string, page: Page): Promise<void> {
  const video = page.video();
  if (!video) return;
  const failed = testInfo.status !== testInfo.expectedStatus || testInfo.errors.length > 0;
  if (videoMode(testInfo) === 'retain-on-failure' && !failed) {
    await video.delete().catch(() => undefined);
    return;
  }
  const path = await video.path().catch(() => undefined);
  if (path) await testInfo.attach(`Wideo – ${name}`, { path, contentType: 'video/webm' });
}
