// Turning Postgres error codes into something the API layer can map to a status
// code. The DB is the last line of defence for several rules (watched_on can't
// precede the event, one log per event per day); when it fires we want a 409 or
// 422, never a 500.

export const PG_ERROR_CODES = {
  uniqueViolation: '23505',
  foreignKeyViolation: '23503',
  checkViolation: '23514',
  notNullViolation: '23502',
  invalidTextRepresentation: '22P02',
} as const;

export interface PgError extends Error {
  code: string;
  constraint?: string;
  detail?: string;
  table?: string;
}

export function isPgError(error: unknown): error is PgError {
  return (
    error instanceof Error &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

export function hasPgCode(
  error: unknown,
  code: (typeof PG_ERROR_CODES)[keyof typeof PG_ERROR_CODES],
): error is PgError {
  return isPgError(error) && error.code === code;
}
