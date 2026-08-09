import Link from 'next/link';

import { getSessionUser } from '@/lib/auth/session';
import { searchCompetitions } from '@/lib/queries/competitions';
import { getUpcomingEvents, searchEvents } from '@/lib/queries/events';
import { getFeed, getViewerTopSports } from '@/lib/queries/logs';
import { getFeaturedLists } from '@/lib/queries/lists';
import { Poster } from '@/components/visuals';
import { CompetitionCard } from '@/components/competition/CompetitionCard';
import { EventPosterCard } from '@/components/event/EventPosterCard';
import { FixtureCalendar } from '@/components/fixture/FixtureCalendar';
import { ListCard } from '@/components/list/ListCard';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default async function HomePage() {
  const user = await getSessionUser();
  const viewerId = user?.id ?? null;
  const topSports = viewerId ? await getViewerTopSports(viewerId) : [];

  const [recentFeed, trending, upcoming, competitions, featuredLists] = await Promise.all([
    getFeed({ scope: 'global', viewerId, limit: 9 }),
    searchEvents({ sort: 'trending', limit: 6 }),
    // Scoped to the viewer's most-logged sports once they have any — same
    // MYSPORTS-scoped calendar as the prototype, all sports for a logged-out
    // visitor or a viewer with no logs yet.
    getUpcomingEvents({ sportSlugs: topSports.length ? topSports.map((s) => s.slug) : undefined, limit: 20 }),
    searchCompetitions({ limit: 4 }),
    getFeaturedLists(6),
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
      <FixtureCalendar events={upcoming} />

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

      <SectionHeader title="Listeler" href="/lists/new" linkLabel="Yeni liste" />
      {featuredLists.length ? (
        <div className="px-4 lg:px-8">
          {featuredLists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      ) : (
        <EmptyState>Henüz bir liste yok.</EmptyState>
      )}
    </>
  );
}
