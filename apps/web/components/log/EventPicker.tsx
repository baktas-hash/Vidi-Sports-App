'use client';

import { useEffect, useState } from 'react';

import type { EventCard } from '@/lib/queries/events';

// The prototype's log sheet always opened from a specific event's card — it
// never needed this step. Logging from the FAB with no event context does,
// so this is new surface, not a port: debounced search against the same
// GET /api/events?q= the search page will also use.
export function EventPicker({ onSelect }: { onSelect: (event: EventCard) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<EventCard[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = q.trim();
    // Every setState call lives inside the timeout, not the effect body
    // itself — react-hooks/set-state-in-effect flags synchronous setState
    // during the effect's own execution, debounced async work is fine.
    const timeout = setTimeout(() => {
      if (!trimmed) {
        setResults([]);
        return;
      }
      setLoading(true);
      fetch(`/api/events?q=${encodeURIComponent(trimmed)}&limit=8`)
        .then((res) => res.json())
        .then((body: { items?: EventCard[] }) => setResults(body.items ?? []))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [q]);

  return (
    <div>
      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Takım, oyuncu veya stat ara…"
        autoFocus
        className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[14px] outline-none focus:border-amber"
      />
      {loading ? <p className="mt-2 font-mono text-[11px] text-muted">Aranıyor…</p> : null}
      <div className="mt-2 flex flex-col gap-1.5">
        {results.map((event) => {
          const [a, b] = [...event.participants].sort((x, y) => x.side - y.side);
          return (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelect(event)}
              className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2.5 text-left"
            >
              <span className="min-w-0 truncate font-display text-[14px] font-semibold">
                {a?.name} – {b?.name}
              </span>
              <span className="flex-none font-mono text-[9px] uppercase text-muted">
                {event.competition?.name ?? event.sport.name}
              </span>
            </button>
          );
        })}
        {!loading && q.trim() && !results.length ? (
          <p className="px-1 font-sans text-[12.5px] text-muted">Sonuç yok.</p>
        ) : null}
      </div>
    </div>
  );
}
