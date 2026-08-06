// Applies db/migrations/*.sql in filename order, once each, inside a
// transaction. Records a checksum so an already-applied file that later gets
// edited is a loud error rather than a silent drift between two machines.

import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { DATABASE_URL, inTransaction, withClient } from './db.js';

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../db/migrations',
);

const TRACKING_TABLE = `
  create table if not exists schema_migration (
    filename    text primary key,
    checksum    text not null,
    applied_at  timestamptz not null default now()
  )
`;

function checksum(sql: string): string {
  return createHash('sha256').update(sql).digest('hex').slice(0, 16);
}

async function main(): Promise<void> {
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migrations found.');
    return;
  }

  await withClient(async (client) => {
    console.log(`→ ${DATABASE_URL}`);
    await client.query(TRACKING_TABLE);

    const { rows } = await client.query<{ filename: string; checksum: string }>(
      'select filename, checksum from schema_migration',
    );
    const applied = new Map(rows.map((r) => [r.filename, r.checksum]));

    let ran = 0;
    for (const filename of files) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, filename), 'utf8');
      const sum = checksum(sql);
      const previous = applied.get(filename);

      if (previous === sum) {
        console.log(`  = ${filename} (already applied)`);
        continue;
      }
      if (previous && previous !== sum) {
        throw new Error(
          `${filename} was already applied but its contents changed ` +
            `(${previous} -> ${sum}). Write a new migration instead of editing this one.`,
        );
      }

      await inTransaction(client, async () => {
        await client.query(sql);
        await client.query(
          'insert into schema_migration (filename, checksum) values ($1, $2)',
          [filename, sum],
        );
      });
      console.log(`  + ${filename}`);
      ran += 1;
    }

    console.log(ran === 0 ? 'Up to date.' : `Applied ${ran} migration(s).`);
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
