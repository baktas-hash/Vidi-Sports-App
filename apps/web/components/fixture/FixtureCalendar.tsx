import type { EventCard } from '@/lib/queries/events';
import { groupByDay } from '@/lib/fixtureGrouping';
import { EmptyState } from '@/components/ui/EmptyState';

import { FixtureRow } from './FixtureRow';

// The prototype's calendar(): day header (label + date + dashed rule) above
// that day's fixture rows, repeated per group.
export function FixtureCalendar({ events }: { events: EventCard[] }) {
  const groups = groupByDay(events);

  if (!groups.length) {
    return <EmptyState>Şu an planlanmış bir event yok.</EmptyState>;
  }

  return (
    <div className="px-4 lg:px-8">
      {groups.map((group) => (
        <div key={`${group.label}-${group.dateLabel}`} className="mb-3">
          <div className="mb-1.5 mt-3 flex items-center gap-2.5">
            <b className="font-display text-[14px] font-bold uppercase tracking-wide">{group.label}</b>
            <span className="font-mono text-[9.5px] text-muted">{group.dateLabel}</span>
            <hr className="flex-1 border-0 border-t border-dashed border-line" />
          </div>
          <div className="flex flex-col gap-1.5 lg:grid lg:grid-cols-2 lg:gap-2">
            {group.events.map((event) => (
              <FixtureRow key={event.id} event={event} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
