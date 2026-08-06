import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getSessionUser } from '@/lib/auth/session';
import { getLogForViewer } from '@/lib/queries/logs';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { StarRating } from '@/components/ui/StarRating';
import { MEDIUM_LABEL } from '@/components/log/LogListItem';
import { ProofImage, Scoreboard, ShareCard } from '@/components/visuals';

export default async function LogViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const log = await getLogForViewer(id, user?.id ?? null);
  if (!log) notFound();

  const [a, b] = [...log.event.participants].sort((x, y) => x.side - y.side);
  const watchedOnLabel = new Date(log.watchedOn).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="px-4 pt-4 lg:mx-auto lg:max-w-2xl lg:px-8">
      <Scoreboard event={log.event} />

      <div className="mt-3.5 flex items-center gap-2">
        <Avatar handle={log.user.handle} />
        <span className="font-sans text-[13px] font-medium text-dim">{log.user.displayName ?? log.user.handle}</span>
        <span className="ml-auto">
          <StarRating value={log.rating} size="md" />
        </span>
      </div>

      <Link href={`/events/${log.event.slug}`} className="mt-3 block">
        <h1 className="font-display text-[22px] font-extrabold uppercase leading-tight">
          {a?.name} – {b?.name}
        </h1>
      </Link>
      <p className="mt-1 font-mono text-[9.5px] text-muted">
        {watchedOnLabel}
        {log.event.venue ? ` · ${log.event.venue}` : ''}
      </p>

      {log.review ? (
        <p className="mt-3 font-serif text-[14.5px] leading-relaxed text-neutral-200">{log.review}</p>
      ) : null}

      {log.medium === 'stadium' ? (
        <div className="mt-3.5">
          <div className="mb-1.5 font-mono text-[8.5px] uppercase tracking-wide text-muted">Kanıt · tribün logu</div>
          <div className="flex gap-2">
            <div className="w-28 flex-none overflow-hidden rounded-md border border-line">
              <ProofImage
                kind="crowd"
                logId={log.id}
                competitionSlug={log.event.competition?.slug ?? null}
                competitionName={log.event.competition?.name ?? ''}
                homeName={a?.name ?? ''}
                awayName={b?.name ?? ''}
                venue={log.event.venue}
                date={watchedOnLabel}
                width={240}
              />
            </div>
            <div className="w-28 flex-none overflow-hidden rounded-md border border-line">
              <ProofImage
                kind="stub"
                logId={log.id}
                competitionSlug={log.event.competition?.slug ?? null}
                competitionName={log.event.competition?.name ?? ''}
                homeName={a?.name ?? ''}
                awayName={b?.name ?? ''}
                venue={log.event.venue}
                date={watchedOnLabel}
                seat={log.ticketRef}
                width={240}
              />
            </div>
          </div>
          <p className="mt-1.5 font-mono text-[9px] text-muted">
            Büyütmek için dokun. Koçan biletin varlığını kanıtlar, katılımı kanıtlamaz.
          </p>
        </div>
      ) : null}

      <div className="mt-3.5 flex flex-wrap gap-1.5">
        <Chip tone={log.medium === 'stadium' ? 'accent' : 'default'}>{MEDIUM_LABEL[log.medium] ?? log.medium}</Chip>
        {log.coverage.label ? <Chip>{log.coverage.label}</Chip> : null}
        {log.isRewatch ? <Chip>tekrar izleme</Chip> : null}
        {log.visibility !== 'public' ? (
          <Chip tone="negative">{log.visibility === 'private' ? 'sadece ben' : 'takipçiler'}</Chip>
        ) : null}
      </div>

      <div className="mt-3.5 flex items-center gap-3">
        <button
          type="button"
          disabled
          title="Beğeni yakında"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-muted"
        >
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M20.8 4.6c-1.6-1.6-4.2-1.6-5.8 0L12 7.6 9 4.6c-1.6-1.6-4.2-1.6-5.8 0-1.6 1.6-1.6 4.2 0 5.8L12 19l8.8-8.6c1.6-1.6 1.6-4.2 0-5.8z" />
          </svg>
          <span className="font-mono text-[10.5px]">{log.likeCount}</span>
        </button>
      </div>

      <div className="mt-5 border-b border-line pb-1.5">
        <h2 className="font-display text-[13.5px] font-bold uppercase tracking-wider text-dim">
          {log.commentCount} yorum · tek konuşma yüzeyi
        </h2>
      </div>
      <p className="py-4 font-sans text-[12.5px] text-muted">
        Henüz yorum yok. İlk yorumu sen yaz — burada kalıcı olarak durur.
      </p>

      <div className="mt-2 border-b border-line pb-1.5">
        <h2 className="font-display text-[13.5px] font-bold uppercase tracking-wider text-dim">Paylaşım kartı</h2>
      </div>
      <div className="mt-3 overflow-hidden rounded-lg border border-line">
        <ShareCard
          data={{
            event: log.event,
            venue: log.event.venue,
            watchedOn: watchedOnLabel,
            rating: log.rating,
            userHandle: log.user.handle,
          }}
        />
      </div>
    </div>
  );
}
