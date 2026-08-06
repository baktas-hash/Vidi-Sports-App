import { getCompetitionTheme } from '@/lib/visuals/competitionTheme';
import { scoreLines, type ScoreLineEvent } from '@/lib/visuals/scoreLine';

import { Art } from './Art';

export interface PosterEvent extends ScoreLineEvent {
  competition: { slug: string; name: string } | null;
  participants: Array<{ slug: string; name: string; side: number; score: number | null }>;
}

// The 2:3 vertical card used everywhere a wall/grid/feed thumbnail needs one.
// Pure art — rating badges, avatars and nicknames are plain HTML laid over
// this by the caller (the original prototype's pcell() does the same split).
//
// Renders at 100% of whatever box the caller puts it in (a grid cell, a
// fixed-width wrapper div) — `width` is only the internal viewBox reference
// used to keep the coordinate math readable, not the displayed pixel size.
export function Poster({ event, width = 300 }: { event: PosterEvent; width?: number }) {
  const height = width * 1.5;
  const scale = width / 300;
  const theme = getCompetitionTheme(event.competition?.slug ?? 'no-competition');
  const [a, b] = [...event.participants].sort((x, y) => x.side - y.side);
  const lines = scoreLines(event);
  const two = lines.length === 2;
  // The score/team names live only inside this SVG's <text> nodes — hiding
  // it from the accessibility tree would drop real information, not just
  // decoration. One label on the whole graphic, not per-node exposure.
  const label = a && b ? `${a.name} ${lines.join('–')} ${b.name}` : 'Poster';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" className="block" role="img" aria-label={label}>
      <Art competitionSlug={event.competition?.slug ?? null} width={width} height={height} />
      <text
        x={16 * scale}
        y={26 * scale}
        fontFamily="var(--font-mono)"
        fontSize={9.5 * scale}
        letterSpacing={1.4 * scale}
        fill={theme.accent}
      >
        {(event.competition?.name ?? '').toLocaleUpperCase('tr-TR')}
      </text>
      <text
        x={16 * scale}
        y={height - (two ? 72 : 64) * scale}
        fontFamily="var(--font-display)"
        fontWeight={800}
        fontSize={(two ? 40 : 62) * scale}
        fill={theme.ink}
        letterSpacing={-1.5 * scale}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {lines[0]}
      </text>
      {two ? (
        <text
          x={16 * scale}
          y={height - 26 * scale}
          fontFamily="var(--font-display)"
          fontWeight={800}
          fontSize={40 * scale}
          fill={theme.ink}
          opacity={0.55}
          letterSpacing={-1.5 * scale}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {lines[1]}
        </text>
      ) : null}
      <text
        x={16 * scale}
        y={height - (two ? 150 : 40) * scale}
        fontFamily="var(--font-sans)"
        fontSize={11 * scale}
        fill={theme.ink}
        opacity={0.72}
      >
        {a?.name}
      </text>
      <text
        x={16 * scale}
        y={height - (two ? 134 : 26) * scale}
        fontFamily="var(--font-sans)"
        fontSize={11 * scale}
        fill={theme.ink}
        opacity={0.72}
      >
        {b?.name}
      </text>
      <text
        x={width - 16 * scale}
        y={26 * scale}
        textAnchor="end"
        fontFamily="var(--font-display)"
        fontWeight={800}
        fontSize={10 * scale}
        letterSpacing={2.4 * scale}
        fill={theme.ink}
        opacity={0.5}
      >
        VIDI
      </text>
    </svg>
  );
}
