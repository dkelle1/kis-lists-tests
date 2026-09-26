import { faker } from '@faker-js/faker';
import { env } from '../config/env';

let seeded = false;

function ensureSeed(): void {
  if (seeded) return;
  const seed = env().FAKER_SEED;
  if (seed !== undefined) faker.seed(seed);
  seeded = true;
}

export interface CommentData {
  /** Unikalny znacznik – po nim test znajduje "swój" komentarz i "swoje" powiadomienie. */
  marker: string;
  /** Pełna treść: znacznik + realistyczny tekst (faker – odpowiednik Bogus z .NET). */
  text: string;
}

/**
 * Komentarz z unikalnym znacznikiem, np. "[e2e P-03 k3j9x0qa] Ut enim ad minima…".
 * Znacznik pozwala odróżnić powiadomienia z bieżącego przebiegu od wcześniejszych
 * i wykryć duplikaty (to samo powiadomienie dwa razy).
 *
 * `body` pozwala podmienić domyślny tekst faker – np. na ładunek XSS (N-09) albo bardzo długą treść (N-12);
 * znacznik zawsze zostaje na początku, więc test i tak znajdzie "swój" wpis.
 */
export function buildComment(scenarioId: string, body?: string): CommentData {
  ensureSeed();
  const marker = `[e2e ${scenarioId} ${faker.string.alphanumeric({ length: 8, casing: 'lower' })}]`;
  return { marker, text: `${marker} ${body ?? faker.lorem.sentence({ min: 4, max: 10 })}` };
}
