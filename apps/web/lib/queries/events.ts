import { query, queryMaybeOne } from '@vidi/db';
import type { EventStatus } from '@vidi/shared';

export interface EventParticipant {
  entityId: string;
  slug: string;
  name: string;
  shortName: string | null;
  side: number;
  score: number | null;
  scoreDetail: unknown;
  outcome: string | null;
}

export interface EventDetail {
  id: string;
  slug: string;
  title: string | null;
  stage: string | null;
  startsAt: string | null;
  startsAtPrecision: string;
  endsOn: string | null;
  status: string;
  isCanonical: boolean;
  isNeutralVenue: boolean;
  behindClosedDoors: boolean;
  segmentCountActual: number | null;
  sport: { slug: string; name: string; topology: string };
  format: { slug: string; name: string; segmentLabel: string; segmentCount: number | null } | null;
  competition: { slug: string; name: string; kind: string } | null;
  season: { slug: string; label: string } | null;
  venue: {
    slug: string;
    name: string;
    /** The name the ground carried on the day. Differs from `name` often. */
    nameAtTheTime: string;
    city: string | null;
    country: string | null;
    lat: number | null;
    lng: number | null;
  } | null;
  participants: EventParticipant[];
}

// venue_name is joined on the event date, not just fetched: a user who went in
// 2013 should read "Türk Telekom Arena", not today's sponsor. Falls back to the
// current display_name when no history row covers the date.
const EVENT_SQL = `
  select
    e.id, e.slug, e.title, e.stage,
    e.starts_at, e.starts_at_precision, e.ends_on, e.status,
    e.is_canonical, e.is_neutral_venue, e.behind_closed_doors,
    e.segment_count_actual,
    s.slug as sport_slug, s.name as sport_name, s.topology as sport_topology,
    f.slug as format_slug, f.name as format_name,
    f.segment_label, f.segment_count,
    c.slug as competition_slug, c.display_name as competition_name, c.kind as competition_kind,
    se.slug as season_slug, se.label as season_label,
    v.slug as venue_slug, v.display_name as venue_name,
    v.city as venue_city, v.country as venue_country, v.lat, v.lng,
    coalesce(
      (select vn.name
         from venue_name vn
        where vn.venue_id = v.id
          and daterange(vn.valid_from, vn.valid_to, '[]') @> e.starts_at::date
        order by vn.valid_from desc nulls last
        limit 1),
      v.display_name
    ) as venue_name_at_the_time
  from event e
  join sport s on s.id = e.sport_id
  left join format f on f.id = e.format_id
  left join competition c on c.id = e.competition_id
  left join season se on se.id = e.season_id
  left join venue v on v.id = e.venue_id
`;

interface EventRow {
  id: string;
  slug: string;
  title: string | null;
  stage: string | null;
  starts_at: Date | null;
  starts_at_precision: string;
  ends_on: string | null;
  status: string;
  is_canonical: boolean;
  is_neutral_venue: boolean;
  behind_closed_doors: boolean;
  segment_count_actual: number | null;
  sport_slug: string;
  sport_name: string;
  sport_topology: string;
  format_slug: string | null;
  format_name: string | null;
  segment_label: string | null;
  segment_count: number | null;
  competition_slug: string | null;
  competition_name: string | null;
  competition_kind: string | null;
  season_slug: string | null;
  season_label: string | null;
  venue_slug: string | null;
  venue_name: string | null;
  venue_name_at_the_time: string | null;
  venue_city: string | null;
  venue_country: string | null;
  lat: number | null;
  lng: number | null;
}

interface ParticipantRow {
  entity_id: string;
  slug: string;
  display_name: string;
  short_name: string | null;
  side: number;
  score: number | null;
  score_detail: unknown;
  outcome: string | null;
}

function toEventDetail(row: EventRow, participants: ParticipantRow[]): EventDetail {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    stage: row.stage,
    startsAt: row.starts_at?.toISOString() ?? null,
    startsAtPrecision: row.starts_at_precision,
    endsOn: row.ends_on,
    status: row.status,
    isCanonical: row.is_canonical,
    isNeutralVenue: row.is_neutral_venue,
    behindClosedDoors: row.behind_closed_doors,
    segmentCountActual: row.segment_count_actual,
    sport: { slug: row.sport_slug, name: row.sport_name, topology: row.sport_topology },
    format:
      row.format_slug && row.format_name && row.segment_label
        ? {
            slug: row.format_slug,
            name: row.format_name,
            segmentLabel: row.segment_label,
            segmentCount: row.segment_count,
          }
        : null,
    competition:
      row.competition_slug && row.competition_name && row.competition_kind
        ? {
            slug: row.competition_slug,
            name: row.competition_name,
            kind: row.competition_kind,
          }
        : null,
    season:
      row.season_slug && row.season_label
        ? { slug: row.season_slug, label: row.season_label }
        : null,
    venue:
      row.venue_slug && row.venue_name
        ? {
            slug: row.venue_slug,
            name: row.venue_name,
            nameAtTheTime: row.venue_name_at_the_time ?? row.venue_name,
            city: row.venue_city,
            country: row.venue_country,
            lat: row.lat,
            lng: row.lng,
          }
        : null,
    participants: participants.map((p) => ({
      entityId: p.entity_id,
      slug: p.slug,
      name: p.display_name,
      shortName: p.short_name,
      side: p.side,
      score: p.score,
      scoreDetail: p.score_detail,
      outcome: p.outcome,
    })),
  };
}

