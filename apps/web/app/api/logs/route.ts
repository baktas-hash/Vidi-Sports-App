import { getSessionUser, requireUser } from '@/lib/auth/session';
import { created, ok, readJson, route } from '@/lib/http';
import { createLog, getFeed, type FeedScope } from '@/lib/queries/logs';
import { paginationParams } from '@/lib/validation/common';
import { createLogSchema } from '@/lib/validation/log';

const SCOPES: FeedScope[] = ['global', 'following', 'user'];

export const GET = route(async (request: Request) => {
  const url = new URL(request.url);
  const viewer = await getSessionUser();

  const raw = url.searchParams.get('scope');
  const scope: FeedScope = SCOPES.includes(raw as FeedScope)
    ? (raw as FeedScope)
    : viewer
      ? 'following'
      : 'global';

  const { cursor, limit } = paginationParams.parse({
    cursor: url.searchParams.get('cursor') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });

  return ok(
    await getFeed({
      scope,
      viewerId: viewer?.id ?? null,
      handle: url.searchParams.get('handle') ?? undefined,
      eventId: url.searchParams.get('eventId') ?? undefined,
      cursor,
      limit,
    }),
  );
});

export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const input = createLogSchema.parse(await readJson(request));
  return created(await createLog(user.id, input));
});
