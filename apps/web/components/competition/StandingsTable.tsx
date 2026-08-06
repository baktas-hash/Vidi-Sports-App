import type { StandingsRow } from '@/lib/queries/competitions';
import { Mark } from '@/components/visuals';

const FORM_BADGE: Record<string, { letter: string; className: string }> = {
  win: { letter: 'W', className: 'bg-emerald-400 text-neutral-950' },
  loss: { letter: 'L', className: 'bg-red-400 text-neutral-950' },
  draw: { letter: 'D', className: 'bg-neutral-500 text-neutral-950' },
};

function FormBadge({ outcome }: { outcome: string }) {
  const badge = FORM_BADGE[outcome] ?? { letter: '?', className: 'bg-neutral-700 text-neutral-300' };
  return (
    <span className={`grid h-3.5 w-3.5 flex-none place-items-center rounded font-display text-[9px] font-bold ${badge.className}`}>
      {badge.letter}
    </span>
  );
}

export function StandingsTable({ rows, sportSlug }: { rows: StandingsRow[]; sportSlug: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-full border-collapse px-3">
        <thead>
          <tr className="border-b border-line">
            <th className="w-6 py-2 pl-3 text-left font-mono text-[8px] uppercase text-neutral-500">#</th>
            <th className="text-left font-mono text-[8px] uppercase text-neutral-500">Takım</th>
            <th className="w-7 text-right font-mono text-[8px] uppercase text-neutral-500">O</th>
            <th className="w-7 text-right font-mono text-[8px] uppercase text-neutral-500">G</th>
            <th className="w-7 text-right font-mono text-[8px] uppercase text-neutral-500">M</th>
            <th className="w-9 py-2 pr-3 text-right font-mono text-[8px] uppercase text-neutral-500">P</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.entity.id} className="border-b border-line/60 last:border-0">
              <td className={`py-2 pl-3 font-display text-[13px] font-bold ${i === 0 ? 'text-amber' : 'text-dim'}`}>
                {i + 1}
              </td>
              <td className="py-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <Mark entity={row.entity} sportSlug={sportSlug} size={17} />
                  <span className="truncate font-display text-[14px] font-semibold">{row.entity.name}</span>
                </div>
              </td>
              <td className="text-right font-display text-[13px] text-dim">{row.played}</td>
              <td className="text-right font-display text-[13px] text-dim">{row.won}</td>
              <td className="text-right font-display text-[13px] text-dim">{row.lost}</td>
              <td className="py-2 pr-3 text-right font-display text-[15px] font-extrabold text-ink">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-line px-3 py-2.5">
        <div className="mb-2 font-mono text-[8px] uppercase tracking-wide text-neutral-500">Form</div>
        <div className="flex flex-col gap-1.5">
          {rows.slice(0, 4).map((row) => (
            <div key={row.entity.id} className="flex items-center gap-2">
              <Mark entity={row.entity} sportSlug={sportSlug} size={17} />
              <span className="flex-1 truncate font-display text-[13px] font-medium text-dim">{row.entity.name}</span>
              <div className="flex gap-1">
                {row.recentForm.map((outcome, i) => (
                  <FormBadge key={i} outcome={outcome} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
