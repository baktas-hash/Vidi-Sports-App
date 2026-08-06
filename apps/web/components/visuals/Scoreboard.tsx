import { Fragment } from 'react';

import { getSportAccent } from '@/lib/visuals/sportAccent';

import { Mark } from './Mark';

export interface ScoreboardParticipant {
  entityId: string;
  slug: string;
  name: string;
  shortName: string | null;
  side: number;
  score: number | null;
  scoreDetail: unknown;
  outcome: string | null;
}

export interface ScoreboardEvent {
  sport: { slug: string; topology: string };
  participants: ScoreboardParticipant[];
}

function ownSetValues(detail: unknown): number[] | null {
  const sets = (detail as { sets?: unknown } | null)?.sets;
  if (!Array.isArray(sets)) return null;
  // Flat [own1, opp1, own2, opp2, ...] — this participant's own value per set.
  const values: number[] = [];
  for (let i = 0; i < sets.length; i += 2) values.push(sets[i] as number);
  return values;
}

function inningsValues(detail: unknown): number[] | null {
  const innings = (detail as { innings?: unknown } | null)?.innings;
  return Array.isArray(innings) ? (innings as number[]) : null;
}

function sortBySide<T extends { side: number }>(participants: T[]): [T | undefined, T | undefined] {
  const sorted = [...participants].sort((a, b) => a.side - b.side);
  return [sorted[0], sorted[1]];
}

function BigScore({ event, accent }: { event: ScoreboardEvent; accent: string }) {
  const [p1, p2] = sortBySide(event.participants);
  if (!p1 || !p2) return null;
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-4">
      <Mark entity={p1} sportSlug={event.sport.slug} size={44} />
      <span className="font-display text-[46px] font-extrabold leading-none tabular-nums" style={{ color: accent }}>
        {p1.score ?? '–'}
      </span>
      <span className="h-8 w-0.5 shrink-0 bg-white/15" />
      <span className="font-display text-[46px] font-extrabold leading-none tabular-nums" style={{ color: accent }}>
        {p2.score ?? '–'}
      </span>
      <Mark entity={p2} sportSlug={event.sport.slug} size={44} />
    </div>
  );
}

function Grid({
  event,
  accent,
  columnLabel,
  getValues,
}: {
  event: ScoreboardEvent;
  accent: string;
  columnLabel: string;
  getValues: (detail: unknown) => number[] | null;
}) {
  const [p1, p2] = sortBySide(event.participants);
  if (!p1 || !p2) return null;

  const v1 = getValues(p1.scoreDetail) ?? [];
  const v2 = getValues(p2.scoreDetail) ?? [];
  const columnCount = Math.max(v1.length, v2.length, 1);
  const columns = Array.from({ length: columnCount }, (_, i) => i + 1);
  const rows = [
    { p: p1, values: v1 },
    { p: p2, values: v2 },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-wider text-neutral-500">
        <span className="ml-auto">{columnLabel}</span>
      </div>
      <div
        className="grid items-center"
        style={{ gridTemplateColumns: `minmax(0,1fr) repeat(${columnCount}, 26px) 54px` }}
      >
        <div />
        {columns.map((c) => (
          <div key={c} className="py-1 text-center font-mono text-[8px] uppercase text-neutral-500">
            {c}
          </div>
        ))}
        <div className="py-1 text-center font-mono text-[8px] uppercase text-neutral-500">T</div>
        {rows.map(({ p, values }) => {
          const win = p.outcome === 'win';
          return (
            <Fragment key={p.entityId}>
              <div className={`flex min-w-0 items-center gap-1.5 px-2.5 py-1.5 ${win ? '' : 'opacity-50'}`}>
                <Mark entity={p} sportSlug={event.sport.slug} size={19} />
                <span className="truncate font-display text-[14.5px] font-semibold">{p.name}</span>
              </div>
              {columns.map((_, i) => (
                <div
                  key={i}
                  className={`py-1.5 text-center font-display text-[14px] font-bold tabular-nums ${
                    win ? 'text-neutral-100' : 'text-neutral-500'
                  }`}
                >
                  {values[i] ?? '–'}
                </div>
              ))}
              <div
                className="py-1.5 text-center font-display text-[20px] font-extrabold tabular-nums"
                style={{ color: win ? accent : undefined }}
              >
                {p.score ?? '–'}
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

// Dispatches on sport.topology, not sport slug or a curated lookup — the
// schema's own design intent (see sport.topology's migration comment) is
// that topology is the one sport-specific thing coverage/scoring needs.
export function Scoreboard({ event }: { event: ScoreboardEvent }) {
  const accent = getSportAccent(event.sport.slug);

  switch (event.sport.topology) {
    case 'set_based':
      return <Grid event={event} accent={accent} columnLabel="SET" getValues={ownSetValues} />;
    case 'innings_based':
      return <Grid event={event} accent={accent} columnLabel="DEVRE" getValues={inningsValues} />;
    case 'timed_halves':
    case 'timed_periods':
    case 'round_based':
    case 'stage_based':
    default:
      return <BigScore event={event} accent={accent} />;
  }
}
