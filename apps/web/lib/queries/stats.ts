import { query } from '@vidi/db';
import { pointToStars, ratingWeight, RATING_MAX, RATING_MIN } from '@vidi/shared';

// The average is computed here, never stored on the event. The weighting
// formula is a placeholder that will change once there is beta data, and a
// cached column would make that change a migration plus a backfill.
//
// The query aggregates by (rating, coverage, medium) instead of returning one
// row per log: cardinality is tiny (10 ratings x a handful of coverage shapes),
// so a match with 50k logs still comes back as a few dozen rows.

export interface RatingStats {
  count: number;
  average: number | null;
  unweightedAverage: number | null;
  /**
   * Ordered 0.5 -> 5, always all ten buckets. An array rather than an object
   * keyed by rating: JS hoists integer-like keys, so `{'1':…, '4.5':…}` comes
   * out as 1,2,3,4,5,0.5,1.5… and the histogram draws in the wrong order.
   */
  distribution: Array<{ stars: number; count: number }>;
  sawEndingShare: number | null;
  byMedium: Record<string, { count: number; average: number | null }>;
}

interface StatsRow {
  rating: number;
  medium: string;
  coverage_fraction: number | null;
  saw_ending: boolean | null;
  n: number;
}

export async function getEventRatingStats(eventId: string): Promise<RatingStats> {
  const rows = await query<StatsRow>(
    `select l.rating, l.medium, c.coverage_fraction, c.saw_ending, count(*) as n
       from log l
       join log_coverage c on c.log_id = l.id
      where l.event_id = $1
        and l.visibility = 'public'
        and l.rating is not null
      group by l.rating, l.medium, c.coverage_fraction, c.saw_ending`,
    [eventId],
  );

  const counts = new Map<number, number>();
  for (let point = RATING_MIN; point <= RATING_MAX; point += 1) {
    counts.set(pointToStars(point), 0);
  }

  const byMedium = new Map<string, { count: number; weight: number; weighted: number }>();
  let count = 0;
  let weightSum = 0;
  let weightedRatingSum = 0;
  let ratingSum = 0;
  let endingKnown = 0;
  let endingSeen = 0;

  for (const row of rows) {
    const stars = pointToStars(row.rating);
    const weight = ratingWeight({
      fraction: row.coverage_fraction,
      sawEnding: row.saw_ending,
    });

    count += row.n;
    ratingSum += stars * row.n;
    weightSum += weight * row.n;
    weightedRatingSum += stars * weight * row.n;
    counts.set(stars, (counts.get(stars) ?? 0) + row.n);

    if (row.saw_ending !== null) {
      endingKnown += row.n;
      if (row.saw_ending) endingSeen += row.n;
    }

    const bucket = byMedium.get(row.medium) ?? { count: 0, weight: 0, weighted: 0 };
    bucket.count += row.n;
    bucket.weight += weight * row.n;
    bucket.weighted += stars * weight * row.n;
    byMedium.set(row.medium, bucket);
  }

  const round = (value: number) => Math.round(value * 100) / 100;

  return {
    count,
    average: weightSum > 0 ? round(weightedRatingSum / weightSum) : null,
    unweightedAverage: count > 0 ? round(ratingSum / count) : null,
    distribution: [...counts]
      .sort((a, b) => a[0] - b[0])
      .map(([stars, n]) => ({ stars, count: n })),
    sawEndingShare: endingKnown > 0 ? round(endingSeen / endingKnown) : null,
    // Kept from day one: a rating from the ground and a rating from the sofa are
    // two different verdicts, and the same mechanism later carries the
    // home/away split.
    byMedium: Object.fromEntries(
      [...byMedium].map(([medium, b]) => [
        medium,
        { count: b.count, average: b.weight > 0 ? round(b.weighted / b.weight) : null },
      ]),
    ),
  };
}
