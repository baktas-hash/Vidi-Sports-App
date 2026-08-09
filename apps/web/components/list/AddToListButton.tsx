'use client';

import Link from 'next/link';
import { useState } from 'react';

import type { ListSummary } from '@/lib/queries/lists';

// Sits where the event page's disabled "Listeye" placeholder used to be.
// Loads the viewer's own lists lazily, on first open — most visits to an
// event page never touch this, so there's no reason to fetch it eagerly.
export function AddToListButton({
  eventId,
  viewerHandle,
}: {
  eventId: string;
  viewerHandle: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ListSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function toggle() {
    if (!viewerHandle) return;
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setMessage(null);
    if (lists) return;

    setLoading(true);
    const res = await fetch(`/api/lists?handle=${viewerHandle}`);
    if (res.ok) {
      const body = (await res.json()) as { items: ListSummary[] };
      setLists(body.items);
    }
    setLoading(false);
  }

  async function addTo(listId: string) {
    setMessage(null);
    const res = await fetch(`/api/lists/${listId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    });
    if (res.ok) {
      setMessage('Listeye eklendi.');
      return;
    }
    const body = (await res.json()) as { error?: { message?: string } };
    setMessage(body.error?.message ?? 'Eklenemedi.');
  }

  if (!viewerHandle) {
    return (
      <button
        disabled
        title="Giriş yapman gerekiyor"
        className="cursor-not-allowed rounded-lg border border-line px-4 font-display text-[14px] font-semibold uppercase tracking-wide text-muted"
      >
        Listeye
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className="rounded-lg border border-line px-4 py-2.5 font-display text-[14px] font-semibold uppercase tracking-wide text-dim"
      >
        Listeye
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-lg border border-line bg-surface p-2 shadow-xl shadow-black/40">
          {loading ? (
            <p className="px-2 py-1.5 font-mono text-[10px] text-muted">Yükleniyor…</p>
          ) : lists?.length ? (
            <div className="flex flex-col gap-0.5">
              {lists.map((list) => (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => addTo(list.id)}
                  className="truncate rounded-md px-2 py-1.5 text-left font-sans text-[12.5px] text-dim hover:bg-surface-2"
                >
                  {list.title}
                </button>
              ))}
            </div>
          ) : (
            <p className="px-2 py-1.5 font-mono text-[10px] leading-relaxed text-muted">
              Henüz bir listen yok.{' '}
              <Link href="/lists/new" className="text-amber">
                Yeni liste
              </Link>
            </p>
          )}
          {message ? <p className="mt-1 px-2 py-1 font-mono text-[10px] text-amber">{message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
