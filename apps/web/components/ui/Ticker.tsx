import type { EventCard } from '@/lib/queries/events';

function scoreText(event: EventCard): string {
  const [p1, p2] = [...event.participants].sort((a, b) => a.side - b.side);
  if (p1?.score == null || p2?.score == null) return '–';
  return `${p1.score}–${p2.score}`;
}

// The prototype's tkrun: the item list rendered twice back to back so an
// infinite translateX(-50%) loop never shows a seam. Pure decoration — the
// same scores are real, clickable content elsewhere (feed, event pages), so
// this whole strip is aria-hidden.
export function Ticker({ events }: { events: EventCard[] }) {
  if (!events.length) return null;

  const row = (keyPrefix: string) =>
    events.map((event) => {
      const [a, b] = [...event.participants].sort((x, y) => x.side - y.side);
      return (
        <span
          key={`${keyPrefix}-${event.id}`}
          className="inline-flex flex-none items-center gap-2 whitespace-nowrap border-r border-line px-4 py-2 font-mono text-[11px] text-dim"
        >
          <span className="rounded bg-surface-2 px-1.5 py-0.5 font-display text-[9.5px] font-bold uppercase tracking-wide text-muted">
            FT
          </span>
          {a?.name}
          <b className="font-display text-[14px] font-bold tabular-nums text-ink">{scoreText(event)}</b>
          {b?.name}
        </span>
      );
    });

  return (
    <div aria-hidden="true" className="overflow-hidden border-b border-line bg-canvas">
      <div className="flex w-max" style={{ animation: 'ticker-scroll 40s linear infinite' }}>
        <div className="flex">{row('a')}</div>
        <div className="flex">{row('b')}</div>
      </div>
    </div>
  );
}
