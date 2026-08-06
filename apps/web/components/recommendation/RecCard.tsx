import Link from 'next/link';

import type { EventCard as EventCardType } from '@/lib/queries/events';
import { Banner } from '@/components/visuals';

export function RecCard({ event, why, tone = 'default' }: { event: EventCardType; why: string; tone?: 'default' | 'bridge' | 'skip' }) {
  const [a, b] = [...event.participants].sort((x, y) => x.side - y.side);
  const borderClass = tone === 'skip' ? 'border-red-400/25' : tone === 'bridge' ? 'border-sky-400/25' : 'border-line';
  const whyClass = tone === 'skip' ? 'text-red-300/85' : tone === 'bridge' ? 'text-sky-300/85' : 'text-muted';

  return (
    <Link href={`/events/${event.slug}`} className={`block overflow-hidden rounded-xl border ${borderClass} bg-surface`}>
      <Banner event={event} />
      <div className="p-3">
        <div className="truncate font-display text-[16px] font-bold uppercase leading-tight">
          {a?.name} – {b?.name}
        </div>
        <p className={`mt-1.5 font-sans text-[12px] leading-relaxed ${whyClass}`}>{why}</p>
      </div>
    </Link>
  );
}
