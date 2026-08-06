import { query, queryMaybeOne, transaction } from '@vidi/db';
import { computeCoverage, pointToStars, starsToPoint, type Coverage } from '@vidi/shared';

import { notFound, unprocessable } from '../http';
import type { CreateLogInput, UpdateLogInput } from '../validation/log';
import type { EventCard, EventParticipant } from './events';

export interface LogDetail {
  id: string;
  medium: string;
  watchedOn: string;
  rating: number | null;
  atmosphere: number | null;
  review: string | null;
  hasSpoilers: boolean;
  isLiveWatch: boolean;
  isRewatch: boolean;
  ticketRef: string | null;
  visibility: string;
  createdAt: string;
  user: { handle: string; displayName: string | null };
  // Same shape as EventCard (minus logCount): a feed/diary card renders its
  // scoreboard straight from this, no per-log follow-up fetch for the event.
  event: Omit<EventCard, 'logCount'>;
  segments: number[];
  coverage: Coverage & { label: string | null };
  likeCount: number;
  commentCount: number;
}

interface LogRow {
  id: string;
  medium: string;
  watched_on: string;
  rating: number | null;
  atmosphere: number | null;
  review: string | null;
  has_spoilers: boolean;
  is_live_watch: boolean;
  is_rewatch: boolean;
  ticket_ref: string | null;
  visibility: string;
  created_at: Date;
  handle: string;
  display_name: string | null;
  event_id: string;
  event_slug: string;
  event_title: string | null;
  event_starts_at: Date | null;
  event_status: string;
  event_is_canonical: boolean;
  event_sport_slug: string;
  event_sport_name: string;
  event_sport_topology: string;
  event_competition_slug: string | null;
  event_competition_name: string | null;
  event_venue: string | null;
  event_participants: EventParticipant[];
  segments_total: number | null;
  segment_label: string | null;
  segments: number[];
  like_count: number;
  comment_count: number;
}

const LOG_SQL = `
  select
    l.id, l.medium, l.watched_on, l.rating, l.atmosphere, l.review,
    l.has_spoilers, l.is_live_watch, l.is_rewatch, l.ticket_ref,
    l.visibility, l.created_at,
    u.handle, u.display_name,
    e.id as event_id, e.slug as event_slug, e.title as event_title,
    e.starts_at as event_starts_at, e.status as event_status, e.is_canonical as event_is_canonical,
    s.slug as event_sport_slug, s.name as event_sport_name, s.topology as event_sport_topology,
    c.slug as event_competition_slug, c.display_name as event_competition_name,
    v.display_name as event_venue,
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
    ) as event_participants,
    coalesce(e.segment_count_actual, f.segment_count) as segments_total,
    f.segment_label,
    coalesce(
      (select array_agg(ls.segment_index order by ls.segment_index)
         from log_segment ls where ls.log_id = l.id),
      '{}'
    ) as segments,
    (select count(*) from log_like ll where ll.log_id = l.id) as like_count,
    (select count(*) from comment cm where cm.log_id = l.id) as comment_count
  from log l
  join app_user u on u.id = l.user_id
  join event e on e.id = l.event_id
  join sport s on s.id = e.sport_id
  left join competition c on c.id = e.competition_id
  left join venue v on v.id = e.venue_id
  left join format f on f.id = e.format_id
`;

function toLogDetail(row: LogRow): LogDetail {
  const coverage = computeCoverage(row.segments, row.segments_total);
  return {
    id: row.id,
    medium: row.medium,
    watchedOn: row.watched_on,
    rating: row.rating === null ? null : pointToStars(row.rating),
    atmosphere: row.atmosphere === null ? null : pointToStars(row.atmosphere),
    review: row.review,
    hasSpoilers: row.has_spoilers,
    isLiveWatch: row.is_live_watch,
    isRewatch: row.is_rewatch,
    ticketRef: row.ticket_ref,
    visibility: row.visibility,
    createdAt: row.created_at.toISOString(),
    user: { handle: row.handle, displayName: row.display_name },
    event: {
      id: row.event_id,
      slug: row.event_slug,
      title: row.event_title,
      startsAt: row.event_starts_at?.toISOString() ?? null,
      status: row.event_status,
      isCanonical: row.event_is_canonical,
      sport: {
        slug: row.event_sport_slug,
        name: row.event_sport_name,
        topology: row.event_sport_topology,
      },
      competition:
        row.event_competition_slug && row.event_competition_name
          ? { slug: row.event_competition_slug, name: row.event_competition_name }
          : null,
      venue: row.event_venue,
      participants: row.event_participants,
    },
    segments: row.segments,
    coverage: { ...coverage, label: row.segment_label },
    likeCount: row.like_count,
    commentCount: row.comment_count,
  };
}

