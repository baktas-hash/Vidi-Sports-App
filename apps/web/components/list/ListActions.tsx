'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeleteListButton({ listId }: { listId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onDelete() {
    if (!window.confirm('Bu listeyi silmek istediğine emin misin?')) return;
    setPending(true);
    const res = await fetch(`/api/lists/${listId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/profile');
      return;
    }
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      className="font-display text-[12px] font-semibold uppercase tracking-wide text-red-400 disabled:opacity-60"
    >
      Sil
    </button>
  );
}

export function RemoveItemButton({ listId, position }: { listId: string; position: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onRemove() {
    setPending(true);
    const res = await fetch(`/api/lists/${listId}/items?position=${position}`, { method: 'DELETE' });
    setPending(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onRemove}
      disabled={pending}
      aria-label="Listeden çıkar"
      className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/70 font-mono text-[11px] text-neutral-100 disabled:opacity-60"
    >
      ×
    </button>
  );
}
