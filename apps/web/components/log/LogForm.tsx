'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import type { EventDetail } from '@/lib/queries/events';

import { StarPicker } from './StarPicker';

const MEDIUM_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'stadium', label: 'Tribünde' },
  { value: 'tv', label: 'TV' },
  { value: 'stream', label: 'Canlı yayından' },
  { value: 'radio', label: 'Radyodan' },
  { value: 'highlights', label: 'Özet' },
  { value: 'replay', label: 'Tekrardan' },
];

const VISIBILITY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'public', label: 'Herkese açık' },
  { value: 'followers', label: 'Takipçiler' },
  { value: 'private', label: 'Sadece ben' },
];

export type ComposerEvent = Pick<EventDetail, 'id' | 'slug' | 'segmentCountActual' | 'format' | 'participants'>;

export function LogForm({ event, onChangeEvent }: { event: ComposerEvent; onChangeEvent: () => void }) {
  const router = useRouter();
  const [medium, setMedium] = useState('stadium');
  const [watchedOn, setWatchedOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [rating, setRating] = useState<number | null>(null);
  const [atmosphere, setAtmosphere] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [ticketRef, setTicketRef] = useState('');
  const [isLiveWatch, setIsLiveWatch] = useState(true);
  const [isRewatch, setIsRewatch] = useState(false);
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [segments, setSegments] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const segmentCount = event.segmentCountActual ?? event.format?.segmentCount ?? null;
  const segmentLabel = event.format?.segmentLabel ?? 'bölüm';
  const [a, b] = [...event.participants].sort((x, y) => x.side - y.side);

  function toggleSegment(index: number) {
    setSegments((prev) => (prev.includes(index) ? prev.filter((s) => s !== index) : [...prev, index].sort((x, y) => x - y)));
  }

  async function onSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setError(null);
    setPending(true);

    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: event.id,
        medium,
        watchedOn,
        rating: rating ?? undefined,
        atmosphere: atmosphere ?? undefined,
        review: review.trim() || undefined,
        hasSpoilers,
        isLiveWatch,
        isRewatch,
        ticketRef: ticketRef.trim() || undefined,
        segments: segments.length ? segments : undefined,
        visibility,
      }),
    });

    if (res.ok) {
      const log = (await res.json()) as { id: string };
      router.push(`/logs/${log.id}`);
      return;
    }

    const body = (await res.json()) as { error?: { message?: string } };
    setError(body.error?.message ?? 'Log kaydedilemedi.');
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2.5">
        <span className="min-w-0 truncate font-display text-[14.5px] font-semibold">
          {a?.name} – {b?.name}
        </span>
        <button type="button" onClick={onChangeEvent} className="flex-none font-mono text-[10px] text-amber">
          değiştir
        </button>
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[9px] uppercase tracking-wide text-muted">Mecra</label>
        <div className="flex flex-wrap gap-1.5">
          {MEDIUM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMedium(opt.value)}
              className={`rounded-full px-3 py-1.5 font-display text-[12.5px] font-semibold ${
                medium === opt.value ? 'bg-ink text-neutral-950' : 'border border-line text-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {medium === 'stadium' ? (
        <div>
          <label className="mb-1.5 block font-mono text-[9px] uppercase tracking-wide text-muted">
            Koltuk / bilet notu
          </label>
          <input
            value={ticketRef}
            onChange={(event) => setTicketRef(event.target.value)}
            placeholder="Kapalı, Blok 214, Sıra 12"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] outline-none focus:border-amber"
          />
        </div>
      ) : null}

      <StarPicker label="Puan" value={rating} onChange={setRating} />
      <StarPicker label="Atmosfer (opsiyonel)" value={atmosphere} onChange={setAtmosphere} />

      {segmentCount ? (
        <div>
          <label className="mb-1.5 block font-mono text-[9px] uppercase tracking-wide text-muted">
            Kapsam · boş bırakırsan tamamını izledin sayılır
          </label>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: segmentCount }, (_, i) => i + 1).map((index) => (
              <button
                key={index}
                type="button"
                onClick={() => toggleSegment(index)}
                className={`rounded-md px-2.5 py-1.5 font-mono text-[10px] ${
                  segments.includes(index) ? 'bg-amber text-neutral-950' : 'border border-line text-muted'
                }`}
              >
                {index}. {segmentLabel}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <label className="mb-1.5 block font-mono text-[9px] uppercase tracking-wide text-muted">İzleme tarihi</label>
        <input
          type="date"
          value={watchedOn}
          onChange={(event) => setWatchedOn(event.target.value)}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] outline-none focus:border-amber"
        />
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-[9px] uppercase tracking-wide text-muted">Yorum</label>
        <textarea
          value={review}
          onChange={(event) => setReview(event.target.value)}
          rows={4}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] leading-relaxed outline-none focus:border-amber"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 font-sans text-[13px] text-dim">
          <input type="checkbox" checked={!isLiveWatch} onChange={(event) => setIsLiveWatch(!event.target.checked)} />
          Sonucu bilerek sonradan izledim
        </label>
        <label className="flex items-center gap-2 font-sans text-[13px] text-dim">
          <input type="checkbox" checked={isRewatch} onChange={(event) => setIsRewatch(event.target.checked)} />
          Bu bir tekrar izleme
        </label>
        <label className="flex items-center gap-2 font-sans text-[13px] text-dim">
          <input type="checkbox" checked={hasSpoilers} onChange={(event) => setHasSpoilers(event.target.checked)} />
          Yorumda spoiler var
        </label>
      </div>

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
        disabled={pending}
        className="rounded-lg bg-amber py-3 font-display text-[15px] font-bold uppercase tracking-wide text-neutral-950 disabled:opacity-60"
      >
        {pending ? 'Kaydediliyor…' : 'Logla'}
      </button>
    </form>
  );
}
