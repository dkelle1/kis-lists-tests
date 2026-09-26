import { env } from '../config/env';

/**
 * Konta powiązane z listą testową – role nadane w oknie „Zaproś do współpracy”.
 *
 *   admin    Administrator – założyciel, właściciel konta (prywatny adres; logowanie przez zapamiętane urządzenie)
 *   piotr    Współpracownik
 *   marcin   Członek zespołu
 *   guest    Gość – lista tylko do wglądu (bez komentowania)
 *
 * „Członkowie zespołu powiązani z listą” z wymagań R1–R3 to konta z prawem edycji listy: admin, piotr, marcin.
 * Gość jest powiązany z listą, ale nie należy do zespołu – służy jako kontrola negatywna (czat zespołu jest prywatny).
 */
export const ACCOUNTS = ['admin', 'piotr', 'marcin', 'guest'] as const;
export type AccountKey = (typeof ACCOUNTS)[number];

/** Członkowie zespołu listy – odbiorcy powiadomień z wymagań R1–R3. */
export const TEAM = ['admin', 'piotr', 'marcin'] as const satisfies readonly AccountKey[];
export type TeamMemberKey = (typeof TEAM)[number];

export interface Account {
  key: AccountKey;
  /** Nazwa w tytułach testów i kroków: osoba + rola. */
  name: string;
  /** Nazwa konta w KIS List – tak osoba jest pokazywana w powiadomieniach i na liście „@”. */
  appName: string;
  role: string;
  email: string;
  password: string;
  /** Cookie `devid` zaufanego urządzenia – logowanie bez kodu 2FA. */
  deviceId?: string;
}

const PERSONAS: Record<AccountKey, { name: string; role: string; appName: string }> = {
  admin: { name: 'Damian (administrator)', role: 'Administrator', appName: 'Damian Keller' },
  piotr: { name: 'Piotr (współpracownik)', role: 'Współpracownik', appName: 'Piotr' },
  marcin: { name: 'Marcin (członek zespołu)', role: 'Członek zespołu', appName: 'Marcin' },
  guest: { name: 'Klient1 (gość)', role: 'Gość', appName: 'Klient1' },
};

/** Nazwa osoby bez sięgania do konfiguracji – bezpieczna w tytułach testów (`playwright test --list`). */
export const personaName = (key: AccountKey): string => PERSONAS[key].name;

export function account(key: AccountKey): Account {
  const config = env();
  const prefix = key.toUpperCase() as Uppercase<AccountKey>;
  return {
    key,
    ...PERSONAS[key],
    appName: config[`${prefix}_DISPLAY_NAME`] ?? PERSONAS[key].appName,
    email: config[`${prefix}_EMAIL`],
    password: config[`${prefix}_PASSWORD`],
    deviceId: config[`${prefix}_DEVICE_ID`],
  };
}

export const othersThan = (key: AccountKey): TeamMemberKey[] => TEAM.filter((other) => other !== key);

/** Ścieżka do zapisanej sesji (storageState) konta – tworzona w projekcie "setup". */
export const storageStatePath = (key: AccountKey): string => `.auth/${key}.json`;
