// Scripts talk to the database through @vidi/db like the web app does, so the
// type parsers and pool settings can never drift between the two.
//
// The one difference: a script is a short-lived process, so it closes the pool
// on the way out instead of leaving it open for the next request.

import { closePool, DATABASE_URL, getPool, transaction } from '@vidi/db';
import type { PoolClient } from 'pg';

export { DATABASE_URL, transaction };

export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
    await closePool();
  }
}

export async function inTransaction<T>(
  client: PoolClient,
  fn: () => Promise<T>,
): Promise<T> {
  await client.query('begin');
  try {
    const result = await fn();
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  }
}
