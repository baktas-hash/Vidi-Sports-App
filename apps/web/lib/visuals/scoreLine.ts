export interface ScoreLineEvent {
  sport: { topology: string };
  participants: Array<{ side: number; score: number | null }>;
}

// The compact "score under the poster" treatment: sets/games won read fine
// as a single dash-joined line ("3–1"); a real points/runs total reads
// better stacked on two lines. One derivation rule for Poster/ShareCard/
// Banner, all three want the same compact score, just at different sizes.
export function scoreLines(event: ScoreLineEvent): [string] | [string, string] {
  const [p1, p2] = [...event.participants].sort((a, b) => a.side - b.side);
  const s1 = p1?.score ?? null;
  const s2 = p2?.score ?? null;
  if (s1 === null || s2 === null) return ['–'];

  return event.sport.topology === 'set_based' ? [`${s1}–${s2}`] : [String(s1), String(s2)];
}
