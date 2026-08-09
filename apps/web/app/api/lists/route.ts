import { getSessionUser, requireUser } from '@/lib/auth/session';
import { created, notFound, ok, readJson, route } from '@/lib/http';
import { createList, getFeaturedLists, getListsForUser } from '@/lib/queries/lists';
import { getUserIdByHandle } from '@/lib/queries/users';
import { limitParam } from '@/lib/validation/common';
import { createListSchema } from '@/lib/validation/list';

export const GET = route(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  const viewer = await getSessionUser();
  const handle = params.get('handle');

  if (handle) {
    const userId = await getUserIdByHandle(handle);
    if (!userId) throw notFound('Kullanıcı bulunamadı.');
    return ok({ items: await getListsForUser(userId, viewer?.id ?? null) });
  }

  return ok({ items: await getFeaturedLists(limitParam.parse(params.get('limit') ?? undefined)) });
});

export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const input = createListSchema.parse(await readJson(request));
  return created(await createList(user.id, input));
});
