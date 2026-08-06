// Drops and recreates the public schema. Local development only — refuses to
// run against anything that is not obviously a local database.

import { DATABASE_URL, withClient } from './db.js';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '']);

function assertLocal(url: string): void {
  const host = new URL(url).hostname;
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`refusing to reset a non-local database (host: ${host})`);
  }
}

async function main(): Promise<void> {
  assertLocal(DATABASE_URL);
  await withClient(async (client) => {
    await client.query('drop schema public cascade');
    await client.query('create schema public');
    console.log(`Reset ${DATABASE_URL}. Run db:migrate next.`);
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
