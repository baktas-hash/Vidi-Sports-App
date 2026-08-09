'use client';

import { useState } from 'react';

import type { LogDetail } from '@/lib/queries/logs';
import type { ListSummary } from '@/lib/queries/lists';
import { EmptyState } from '@/components/ui/EmptyState';
import { StarRating } from '@/components/ui/StarRating';
import { EventPosterCard } from '@/components/event/EventPosterCard';
import { ListCard } from '@/components/list/ListCard';

const TABS = [
  { key: 'diary', label: 'Günlük' },
  { key: 'lists', label: 'Listeler' },
  { key: 'activity', label: 'Aktivite' },
] as const;

function groupByMonth(logs: LogDetail[]): Array<[string, LogDetail[]]> {
  const groups = new Map<string, LogDetail[]>();
  for (const log of logs) {
    const key = new Date(log.watchedOn).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    const bucket = groups.get(key) ?? [];
    bucket.push(log);
    groups.set(key, bucket);
  }
  return [...groups.entries()];
}

export function ProfileTabs({ diary, lists }: { diary: LogDetail[]; lists: ListSummary[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('diary');
  const months = groupByMonth(diary);

  return (
    <div>
      <div className="flex justify-center gap-6 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`border-b-2 py-3 font-display text-[14px] font-bold uppercase tracking-wide ${
              tab === t.key ? 'border-amber text-ink' : 'border-transparent text-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'diary' ? (
        diary.length ? (
          months.map(([month, logs]) => (
            <div key={month}>
              <div className="mx-4 mb-2.5 mt-4 border-b border-line pb-1.5 lg:mx-8">
                <h2 className="font-display text-[13.5px] font-bold uppercase tracking-wider text-dim">{month}</h2>
              </div>
              <div className="grid grid-cols-3 gap-2 px-4 pb-2 lg:grid-cols-6 lg:gap-3 lg:px-8">
                {logs.map((log) => {
                  const [a, b] = [...log.event.participants].sort((x, y) => x.side - y.side);
                  return (
                    <div key={log.id}>
                      <EventPosterCard event={log.event} rating={log.rating} />
                      <div className="mt-1.5 truncate font-display text-[12px] font-semibold leading-tight">
                        {a?.name} – {b?.name}
                      </div>
                      <StarRating value={log.rating} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <EmptyState>Henüz bir şey loglamadın.</EmptyState>
        )
      ) : tab === 'lists' ? (
        <div className="pt-3">
          {lists.length ? (
            <div className="px-4 lg:px-8">
              {lists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </div>
          ) : (
            <EmptyState>Henüz bir liste yok.</EmptyState>
          )}
        </div>
      ) : (
        <div className="pt-3">
          <EmptyState>Aktivite akışı yakında.</EmptyState>
        </div>
      )}
    </div>
  );
}
