import { EVENT_STATUSES, isOneOf } from '@vidi/shared';

import { ok, route } from '@/lib/http';
import { searchEvents } from '@/lib/queries/events';
import { limitParam } from '@/lib/validation/common';

export const GET = route(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  const status = params.get('status');

  return ok({
    items: await searchEvents({
      q: params.get('q')?.trim() || undefined,
      sport: params.get('sport') ?? undefined,
      competition: params.get('competition') ?? undefined,
      venue: params.get('venue') ?? undefined,
      canonicalOnly: params.get('canonical') === 'true',
      status: status && isOneOf(EVENT_STATUSES, status) ? status : undefined,
      sort: params.get('sort') === 'trending' ? 'trending' : 'recent',
      limit: limitParam.parse(params.get('limit') ?? undefined),
    }),
  });
});
