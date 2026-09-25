import { env } from '../config/env';

export const TEAM = ['piotr', 'anna', 'marcin', 'michalina'] as const;
export type TeamMemberKey = (typeof TEAM)[number];

export interface TeamMember {
  key: TeamMemberKey;
  /** Osoba z opisu zadania – używana w tytułach testów i kroków. */
  name: string;
  /** Nazwa konta w KIS List – tak osoba jest pokazywana w powiadomieniach i na liście "@". */
  appName: string;
  role: string;
  email: string;
  password: string;
}

const PERSONAS: Record<TeamMemberKey, { name: string; role: string }> = {
  piotr: { name: 'Piotr', role: 'założyciel, właściciel konta' },
  anna: { name: 'Anna', role: 'zarządza projektem' },
  marcin: { name: 'Marcin', role: 'tworzy kosztorys' },
  michalina: { name: 'Michalina', role: 'praca w terenie' },
};

/** Imię osoby bez sięgania do konfiguracji – bezpieczne w tytułach testów (`playwright test --list`). */
export const personaName = (key: TeamMemberKey): string => PERSONAS[key].name;

export function member(key: TeamMemberKey): TeamMember {
  const config = env();
  const prefix = key.toUpperCase() as Uppercase<TeamMemberKey>;
  return {
    key,
    ...PERSONAS[key],
    appName: config[`${prefix}_DISPLAY_NAME`] ?? PERSONAS[key].name,
    email: config[`${prefix}_EMAIL`],
    password: config[`${prefix}_PASSWORD`],
  };
}

export const othersThan = (key: TeamMemberKey): TeamMemberKey[] => TEAM.filter((other) => other !== key);

/** Ścieżka do zapisanej sesji (storageState) członka zespołu – tworzona w projekcie "setup". */
export const storageStatePath = (key: TeamMemberKey): string => `.auth/${key}.json`;
