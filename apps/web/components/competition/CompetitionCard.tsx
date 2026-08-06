import Link from 'next/link';

import type { CompetitionSummary } from '@/lib/queries/competitions';
import { getCompetitionTheme } from '@/lib/visuals/competitionTheme';

export function CompetitionCard({ competition }: { competition: CompetitionSummary }) {
  const theme = getCompetitionTheme(competition.slug);
  return (
    <Link
      href={`/competitions/${competition.slug}`}
      className="rounded-xl border p-3"
      style={{ borderColor: `${theme.accent}40`, background: theme.bg }}
    >
      <h4 className="font-display text-[15px] font-bold uppercase leading-tight" style={{ color: theme.accent }}>
        {competition.displayName}
      </h4>
      <p className="mt-1 font-mono text-[8.5px] uppercase tracking-wide text-muted">
        {competition.sport.name} · {competition.eventCount} event
      </p>
    </Link>
  );
}
