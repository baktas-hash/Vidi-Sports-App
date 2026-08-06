import { query, queryMaybeOne } from '@vidi/db';
import type { CompetitionKind } from '@vidi/shared';

import { searchEvents, type EventCard } from './events';

export interface CompetitionSummary {
  id: string;
  slug: string;
  displayName: string;
  kind: string;
  country: string | null;
  tier: number | null;
  sport: { slug: string; name: string };
  seasonCount: number;
  eventCount: number;
}

export interface CompetitionSearchParams {
  sport?: string | undefined;
  kind?: CompetitionKind | undefined;
  q?: string | undefined;
  limit: number;
}

interface CompetitionSummaryRow {
  id: string;
  slug: string;
  display_name: string;
  kind: string;
  country: string | null;
  tier: number | null;
  sport_slug: string;
  sport_name: string;
  season_count: number;
  event_count: number;
}

export async function searchCompetitions(
  params: CompetitionSearchParams,
): Promise<CompetitionSummary[]> {
  const where: string[] = [];
  const values: unknown[] = [];

  const add = (clause: string, value: unknown) => {
    values.push(value);
    where.push(clause.replace('?', `$${values.length}`));
  };

  if (params.sport) add('s.slug = ?', params.sport);
  if (params.kind) add('c.kind = ?', params.kind);
  if (params.q) add(`c.display_name ilike '%' || ? || '%'`, params.q);

  values.push(params.limit);

  const rows = await query<CompetitionSummaryRow>(
    `select c.id, c.slug, c.display_name, c.kind, c.country, c.tier,
            s.slug as sport_slug, s.name as sport_name,
            (select count(*) from season se where se.competition_id = c.id)::int as season_count,
            (select count(*) from event e where e.competition_id = c.id)::int as event_count
       from competition c
       join sport s on s.id = c.sport_id
      ${where.length ? `where ${where.join(' and ')}` : ''}
      order by c.display_name
      limit $${values.length}`,
    values,
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    displayName: row.display_name,
    kind: row.kind,
    country: row.country,
    tier: row.tier,
    sport: { slug: row.sport_slug, name: row.sport_name },
    seasonCount: row.season_count,
    eventCount: row.event_count,
  }));
}

export interface CompetitionDetail {
  id: string;
  slug: string;
  displayName: string;
  kind: string;
  country: string | null;
  tier: number | null;
  sport: { slug: string; name: string; topology: string };
  seasons: Array<{ slug: string; label: string; startsOn: string | null; endsOn: string | null }>;
  events: EventCard[];
}

interface CompetitionRow {
  id: string;
  slug: string;
  display_name: string;
  kind: string;
  country: string | null;
  tier: number | null;
  sport_slug: string;
  sport_name: string;
  sport_topology: string;
}

interface SeasonRow {
  slug: string;
  label: string;
  starts_on: string | null;
  ends_on: string | null;
}

export async function getCompetitionBySlug(slug: string): Promise<CompetitionDetail | null> {
  const row = await queryMaybeOne<CompetitionRow>(
    `select c.id, c.slug, c.display_name, c.kind, c.country, c.tier,
            s.slug as sport_slug, s.name as sport_name, s.topology as sport_topology
       from competition c
       join sport s on s.id = c.sport_id
      where c.slug = $1`,
    [slug],
  );
  if (!row) return null;

  const [seasons, events] = await Promise.all([
    query<SeasonRow>(
      `select slug, label, starts_on, ends_on from season
        where competition_id = $1
        order by starts_on desc nulls last`,
      [row.id],
    ),
    searchEvents({ competition: row.slug, limit: 20 }),
  ]);

  return {
    id: row.id,
    slug: row.slug,
    displayName: row.display_name,
    kind: row.kind,
    country: row.country,
    tier: row.tier,
    sport: { slug: row.sport_slug, name: row.sport_name, topology: row.sport_topology },
    seasons: seasons.map((s) => ({
      slug: s.slug,
      label: s.label,
      startsOn: s.starts_on,
      endsOn: s.ends_on,
    })),
    events,
  };
}

export interface StandingsRow {
  entity: { id: string; slug: string; name: string; shortName: string | null };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  otherOutcomes: number;
  scoreFor: number | null;
  scoreAgainst: number | null;
  points: number;
  recentForm: string[];
}

export interface CompetitionStandings {
  competition: { slug: string; displayName: string };
  season: { slug: string; label: string } | null;
  // A "league table" is only a meaningful UI concept for kind='league' — a
  // 2-leg cup or a one-off international still aggregates cleanly, it just
  // produces a thin, oddly-shaped table. The caller decides whether to show it.
  isMeaningful: boolean;
  rows: StandingsRow[];
}

