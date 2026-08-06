// How much of a contest a log actually covers.
//
// Segments are stored one by one rather than as a percentage, because
// "40% of a five-setter" is two completely different experiences depending on
// WHICH 40%. Keeping the indices gives us the thing that actually matters in
// sport: did they see the ending?
//
// An empty segment list means "watched the whole thing" — the common case, and
// the reason we never force the user to fill this in.

export interface Coverage {
  /** 0..1, or null when the segment total is unknown. */
  fraction: number | null;
  /** null when the segment total is unknown. */
  sawEnding: boolean | null;
  /** Watched in separate chunks rather than one continuous run. */
  isFragmented: boolean;
  /** Contiguous runs of segments, e.g. [[1,2],[5,5]]. */
  chunks: Array<[number, number]>;
  segmentsSeen: number;
  segmentsTotal: number | null;
}

export function computeCoverage(
  segmentIndices: readonly number[],
  segmentsTotal: number | null | undefined,
): Coverage {
  const total = segmentsTotal ?? null;
  const seen = [...new Set(segmentIndices)].sort((a, b) => a - b);

  if (seen.length === 0) {
    return {
      fraction: 1,
      sawEnding: true,
      isFragmented: false,
      chunks: total ? [[1, total]] : [],
      segmentsSeen: total ?? 0,
      segmentsTotal: total,
    };
  }

  const chunks: Array<[number, number]> = [];
  for (const index of seen) {
    const last = chunks[chunks.length - 1];
    if (last && index === last[1] + 1) last[1] = index;
    else chunks.push([index, index]);
  }

  const lastSeen = seen[seen.length - 1]!;

  return {
    fraction: total === null ? null : Math.min(1, seen.length / total),
    sawEnding: total === null ? null : lastSeen >= total,
    isFragmented: chunks.length > 1,
    chunks,
    segmentsSeen: seen.length,
    segmentsTotal: total,
  };
}

/** 'İlk 2 set' / '3 bölüm halinde' — short UI label. */
export function coverageLabel(
  coverage: Coverage,
  segmentLabel: string,
): string {
  if (coverage.fraction === 1 && !coverage.isFragmented) return 'Tamamı';
  if (coverage.isFragmented) return `${coverage.chunks.length} bölüm halinde`;

  const chunk = coverage.chunks[0];
  if (!chunk) return 'Bilinmiyor';

  const [from, to] = chunk;
  const range = from === to ? `${from}.` : `${from}-${to}.`;
  const tail = coverage.sawEnding === false ? ', sonunu görmedi' : '';
  return `${range} ${segmentLabel}${tail}`;
}

// PLACEHOLDER. The coefficients are invented — they cannot be known before
// there is beta data to fit them against. Deliberately a function rather than
// a generated column so changing it is a one-line diff, not a migration.
//
// Takes the two fields it actually needs, so aggregate queries can group logs
// by coverage and weight the groups without reconstructing segment lists.
export function ratingWeight(coverage: Pick<Coverage, 'fraction' | 'sawEnding'>): number {
  if (coverage.fraction === null) return 1;
  const base = 0.25 + 0.75 * coverage.fraction;
  return coverage.sawEnding === false ? base * 0.8 : base;
}
