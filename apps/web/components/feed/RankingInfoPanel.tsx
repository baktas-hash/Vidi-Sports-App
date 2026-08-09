// Static explanatory copy, straight from the design prototype's sidebar —
// no data to fetch, it's the same text for every viewer.
export function RankingInfoPanel() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="mb-3 font-display text-[13px] font-bold uppercase tracking-wide text-muted">Sıralama</h3>
      <p className="font-sans text-[12.5px] leading-relaxed text-dim">
        Etkileşime göre değil, örtüşmeye göre: logladığın eventler, takip ettiğin ligler, zevk
        etiketlerin. Reklam yok — seni burada tutmaya çalışan bir sıralama da yok.
      </p>
    </div>
  );
}