interface CompetitionLookupRow {
  id: string;
  slug: string;
  display_name: string;
  kind: string;
}

interface SeasonLookupRow {
  id: string;
  slug: string;
  label: string;
}

interface StandingsQueryRow {
  entity_id: string;
  slug: string;
  display_name: string;
  short_name: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  other_outcomes: number;
  score_for: number | null;
  score_against: number | null;
}

export async function getCompetitionStandings(
  slug: string,
  seasonSlug?: string,
): Promise<CompetitionStandings | null> {
  const competition = await queryMaybeOne<CompetitionLookupRow>(
    `select id, slug, display_name, kind from competition where slug = $1`,
    [slug],
  );
  if (!competition) return null;

  const season = seasonSlug
    ? await queryMaybeOne<SeasonLookupRow>(
        `select id, slug, label from season where competition_id = $1 and slug = $2`,
        [competition.id, seasonSlug],
      )
    : await queryMaybeOne<SeasonLookupRow>(
        `select id, slug, label from season where competition_id = $1
          order by starts_on desc nulls last limit 1`,
        [competition.id],
      );

  // Assumes exactly 2 sides per event (the self-join below pairs each row with
  // its one opponent). Safe for everything seeded so far, but the schema
  // allows up to 8 sides (event_participant.side) — a future 3+-sided contest
  // would double/multiply-count played/won/scores here. Documented, not fixed.
  const rows = await query<StandingsQueryRow>(
    `with scoped as (
       select id from event
        where competition_id = $1 and status = 'finished'
          and ($2::uuid is null or season_id = $2)
     ),
     per_entity as (
       select ep.entity_id,
              count(*)::int as played,
              count(*) filter (where ep.outcome = 'win')::int as won,
              count(*) filter (where ep.outcome = 'draw')::int as drawn,
              count(*) filter (where ep.outcome = 'loss')::int as lost,
              count(*) filter (where ep.outcome in ('walkover', 'retired', 'no_result'))::int
                as other_outcomes,
              sum(ep.score)::int as score_for,
              sum(opp.score)::int as score_against
         from event_participant ep
         join scoped se on se.id = ep.event_id
         left join event_participant opp
           on opp.event_id = ep.event_id and opp.entity_id <> ep.entity_id
        group by ep.entity_id
     )
     select en.id as entity_id, en.slug, en.display_name, en.short_name,
            pe.played, pe.won, pe.drawn, pe.lost, pe.other_outcomes, pe.score_for, pe.score_against
       from per_entity pe
       join entity en on en.id = pe.entity_id
      order by (pe.won * 3 + pe.drawn) desc,
               (coalesce(pe.score_for, 0) - coalesce(pe.score_against, 0)) desc`,
    [competition.id, season?.id ?? null],
  );

  const form = await getRecentForm(
    competition.id,
    rows.map((r) => r.entity_id),
    season?.id ?? null,
  );

  return {
    competition: { slug: competition.slug, displayName: competition.display_name },
    season: season ? { slug: season.slug, label: season.label } : null,
    isMeaningful: competition.kind === 'league',
    rows: rows.map((row) => ({
      entity: {
        id: row.entity_id,
        slug: row.slug,
        name: row.display_name,
        shortName: row.short_name,
      },
      played: row.played,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      otherOutcomes: row.other_outcomes,
      scoreFor: row.score_for,
      scoreAgainst: row.score_against,
      // win=3/draw=1/loss=0 — placeholder weighting, same spirit as
      // packages/shared's ratingWeight(): a one-line diff, not a migration,
      // once real product judgement on this exists.
      points: row.won * 3 + row.drawn,
      recentForm: form.get(row.entity_id) ?? [],
    })),
  };
}

async function getRecentForm(
  competitionId: string,
  entityIds: string[],
  seasonId: string | null,
): Promise<Map<string, string[]>> {
  if (!entityIds.length) return new Map();

  const rows = await query<{ entity_id: string; outcome: string | null }>(
    `select ep.entity_id, ep.outcome
       from event_participant ep
       join event e on e.id = ep.event_id
      where e.competition_id = $1 and e.status = 'finished'
        and ($2::uuid is null or e.season_id = $2)
        and ep.entity_id = any($3::uuid[])
      order by ep.entity_id, e.starts_at desc`,
    [competitionId, seasonId, entityIds],
  );

  const byEntity = new Map<string, string[]>();
  for (const row of rows) {
    const list = byEntity.get(row.entity_id) ?? [];
    if (list.length < 5) list.push(row.outcome ?? '?');
    byEntity.set(row.entity_id, list);
  }
  return byEntity;
}
