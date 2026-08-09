import { query, queryMaybeOne, queryOne, transaction } from '@vidi/db';
import { slugify } from '@vidi/shared';

import { forbidden, notFound } from '../http';
import type { AddListItemInput, CreateListInput, UpdateListInput } from '../validation/list';
import type { EventCard, EventParticipant } from './events';

export interface ListOwner {
  handle: string;
  displayName: string | null;
}

export interface ListSummary {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  isRanked: boolean;
  visibility: string;
  createdAt: string;
  /** null = editorial list, not owned by any user. */
  owner: ListOwner | null;
  itemCount: number;
  /** First 3 items, in position order — enough for a stacked-poster card. */
  previewEvents: Array<Omit<EventCard, 'logCount'>>;
}

export interface ListItem {
  position: number;
  note: string | null;
  event: Omit<EventCard, 'logCount'>;
}

export interface ListDetail extends ListSummary {
  items: ListItem[];
}

interface ListRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_ranked: boolean;
  visibility: string;
  created_at: Date;
  owner_handle: string | null;
  owner_display_name: string | null;
  item_count: number;
}

// item_count is a subselect, not a join + group by: a list with zero items is
// common (freshly created) and a join would either need a left join with its
// own count(distinct) gymnastics or silently drop the row.
const LIST_SQL = `
  select l.id, l.slug, l.title, l.description, l.is_ranked, l.visibility, l.created_at,
         u.handle as owner_handle, u.display_name as owner_display_name,
         (select count(*) from list_item li where li.list_id = l.id)::int as item_count
    from list l
    left join app_user u on u.id = l.user_id
`;

interface ListItemRow {
  list_id: string;
  position: number;
  note: string | null;
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
}

// Mirrors events.ts/logs.ts's participants sub-select — duplicated rather
// than shared, same as those two files duplicate it from each other.
const LIST_ITEM_SQL = `
  select li.list_id, li.position, li.note,
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
         ) as event_participants
    from list_item li
    join event e on e.id = li.event_id
    join sport s on s.id = e.sport_id
    left join competition c on c.id = e.competition_id
    left join venue v on v.id = e.venue_id
`;

function toEventCard(row: ListItemRow): Omit<EventCard, 'logCount'> {
  return {
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
  };
}

function toListSummary(row: ListRow, items: ListItemRow[]): ListSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    isRanked: row.is_ranked,
    visibility: row.visibility,
    createdAt: row.created_at.toISOString(),
    owner: row.owner_handle ? { handle: row.owner_handle, displayName: row.owner_display_name } : null,
    itemCount: row.item_count,
    previewEvents: items.slice(0, 3).map(toEventCard),
  };
}

async function attachPreviews(rows: ListRow[]): Promise<ListSummary[]> {
  if (!rows.length) return [];
  const items = await query<ListItemRow>(
    `${LIST_ITEM_SQL} where li.list_id = any($1::uuid[]) order by li.list_id, li.position`,
    [rows.map((row) => row.id)],
  );
  const byList = new Map<string, ListItemRow[]>();
  for (const item of items) {
    const bucket = byList.get(item.list_id) ?? [];
    bucket.push(item);
    byList.set(item.list_id, bucket);
  }
  return rows.map((row) => toListSummary(row, byList.get(row.id) ?? []));
}

// Public lists across every user plus editorial ones (user_id null), busiest
// first — the closest thing to "front page" ranking a list can get without a
// dedicated popularity column.
export async function getFeaturedLists(limit: number): Promise<ListSummary[]> {
  const rows = await query<ListRow>(
    `${LIST_SQL} where l.visibility = 'public' order by item_count desc, l.created_at desc limit $1`,
    [limit],
  );
  return attachPreviews(rows);
}

// Same visibility discipline as logs.ts's VISIBLE_TO: lives in the query, not
// a post-filter, so no endpoint can forget it.
export async function getListsForUser(userId: string, viewerId: string | null): Promise<ListSummary[]> {
  const rows = await query<ListRow>(
    `${LIST_SQL}
      where l.user_id = $1
        and (
          l.visibility = 'public'
          or ($2::uuid is not null and l.user_id = $2::uuid)
          or (l.visibility = 'followers' and $2::uuid is not null and exists (
            select 1 from follow fo where fo.followee_id = l.user_id and fo.follower_id = $2::uuid
          ))
        )
      order by l.created_at desc`,
    [userId, viewerId],
  );
  return attachPreviews(rows);
}

