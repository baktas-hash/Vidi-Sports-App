export function StarRating({ value, size = 'sm' }: { value: number | null; size?: 'sm' | 'md' }) {
  if (!value) {
    return (
      <span className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-[9.5px] text-muted">puansız</span>
    );
  }
  const full = Math.floor(value);
  const half = value % 1 >= 0.5;
  return (
    <span className={`font-display font-bold text-amber ${size === 'md' ? 'text-[13px]' : 'text-[11px]'}`}>
      {'★'.repeat(full)}
      {half ? '½' : ''}
    </span>
  );
}
