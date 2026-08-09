'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

const VISIBILITY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'public', label: 'Herkese açık' },
  { value: 'followers', label: 'Takipçiler' },
  { value: 'private', label: 'Sadece ben' },
];

export function CreateListForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isRanked, setIsRanked] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setError(null);
    setPending(true);

    const res = await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: description.trim() || undefined,
        isRanked,
        visibility,
      }),
    });

    if (res.ok) {
      const list = (await res.json()) as { id: string };
      router.push(`/lists/${list.id}`);
      return;
    }

    const body = (await res.json()) as { error?: { message?: string } };
    setError(body.error?.message ?? 'Liste kaydedilemedi.');
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-8">
      <div>
        <label className="mb-1.5 block font-mono text-[9px] uppercase tracking-wide text-muted">Başlık</label>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Gördüğüm en iyi beşinci setler"
          required
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] outline-none focus:border-amber"
        />
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[9px] uppercase tracking-wide text-muted">
          Açıklama (opsiyonel)
        </label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] leading-relaxed outline-none focus:border-amber"
        />
      </div>

      <label className="flex items-center gap-2 font-sans text-[13px] text-dim">
        <input type="checkbox" checked={isRanked} onChange={(event) => setIsRanked(event.target.checked)} />
        Sıralı liste (1'den başlayarak numaralanır)
      </label>

      <div>
        <label className="mb-1.5 block font-mono text-[9px] uppercase tracking-wide text-muted">Görünürlük</label>
        <div className="flex gap-1.5">
          {VISIBILITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setVisibility(opt.value)}
              className={`flex-1 rounded-full py-1.5 font-display text-[12px] font-semibold ${
                visibility === opt.value ? 'bg-ink text-neutral-950' : 'border border-line text-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="font-sans text-[12.5px] text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={pending || !title.trim()}
        className="rounded-lg bg-amber py-3 font-display text-[15px] font-bold uppercase tracking-wide text-neutral-950 disabled:opacity-60"
      >
        {pending ? 'Kaydediliyor…' : 'Listeyi oluştur'}
      </button>
    </form>
  );
}
