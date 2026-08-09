import type { EventCard } from '@/lib/queries/events';
import { groupByDay } from '@/lib/fixtureGrouping';
import { Chip } from '@/components/ui/Chip';

import { FixtureRowMini } from './FixtureRowMini';

// TODO: same temporary visual-preview fallback as ArchiveStatsPanel/
// PendingToLogPanel — no seeded events on the deployed site yet, so there's
// nothing for getUpcomingEvents to return there. Placeholder chips + rows
// straight from the design prototype; drop once real fixtures exist.
const MOCK_CHIPS = [
  { slug: 'voleybol', name: 'Voleybol' },
  { slug: 'basketbol', name: 'Basketbol' },
  { slug: 'kriket', name: 'Kriket' },
];

interface MockRow {
  a: string;
  b: string;
  sport: string;
  time: string | null;
  live?: boolean;
}

const MOCK_GROUPS: Array<{ label: string; dateLabel: string; rows: MockRow[] }> = [
  {
    label: 'Bugün',
    dateLabel: '30 Tem',
    rows: [
      { a: 'VakıfBank', b: 'Fenerbahçe', sport: 'VOL', time: null, live: true },
      { a: 'VakıfBank', b: 'Eczacıbaşı', sport: 'VOL', time: null, live: true },
      { a: 'Thunder', b: 'Celtics', sport: 'BAS', time: null, live: true },
    ],
  },
  {
    label: 'Yarın',
    dateLabel: '31 Tem',
    rows: [
      { a: 'VakıfBank', b: 'Fenerbahçe', sport: 'VOL', time: '19:30' },
      { a: 'Fenerbahçe', b: 'Eczacıbaşı', sport: 'VOL', time: '19:30' },
      { a: 'Grizzlies', b: 'Celtics', sport: 'BAS', time: '19:30' },
    ],
  },
];

// Same visual as FixtureRowMini but without a backing EventCard — a plain
// div, not a Link, so a mock row never points at an event page that doesn't
// exist.
function MockFixtureRow({ a, b, sport, time, live }: MockRow) {
  return (
    <div className="flex items-center gap-2.5 border-t border-line/50 py-1.5 first:border-t-0">
      <div className="flex w-9 flex-none items-center gap-1 border-l-2 border-amber pl-2 font-display text-[13px] font-bold tabular-nums text-dim">
        {live ? <span className="h-1.5 w-1.5 flex-none animate-pulse rounded-full bg-live" /> : (time ?? '–')}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-[13.5px] font-semibold leading-tight">{a}</div>
        <div className="truncate font-display text-[13.5px] font-semibold leading-tight text-muted">{b}</div>
      </div>
      {live ? (
        <span className="flex-none rounded-md border border-live/40 bg-live/15 px-1.5 py-0.5 font-display text-[10px] font-bold uppercase text-live">
          canlı
        </span>
      ) : (
        <span className="flex-none font-mono text-[9px] uppercase text-muted">{sport}</span>
      )}
    </div>
  );
}

// Sidebar version of FixtureCalendar: sport chips on top, capped to the
// nearest couple of days and a few rows each — a taste of what's coming, not
// the full fikstür (that lives on the competition page).
export function CompactFixtureCalendar({
  events,
  sports,
}: {
  events: EventCard[];
  sports: Array<{ slug: string; name: string }>;
}) {
  const groups = groupByDay(events).slice(0, 2);
  const usingMock = events.length === 0;
  const chips = usingMock ? MOCK_CHIPS : sports;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="mb-3 font-display text-[13px] font-bold uppercase tracking-wide text-muted">
        Takip ettiğin sporlar · takvim
      </h3>
      {chips.length ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {chips.map((sport) => (
            <Chip key={sport.slug}>{sport.name}</Chip>
          ))}
        </div>
      ) : null}
      {usingMock
        ? MOCK_GROUPS.map((group) => (
            <div key={`${group.label}-${group.dateLabel}`} className="mb-2 last:mb-0">
              <div className="mb-1 flex items-baseline gap-1.5">
                <b className="font-display text-[11.5px] font-bold uppercase tracking-wide">{group.label}</b>
                <span className="font-mono text-[8.5px] text-muted">{group.dateLabel}</span>
              </div>
              {group.rows.map((row) => (
                <MockFixtureRow key={`${row.a}-${row.b}`} {...row} />
              ))}
            </div>
          ))
        : groups.map((group) => (
            <div key={`${group.label}-${group.dateLabel}`} className="mb-2 last:mb-0">
              <div className="mb-1 flex items-baseline gap-1.5">
                <b className="font-display text-[11.5px] font-bold uppercase tracking-wide">{group.label}</b>
                <span className="font-mono text-[8.5px] text-muted">{group.dateLabel}</span>
              </div>
              {group.events.slice(0, 3).map((event) => (
                <FixtureRowMini key={event.id} event={event} />
              ))}
            </div>
          ))}
    </div>
  );
}
