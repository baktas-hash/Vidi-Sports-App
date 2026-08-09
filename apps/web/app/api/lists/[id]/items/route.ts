import { requireUser } from '@/lib/auth/session';
import { badRequest, noContent, ok, readJson, route } from '@/lib/http';
import { addEventToList, removeListItem, setListItems } from '@/lib/queries/lists';
import { addListItemSchema, setListItemsSchema } from '@/lib/validation/list';

type Context = { params: Promise<{ id: string }> };

// Writes the whole ordering at once — the backend-plan contract for this
// endpoint, same "client always sends the full state" rule as PATCH /logs
// uses for segments.
export const PUT = route(async (request: Request, { params }: Context) => {
  const { id } = await params;
  const user = await requireUser();
  const { eventIds } = setListItemsSchema.parse(await readJson(request));
  return ok(await setListItems(id, user.id, eventIds));
});

// Convenience path for "add this one event to a list" without resending
// every other item — used by AddToListButton on an event page.
export const POST = route(async (request: Request, { params }: Context) => {
  const { id } = await params;
  const user = await requireUser();
  const input = addListItemSchema.parse(await readJson(request));
  return ok(await addEventToList(id, user.id, input));
});

export const DELETE = route(async (request: Request, { params }: Context) => {
  const { id } = await params;
  const user = await requireUser();
  const position = Number(new URL(request.url).searchParams.get('position'));
  if (!Number.isInteger(position) || position < 1) {
    throw badRequest('Geçerli bir position gerekli.');
  }
  return ok(await removeListItem(id, user.id, position));
});
