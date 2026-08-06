import { queryMaybeOne } from '@vidi/db';

import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { ApiError, ok, readJson, route } from '@/lib/http';
import { loginSchema } from '@/lib/validation/auth';

export const POST = route(async (request: Request) => {
  const input = loginSchema.parse(await readJson(request));

  const row = await queryMaybeOne<{
    id: string;
    handle: string;
    email: string;
    password_hash: string | null;
  }>(
    `select id, handle, email, password_hash
       from app_user where lower(email) = lower($1)`,
    [input.email],
  );

  // One message for "no such account" and "wrong password", so the endpoint
  // cannot be used to enumerate who has an account here.
  const invalid = new ApiError('unauthorized', 'E-posta veya şifre hatalı.');

  if (!row?.password_hash) {
    // Still spend the time hashing: answering instantly for unknown addresses
    // is itself the enumeration signal.
    await verifyPassword(input.password, 'scrypt$16384$8$1$AAAA$AAAA');
    throw invalid;
  }

  if (!(await verifyPassword(input.password, row.password_hash))) throw invalid;

  await createSession(row.id, {
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
  });

  return ok({ user: { id: row.id, handle: row.handle, email: row.email } });
});
