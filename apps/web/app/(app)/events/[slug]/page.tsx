import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getSessionUser } from '@/lib/auth/session';
import { getEventBySlug } from '@/lib/queries/events';
import { getFeed } from '@/lib/queries/logs';
import { getEventRatingStats } from '@/lib/queries/stats';
import { getCompetitionTheme } from '@/lib/visuals/competitionTheme';
import { Scoreboard } from '@/components/visuals';
import { RatingHistogram } from '@/components/event/RatingHistogram';
import { LogListItem, MEDIUM_LABEL } from '@/components/log/LogListItem';
import { EmptyState } from '@/components/ui/EmptyState';

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [event, user] = await Promise.all([getEventBySlug(slug), getSessionUser()]);
  if (!event) notFound();

  const [stats, loggedBy] = await Promise.all([
    getEventRatingStats(event.id),
    getFeed({ scope: 'global', viewerId: user?.id ?? null, eventId: event.id, limit: 30 }),
  ]);

  const theme = getCompetitionTheme(event.competition?.slug ?? 'no-competition');
  const [a, b] = [...event.participants].sort((x, y) => x.side - y.side);
  const dateLabel = event.startsAt
    ? new Date(event.startsAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;
  const mediumBreakdown = Object.entries(stats.byMedium);

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <div className="px-4 pt-4 lg:px-8">
        <Scoreboard event={event} />
      </div>

      <div className="px-4 pt-4 lg:px-8">
        <h1 className="font-display text-[25px] font-extrabold uppercase leading-none lg:text-[30px]">
          {a?.name} <span style={{ color: theme.accent }}>–</span> {b?.name}
        </h1>
        <p className="mt-1.5 font-mono text-[9.5px] leading-relaxed text-muted">
          {event.competition?.name ?? event.sport.name}
          {dateLabel ? ` · ${dateLabel}` : ''}
          {event.venue ? ` · ${event.venue.nameAtTheTime}` : ''}
        </p>
      </div>

      <div className="mx-4 mt-4 rounded-xl border border-line bg-surface p-3.5 lg:mx-8">
        <div className="mb-2 font-mono text-[8.5px] uppercase tracking-wider text-muted">Topluluk puanı</div>
        {stats.count ? (
          <>
            <div className="flex items-center gap-4">
              <div className="flex-none">
                <div className="font-display text-[38px] font-extrabold tabular-nums text-amber">
                  {stats.average?.toFixed(1).replace('.', ',') ?? '–'}
                </div>
                <div className="font-mono text-[9px] text-muted">{stats.count.toLocaleString('tr-TR')} puan</div>
              </div>
              <div className="flex-1">
                <RatingHistogram distribution={stats.distribution} />
              </div>
            </div>
            {mediumBreakdown.length > 1 ? (
              <div className="mt-3.5 flex gap-1.5">
                {mediumBreakdown.map(([medium, m]) => (
                  <div key={medium} className="flex-1 rounded-lg bg-surface-2 px-2 py-2 text-center">
                    <div className="font-display text-[16px] font-extrabold tabular-nums text-amber">
                      {m.average?.toFixed(1).replace('.', ',') ?? '–'}
                    </div>
                    <div className="mt-0.5 font-mono text-[8px] uppercase text-muted">
                      {MEDIUM_LABEL[medium] ?? medium}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {stats.sawEndingShare !== null ? (
              <p className="mt-3 font-mono text-[9.5px] text-muted">
                Sonunu görenlerin oranı: <span className="text-dim">%{Math.round(stats.sawEndingShare * 100)}</span>
              </p>
            ) : null}
          </>
        ) : (
          <p className="font-sans text-[12.5px] text-muted">Henüz puan yok — ilk loglayan sen ol.</p>
        )}
        <div className="mt-3.5 flex gap-2">
          <Link
            href={`/logs/new?event=${event.slug}`}
            className="flex-1 rounded-lg bg-amber py-2.5 text-center font-display text-[14px] font-semibold uppercase tracking-wide text-neutral-950"
          >
            ＋ Logla
          </Link>
          <button
            disabled
            title="Yakında"
            className="cursor-not-allowed rounded-lg border border-line px-4 font-display text-[14px] font-semibold uppercase tracking-wide text-muted"
          >
            Listeye
          </button>
        </div>
      </div>

      <div className="mx-4 mb-2.5 mt-5 border-b border-line pb-1.5 lg:mx-8">
        <h2 className="font-display text-[13.5px] font-bold uppercase tracking-wider text-dim">
          Bu event&apos;i loglayanlar · {loggedBy.items.length}
        </h2>
      </div>
      {loggedBy.items.length ? (
        loggedBy.items.map((log) => <LogListItem key={log.id} log={log} />)
      ) : (
        <EmptyState>Henüz kimse loglamadı.</EmptyState>
      )}
    </div>
  );
}
