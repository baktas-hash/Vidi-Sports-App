import { searchCompetitions } from '@/lib/queries/competitions';
import { CompetitionCard } from '@/components/competition/CompetitionCard';

export default async function CompetitionsPage() {
  const competitions = await searchCompetitions({ limit: 50 });

  return (
    <div>
      <div className="mx-4 mb-2.5 mt-4 border-b border-line pb-1.5">
        <h2 className="font-display text-[13.5px] font-bold uppercase tracking-wider text-dim">
          Turnuvalar · {competitions.length}
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 pb-4 lg:grid-cols-4 lg:gap-3 lg:px-8">
        {competitions.map((competition) => (
          <CompetitionCard key={competition.id} competition={competition} />
        ))}
      </div>
    </div>
  );
}
