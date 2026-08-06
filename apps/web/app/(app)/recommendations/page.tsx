import { searchEvents } from '@/lib/queries/events';
import { RecCard } from '@/components/recommendation/RecCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

const DISCOVER_WHY = [
  'Yüksek topluluk puanı ve düşük "sonunu görmedi" oranıyla dikkat çekiyor.',
  'Şu anda en çok loglanan event\'lerden biri.',
  'Kendi turnuvasının bu sezonki en yüksek puanlı karşılaşması.',
];

// No real recommendation engine exists yet — this screen shows how it looks
// against real event data, with generic (not personalized) reasoning copy.
export default async function RecommendationsPage() {
  const [discover, bridge, skip] = await Promise.all([
    searchEvents({ sort: 'trending', limit: 3 }),
    searchEvents({ sport: 'tennis', limit: 1 }),
    searchEvents({ sport: 'cricket', limit: 1 }),
  ]);

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <p className="mx-4 mt-4 rounded-lg border border-dashed border-line bg-surface px-3 py-2 font-mono text-[10px] leading-relaxed text-neutral-500 lg:mx-8">
        Öneri motoru henüz yok — burası gerçek event verisiyle nasıl görüneceğini gösteriyor, kişiselleştirilmiş
        değil.
      </p>

      <SectionHeader title="Keşfetmeye değer" />
      <div className="flex flex-col gap-2.5 px-4 pb-2 lg:px-8">
        {discover.map((event, i) => (
          <RecCard key={event.id} event={event} why={DISCOVER_WHY[i % DISCOVER_WHY.length]!} />
        ))}
      </div>

      <SectionHeader title="Başka bir spor" />
      <div className="mx-4 mb-2.5 rounded-xl border border-sky-400/25 bg-sky-400/10 p-3.5 lg:mx-8">
        <h4 className="mb-1.5 font-display text-[15px] font-bold uppercase text-sky-300">
          Farklı spor, tanıdık his
        </h4>
        <p className="font-sans text-[12.5px] leading-relaxed text-dim">
          Bir sporu <em className="text-sky-300">tempo</em> ve <em className="text-sky-300">gerilim</em> için
          seviyorsan, bu eksende başka bir spor da aynı hissi taşıyabilir.
        </p>
      </div>
      <div className="flex flex-col gap-2.5 px-4 pb-2 lg:px-8">
        {bridge.map((event) => (
          <RecCard key={event.id} event={event} tone="bridge" why="Farklı spor, tanıdık his." />
        ))}
      </div>

      <SectionHeader title="Sana göre olmayabilir" />
      <div className="flex flex-col gap-2.5 px-4 pb-4 lg:px-8">
        {skip.map((event) => (
          <RecCard
            key={event.id}
            event={event}
            tone="skip"
            why="Bu tarz genelde düşük not alıyor — yine de kararı sana bırakıyoruz."
          />
        ))}
      </div>
    </div>
  );
}
