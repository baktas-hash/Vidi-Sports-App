export function Chip({
  children,
  tone = 'default',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'accent' | 'positive' | 'negative';
  className?: string;
}) {
  const toneClass = {
    default: 'border-line bg-surface text-muted',
    accent: 'border-amber bg-amber text-neutral-950 font-medium',
    positive: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    negative: 'border-red-400/30 bg-red-400/10 text-red-300',
  }[tone];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[9.5px] ${toneClass} ${className}`}>
      {children}
    </span>
  );
}
