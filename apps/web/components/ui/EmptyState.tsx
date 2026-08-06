export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 rounded-xl border border-dashed border-line bg-surface px-4 py-5 font-sans text-[12.5px] leading-relaxed text-muted lg:mx-8">
      {children}
    </div>
  );
}
