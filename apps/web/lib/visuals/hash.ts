// Deterministic string -> unsigned 32-bit int (FNV-1a). Used to pick a
// fallback color/motif for any competition or entity we haven't curated —
// never Math.random()/Date.now(), so server and client render the same byte,
// and a share card doesn't redraw differently on every visit.
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
