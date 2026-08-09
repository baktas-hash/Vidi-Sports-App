import type { EventCard } from '@/lib/queries/events';
import { groupByDay } from '@/lib/fixtureGrouping';
import { Chip } from '@/components/ui/Chip';

import { FixtureRowMini } from './FixtureRowMini';

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

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="mb-3 font-display text-[13px] font-bold uppercase tracking-wide text-muted">
        Takip ettiğin sporlar · takvim
      </h3>
      {sports.length ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {sports.map((sport) => (
            <Chip key={sport.slug}>{sport.name}</Chip>
          ))}
        </div>
      ) : null}
      {groups.length ? (
        groups.map((group) => (
          <div key={`${group.label}-${group.dateLabel}`} className="mb-2 last:mb-0">
            <div className="mb-1 flex items-baseline gap-1.5">
              <b className="font-display text-[11.5px] font-bold uppercase tracking-wide">{group.label}</b>
              <span className="font-mono text-[8.5px] text-muted">{group.dateLabel}</span>
            </div>
            {group.events.slice(0, 3).map((event) => (
              <FixtureRowMini key={event.id} event={event} />
            ))}
          </div>
        ))
      ) : (
        <p className="font-mono text-[10px] text-muted">Şu an planlanmış bir event yok.</p>
      )}
    </div>
  );
}
