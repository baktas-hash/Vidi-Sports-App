import { getCompetitionTheme } from '@/lib/visuals/competitionTheme';

import { Art } from './Art';

export interface BannerEvent {
  competition: { slug: string; name: string } | null;
  participants: Array<{ slug: string; name: string; side: number }>;
}

// Wide, score-less card for recommendation rails — the event hasn't been
// played (or its result isn't the point) so there's nothing to score yet.
export function Banner({
  event,
  width = 392,
  height = 118,
}: {
  event: BannerEvent;
  width?: number;
  height?: number;
}) {
  const theme = getCompetitionTheme(event.competition?.slug ?? 'no-competition');
  const [a, b] = [...event.participants].sort((x, y) => x.side - y.side);
  const label = a && b ? `${a.name} – ${b.name}${event.competition ? `, ${event.competition.name}` : ''}` : 'Banner';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={label}
    >
      <Art competitionSlug={event.competition?.slug ?? null} width={width} height={height * 2.6} />
      <text x={16} y={26} fontFamily="var(--font-mono)" fontSize={9.5} letterSpacing={1.6} fill={theme.accent}>
        {(event.competition?.name ?? '').toLocaleUpperCase('tr-TR')}
      </text>
      <text x={16} y={height - 34} fontFamily="var(--font-sans)" fontSize={17} fill={theme.ink} opacity={0.92}>
        {a?.name}
      </text>
      <text x={16} y={height - 14} fontFamily="var(--font-sans)" fontSize={17} fill={theme.ink} opacity={0.92}>
        {b?.name}
      </text>
      <text
        x={width - 16}
        y={26}
        textAnchor="end"
        fontFamily="var(--font-display)"
        fontWeight={800}
        fontSize={10}
        letterSpacing={2.4}
        fill={theme.ink}
        opacity={0.45}
      >
        VIDI
      </text>
    </svg>
  );
}
