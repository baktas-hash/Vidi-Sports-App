import { notFound } from 'next/navigation';

import { getSessionUser } from '@/lib/auth/session';
import { getCompetitionBySlug, getCompetitionStandings } from '@/lib/queries/competitions';
import { getUpcomingEvents } from '@/lib/queries/events';
import { getFeed } from '@/lib/queries/logs';
import { getCompetitionTheme } from '@/lib/visuals/competitionTheme';
import { EventPosterCard } from '@/components/event/EventPosterCard';
import { StandingsTable } from '@/components/competition/StandingsTable';
import { FixtureCalendar } from '@/components/fixture/FixtureCalendar';
import { EmptyState } from '@/components/ui/EmptyState';
import { LogListItem } from '@/components/log/LogListItem';

export default async function CompetitionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [competition, standings, user] = await Promise.all([
    getCompetitionBySlug(slug),
    getCompetitionStandings(slug),
    getSessionUser(),
  ]);
  if (!competition) notFound();

  const [logs, fixtures] = await Promise.all([
    getFeed({
      scope: 'global',
      viewerId: user?.id ?? null,
      competitionId: competition.id,
      limit: 10,
    }),
    getUpcomingEvents({ competitionId: competition.id, limit: 10 }),
  ]);

  const theme = getCompetitionTheme(competition.slug);
  // getCompetitionBySlug's events list is status-agnostic; the scheduled ones
  // already have their own "Fikstür" section above, so keep them out of here.
  const finishedEvents = competition.events.filter((event) => event.status !== 'scheduled');

  return (
    <div>
      <div
        className="px-4 py-5 lg:px-8 lg:py-8"
        style={{ background: theme.bg, clipPath: 'polygon(0 0,100% 0,100% calc(100% - 16px),0 100%)' }}
      >
        <h1
          className="font-display text-[30px] font-extrabold uppercase leading-none lg:text-[42px]"
          style={{ color: theme.accent }}
        >
          {competition.displayName}
        </h1>
        <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-wide" style={{ color: theme.ink }}>
          {competition.sport.name} · {competition.country ?? 'uluslararası'} · {competition.events.length} loglu event
        </p>
      </div>

      <div className="mx-4 mb-2.5 mt-4 border-b border-line pb-1.5 lg:mx-8">
        <h2 className="font-display text-[13.5px] font-bold uppercase tracking-wider text-dim">Fikstür</h2>
      </div>
      <FixtureCalendar events={fixtures} />

      <div className="mx-4 mb-2.5 mt-5 border-b border-line pb-1.5 lg:mx-8">
        <h2 className="font-display text-[13.5px] font-bold uppercase tracking-wider text-dim">Sonuçlar</h2>
      </div>
      {finishedEvents.length ? (
        <div className="grid grid-cols-3 gap-2 px-4 pb-1 lg:grid-cols-6 lg:gap-3 lg:px-8">
          {finishedEvents.map((event) => (
            <EventPosterCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyState>Bu turnuvadan henüz oynanmış bir event yok.</EmptyState>
      )}

      {standings && standings.isMeaningful ? (
        <>
          <div className="mx-4 mb-2.5 mt-5 border-b border-line pb-1.5 lg:mx-8">
            <h2 className="font-display text-[13.5px] font-bold uppercase tracking-wider text-dim">
              Puan durumu {standings.season ? `· ${standings.season.label}` : ''}
            </h2>
          </div>
          <div className="mx-4 lg:mx-8 lg:max-w-xl">
            <StandingsTable rows={standings.rows} sportSlug={competition.sport.slug} />
          </div>
        </>
      ) : null}

      <div className="mx-4 mb-2.5 mt-5 border-b border-line pb-1.5 lg:mx-8">
        <h2 className="font-display text-[13.5px] font-bold uppercase tracking-wider text-dim">
          Bu turnuvadan loglar
        </h2>
      </div>
      {logs.items.length ? (
        logs.items.map((log) => <LogListItem key={log.id} log={log} />)
      ) : (
        <EmptyState>Bu turnuvadan henüz loglanan bir şey yok.</EmptyState>
      )}
    </div>
  );
}
