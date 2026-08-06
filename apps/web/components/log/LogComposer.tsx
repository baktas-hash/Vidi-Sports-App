'use client';

import { useState } from 'react';

import type { EventCard } from '@/lib/queries/events';

import { EventPicker } from './EventPicker';
import { LogForm, type ComposerEvent } from './LogForm';

export function LogComposer({ prefillEvent }: { prefillEvent: ComposerEvent | null }) {
  const [event, setEvent] = useState<ComposerEvent | null>(prefillEvent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function selectEvent(picked: EventCard) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/events/${picked.slug}`);
    if (!res.ok) {
      setError('Event yüklenemedi.');
      setLoading(false);
      return;
    }
    setEvent(await res.json());
    setLoading(false);
  }

  if (!event) {
    return (
      <div>
        <EventPicker onSelect={selectEvent} />
        {loading ? <p className="mt-2 font-mono text-[11px] text-muted">Yükleniyor…</p> : null}
        {error ? <p className="mt-2 font-sans text-[12.5px] text-red-400">{error}</p> : null}
      </div>
    );
  }

  return <LogForm event={event} onChangeEvent={() => setEvent(null)} />;
}
