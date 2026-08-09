import type { ViewerStats } from '@/lib/queries/logs';

// TODO: temporary visual-preview fallback so this panel is visible on the
// deployed site before there's a logged-in demo user with real stats there
// (the seed script only ever ran against local dev). Drop MOCK_STATS once
// production has a real viewer to render for. Values match the original
// design prototype's own placeholder numbers.
const MOCK_STATS: ViewerStats = { eventCount: 247, stadiumCount: 12, listCount: 8 };

export function ArchiveStatsPanel({ stats }: { stats: ViewerStats | null }) {
  const shown = stats ?? MOCK_STATS;
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="mb-3 font-display text-[13px] font-bold uppercase tracking-wide text-muted">Senin arşivin</h3>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <b className="block font-display text-[22px] font-extrabold tabular-nums">{shown.eventCount}</b>
          <span className="font-mono text-[8.5px] uppercase tracking-wide text-muted">event</span>
        </div>
        <div>
          <b className="block font-display text-[22px] font-extrabold tabular-nums">{shown.stadiumCount}</b>
          <span className="font-mono text-[8.5px] uppercase tracking-wide text-muted">tribün</span>
        </div>
        <div>
          <b className="block font-display text-[22px] font-extrabold tabular-nums">{shown.listCount}</b>
          <span className="font-mono text-[8.5px] uppercase tracking-wide text-muted">liste</span>
        </div>
      </div>
    </div>
  );
}
