import type { TestDetailsAnnotation } from '@playwright/test';

export type Requirement = 'R1' | 'R2' | 'R3';
export type Severity = 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';

export const TEST_PLAN_URL = 'https://github.com/dkelle1/kis-lists-tests/blob/main/README.md#3-plan-testów';
export const BUGS_URL = 'https://github.com/dkelle1/kis-lists-tests/blob/main/README.md#zgłoszone-błędy';

const FEATURES: Record<Requirement, string> = {
  R1: 'R1: klient komentuje propozycję',
  R2: 'R2: klient komentuje udostępnioną listę',
  R3: 'R3: członek zespołu komentuje element listy',
};

/**
 * Metadane Allure jako adnotacje Playwrighta (allure-playwright mapuje `allure.label.*` na etykiety,
 * a `tms` na link do planu testów). Są zapisane przy deklaracji testu, więc trafiają do raportu
 * również wtedy, gdy test upadnie jeszcze w fixture, zanim wykona się jakikolwiek kod testu.
 */
export function allureMeta(options: {
  requirement: Requirement;
  story: string;
  scenarios: readonly string[];
  severity?: Severity;
  /** Znany błąd, który test odtwarza (link „issue” w Allure) – np. 'BUG-01'. */
  bug?: string;
}): TestDetailsAnnotation[] {
  return [
    { type: 'allure.label.epic', description: 'Powiadomienia o komentarzach' },
    { type: 'allure.label.feature', description: FEATURES[options.requirement] },
    { type: 'allure.label.story', description: options.story },
    { type: 'allure.label.severity', description: options.severity ?? 'critical' },
    ...options.scenarios.map((id) => ({ type: 'tms', description: id })),
    ...(options.bug ? [{ type: 'issue', description: options.bug }] : []),
  ];
}
