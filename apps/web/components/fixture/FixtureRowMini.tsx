import Link from 'next/link';

import type { EventCard } from '@/lib/queries/events';

const SPORT_ABBR: Record<string, string> = {
  football: 'FUT',
  basketball: 'BAS',
  tennis: 'TEN',
  volleyball: 'VOL',
  cricket: 'KRK',
  'american-football': 'NFL',
  'rugby-union': 'RGB',
  'rugby-league': 'RGB',
  boxing: 'BOX',
  mma: 'MMA',
};

// The sidebar's condensed row: time (or a pulsing "canlı" for status='live')
// on the left, both names stacked, a sport tag instead of the full
// competition name FixtureRow shows — there isn't room for both here.
export function FixtureRowMini({ event }: { event: EventCard }) {
  const [a, b] = [...event.participants].sort((x, y) => x.side - y.side);
  const isLive = event.status === 'live';

  return (
    <Link
      href={`/events/${event.slug}`}
      className="flex items-center gap-2.5 border-t border-line/50 py-1.5 first:border-t-0"
    >
      <div className="flex w-9 flex-none items-center gap-1 border-l-2 border-amber pl-2 font-display text-[13px] font-bold tabular-nums text-dim">
        {isLive ? (
          <span className="h-1.5 w-1.5 flex-none animate-pulse rounded-full bg-live" />
        ) : event.startsAt ? (
          new Date(event.startsAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        ) : (
          '–'
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-[13.5px] font-semibold leading-tight">{a?.name}</div>
        <div className="truncate font-display text-[13.5px] font-semibold leading-tight text-muted">{b?.name}</div>
      </div>
      {isLive ? (
        <span className="flex-none rounded-md border border-live/40 bg-live/15 px-1.5 py-0.5 font-display text-[10px] font-bold uppercase text-live">
          canlı
        </span>
      ) : (
        <span className="flex-none font-mono text-[9px] uppercase text-muted">
          {SPORT_ABBR[event.sport.slug] ?? event.sport.slug.slice(0, 3).toUpperCase()}
        </span>
      )}
    </Link>
  );
}
