import { notFound, ok, route } from '@/lib/http';
import { getCompetitionBySlug } from '@/lib/queries/competitions';

type Context = { params: Promise<{ slug: string }> };

export const GET = route(async (_request: Request, { params }: Context) => {
  const { slug } = await params;
  const competition = await getCompetitionBySlug(slug);
  if (!competition) throw notFound('Turnuva bulunamadı.');
  return ok(competition);
});
