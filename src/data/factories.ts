import { faker } from '@faker-js/faker';
import { env } from '../config/env';

/**
 * Fabryki danych testowych (faker – odpowiednik Bogus z .NET).
 * Każdy komentarz ma unikalny znacznik, żeby jednoznacznie znaleźć "jego" powiadomienie,
 * nawet gdy w centrum powiadomień są wpisy z wcześniejszych przebiegów.
 */
let seeded = false;

function ensureSeed(): void {
  if (seeded) return;
  const seed = env().FAKER_SEED;
  if (seed !== undefined) faker.seed(seed);
  seeded = true;
}

export interface CommentData {
  /** Unikalny znacznik wyszukiwany w powiadomieniach. */
  marker: string;
  /** Pełna treść komentarza (znacznik + realistyczny tekst). */
  text: string;
}

export function buildComment(scenario: string): CommentData {
  ensureSeed();
  const marker = `[e2e ${scenario} ${faker.string.alphanumeric({ length: 8, casing: 'lower' })}]`;
  return { marker, text: `${marker} ${faker.lorem.sentence({ min: 4, max: 10 })}` };
}

export interface ClientData {
  name: string;
  email: string;
}

export function buildClient(): ClientData {
  ensureSeed();
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName, provider: 'example.com' }).toLowerCase(),
  };
}
