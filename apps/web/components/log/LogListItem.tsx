import Link from 'next/link';

import type { LogDetail } from '@/lib/queries/logs';
import { scoreLines } from '@/lib/visuals/scoreLine';
import { getSportAccent } from '@/lib/visuals/sportAccent';
import { Mark, Poster } from '@/components/visuals';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { StarRating } from '@/components/ui/StarRating';

export const MEDIUM_LABEL: Record<string, string> = {
  stadium: 'tribünde',
  tv: 'tv',
  stream: 'canlı yayından',
  radio: 'radyodan',
  highlights: 'özet',
  replay: 'tekrardan',
};

// A single dash-joined line regardless of topology — Poster stacks
// two-line scores vertically, but a feed title only has room for one line.
function titleScore(event: LogDetail['event']): string {
  return scoreLines(event).join('–');
}

// The prototype's covbar(): one box per segment, filled in the sport's
// accent when that segment was actually watched (or all of them, for the
// common "no segments recorded" = watched-the-whole-thing case).
function CoverageBar({
  segments,
  segmentsTotal,
  accent,
}: {
  segments: number[];
  segmentsTotal: number | null;
  accent: string;
}) {
  if (!segmentsTotal) return null;
  const seenAll = segments.length === 0;

  return (
    <div className="mt-2 flex max-w-[190px] gap-0.5">
      {Array.from({ length: segmentsTotal }, (_, i) => i + 1).map((segment) => {
        const on = seenAll || segments.includes(segment);
        return (
          <span
            key={segment}
            className={`h-1 flex-1 rounded-sm ${on ? '' : 'bg-surface-2'}`}
            style={on ? { background: accent } : undefined}
          />
        );
      })}
    </div>
  );
}

// Matches the design prototype's frow(): poster thumbnail, byline with a
// sport chip, a title line built from real team marks + score, competition/
// date/venue, the review, a tag row (medium, coverage, saw-the-ending, likes)
// and the coverage bar. No "kanıtsız" proof-photo tag — that would need a
// real evidence signal the schema doesn't have, so it's left out rather than
// faked.
export function LogListItem({ log }: { log: LogDetail }) {
  const [a, b] = [...log.event.participants].sort((x, y) => x.side - y.side);
  const accent = getSportAccent(log.event.sport.slug);
  const sawEnding = log.coverage.sawEnding;
  const dateLabel = log.event.startsAt
    ? new Date(log.event.startsAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;

  return (
    <Link href={`/logs/${log.id}`} className="flex gap-3 border-b border-line/60 px-4 py-3.5 lg:px-8">
      <div className="w-[84px] flex-none overflow-hidden rounded-[9px] shadow-lg shadow-black/40 lg:w-[120px]">
        <Poster event={log.event} />
      </div>

      <div className="min-w-0 flex-1 lg:max-w-2xl">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <Avatar handle={log.user.handle} size={22} />
          <span className="font-sans text-[12.5px] font-medium text-dim">
            {log.user.displayName ?? log.user.handle}
          </span>
          <span
            className="rounded-full border border-line bg-surface px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide"
            style={{ color: accent }}
          >
            {log.event.sport.name}
          </span>
          <StarRating value={log.rating} />
        </div>

        <h3 className="mb-1 flex flex-wrap items-center gap-1.5 font-display text-[18px] font-bold leading-tight lg:text-[20px]">
          {a ? <Mark entity={a} sportSlug={log.event.sport.slug} size={20} /> : null}
          <span>{a?.name}</span>
          <b className="tabular-nums text-muted">{titleScore(log.event)}</b>
          <span>{b?.name}</span>
          {b ? <Mark entity={b} sportSlug={log.event.sport.slug} size={20} /> : null}
        </h3>

        <div className="mb-1.5 font-mono text-[9.5px] text-muted">
          {log.event.competition?.name ?? log.event.sport.name}
          {dateLabel ? ` · ${dateLabel}` : ''}
          {log.event.venue ? ` · ${log.event.venue}` : ''}
        </div>

        {log.review ? (
          <p className="mb-2 line-clamp-3 font-serif text-[13.5px] leading-relaxed text-neutral-300">{log.review}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone={log.medium === 'stadium' ? 'accent' : 'default'}>{MEDIUM_LABEL[log.medium] ?? log.medium}</Chip>
          {log.coverage.label ? <Chip>{log.coverage.label}</Chip> : null}
          {sawEnding === true ? <Chip tone="positive">sonunu gördü</Chip> : null}
          {sawEnding === false ? <Chip tone="negative">sonunu görmedi</Chip> : null}
          <Chip>♥ {log.likeCount}</Chip>
        </div>

        <CoverageBar segments={log.segments} segmentsTotal={log.coverage.segmentsTotal} accent={accent} />
      </div>
    </Link>
  );
}
