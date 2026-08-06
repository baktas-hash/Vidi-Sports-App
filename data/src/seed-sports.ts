// Seeds sport + format from data/sports.json.
//
// Idempotent and additive: it upserts and never deletes. Removing a sport is a
// deliberate migration, not a side effect of someone tidying up the JSON —
// there may already be events pointing at it.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { parseSportsFile, type SportSeed } from '@vidi/shared';

import { DATABASE_URL, inTransaction, withClient } from './db.js';
import type { PoolClient } from 'pg';

const SPORTS_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../sports.json',
);

const UPSERT_SPORT = `
  insert into sport (slug, name, topology, is_team_sport, sort_order)
  values ($1, $2, $3, $4, $5)
  on conflict (slug) do update set
    name          = excluded.name,
    topology      = excluded.topology,
    is_team_sport = excluded.is_team_sport,
    sort_order    = excluded.sort_order
  returning id, (xmax = 0) as inserted
`;

const UPSERT_FORMAT = `
  insert into format (sport_id, slug, name, segment_label, segment_count, is_default, notes)
  values ($1, $2, $3, $4, $5, $6, $7)
  on conflict (sport_id, slug) do update set
    name          = excluded.name,
    segment_label = excluded.segment_label,
    segment_count = excluded.segment_count,
    is_default    = excluded.is_default,
    notes         = excluded.notes
  returning (xmax = 0) as inserted
`;

interface Counts {
  sportsInserted: number;
  sportsUpdated: number;
  formatsInserted: number;
  formatsUpdated: number;
}

async function seedSport(client: PoolClient, sport: SportSeed, counts: Counts): Promise<void> {
  const { rows } = await client.query<{ id: string; inserted: boolean }>(UPSERT_SPORT, [
    sport.slug,
    sport.name,
    sport.topology,
    sport.isTeamSport,
    sport.sortOrder,
  ]);
  const row = rows[0];
  if (!row) throw new Error(`upsert returned no row for sport ${sport.slug}`);
  if (row.inserted) counts.sportsInserted += 1;
  else counts.sportsUpdated += 1;

  // Clear defaults first: a partial unique index allows only one default per
  // sport, and moving the flag between two formats would collide mid-statement.
  await client.query('update format set is_default = false where sport_id = $1', [row.id]);

  for (const format of sport.formats) {
    const result = await client.query<{ inserted: boolean }>(UPSERT_FORMAT, [
      row.id,
      format.slug,
      format.name,
      format.segmentLabel,
      format.segmentCount,
      format.isDefault ?? false,
      format.notes ?? null,
    ]);
    if (result.rows[0]?.inserted) counts.formatsInserted += 1;
    else counts.formatsUpdated += 1;
  }
}

async function main(): Promise<void> {
  const file = parseSportsFile(JSON.parse(await readFile(SPORTS_FILE, 'utf8')));
  const counts: Counts = {
    sportsInserted: 0,
    sportsUpdated: 0,
    formatsInserted: 0,
    formatsUpdated: 0,
  };

  await withClient(async (client) => {
    console.log(`→ ${DATABASE_URL}`);
    await inTransaction(client, async () => {
      for (const sport of file.sports) {
        await seedSport(client, sport, counts);
        console.log(`  ${sport.slug} (${sport.formats.length} format)`);
      }
    });
  });

  console.log(
    `sport: +${counts.sportsInserted} yeni, ~${counts.sportsUpdated} güncel  |  ` +
      `format: +${counts.formatsInserted} yeni, ~${counts.formatsUpdated} güncel`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
