import assert from 'node:assert/strict';
import { test } from 'node:test';

import { computeCoverage, coverageLabel, ratingWeight } from './coverage';
import { eventSlug, slugify } from './slug';
import { formatStars, pointToStars, starsToPoint } from './rating';

test('slugify handles Turkish letters that toLowerCase and NFD get wrong', () => {
  assert.equal(slugify('İstanbul'), 'istanbul');
  assert.equal(slugify('Fenerbahçe Şükrü Saracoğlu'), 'fenerbahce-sukru-saracoglu');
  assert.equal(slugify('Beşiktaş'), 'besiktas');
  assert.equal(slugify('Iğdır'), 'igdir');
  // The failure mode: 'İ'.toLowerCase() is two code points, so a naive slugify
  // leaves a combining dot behind and the URL gains a stray character.
  assert.equal(slugify('İ').length, 1);
  assert.ok(!slugify('İzmir Göztepe').includes('̇'));
});

test('slugify strips ordinary diacritics and punctuation', () => {
  assert.equal(slugify('Bayern München'), 'bayern-munchen');
  assert.equal(slugify("Nott'm Forest"), 'nottm-forest');
  assert.equal(slugify('Borussia Mönchengladbach'), 'borussia-monchengladbach');
  assert.equal(slugify('  --Real Madrid--  '), 'real-madrid');
});

test('eventSlug composes sides, competition and date', () => {
  assert.equal(
    eventSlug({ sides: ['Galatasaray', 'Fenerbahçe'], competition: 'Süper Lig', date: '2026-02-15' }),
    'galatasaray-v-fenerbahce-super-lig-2026-02-15',
  );
  assert.equal(
    eventSlug({ sides: ['Rafael Nadal', 'Roger Federer'], date: '2008-07-06' }),
    'rafael-nadal-v-roger-federer-2008-07-06',
  );
});

test('no recorded segments means the whole contest was watched', () => {
  const coverage = computeCoverage([], 5);
  assert.equal(coverage.fraction, 1);
  assert.equal(coverage.sawEnding, true);
  assert.equal(coverage.isFragmented, false);
});

test('first two sets of a five-setter is 40% and misses the ending', () => {
  const coverage = computeCoverage([1, 2], 5);
  assert.equal(coverage.fraction, 0.4);
  assert.equal(coverage.sawEnding, false);
  assert.deepEqual(coverage.chunks, [[1, 2]]);
});

test('last two sets is the same 40% but sees the ending', () => {
  const coverage = computeCoverage([4, 5], 5);
  assert.equal(coverage.fraction, 0.4);
  assert.equal(coverage.sawEnding, true);
  // Same fraction, opposite experience — the reason segments are stored one by
  // one instead of as a percentage.
  assert.ok(ratingWeight(computeCoverage([4, 5], 5)) > ratingWeight(computeCoverage([1, 2], 5)));
});

test('channel hopping is flagged as fragmented', () => {
  const coverage = computeCoverage([1, 4, 5], 5);
  assert.equal(coverage.isFragmented, true);
  assert.deepEqual(coverage.chunks, [[1, 1], [4, 5]]);
  assert.equal(coverage.sawEnding, true);
  assert.equal(coverageLabel(coverage, 'set'), '2 bölüm halinde');
});

test('a best-of-five that ended in four judges the ending on set four', () => {
  assert.equal(computeCoverage([3, 4], 4).sawEnding, true);
  assert.equal(computeCoverage([3, 4], 5).sawEnding, false);
});

test('a four-day Test match: day three is not the ending', () => {
  const coverage = computeCoverage([1, 2, 3], 4);
  assert.equal(coverage.sawEnding, false);
  assert.equal(coverageLabel(coverage, 'gün'), '1-3. gün, sonunu görmedi');
});

test('unknown segment total leaves coverage undecided rather than guessing', () => {
  const coverage = computeCoverage([1, 2], null);
  assert.equal(coverage.fraction, null);
  assert.equal(coverage.sawEnding, null);
  assert.equal(ratingWeight(coverage), 1);
});

test('duplicate and unsorted segment indices are normalised', () => {
  const coverage = computeCoverage([3, 1, 2, 2], 3);
  assert.equal(coverage.segmentsSeen, 3);
  assert.equal(coverage.isFragmented, false);
});

test('half-star ratings round-trip through the integer column', () => {
  assert.equal(starsToPoint(0.5), 1);
  assert.equal(starsToPoint(4.5), 9);
  assert.equal(starsToPoint(5), 10);
  assert.equal(pointToStars(7), 3.5);
  assert.equal(formatStars(7), '★★★½');
  assert.equal(formatStars(10), '★★★★★');
  assert.throws(() => starsToPoint(0));
  assert.throws(() => starsToPoint(5.5));
});
