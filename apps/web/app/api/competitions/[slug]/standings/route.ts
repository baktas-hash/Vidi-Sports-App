import { notFound, ok, route } from '@/lib/http';
import { getCompetitionStandings } from '@/lib/queries/competitions';

type Context = { params: Promise<{ slug: string }> };

export const GET = route(async (request: Request, { params }: Context) => {
  const { slug } = await params;
  const season = new URL(request.url).searchParams.get('season') ?? undefined;

  const standings = await getCompetitionStandings(slug, season);
  if (!standings) throw notFound('Turnuva bulunamadı.');
  return ok(standings);
});
