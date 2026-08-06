import Link from 'next/link';

import { getSessionUser } from '@/lib/auth/session';
import { searchCompetitions } from '@/lib/queries/competitions';
import { searchEvents, type EventCard } from '@/lib/queries/events';
import { getFeed, getViewerTopSports } from '@/lib/queries/logs';
import { Poster } from '@/components/visuals';
import { CompetitionCard } from '@/components/competition/CompetitionCard';
import { EventPosterCard } from '@/components/event/EventPosterCard';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';

function FixtureRow({ event }: { event: EventCard }) {
  const [a, b] = [...event.participants].sort((x, y) => x.side - y.side);
  return (
    <Link
      href={`/events/${event.slug}`}
      className="flex items-center gap-2.5 rounded-[9px] border border-line bg-surface px-3 py-2.5"
    >
      <div className="w-11 flex-none text-center font-display text-[15px] font-bold tabular-nums text-dim">
        {event.startsAt
          ? new Date(event.startsAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
          : '–'}
      </div>
      <div className="min-w-0 flex-1 truncate font-display text-[14.5px] font-semibold">
        {a?.name} <span className="text-muted">–</span> {b?.name}
      </div>
      <div className="flex-none font-mono text-[8.5px] uppercase text-muted">{event.competition?.name}</div>
    </Link>
  );
}

export default async function HomePage() {
  const user = await getSessionUser();
  const viewerId = user?.id ?? null;

  const [recentFeed, trending, upcoming, competitions, topSports] = await Promise.all([
    getFeed({ scope: 'global', viewerId, limit: 9 }),
    searchEvents({ sort: 'trending', limit: 6 }),
    searchEvents({ status: 'scheduled', limit: 4 }),
    searchCompetitions({ limit: 4 }),
    viewerId ? getViewerTopSports(viewerId) : Promise.resolve([]),
  ]);

  return (
    <>
      <section
        className="border-b border-line px-4 py-6 lg:px-8 lg:py-12"
        style={{ clipPath: 'polygon(0 0,100% 0,100% calc(100% - 20px),0 100%)' }}
      >
        <h1 className="font-display text-[34px] font-extrabold uppercase leading-[0.95] lg:text-[52px]">
          İzlediğin her maç
          <br />
          <span className="text-amber">bir yerde kalsın.</span>
        </h1>
        <p className="mt-2 font-serif text-[13px] text-dim lg:text-[15px]">Yedi spor, tek kalıcı arşiv.</p>
      </section>

      <SectionHeader title="Şu an loglananlar" href="/feed" linkLabel="Akış →" />
      {recentFeed.items.length ? (
        <div className="grid grid-cols-3 gap-2 px-4 pb-1 lg:grid-cols-6 lg:gap-3 lg:px-8">
          {recentFeed.items.slice(0, 9).map((log) => (
            <EventPosterCard key={log.id} event={log.event} rating={log.rating} authorHandle={log.user.handle} />
          ))}
        </div>
      ) : (
        <EmptyState>Henüz kimse bir şey loglamadı.</EmptyState>
      )}

      {topSports.length ? (
        <>
          <SectionHeader title="Takip ettiğin sporlar" />
          <div className="flex flex-wrap gap-1.5 px-4 pb-1 lg:px-8">
            {topSports.map((sport) => (
              <Chip key={sport.slug}>{sport.name}</Chip>
            ))}
          </div>
        </>
      ) : null}

      <SectionHeader title="Yaklaşan fikstür" />
      {upcoming.length ? (
        <div className="flex flex-col gap-1.5 px-4 pb-1 lg:grid lg:grid-cols-2 lg:gap-2 lg:px-8">
          {upcoming.map((event) => (
            <FixtureRow key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyState>
          Şu an planlanmış bir event yok — bu demo verisi baştan sona oynanmış maçlardan oluşuyor.
        </EmptyState>
      )}

      <SectionHeader title="En çok loglanan" />
      <div className="grid grid-cols-3 gap-2 px-4 pb-1 lg:grid-cols-6 lg:gap-3 lg:px-8">
        {trending.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.slug}`}
            className="relative block overflow-hidden rounded-[9px] shadow-lg shadow-black/40"
          >
            <Poster event={event} />
            <span className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-amber">
              {event.logCount} log
            </span>
          </Link>
        ))}
      </div>

      <SectionHeader title="Turnuvalar" href="/competitions" linkLabel="Hepsi →" />
      <div className="grid grid-cols-2 gap-2 px-4 pb-1 lg:grid-cols-4 lg:gap-3 lg:px-8">
        {competitions.map((competition) => (
          <CompetitionCard key={competition.id} competition={competition} />
        ))}
      </div>

      <SectionHeader title="Listeler" />
      <EmptyState>Listeler yakında.</EmptyState>
    </>
  );
}