export async function getListById(id: string, viewerId: string | null): Promise<ListDetail | null> {
  const row = await queryMaybeOne<ListRow>(
    `${LIST_SQL}
      where l.id = $1
        and (
          l.visibility = 'public'
          or ($2::uuid is not null and l.user_id = $2::uuid)
          or (l.visibility = 'followers' and l.user_id is not null and $2::uuid is not null and exists (
            select 1 from follow fo where fo.followee_id = l.user_id and fo.follower_id = $2::uuid
          ))
        )`,
    [id, viewerId],
  );
  if (!row) return null;

  const itemRows = await query<ListItemRow>(`${LIST_ITEM_SQL} where li.list_id = $1 order by li.position`, [
    row.id,
  ]);

  return {
    ...toListSummary(row, itemRows),
    items: itemRows.map((item) => ({ position: item.position, note: item.note, event: toEventCard(item) })),
  };
}

/** null = editorial list — nobody owns it, so every write is forbidden. */
export async function getListOwner(id: string): Promise<string | null> {
  const row = await queryMaybeOne<{ user_id: string | null }>('select user_id from list where id = $1', [id]);
  if (!row) throw notFound('Liste bulunamadı.');
  return row.user_id;
}

async function assertOwner(id: string, userId: string): Promise<void> {
  const ownerId = await getListOwner(id);
  if (ownerId !== userId) throw forbidden('Bu liste üzerinde yetkiniz yok.');
}

export async function createList(userId: string, input: CreateListInput): Promise<ListDetail> {
  const row = await queryOne<{ id: string }>(
    `insert into list (user_id, slug, title, description, is_ranked, visibility)
     values ($1, $2, $3, $4, $5, $6) returning id`,
    [userId, slugify(input.title), input.title, input.description ?? null, input.isRanked, input.visibility],
  );
  return (await getListById(row.id, userId))!;
}

const LIST_COLUMN_FOR: Record<keyof Omit<UpdateListInput, 'title'>, string> = {
  description: 'description',
  isRanked: 'is_ranked',
  visibility: 'visibility',
};

export async function updateList(id: string, userId: string, input: UpdateListInput): Promise<ListDetail> {
  await assertOwner(id, userId);

  const assignments: string[] = [];
  const values: unknown[] = [];

  if (input.title !== undefined) {
    values.push(input.title);
    assignments.push(`title = $${values.length}`);
    values.push(slugify(input.title));
    assignments.push(`slug = $${values.length}`);
  }
  for (const [key, value] of Object.entries(input) as Array<[keyof typeof LIST_COLUMN_FOR, unknown]>) {
    const column = LIST_COLUMN_FOR[key];
    if (!column) continue;
    values.push(value);
    assignments.push(`${column} = $${values.length}`);
  }

  values.push(id);
  await query(`update list set ${assignments.join(', ')} where id = $${values.length}`, values);

  return (await getListById(id, userId))!;
}

export async function deleteList(id: string, userId: string): Promise<void> {
  await assertOwner(id, userId);
  await query('delete from list where id = $1', [id]);
}

// The backend-plan contract for PUT lists/[id]/items: the client always sends
// the full ordering, and this replaces list_item wholesale — same reasoning
// as logs.ts's segment replace-not-merge. Per-item notes don't survive a
// wholesale rewrite; addEventToList is the path that sets one.
export async function setListItems(id: string, userId: string, eventIds: string[]): Promise<ListDetail> {
  await assertOwner(id, userId);

  await transaction(async (client) => {
    await client.query('delete from list_item where list_id = $1', [id]);
    if (eventIds.length) {
      await client.query(
        `insert into list_item (list_id, position, event_id)
         select $1, position, event_id
           from unnest($2::uuid[]) with ordinality as t(event_id, position)`,
        [id, eventIds],
      );
    }
  });

  return (await getListById(id, userId))!;
}

export async function addEventToList(
  id: string,
  userId: string,
  input: AddListItemInput,
): Promise<ListDetail> {
  await assertOwner(id, userId);

  await transaction(async (client) => {
    const { rows } = await client.query<{ next: number }>(
      `select coalesce(max(position), 0) + 1 as next from list_item where list_id = $1`,
      [id],
    );
    await client.query(`insert into list_item (list_id, position, event_id, note) values ($1, $2, $3, $4)`, [
      id,
      rows[0]!.next,
      input.eventId,
      input.note ?? null,
    ]);
  });

  return (await getListById(id, userId))!;
}

export async function removeListItem(id: string, userId: string, position: number): Promise<ListDetail> {
  await assertOwner(id, userId);

  const rows = await query('delete from list_item where list_id = $1 and position = $2 returning position', [
    id,
    position,
  ]);
  if (!rows.length) throw notFound('Liste öğesi bulunamadı.');

  return (await getListById(id, userId))!;
}
