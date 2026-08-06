import { getCompetitionTheme } from '@/lib/visuals/competitionTheme';

import { renderMotif } from './motifs';

// Background rect + the competition's motif, self-contained so callers don't
// also have to draw the base fill. Callers still call getCompetitionTheme()
// themselves for their own text/accent colors on top.
export function Art({
  competitionSlug,
  width,
  height,
}: {
  competitionSlug: string | null;
  width: number;
  height: number;
}) {
  const theme = getCompetitionTheme(competitionSlug ?? 'no-competition');
  return (
    <>
      <rect width={width} height={height} fill={theme.bg} />
      {renderMotif(theme.motif, width, height, theme.accent)}
    </>
  );
}
