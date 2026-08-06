import { destroySession } from '@/lib/auth/session';
import { noContent, route } from '@/lib/http';

export const POST = route(async () => {
  await destroySession();
  return noContent();
});
