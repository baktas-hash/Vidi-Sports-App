import Link from 'next/link';

import type { EventCard } from '@/lib/queries/events';
import { Poster } from '@/components/visuals';

// TODO: temporary visual-preview fallback, same reasoning as ArchiveStatsPanel's
// MOCK_STATS — no logged-in viewer with real pending events on the deployed
// site yet, so show the design prototype's own placeholder rows instead of
// hiding the whole panel. Drop once there's a real viewer to derive this from.
const MOCK_PENDING = [
  { title: 'Mumbai – Chennai', meta: 'IPL · 19.04.2026', color: '#2B0733' },
  { title: 'Chiefs – 49ers', meta: 'Super Bowl · 08.02.2026', color: '#12131A' },
];

// "izlendi ama loglanmadı" diye bir sinyal şemada yok — bu panel onun yerine
// dürüst bir türetme kullanıyor: en çok logladığın sporlarda, henüz
// loglamadığın bitmiş event'ler (bkz. getPendingToLog).
export function PendingToLogPanel({ events }: { events: EventCard[] }) {
  if (!events.length) {
    return (
      <div className="rounded-2xl border border-amber/30 bg-gradient-to-br from-amber/10 to-transparent p-4">
        <h3 className="mb-3 font-display text-[13px] font-bold uppercase tracking-wide text-amber">
          Loglamayı bekliyor
        </h3>
        <div className="flex flex-col gap-2.5">
          {MOCK_PENDING.map((item) => (
            <div key={item.title} className="flex items-center gap-2.5">
              <div className="h-8 w-8 flex-none rounded-md shadow shadow-black/40" style={{ background: item.color }} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-[13.5px] font-bold leading-tight">{item.title}</div>
                <div className="truncate font-mono text-[8.5px] uppercase text-muted">{item.meta}</div>
              </div>
              <span className="grid h-6 w-6 flex-none place-items-center rounded-md bg-amber font-display text-[15px] font-bold text-neutral-950">
                +
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber/30 bg-gradient-to-br from-amber/10 to-transparent p-4">
      <h3 className="mb-3 font-display text-[13px] font-bold uppercase tracking-wide text-amber">
        Loglamayı bekliyor
      </h3>
      <div className="flex flex-col gap-2.5">
        {events.map((event) => {
          const [a, b] = [...event.participants].sort((x, y) => x.side - y.side);
          return (
            <Link key={event.id} href={`/logs/new?event=${event.slug}`} className="flex items-center gap-2.5">
              <div className="w-8 flex-none overflow-hidden rounded-md shadow shadow-black/40">
                <Poster event={event} width={60} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-[13.5px] font-bold leading-tight">
                  {a?.name} – {b?.name}
                </div>
                <div className="truncate font-mono text-[8.5px] text-muted">
                  {event.competition?.name}
                  {event.startsAt
                    ? ` · ${new Date(event.startsAt).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}`
                    : ''}
                </div>
              </div>
              <span className="grid h-6 w-6 flex-none place-items-center rounded-md bg-amber font-display text-[15px] font-bold text-neutral-950">
                +
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
