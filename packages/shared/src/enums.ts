// Mirrors the CHECK constraints in db/migrations. These are hand-synced:
// adding a value here without touching the migration will fail at runtime,
// not at compile time. Keep the two in the same commit.

export const SPORT_TOPOLOGIES = [
  'timed_halves',
  'timed_periods',
  'set_based',
  'innings_based',
  'round_based',
  'stage_based',
] as const;
export type SportTopology = (typeof SPORT_TOPOLOGIES)[number];

export const ENTITY_KINDS = ['club', 'national_team', 'person', 'pair', 'crew'] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

export const COMPETITION_KINDS = [
  'league',
  'cup',
  'tournament',
  'international',
  'exhibition',
  'friendly',
] as const;
export type CompetitionKind = (typeof COMPETITION_KINDS)[number];

export const EVENT_STATUSES = [
  'scheduled',
  'live',
  'finished',
  'postponed',
  'cancelled',
  'abandoned',
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const DATE_PRECISIONS = ['minute', 'day', 'month', 'year'] as const;
export type DatePrecision = (typeof DATE_PRECISIONS)[number];

export const OUTCOMES = ['win', 'loss', 'draw', 'walkover', 'retired', 'no_result'] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const MEDIUMS = ['stadium', 'tv', 'stream', 'radio', 'highlights', 'replay'] as const;
export type Medium = (typeof MEDIUMS)[number];

export const VISIBILITIES = ['public', 'followers', 'private'] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export function isOneOf<T extends readonly string[]>(
  allowed: T,
  value: unknown,
): value is T[number] {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}
