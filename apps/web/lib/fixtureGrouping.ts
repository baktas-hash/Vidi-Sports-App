import type { EventCard } from './queries/events';

export interface FixtureDayGroup {
  label: string;
  dateLabel: string;
  events: EventCard[];
}

// "Bugün" / "Yarın" / gün adı — same Intl-based day labelling ProfileTabs.tsx
// already uses for its month headers, just at day granularity. Events are
// expected pre-sorted by starts_at asc (getUpcomingEvents already does
// this): a Map preserves first-insertion key order, so the groups come out
// chronological with no extra sort here.
export function groupByDay(events: EventCard[]): FixtureDayGroup[] {
  const groups = new Map<string, EventCard[]>();
  for (const event of events) {
    if (!event.startsAt) continue;
    const key = new Date(event.startsAt).toDateString();
    const bucket = groups.get(key) ?? [];
    bucket.push(event);
    groups.set(key, bucket);
  }

  const today = new Date().toDateString();
  const tomorrow = new Date(Date.now() + 86_400_000).toDateString();

  return [...groups.entries()].map(([key, dayEvents]) => {
    const date = new Date(key);
    const label =
      key === today
        ? 'Bugün'
        : key === tomorrow
          ? 'Yarın'
          : date.toLocaleDateString('tr-TR', { weekday: 'long' });
    return {
      label,
      dateLabel: date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      events: dayEvents,
    };
  });
}