async function participantsFor(eventId: string): Promise<ParticipantRow[]> {
  return query<ParticipantRow>(
    `select ep.entity_id, en.slug, en.display_name, en.short_name,
            ep.side, ep.score, ep.score_detail, ep.outcome
       from event_participant ep
       join entity en on en.id = ep.entity_id
      where ep.event_id = $1
      order by ep.side`,
    [eventId],
  );
}

export async function getEventBySlug(slug: string): Promise<EventDetail | null> {
  const row = await queryMaybeOne<EventRow>(`${EVENT_SQL} where e.slug = $1`, [slug]);
  if (!row) return null;
  return toEventDetail(row, await participantsFor(row.id));
}

export async function getEventById(id: string): Promise<EventDetail | null> {
  const row = await queryMaybeOne<EventRow>(`${EVENT_SQL} where e.id = $1`, [id]);
  if (!row) return null;
  return toEventDetail(row, await participantsFor(row.id));
}

export interface EventSearchParams {
  q?: string | undefined;
  sport?: string | undefined;
  competition?: string | undefined;
  venue?: string | undefined;
  canonicalOnly?: boolean | undefined;
  status?: EventStatus | undefined;
  /** 'trending' = most publicly logged first. Default 'recent' keeps today's order. */
  sort?: 'recent' | 'trending' | undefined;
  limit: number;
}

// Carries scores/outcomes, not just names, so a poster/scoreboard can render
// straight from a list result — no per-card follow-up fetch for the detail.
export interface EventCard {
  id: string;
  slug: string;
  title: string | null;
  startsAt: string | null;
  status: string;
  isCanonical: boolean;
  sport: { slug: string; name: string; topology: string };
  competition: { slug: string; name: string } | null;
  venue: string | null;
  participants: EventParticipant[];
  logCount: number;
}

export async function searchEvents(params: EventSearchParams): Promise<EventCard[]> {
  const where: string[] = [];
  const values: unknown[] = [];

  const add = (clause: string, value: unknown) => {
    values.push(value);
    where.push(clause.replace('?', `$${values.length}`));
  };

  if (params.sport) add('s.slug = ?', params.sport);
  if (params.competition) add('c.slug = ?', params.competition);
  if (params.venue) add('v.slug = ?', params.venue);
  if (params.status) add('e.status = ?', params.status);
  if (params.canonicalOnly) where.push('e.is_canonical');
  if (params.q) {
    // The participants' names, the event title and the ground all count as
    // "the thing the user typed" — one box, no scoping dropdown.
    values.push(params.q);
    const n = `$${values.length}`;
    where.push(
      `(e.title ilike '%' || ${n} || '%'
        or v.display_name ilike '%' || ${n} || '%'
        or exists (
          select 1
            from event_participant ep2
            join entity en2 on en2.id = ep2.entity_id
           where ep2.event_id = e.id
             and en2.display_name ilike '%' || ${n} || '%'))`,
    );
  }

  values.push(params.limit);

  const rows = await query<{
    id: string;
    slug: string;
    title: string | null;
    starts_at: Date | null;
    status: string;
    is_canonical: boolean;
    sport_slug: string;
    sport_name: string;
    sport_topology: string;
    competition_slug: string | null;
    competition_name: string | null;
    venue: string | null;
    participants: EventParticipant[];
    log_count: number;
  }>(
    `select e.id, e.slug, e.title, e.starts_at, e.status, e.is_canonical,
            s.slug as sport_slug, s.name as sport_name, s.topology as sport_topology,
            c.slug as competition_slug, c.display_name as competition_name,
            v.display_name as venue,
            coalesce(
              (select json_agg(json_build_object(
                        'entityId', en.id, 'slug', en.slug, 'name', en.display_name,
                        'shortName', en.short_name, 'side', ep.side, 'score', ep.score,
                        'scoreDetail', ep.score_detail, 'outcome', ep.outcome
                      ) order by ep.side)
                 from event_participant ep
                 join entity en on en.id = ep.entity_id
                where ep.event_id = e.id),
              '[]'
            ) as participants,
            (select count(*) from log l where l.event_id = e.id and l.visibility = 'public') as log_count
       from event e
       join sport s on s.id = e.sport_id
       left join competition c on c.id = e.competition_id
       left join venue v on v.id = e.venue_id
      ${where.length ? `where ${where.join(' and ')}` : ''}
      order by ${params.sort === 'trending' ? 'log_count desc, e.starts_at desc nulls last' : 'e.starts_at desc nulls last'}
      limit $${values.length}`,
    values,
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    startsAt: row.starts_at?.toISOString() ?? null,
    status: row.status,
    isCanonical: row.is_canonical,
    sport: { slug: row.sport_slug, name: row.sport_name, topology: row.sport_topology },
    competition:
      row.competition_slug && row.competition_name
        ? { slug: row.competition_slug, name: row.competition_name }
        : null,
    venue: row.venue,
    participants: row.participants,
    logCount: row.log_count,
  }));
}
