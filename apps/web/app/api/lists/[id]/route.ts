import { getSessionUser, requireUser } from '@/lib/auth/session';
import { noContent, notFound, ok, readJson, route } from '@/lib/http';
import { deleteList, getListById, updateList } from '@/lib/queries/lists';
import { updateListSchema } from '@/lib/validation/list';

type Context = { params: Promise<{ id: string }> };

export const GET = route(async (_request: Request, { params }: Context) => {
  const { id } = await params;
  const viewer = await getSessionUser();
  const list = await getListById(id, viewer?.id ?? null);
  if (!list) throw notFound('Liste bulunamadı.');
  return ok(list);
});

export const PATCH = route(async (request: Request, { params }: Context) => {
  const { id } = await params;
  const user = await requireUser();
  const input = updateListSchema.parse(await readJson(request));
  return ok(await updateList(id, user.id, input));
});

export const DELETE = route(async (_request: Request, { params }: Context) => {
  const { id } = await params;
  const user = await requireUser();
  await deleteList(id, user.id);
  return noContent();
});
