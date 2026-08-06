import { getCompetitionTheme } from '@/lib/visuals/competitionTheme';
import { scoreLines } from '@/lib/visuals/scoreLine';

import { Art } from './Art';
import type { PosterEvent } from './Poster';

export interface ShareCardData {
  event: PosterEvent;
  venue: string | null;
  watchedOn: string;
  rating: number | null;
  userHandle: string;
}

// The 1200x630 og:image-shaped card shown on a log's own page — this is the
// in-app equivalent of the prototype's shareCard(); a real SSR'd
// opengraph-image sharing this exact art system is a deliberate follow-up,
// not part of this pass (Satori's renderer doesn't guarantee 1:1 fidelity
// with the hand-drawn motifs here).
export function ShareCard({ data }: { data: ShareCardData }) {
  const { event, venue, watchedOn, rating, userHandle } = data;
  const width = 1200;
  const height = 630;
  const theme = getCompetitionTheme(event.competition?.slug ?? 'no-competition');
  const [a, b] = [...event.participants].sort((x, y) => x.side - y.side);
  const lines = scoreLines(event);
  const two = lines.length === 2;
  const label =
    a && b ? `${userHandle}: ${a.name} ${lines.join('–')} ${b.name}, ${watchedOn}` : `${userHandle} paylaşım kartı`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={label}>
      <Art competitionSlug={event.competition?.slug ?? null} width={width} height={height} />
      <text x={56} y={76} fontFamily="var(--font-mono)" fontSize={24} letterSpacing={5} fill={theme.accent}>
        {(event.competition?.name ?? '').toLocaleUpperCase('tr-TR')}
      </text>
      <text
        x={width - 56}
        y={76}
        textAnchor="end"
        fontFamily="var(--font-display)"
        fontWeight={800}
        fontSize={26}
        letterSpacing={7}
        fill={theme.ink}
        opacity={0.55}
      >
        VIDI
      </text>
      <text x={56} y={two ? 330 : 340} fontFamily="var(--font-sans)" fontSize={46} fill={theme.ink} opacity={0.85}>
        {a?.name}
      </text>
      <text x={56} y={two ? 392 : 406} fontFamily="var(--font-sans)" fontSize={46} fill={theme.ink} opacity={0.85}>
        {b?.name}
      </text>
      <text
        x={width - 56}
        y={two ? 350 : 392}
        textAnchor="end"
        fontFamily="var(--font-display)"
        fontWeight={800}
        fontSize={two ? 128 : 172}
        fill={theme.ink}
        letterSpacing={-6}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {lines[0]}
      </text>
      {two ? (
        <text
          x={width - 56}
          y={462}
          textAnchor="end"
          fontFamily="var(--font-display)"
          fontWeight={800}
          fontSize={128}
          fill={theme.ink}
          opacity={0.55}
          letterSpacing={-6}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {lines[1]}
        </text>
      ) : null}
      <line x1={56} y1={height - 118} x2={width - 56} y2={height - 118} stroke={theme.ink} opacity={0.22} strokeWidth={2} />
      <text x={56} y={height - 64} fontFamily="var(--font-mono)" fontSize={24} fill={theme.ink} opacity={0.7}>
        {watchedOn}
        {venue ? ` · ${venue}` : ''}
      </text>
      <text x={width - 56} y={height - 64} textAnchor="end" fontFamily="var(--font-display)" fontWeight={700} fontSize={30} fill={theme.accent}>
        {userHandle} · {rating ? rating.toFixed(1).replace('.', ',') : '–'}
      </text>
    </svg>
  );
}
