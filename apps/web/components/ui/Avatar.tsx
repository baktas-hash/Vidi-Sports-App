import { hashString } from '@/lib/visuals/hash';

// No curated per-user color list (unlike teams/competitions) — any handle
// can sign up, so this is hash-only by design, not curated-plus-fallback.
export function Avatar({ handle, size = 26 }: { handle: string; size?: number }) {
  const hue = hashString(handle) % 360;
  return (
    <span
      className="inline-grid flex-none place-items-center rounded-full font-display font-semibold text-neutral-950"
      style={{ width: size, height: size, background: `hsl(${hue} 80% 65%)`, fontSize: size * 0.42 }}
    >
      {handle[0]?.toUpperCase()}
    </span>
  );
}
