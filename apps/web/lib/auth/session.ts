// Opaque random session tokens in an httpOnly cookie; only the SHA-256 of the
// token is stored, so a database dump does not hand over live sessions.

import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';

import { query, queryMaybeOne } from '@vidi/db';

import { unauthorized } from '../http';

export const SESSION_COOKIE = 'vidi_session';
const SESSION_DAYS = 30;
// Don't touch last_seen_at on every single request — one write per session per
// hour is enough to tell an idle session from a dead one.
const TOUCH_AFTER_MS = 60 * 60 * 1000;

export interface SessionUser {
  id: string;
  handle: string;
  displayName: string | null;
  email: string;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(
  userId: string,
  meta: { userAgent?: string | null; ip?: string | null } = {},
): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await query(
    `insert into session (token_hash, user_id, expires_at, user_agent, ip)
     values ($1, $2, $3, $4, $5)`,
    [hashToken(token), userId, expiresAt, meta.userAgent ?? null, meta.ip ?? null],
  );

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = await queryMaybeOne<{
    session_id: string;
    last_seen_at: Date;
    id: string;
    handle: string;
    display_name: string | null;
    email: string;
  }>(
    `select s.id as session_id, s.last_seen_at,
            u.id, u.handle, u.display_name, u.email
       from session s
       join app_user u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [hashToken(token)],
  );

  if (!row) return null;

  if (Date.now() - row.last_seen_at.getTime() > TOUCH_AFTER_MS) {
    await query('update session set last_seen_at = now() where id = $1', [row.session_id]);
  }

  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    email: row.email,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw unauthorized();
  return user;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await query('delete from session where token_hash = $1', [hashToken(token)]);
  }
  store.delete(SESSION_COOKIE);
}
