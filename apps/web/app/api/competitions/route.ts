import { COMPETITION_KINDS, isOneOf } from '@vidi/shared';

import { ok, route } from '@/lib/http';
import { searchCompetitions } from '@/lib/queries/competitions';
import { limitParam } from '@/lib/validation/common';

export const GET = route(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  const kind = params.get('kind');

  return ok({
    items: await searchCompetitions({
      sport: params.get('sport') ?? undefined,
      kind: kind && isOneOf(COMPETITION_KINDS, kind) ? kind : undefined,
      q: params.get('q')?.trim() || undefined,
      limit: limitParam.parse(params.get('limit') ?? undefined),
    }),
  });
});
