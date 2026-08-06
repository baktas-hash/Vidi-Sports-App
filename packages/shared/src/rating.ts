// Ratings are half-stars, stored as an integer 1..10 so the DB column stays
// a smallint and averages stay exact. 1 = 0.5 stars, 10 = 5 stars.

export const RATING_MIN = 1;
export const RATING_MAX = 10;

export type RatingPoint = number; // 1..10, integer

export function starsToPoint(stars: number): RatingPoint {
  const point = Math.round(stars * 2);
  if (point < RATING_MIN || point > RATING_MAX) {
    throw new RangeError(`rating out of range: ${stars} stars`);
  }
  return point;
}

export function pointToStars(point: RatingPoint): number {
  return point / 2;
}

/** '★★★½' — for compact rows where a widget is overkill. */
export function formatStars(point: RatingPoint): string {
  const full = Math.floor(point / 2);
  return '★'.repeat(full) + (point % 2 === 1 ? '½' : '');
}
