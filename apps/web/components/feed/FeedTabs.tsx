'use client';

import Link from 'next/link';
import { useState } from 'react';

import type { Feed } from '@/lib/queries/logs';
import { EmptyState } from '@/components/ui/EmptyState';
import { LogListItem } from '@/components/log/LogListItem';

type Tab = 'following' | 'discover';

export function FeedTabs({
  initialFollowing,
  initialDiscover,
  loggedIn,
}: {
  initialFollowing: Feed;
  initialDiscover: Feed;
  loggedIn: boolean;
}) {
  const [tab, setTab] = useState<Tab>(loggedIn ? 'following' : 'discover');
  const [following, setFollowing] = useState(initialFollowing);
  const [discover, setDiscover] = useState(initialDiscover);
  const [loadingMore, setLoadingMore] = useState(false);

  const active = tab === 'following' ? following : discover;
  const setActive = tab === 'following' ? setFollowing : setDiscover;

  async function loadMore() {
    if (!active.nextCursor || loadingMore) return;
    setLoadingMore(true);
    const scope = tab === 'following' ? 'following' : 'global';
    const res = await fetch(`/api/logs?scope=${scope}&cursor=${encodeURIComponent(active.nextCursor)}&limit=10`);
    const body = (await res.json()) as Feed;
    setActive((prev) => ({ items: [...prev.items, ...body.items], nextCursor: body.nextCursor }));
    setLoadingMore(false);
  }

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <div className="flex gap-2 px-4 pt-3 lg:px-8">
        <button
          type="button"
          onClick={() => setTab('following')}
          disabled={!loggedIn}
          className={`flex-1 rounded-full py-2 font-display text-[13px] font-bold uppercase tracking-wide disabled:opacity-40 ${
            tab === 'following' ? 'bg-ink text-neutral-950' : 'border border-line text-muted'
          }`}
        >
          Takip ettiklerin
        </button>
        <button
          type="button"
          onClick={() => setTab('discover')}
          className={`flex-1 rounded-full py-2 font-display text-[13px] font-bold uppercase tracking-wide ${
            tab === 'discover' ? 'bg-ink text-neutral-950' : 'border border-line text-muted'
          }`}
        >
          Keşif
        </button>
      </div>

      <div className="mt-3">
        {!loggedIn && tab === 'following' ? (
          <EmptyState>
            Takip ettiklerini görmek için{' '}
            <Link href="/login" className="text-amber">
              giriş yap
            </Link>
            .
          </EmptyState>
        ) : active.items.length ? (
          <>
            {active.items.map((log) => (
              <LogListItem key={log.id} log={log} />
            ))}
            {active.nextCursor ? (
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="mx-auto my-4 block rounded-full border border-line px-5 py-2 font-display text-[12.5px] font-semibold uppercase tracking-wide text-dim"
              >
                {loadingMore ? 'Yükleniyor…' : 'Daha fazla'}
              </button>
            ) : null}
          </>
        ) : (
          <EmptyState>
            {tab === 'following' ? 'Henüz takip ettiğin kimse loglamadı.' : 'Henüz kimse loglamadı.'}
          </EmptyState>
        )}
      </div>
    </div>
  );
}
