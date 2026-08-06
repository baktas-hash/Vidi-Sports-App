import Link from 'next/link';

import { Poster, type PosterEvent } from '@/components/visuals';

export interface EventPosterCardEvent extends PosterEvent {
  slug: string;
}

// Poster fills whatever width the caller's layout gives it (a CSS grid
// column) — this just adds the rating badge / author footer overlay and the
// link to the event page, mirroring the original prototype's pcell().
export function EventPosterCard({
  event,
  rating,
  authorHandle,
}: {
  event: EventPosterCardEvent;
  rating?: number | null;
  authorHandle?: string;
}) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="relative block overflow-hidden rounded-[9px] shadow-lg shadow-black/40 transition-transform active:scale-[0.97]"
    >
      <Poster event={event} />
      {rating ? (
        <span className="absolute right-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 font-display text-[11px] font-bold text-amber">
          {rating.toFixed(1).replace('.', ',')}
        </span>
      ) : null}
      {authorHandle ? (
        <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/85 to-transparent px-1.5 pb-1.5 pt-4 font-mono text-[9px] text-neutral-100">
          {authorHandle}
        </span>
      ) : null}
    </Link>
  );
}
