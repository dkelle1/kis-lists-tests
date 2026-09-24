export type TeamMemberKey = 'piotr' | 'anna' | 'marcin' | 'michalina';

export interface TeamMember {
  key: TeamMemberKey;
  displayName: string;
  email: string;
  password: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Brak zmiennej środowiskowej ${name} – uzupełnij plik .env (patrz .env.example).`);
  }
  return value;
}

function member(key: TeamMemberKey, displayName: string): TeamMember {
  const prefix = key.toUpperCase();
  return {
    key,
    displayName,
    email: requireEnv(`${prefix}_EMAIL`),
    password: requireEnv(`${prefix}_PASSWORD`),
  };
}

export const team = {
  get piotr() { return member('piotr', 'Piotr'); },
  get anna() { return member('anna', 'Anna'); },
  get marcin() { return member('marcin', 'Marcin'); },
  get michalina() { return member('michalina', 'Michalina'); },
};

export const allTeamKeys: TeamMemberKey[] = ['piotr', 'anna', 'marcin', 'michalina'];

export const env = {
  get listName() { return requireEnv('KIS_LIST_NAME'); },
  get clientShareUrl() { return requireEnv('CLIENT_SHARE_URL'); },
  get clientProposalUrl() { return requireEnv('CLIENT_PROPOSAL_URL'); },
  get clientName() { return process.env.CLIENT_NAME ?? 'Klient E2E'; },
};

/** Unikalny znacznik, żeby w centrum powiadomień jednoznacznie znaleźć komentarz z danego przebiegu testu. */
export function uniqueCommentText(label: string): string {
  return `[e2e ${label}] ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
