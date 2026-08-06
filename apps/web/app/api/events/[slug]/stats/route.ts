import { queryMaybeOne } from '@vidi/db';

import { notFound, ok, route } from '@/lib/http';
import { getEventRatingStats } from '@/lib/queries/stats';

type Context = { params: Promise<{ slug: string }> };

export const GET = route(async (_request: Request, { params }: Context) => {
  const { slug } = await params;

  const event = await queryMaybeOne<{ id: string }>('select id from event where slug = $1', [
    slug,
  ]);
  if (!event) throw notFound('Event bulunamadı.');

  return ok(await getEventRatingStats(event.id));
});
