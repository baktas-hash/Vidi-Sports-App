import { Pool, type PoolClient, type QueryResultRow } from 'pg';

import './parsers';

export const DATABASE_URL =
  process.env['DATABASE_URL'] ?? 'postgres://localhost:5432/vidi_dev';

// Next's dev server reloads modules on every edit. Without stashing the pool on
// globalThis you leak a connection pool per reload and hit max_connections
// after a few minutes of editing.
const globalForPool = globalThis as typeof globalThis & { __vidiPool?: Pool | undefined };

export function getPool(): Pool {
  globalForPool.__vidiPool ??= new Pool({
    connectionString: DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
  });
  return globalForPool.__vidiPool;
}

export async function query<T extends QueryResultRow>(
  sql: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(sql, params as unknown[]);
  return result.rows;
}

/** Exactly one row, or null. Throws if the query returns more than one. */
export async function queryMaybeOne<T extends QueryResultRow>(
  sql: string,
  params: readonly unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  if (rows.length > 1) {
    throw new Error(`expected at most one row, got ${rows.length}`);
  }
  return rows[0] ?? null;
}

/** Exactly one row. Throws if there is none. */
export async function queryOne<T extends QueryResultRow>(
  sql: string,
  params: readonly unknown[] = [],
): Promise<T> {
  const row = await queryMaybeOne<T>(sql, params);
  if (!row) throw new Error('expected one row, got none');
  return row;
}

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  const pool = globalForPool.__vidiPool;
  if (!pool) return;
  globalForPool.__vidiPool = undefined;
  await pool.end();
}