/** Segments beyond what the contest actually had are a client bug, not data. */
async function assertSegmentsFit(eventId: string, segments: number[] | undefined): Promise<void> {
  if (!segments?.length) return;

  const row = await queryMaybeOne<{ segments_total: number | null }>(
    `select coalesce(e.segment_count_actual, f.segment_count) as segments_total
       from event e left join format f on f.id = e.format_id
      where e.id = $1`,
    [eventId],
  );
  if (!row) throw notFound('Event bulunamadı.');
  if (row.segments_total === null) return; // open-ended format: nothing to check

  const tooHigh = segments.filter((s) => s > row.segments_total!);
  if (tooHigh.length) {
    throw unprocessable(
      `Bu event ${row.segments_total} bölümden oluşuyor; ${tooHigh.join(', ')} geçersiz.`,
      { segments: [`en fazla ${row.segments_total} olabilir`] },
    );
  }
}

export async function createLog(userId: string, input: CreateLogInput): Promise<LogDetail> {
  await assertSegmentsFit(input.eventId, input.segments);

  const id = await transaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `insert into log (user_id, event_id, medium, watched_on, rating, atmosphere,
                        review, has_spoilers, is_live_watch, is_rewatch, ticket_ref, visibility)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       returning id`,
      [
        userId,
        input.eventId,
        input.medium,
        input.watchedOn,
        input.rating === undefined ? null : starsToPoint(input.rating),
        input.atmosphere === undefined ? null : starsToPoint(input.atmosphere),
        input.review ?? null,
        input.hasSpoilers,
        input.isLiveWatch,
        input.isRewatch,
        input.ticketRef ?? null,
        input.visibility,
      ],
    );
    const logId = rows[0]!.id;

    if (input.segments?.length) {
      // unnest keeps this one round trip regardless of segment count.
      await client.query(
        `insert into log_segment (log_id, segment_index)
         select $1, unnest($2::smallint[])
         on conflict do nothing`,
        [logId, [...new Set(input.segments)]],
      );
    }

    return logId;
  });

  return (await getLogById(id))!;
}

/** No visibility filter — for the author's own log right after writing it. */
export async function getLogById(id: string): Promise<LogDetail | null> {
  const row = await queryMaybeOne<LogRow>(`${LOG_SQL} where l.id = $1`, [id]);
  return row ? toLogDetail(row) : null;
}

// The visibility rule is part of the SQL, same as in getFeed. A private log is
// indistinguishable from a missing one for anyone but its author, which is why
// the caller turns a null into 404 rather than 403.
const VISIBLE_TO = `(
  l.visibility = 'public'
  or ($2::uuid is not null and l.user_id = $2::uuid)
  or (l.visibility = 'followers' and $2::uuid is not null and exists (
    select 1 from follow fo
     where fo.followee_id = l.user_id and fo.follower_id = $2::uuid
  ))
)`;

export async function getLogForViewer(
  id: string,
  viewerId: string | null,
): Promise<LogDetail | null> {
  const row = await queryMaybeOne<LogRow>(
    `${LOG_SQL} where l.id = $1 and ${VISIBLE_TO}`,
    [id, viewerId],
  );
  return row ? toLogDetail(row) : null;
}

// Ordered by the day the event was watched, not when the log row was
// created — a Letterboxd-style diary reads by watch date, unlike the feed.
export async function getUserDiary(
  userId: string,
  viewerId: string | null,
): Promise<LogDetail[]> {
  const rows = await query<LogRow>(
    `${LOG_SQL} where l.user_id = $1 and ${VISIBLE_TO} order by l.watched_on desc, l.created_at desc`,
    [userId, viewerId],
  );
  return rows.map(toLogDetail);
}

// There's no "followed sport" table anywhere in the schema (follow is
// user-to-user). Rather than mock this, derive it from what the viewer has
// actually logged most — an honest substitute for Home's sport chips.
export async function getViewerTopSports(
  userId: string,
  limit = 5,
): Promise<Array<{ slug: string; name: string }>> {
  return query<{ slug: string; name: string }>(
    `select s.slug, s.name
       from log l
       join event e on e.id = l.event_id
       join sport s on s.id = e.sport_id
      where l.user_id = $1
      group by s.slug, s.name
      order by count(*) desc
      limit $2`,
    [userId, limit],
  );
}

export async function getLogOwner(id: string): Promise<string | null> {
  const row = await queryMaybeOne<{ user_id: string }>(
    'select user_id from log where id = $1',
    [id],
  );
  return row?.user_id ?? null;
}

