import Link from 'next/link';

import type { LogDetail } from '@/lib/queries/logs';
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

export function LogListItem({ log }: { log: LogDetail }) {
  return (
    <Link href={`/logs/${log.id}`} className="flex gap-3 border-b border-line/60 px-4 py-3.5 lg:px-8">
      <Avatar handle={log.user.handle} />
      <div className="min-w-0 flex-1 lg:max-w-2xl">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-sans text-[12px] font-medium text-dim">{log.user.displayName ?? log.user.handle}</span>
          <StarRating value={log.rating} />
        </div>
        {log.review ? (
          <p className="mb-1.5 line-clamp-3 font-serif text-[13px] leading-relaxed text-neutral-300">{log.review}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone={log.medium === 'stadium' ? 'accent' : 'default'}>{MEDIUM_LABEL[log.medium] ?? log.medium}</Chip>
          {log.coverage.label ? <Chip>{log.coverage.label}</Chip> : null}
        </div>
      </div>
    </Link>
  );
}
