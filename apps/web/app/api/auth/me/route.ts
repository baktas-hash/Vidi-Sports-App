import { getSessionUser } from '@/lib/auth/session';
import { ok, route } from '@/lib/http';

// 200 with user: null rather than 401 — "am I signed in?" is a question, not a
// failed request, and the client shouldn't have to treat it as an error.
export const GET = route(async () => {
  return ok({ user: await getSessionUser() });
});
