import { getSessionUser, requireUser } from '@/lib/auth/session';
import { forbidden, noContent, notFound, ok, readJson, route } from '@/lib/http';
import { deleteLog, getLogForViewer, getLogOwner, updateLog } from '@/lib/queries/logs';
import { updateLogSchema } from '@/lib/validation/log';

// In Next 16 params is a Promise; awaiting it is not optional.
type Context = { params: Promise<{ id: string }> };

export const GET = route(async (_request: Request, { params }: Context) => {
  const { id } = await params;
  const viewer = await getSessionUser();
  const log = await getLogForViewer(id, viewer?.id ?? null);
  // A private log is invisible to everyone but its author — including the fact
  // that it exists, hence 404 rather than 403.
  if (!log) throw notFound('Log bulunamadı.');
  return ok(log);
});

async function assertOwner(id: string): Promise<void> {
  const user = await requireUser();
  const ownerId = await getLogOwner(id);
  if (!ownerId) throw notFound('Log bulunamadı.');
  if (ownerId !== user.id) throw forbidden('Bu log size ait değil.');
}

export const PATCH = route(async (request: Request, { params }: Context) => {
  const { id } = await params;
  await assertOwner(id);
  const input = updateLogSchema.parse(await readJson(request));
  return ok(await updateLog(id, input));
});

export const DELETE = route(async (_request: Request, { params }: Context) => {
  const { id } = await params;
  await assertOwner(id);
  await deleteLog(id);
  return noContent();
});
