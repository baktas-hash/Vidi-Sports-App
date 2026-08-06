import { queryOne } from '@vidi/db';

import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { created, readJson, route } from '@/lib/http';
import { registerSchema } from '@/lib/validation/auth';

export const POST = route(async (request: Request) => {
  const input = registerSchema.parse(await readJson(request));

  const user = await queryOne<{ id: string; handle: string; email: string }>(
    `insert into app_user (handle, email, password_hash, display_name, country)
     values ($1, $2, $3, $4, $5)
     returning id, handle, email`,
    [
      input.handle,
      input.email,
      await hashPassword(input.password),
      input.displayName ?? null,
      input.country ?? null,
    ],
  );

  await createSession(user.id, {
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
  });

  return created({ user });
});
