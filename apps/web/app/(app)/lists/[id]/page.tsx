import { notFound } from 'next/navigation';

import { getSessionUser } from '@/lib/auth/session';
import { getListById } from '@/lib/queries/lists';
import { EventPosterCard } from '@/components/event/EventPosterCard';
import { DeleteListButton, RemoveItemButton } from '@/components/list/ListActions';
import { EmptyState } from '@/components/ui/EmptyState';

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const resolvedList = await getListById(id, user?.id ?? null);
  if (!resolvedList) notFound();

  const isOwner = Boolean(user && resolvedList.owner?.handle === user.handle);

  return (
    <div>
      <div className="px-4 pt-4 lg:px-8">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-[25px] font-extrabold uppercase leading-none lg:text-[30px]">
            {resolvedList.title}
          </h1>
          {isOwner ? <DeleteListButton listId={resolvedList.id} /> : null}
        </div>
        <p className="mt-1.5 font-mono text-[9.5px] leading-relaxed text-muted">
          {resolvedList.itemCount} event
          {resolvedList.owner ? ` · ${resolvedList.owner.displayName ?? resolvedList.owner.handle}` : ' · editöryel'}
        </p>
        {resolvedList.description ? (
          <p className="mt-2 font-serif text-[13px] text-dim">{resolvedList.description}</p>
        ) : null}
      </div>

      <div className="mx-4 mb-2.5 mt-4 border-b border-line pb-1.5 lg:mx-8">
        <h2 className="font-display text-[13.5px] font-bold uppercase tracking-wider text-dim">Event'ler</h2>
      </div>

      {resolvedList.items.length ? (
        <div className="grid grid-cols-3 gap-2 px-4 pb-4 lg:grid-cols-6 lg:gap-3 lg:px-8">
          {resolvedList.items.map((item) => {
            const [a, b] = [...item.event.participants].sort((x, y) => x.side - y.side);
            return (
              <div key={item.position} className="relative">
                <EventPosterCard event={item.event} />
                {resolvedList.isRanked ? (
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 font-display text-[11px] font-bold text-amber">
                    #{item.position}
                  </span>
                ) : null}
                {isOwner ? <RemoveItemButton listId={resolvedList.id} position={item.position} /> : null}
                <div className="mt-1.5 truncate font-display text-[12px] font-semibold leading-tight">
                  {a?.name} – {b?.name}
                </div>
                {item.note ? <p className="mt-0.5 truncate font-mono text-[9px] text-muted">{item.note}</p> : null}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState>Bu liste henüz boş.</EmptyState>
      )}
    </div>
  );
}
