import Link from 'next/link';

import type { EventCard } from '@/lib/queries/events';

// Extracted from the home page's original inline FixtureRow, unchanged —
// now shared with FixtureCalendar and the competition page.
export function FixtureRow({ event }: { event: EventCard }) {
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
