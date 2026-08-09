import Link from 'next/link';

import type { ListSummary } from '@/lib/queries/lists';
import { Poster } from '@/components/visuals';

// The prototype's listRow(): a small stack of offset posters standing in for
// the list's contents, title + count + note beside it. Posters overlap by
// giving each one a bigger left offset and a lower z-index than the one
// before it, same trick as the prototype's absolutely-positioned .stack divs.
export function ListCard({ list }: { list: ListSummary }) {
  return (
    <Link href={`/lists/${list.id}`} className="flex items-center gap-4 border-b border-line py-3.5 lg:px-2">
      <div className="relative h-[70px] w-[88px] flex-none">
        {list.previewEvents.length ? (
          list.previewEvents.map((event, index) => (
            <div
              key={event.id}
              className="absolute top-0 w-[46px] overflow-hidden rounded-md shadow-lg shadow-black/50"
              style={{ left: index * 21, zIndex: list.previewEvents.length - index }}
            >
              <Poster event={event} width={46} />
            </div>
          ))
        ) : (
          <div className="grid h-full w-full place-items-center rounded-md border border-dashed border-line font-mono text-[9px] text-muted">
            boş
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate font-display text-[16px] font-bold uppercase leading-tight">{list.title}</div>
        <div className="mt-1 truncate font-mono text-[9px] text-muted">
          {list.itemCount} event
          {list.owner ? ` · ${list.owner.displayName ?? list.owner.handle}` : ' · editöryel'}
          {list.description ? ` · ${list.description}` : ''}
        </div>
      </div>
    </Link>
  );
}
