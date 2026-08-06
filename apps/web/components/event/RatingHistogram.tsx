export function RatingHistogram({ distribution }: { distribution: Array<{ stars: number; count: number }> }) {
  const max = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <div>
      <div className="flex h-12 items-end gap-1">
        {distribution.map((bucket) => (
          <div key={bucket.stars} className="group relative flex-1" title={`${bucket.stars}★ — ${bucket.count} puan`}>
            <div className="h-12 w-full rounded-t bg-surface-2" />
            <div
              className="absolute bottom-0 w-full rounded-t bg-amber transition-[height]"
              style={{ height: `${Math.round((bucket.count / max) * 100)}%`, opacity: 0.82 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[8.5px] text-neutral-500">
        <span>½★</span>
        <span>★★★★★</span>
      </div>
    </div>
  );
}
