import { env } from '../config/env';

export const TEAM = ['piotr', 'anna', 'marcin', 'michalina'] as const;
export type TeamMemberKey = (typeof TEAM)[number];

export interface TeamMember {
  key: TeamMemberKey;
  displayName: string;
  role: string;
  email: string;
  password: string;
}

const profiles: Record<TeamMemberKey, { displayName: string; role: string }> = {
  piotr: { displayName: 'Piotr', role: 'założyciel, właściciel konta' },
  anna: { displayName: 'Anna', role: 'zarządza projektem' },
  marcin: { displayName: 'Marcin', role: 'tworzy kosztorys' },
  michalina: { displayName: 'Michalina', role: 'praca w terenie' },
};

export function member(key: TeamMemberKey): TeamMember {
  const e = env();
  const upper = key.toUpperCase() as Uppercase<TeamMemberKey>;
  return {
    key,
    ...profiles[key],
    email: e[`${upper}_EMAIL`],
    password: e[`${upper}_PASSWORD`],
  };
}

export const displayName = (key: TeamMemberKey): string => profiles[key].displayName;

export const othersThan = (author: TeamMemberKey): TeamMemberKey[] => TEAM.filter((k) => k !== author);

/** Ścieżka do zapisanej sesji (storageState) członka zespołu – tworzona w projekcie "setup". */
export const storageStatePath = (key: TeamMemberKey): string => `.auth/${key}.json`;
