// pg's default type parsers have three footguns that would each show up as a
// subtle wrong number in the UI. Fixed once, here, so no caller has to know.
//
// Imported for side effects by pool.ts — must run before any query.

import pg from 'pg';

const { builtins } = pg.types;

// 1. DATE -> JS Date at LOCAL midnight, so a log made on 2026-02-15 reads back
//    as 2026-02-14T21:00Z in Istanbul. watched_on is a calendar day with no
//    time zone attached; keep it a string end to end.
pg.types.setTypeParser(builtins.DATE, (value) => value);

// 2. INT8 (bigint) -> string, so `count(*)` comes back as '128' and any
//    arithmetic on it silently concatenates. Every count we have is far below
//    Number.MAX_SAFE_INTEGER.
pg.types.setTypeParser(builtins.INT8, (value) => Number(value));

// 3. NUMERIC -> string, to protect arbitrary precision. We only use numeric for
//    coordinates and coverage fractions, where a float is what we actually want.
//    If money ever appears, give it its own parser instead of undoing this.
pg.types.setTypeParser(builtins.NUMERIC, (value) => Number(value));
