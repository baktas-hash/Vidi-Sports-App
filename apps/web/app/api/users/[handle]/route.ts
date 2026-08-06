import { getSessionUser } from '@/lib/auth/session';
import { notFound, ok, route } from '@/lib/http';
import { getUserProfile } from '@/lib/queries/users';

type Context = { params: Promise<{ handle: string }> };

export const GET = route(async (_request: Request, { params }: Context) => {
  const { handle } = await params;
  const viewer = await getSessionUser();

  const profile = await getUserProfile(handle, viewer?.id ?? null);
  if (!profile) throw notFound('Kullanıcı bulunamadı.');
  return ok(profile);
});
