import type { TestCase, TestResult } from '@playwright/test/reporter';
import AllureReporter from 'allure-playwright';

/**
 * allure-playwright z jedną zmianą: trace Playwrighta NIE trafia do raportu Allure.
 * Trace (kilka–kilkanaście MB na test) jest w raporcie HTML Playwrighta (artefakt `playwright-report`);
 * raport Allure zostaje lżejszy – zrzuty z każdego kroku, wideo i treść błędów.
 */
const isTrace = (attachment: TestResult['attachments'][number]): boolean =>
  attachment.name === 'trace' || attachment.contentType === 'application/vnd.allure.playwright-trace';

export default class AllureWithoutTraceReporter extends AllureReporter {
  override async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    await super.onTestEnd(test, { ...result, attachments: result.attachments.filter((a) => !isTrace(a)) });
  }
}