const COLUMN_FOR: Record<keyof UpdateLogInput, string> = {
  medium: 'medium',
  watchedOn: 'watched_on',
  rating: 'rating',
  atmosphere: 'atmosphere',
  review: 'review',
  hasSpoilers: 'has_spoilers',
  isLiveWatch: 'is_live_watch',
  isRewatch: 'is_rewatch',
  ticketRef: 'ticket_ref',
  visibility: 'visibility',
  segments: '',
};

export async function updateLog(id: string, input: UpdateLogInput): Promise<LogDetail> {
  const { segments, ...fields } = input;

  const assignments: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(fields) as Array<
    [keyof UpdateLogInput, unknown]
  >) {
    const column = COLUMN_FOR[key];
    if (!column) continue;
    values.push(
      (key === 'rating' || key === 'atmosphere') && typeof value === 'number'
        ? starsToPoint(value)
        : value,
    );
    assignments.push(`${column} = $${values.length}`);
  }

  await transaction(async (client) => {
    if (assignments.length) {
      values.push(id);
      const { rowCount } = await client.query(
        `update log set ${assignments.join(', ')} where id = $${values.length}`,
        values,
      );
      if (!rowCount) throw notFound('Log bulunamadı.');
    }

    if (segments !== undefined) {
      // Segments are replaced wholesale, not merged: the client always sends
      // the full list, and a partial merge could silently keep a stale segment.
      await client.query('delete from log_segment where log_id = $1', [id]);
      if (segments.length) {
        await client.query(
          `insert into log_segment (log_id, segment_index)
           select $1, unnest($2::smallint[])`,
          [id, [...new Set(segments)]],
        );
      }
    }
  });

  const updated = await getLogById(id);
  if (!updated) throw notFound('Log bulunamadı.');
  return updated;
}

export async function deleteLog(id: string): Promise<void> {
  const rows = await query('delete from log where id = $1 returning id', [id]);
  if (!rows.length) throw notFound('Log bulunamadı.');
}

export type FeedScope = 'global' | 'following' | 'user';

export interface FeedParams {
  scope: FeedScope;
  viewerId: string | null;
  handle?: string | undefined;
  eventId?: string | undefined;
  competitionId?: string | undefined;
  cursor?: string | undefined;
  limit: number;
}

export interface Feed {
  items: LogDetail[];
  nextCursor: string | null;
}

// Keyset pagination on (created_at, id). Offset would skip or repeat rows as
// new logs land at the top of the feed, which on match day is constant.
function decodeCursor(cursor: string): { createdAt: string; id: string } {
  const [createdAt, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
  if (!createdAt || !id) throw unprocessable('Geçersiz cursor.');
  return { createdAt, id };
}

function encodeCursor(log: { createdAt: string; id: string }): string {
  return Buffer.from(`${log.createdAt}|${log.id}`, 'utf8').toString('base64url');
}

export async function getFeed(params: FeedParams): Promise<Feed> {
  const where: string[] = [];
  const values: unknown[] = [];

  const push = (value: unknown): string => {
    values.push(value);
    return `$${values.length}`;
  };

  // Visibility lives in the query, not in a post-filter in the handler:
  // forgetting it in one endpoint would be a leak.
  if (params.viewerId) {
    const viewer = push(params.viewerId);
    where.push(`(
      l.visibility = 'public'
      or l.user_id = ${viewer}
      or (l.visibility = 'followers' and exists (
        select 1 from follow fo
         where fo.followee_id = l.user_id and fo.follower_id = ${viewer}
      ))
    )`);
  } else {
    where.push(`l.visibility = 'public'`);
  }

  if (params.scope === 'following') {
    if (!params.viewerId) throw unprocessable('Takip akışı için giriş gerekiyor.');
    const viewer = push(params.viewerId);
    where.push(`(l.user_id = ${viewer} or exists (
      select 1 from follow fo
       where fo.follower_id = ${viewer} and fo.followee_id = l.user_id
    ))`);
  }

  if (params.scope === 'user') {
    if (!params.handle) throw unprocessable('scope=user için handle gerekiyor.');
    where.push(`u.handle = ${push(params.handle)}`);
  }

  if (params.eventId) where.push(`l.event_id = ${push(params.eventId)}`);
  if (params.competitionId) where.push(`e.competition_id = ${push(params.competitionId)}`);

  if (params.cursor) {
    const { createdAt, id } = decodeCursor(params.cursor);
    where.push(`(l.created_at, l.id) < (${push(createdAt)}::timestamptz, ${push(id)}::uuid)`);
  }

  const rows = await query<LogRow>(
    `${LOG_SQL}
      where ${where.join(' and ')}
      order by l.created_at desc, l.id desc
      limit ${push(params.limit + 1)}`,
    values,
  );

  const items = rows.slice(0, params.limit).map(toLogDetail);
  const last = items[items.length - 1];

  return {
    items,
    nextCursor: rows.length > params.limit && last ? encodeCursor(last) : null,
  };
}
