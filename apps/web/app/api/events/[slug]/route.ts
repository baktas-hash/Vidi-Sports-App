import { notFound, ok, route } from '@/lib/http';
import { getEventBySlug } from '@/lib/queries/events';

type Context = { params: Promise<{ slug: string }> };

export const GET = route(async (_request: Request, { params }: Context) => {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) throw notFound('Event bulunamadı.');
  return ok(event);
});
