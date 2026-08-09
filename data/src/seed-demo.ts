// Demo fixtures for local development, and the first real proof that the
// schema holds together: name history, a rebuilt ground, a neutral venue behind
// closed doors, and three logs whose coverage differs.
//
// Not idempotent — meant to run against a freshly reset local database.

import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

import { eventSlug, slugify, starsToPoint } from '@vidi/shared';

import { DATABASE_URL, inTransaction, withClient } from './db.js';
import type { PoolClient } from 'pg';

// Mirrors apps/web/lib/auth/password.ts's scrypt$N$r$p$salt$hash format
// exactly, duplicated here rather than imported: data/ has no dependency on
// apps/web and shouldn't grow one just for a demo password.
const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

async function hashPasswordForSeed(password: string): Promise<string> {
  const params = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 32, params);
  return [
    'scrypt',
    params.N,
    params.r,
    params.p,
    salt.toString('base64'),
    key.toString('base64'),
  ].join('$');
}

async function one<T extends Record<string, unknown>>(
  client: PoolClient,
  sql: string,
  params: unknown[] = [],
): Promise<T> {
  const { rows } = await client.query<T>(sql, params);
  const row = rows[0];
  if (!row) throw new Error(`expected a row from: ${sql.trim().split('\n')[0]}`);
  return row;
}

async function id(client: PoolClient, sql: string, params: unknown[] = []): Promise<string> {
  return (await one<{ id: string }>(client, sql, params)).id;
}

async function main(): Promise<void> {
  await withClient(async (client) => {
    console.log(`→ ${DATABASE_URL}`);

    await inTransaction(client, async () => {
      const football = await id(client, `select id from sport where slug = 'football'`);
      const tennis = await id(client, `select id from sport where slug = 'tennis'`);
      const volleyball = await id(client, `select id from sport where slug = 'volleyball'`);
      const basketball = await id(client, `select id from sport where slug = 'basketball'`);
      const cricket = await id(client, `select id from sport where slug = 'cricket'`);
      const bestOf5 = await id(
        client,
        `select f.id from format f join sport s on s.id = f.sport_id
          where s.slug = 'tennis' and f.slug = 'best-of-5'`,
      );
      const footballRegulation = await id(
        client,
        `select f.id from format f join sport s on s.id = f.sport_id
          where s.slug = 'football' and f.slug = 'regulation'`,
      );
      const volleyballBestOf5 = await id(
        client,
        `select f.id from format f join sport s on s.id = f.sport_id
          where s.slug = 'volleyball' and f.slug = 'best-of-5'`,
      );
      const basketballRegulation = await id(
        client,
        `select f.id from format f join sport s on s.id = f.sport_id
          where s.slug = 'basketball' and f.slug = 'regulation'`,
      );
      const cricketTest = await id(
        client,
        `select f.id from format f join sport s on s.id = f.sport_id
          where s.slug = 'cricket' and f.slug = 'test'`,
      );

      // --- venues -------------------------------------------------------
      // İnönü was demolished and rebuilt on the same site. Two venue rows
      // linked by predecessor_venue_id: a ground collector counts them apart.
      const inonu = await id(
        client,
        `insert into venue (slug, display_name, city, country, capacity, opened_year, closed_year, lat, lng)
         values ('bjk-inonu-stadyumu', 'BJK İnönü Stadyumu', 'İstanbul', 'TR', 32145, 1947, 2013, 41.039200, 29.005600)
         returning id`,
      );
      const vodafonePark = await id(
        client,
        `insert into venue (slug, display_name, city, country, capacity, opened_year, lat, lng, predecessor_venue_id)
         values ('tupras-stadyumu', 'Tüpraş Stadyumu', 'İstanbul', 'TR', 41903, 2016, 41.039200, 29.005600, $1)
         returning id`,
        [inonu],
      );
      const ramsPark = await id(
        client,
        `insert into venue (slug, display_name, city, country, capacity, opened_year, lat, lng)
         values ('rams-park', 'RAMS Park', 'İstanbul', 'TR', 52223, 2011, 41.103600, 28.990800)
         returning id`,
      );
      const centreCourt = await id(
        client,
        `insert into venue (slug, display_name, city, country, capacity, opened_year, is_indoor, lat, lng)
         values ('wimbledon-centre-court', 'Centre Court', 'London', 'GB', 14979, 1922, false, 51.433900, -0.214200)
         returning id`,
      );

      // Sponsor name churn: the user who went in 2013 should see the 2013 name.
      await client.query(
        `insert into venue_name (venue_id, name, valid_from, valid_to) values
           ($1, 'Türk Telekom Arena',    '2011-01-15', '2018-06-30'),
           ($1, 'Türk Telekom Stadyumu', '2018-07-01', '2020-08-31'),
           ($1, 'NEF Stadyumu',          '2020-09-01', '2021-06-30'),
           ($1, 'Ali Sami Yen Spor Kompleksi Nef Stadyumu', '2021-07-01', '2023-08-31'),
           ($1, 'RAMS Park',             '2023-09-01', null),
           ($2, 'Vodafone Arena',        '2016-04-10', '2019-06-30'),
           ($2, 'Vodafone Park',         '2019-07-01', '2023-06-30'),
           ($2, 'Tüpraş Stadyumu',       '2023-07-01', null)`,
        [ramsPark, vodafonePark],
      );

      // Volleyball, basketball and cricket grounds for the wider seed below.
      // Capacity/opened_year omitted where not confidently known — both columns
      // are nullable for exactly this reason.
      const burhanFelek = await id(
        client,
        `insert into venue (slug, display_name, city, country, is_indoor)
         values ('burhan-felek-spor-salonu', 'Burhan Felek Spor Salonu', 'İstanbul', 'TR', true)
         returning id`,
      );
      const palaVerde = await id(
        client,
        `insert into venue (slug, display_name, city, country, is_indoor)
         values ('palaverde', 'PalaVerde', 'Villorba', 'IT', true)
         returning id`,
      );
      const ballArena = await id(
        client,
        `insert into venue (slug, display_name, city, country, capacity, opened_year, is_indoor)
         values ('ball-arena', 'Ball Arena', 'Denver', 'US', 19520, 1999, true)
         returning id`,
      );
      const paycomCenter = await id(
        client,
        `insert into venue (slug, display_name, city, country, capacity, opened_year, is_indoor)
         values ('paycom-center', 'Paycom Center', 'Oklahoma City', 'US', 18203, 2002, true)
         returning id`,
      );
      const mcg = await id(
        client,
        `insert into venue (slug, display_name, city, country, capacity, opened_year, is_indoor)
         values ('melbourne-cricket-ground', 'Melbourne Cricket Ground', 'Melbourne', 'AU', 100024, 1853, false)
         returning id`,
      );
      const scg = await id(
        client,
        `insert into venue (slug, display_name, city, country, capacity, opened_year, is_indoor)
         values ('sydney-cricket-ground', 'Sydney Cricket Ground', 'Sydney', 'AU', 48000, 1848, false)
         returning id`,
      );

      // --- entities -----------------------------------------------------
      // sport_id null on the clubs: these are multi-sport institutions.
      const clubs: Array<[string, string, string]> = [
        ['Galatasaray', 'GS', 'TR'],
        ['Fenerbahçe', 'FB', 'TR'],
        ['Beşiktaş', 'BJK', 'TR'],
      ];
      const clubIds = new Map<string, string>();
      for (const [name, short, country] of clubs) {
        clubIds.set(
          name,
          await id(
            client,
            `insert into entity (sport_id, kind, slug, display_name, short_name, country)
             values (null, 'club', $1, $2, $3, $4) returning id`,
            [slugify(name), name, short, country],
          ),
        );
      }

      const players = new Map<string, string>();
      for (const [name, country] of [
        ['Roger Federer', 'CH'],
        ['Rafael Nadal', 'ES'],
      ] as Array<[string, string]>) {
        players.set(
          name,
          await id(
            client,
            `insert into entity (sport_id, kind, slug, display_name, country)
             values ($1, 'person', $2, $3, $4) returning id`,
            [tennis, slugify(name), name, country],
          ),
        );
      }

      // Sport-scoped clubs: unlike the multi-branch Turkish institutions
      // above, these rows only ever field the one sport modelled here.
      const sportClubs: Array<[string, string, string, string]> = [
        ['VakıfBank', 'VB', 'TR', volleyball],
        ['Eczacıbaşı Dynavit', 'ECZ', 'TR', volleyball],
        ['Imoco Volley Conegliano', 'IMO', 'IT', volleyball],
        ['Denver Nuggets', 'DEN', 'US', basketball],
        ['Oklahoma City Thunder', 'OKC', 'US', basketball],
        ['Boston Celtics', 'BOS', 'US', basketball],
        ['Los Angeles Lakers', 'LAL', 'US', basketball],
      ];
      for (const [name, short, country, sportId] of sportClubs) {
        clubIds.set(
          name,
          await id(
            client,
            `insert into entity (sport_id, kind, slug, display_name, short_name, country)
             values ($1, 'club', $2, $3, $4, $5) returning id`,
            [sportId, slugify(name), name, short, country],
          ),
        );
      }

      const nationalTeams = new Map<string, string>();
      for (const [name, short, country] of [
        ['England', 'ENG', 'GB'],
        ['Australia', 'AUS', 'AU'],
      ] as Array<[string, string, string]>) {
        nationalTeams.set(
          name,
          await id(
            client,
            `insert into entity (sport_id, kind, slug, display_name, short_name, country)
             values ($1, 'national_team', $2, $3, $4, $5) returning id`,
            [cricket, slugify(name), name, short, country],
          ),
        );
      }

      // --- competitions -------------------------------------------------
      const superLig = await id(
        client,
        `insert into competition (sport_id, slug, display_name, kind, country, tier)
         values ($1, 'super-lig', 'Süper Lig', 'league', 'TR', 1) returning id`,
        [football],
      );
      const wimbledon = await id(
        client,
        `insert into competition (sport_id, slug, display_name, kind, country)
         values ($1, 'wimbledon', 'Wimbledon', 'tournament', 'GB') returning id`,
        [tennis],
      );
      const superLig2526 = await id(
        client,
        `insert into season (competition_id, slug, label, starts_on, ends_on)
         values ($1, '2025-26', '2025-26', '2025-08-08', '2026-05-24') returning id`,
        [superLig],
      );
      const wimbledon2008 = await id(
        client,
        `insert into season (competition_id, slug, label, starts_on, ends_on)
         values ($1, '2008', 'Wimbledon 2008', '2008-06-23', '2008-07-06') returning id`,
        [wimbledon],
      );

      const sultanlarLigi = await id(
        client,
        `insert into competition (sport_id, slug, display_name, kind, country, tier)
         values ($1, 'sultanlar-ligi', 'Sultanlar Ligi', 'league', 'TR', 1) returning id`,
        [volleyball],
      );
      const cevChampionsLeague = await id(
        client,
        `insert into competition (sport_id, slug, display_name, kind)
         values ($1, 'cev-champions-league', 'CEV Şampiyonlar Ligi', 'international') returning id`,
        [volleyball],
      );
      const nba = await id(
        client,
        `insert into competition (sport_id, slug, display_name, kind, country, tier)
         values ($1, 'nba', 'NBA', 'league', 'US', 1) returning id`,
        [basketball],
      );
      const theAshes = await id(
        client,
        `insert into competition (sport_id, slug, display_name, kind)
         values ($1, 'the-ashes', 'The Ashes', 'international') returning id`,
        [cricket],
      );
      const sultanlarLigi2526 = await id(
        client,
        `insert into season (competition_id, slug, label, starts_on, ends_on)
         values ($1, '2025-26', '2025-26', '2025-10-01', '2026-04-30') returning id`,
        [sultanlarLigi],
      );
      const cevCl2526 = await id(
        client,
        `insert into season (competition_id, slug, label, starts_on, ends_on)
         values ($1, '2025-26', '2025-26 CEV Şampiyonlar Ligi', '2025-11-01', '2026-03-31') returning id`,
        [cevChampionsLeague],
      );
      const nba2526 = await id(
        client,
        `insert into season (competition_id, slug, label, starts_on, ends_on)
         values ($1, '2025-26', '2025-26', '2025-10-21', '2026-06-15') returning id`,
        [nba],
      );
      const ashes2526 = await id(
        client,
        `insert into season (competition_id, slug, label, starts_on, ends_on)
         values ($1, '2025-26', 'The Ashes 2025-26', '2025-12-01', '2026-01-10') returning id`,
        [theAshes],
      );

      // --- events -------------------------------------------------------
      const derby = await id(
        client,
        `insert into event
           (sport_id, competition_id, season_id, format_id, venue_id, slug, stage,
            starts_at, status, segment_count_actual)
         values ($1, $2, $3, $4, $5, $6, '14. hafta',
                 '2026-02-15 19:00+03', 'finished', 2)
         returning id`,
        [
          football,
          superLig,
          superLig2526,
          footballRegulation,
          ramsPark,
          eventSlug({
            sides: ['Galatasaray', 'Fenerbahçe'],
            competition: 'Süper Lig',
            date: '2026-02-15',
          }),
        ],
      );
      await client.query(
        `insert into event_participant (event_id, entity_id, side, score, outcome) values
           ($1, $2, 1, 2, 'win'),
           ($1, $3, 2, 1, 'loss')`,
        [derby, clubIds.get('Galatasaray'), clubIds.get('Fenerbahçe')],
      );

      // Went the full five sets, so segment_count_actual = 5. (The shorter case
      // — a best-of-five decided in four, where the ending is set 4 and not
      // set 5 — is covered in packages/shared tests.)
      const final2008 = await id(
        client,
        `insert into event
           (sport_id, competition_id, season_id, format_id, venue_id, slug, title, stage,
            starts_at, status, segment_count_actual, is_canonical)
         values ($1, $2, $3, $4, $5, $6, 'Wimbledon 2008 Finali', 'Final',
                 '2008-07-06 14:35+01', 'finished', 5, true)
         returning id`,
        [
          tennis,
          wimbledon,
          wimbledon2008,
          bestOf5,
          centreCourt,
          eventSlug({ sides: ['Rafael Nadal', 'Roger Federer'], date: '2008-07-06' }),
        ],
      );
      await client.query(
        `insert into event_participant (event_id, entity_id, side, score, score_detail, outcome) values
           ($1, $2, 1, 3, $4::jsonb, 'win'),
           ($1, $3, 2, 2, $5::jsonb, 'loss')`,
        [
          final2008,
          players.get('Rafael Nadal'),
          players.get('Roger Federer'),
          JSON.stringify({ sets: [6, 4, 6, 4, 6, 7, 6, 7, 9, 7] }),
          JSON.stringify({ sets: [4, 6, 4, 6, 7, 6, 7, 6, 7, 9] }),
        ],
      );

      // Neutral-venue, behind-closed-doors example — the two flags that a
      // home_club.stadium shortcut could never express.
      const neutral = await id(
        client,
        `insert into event
           (sport_id, competition_id, season_id, format_id, venue_id, slug, stage,
            starts_at, status, is_neutral_venue, behind_closed_doors, segment_count_actual)
         values ($1, $2, $3, $4, $5, $6, 'Kupa Finali',
                 '2026-05-20 20:45+03', 'finished', true, true, 2)
         returning id`,
        [
          football,
          superLig,
          superLig2526,
          footballRegulation,
          vodafonePark,
          eventSlug({ sides: ['Beşiktaş', 'Galatasaray'], date: '2026-05-20', suffix: 'kupa' }),
        ],
      );
      await client.query(
        `insert into event_participant (event_id, entity_id, side, score, outcome) values
           ($1, $2, 1, 1, 'draw'),
           ($1, $3, 2, 1, 'draw')`,
        [neutral, clubIds.get('Beşiktaş'), clubIds.get('Galatasaray')],
      );

      // --- volleyball: Sultanlar Ligi round-robin ------------------------
      // Fictional fixtures/scores (like the derby/cup-final above) — only the
      // 2008 Wimbledon final claims to be a real historical result. sets is
      // flat per participant: [ownSet1, oppSet1, ownSet2, oppSet2, ...].
      async function volleyballEvent(
        home: string,
        away: string,
        date: string,
        segmentCountActual: number,
        homeSets: number[],
        awaySets: number[],
        competitionId: string,
        seasonId: string,
        venueId: string,
      ): Promise<string> {
        const eventId = await id(
          client,
          `insert into event
             (sport_id, competition_id, season_id, format_id, venue_id, slug,
              starts_at, status, segment_count_actual)
           values ($1, $2, $3, $4, $5, $6, $7, 'finished', $8)
           returning id`,
          [
            volleyball,
            competitionId,
            seasonId,
            volleyballBestOf5,
            venueId,
            eventSlug({ sides: [home, away], competition: 'Voleybol', date }),
            `${date} 19:30+03`,
            segmentCountActual,
          ],
        );
        const homeSetsWon = homeSets.reduce((sum, v, i) => (i % 2 === 0 && v > homeSets[i + 1]! ? sum + 1 : sum), 0);
        const awaySetsWon = segmentCountActual - homeSetsWon;
        await client.query(
          `insert into event_participant (event_id, entity_id, side, score, score_detail, outcome) values
             ($1, $2, 1, $5, $6::jsonb, $7),
             ($1, $3, 2, $4, $8::jsonb, $9)`,
          [
            eventId,
            clubIds.get(home),
            clubIds.get(away),
            awaySetsWon,
            homeSetsWon,
            JSON.stringify({ sets: homeSets }),
            homeSetsWon > awaySetsWon ? 'win' : 'loss',
            JSON.stringify({ sets: awaySets }),
            awaySetsWon > homeSetsWon ? 'win' : 'loss',
          ],
        );
        return eventId;
      }

      const vbFb1 = await volleyballEvent(
        'VakıfBank', 'Fenerbahçe', '2025-10-18', 4,
        [25, 20, 22, 25, 25, 21, 25, 18], [20, 25, 25, 22, 21, 25, 18, 25],
        sultanlarLigi, sultanlarLigi2526, burhanFelek,
      );
      const eczGs1 = await volleyballEvent(
        'Eczacıbaşı Dynavit', 'Galatasaray', '2025-10-25', 3,
        [25, 18, 25, 20, 25, 23], [18, 25, 20, 25, 23, 25],
        sultanlarLigi, sultanlarLigi2526, burhanFelek,
      );
      await volleyballEvent(
        'Fenerbahçe', 'Eczacıbaşı Dynavit', '2025-11-08', 5,
        [25, 23, 20, 25, 25, 22, 22, 25, 15, 11], [23, 25, 25, 20, 22, 25, 25, 22, 11, 15],
        sultanlarLigi, sultanlarLigi2526, burhanFelek,
      );
      await volleyballEvent(
        'VakıfBank', 'Eczacıbaşı Dynavit', '2025-11-22', 4,
        [25, 21, 23, 25, 25, 19, 25, 20], [21, 25, 25, 23, 19, 25, 20, 25],
        sultanlarLigi, sultanlarLigi2526, burhanFelek,
      );
      await volleyballEvent(
        'Galatasaray', 'Fenerbahçe', '2025-12-06', 5,
        [25, 22, 22, 25, 25, 20, 20, 25, 15, 13], [22, 25, 25, 22, 20, 25, 25, 20, 13, 15],
        sultanlarLigi, sultanlarLigi2526, burhanFelek,
      );
      await volleyballEvent(
        'VakıfBank', 'Galatasaray', '2026-01-17', 3,
        [25, 16, 25, 19, 25, 21], [16, 25, 19, 25, 21, 25],
        sultanlarLigi, sultanlarLigi2526, burhanFelek,
      );

      // --- volleyball: CEV Champions League ------------------------------
      const vbImo1 = await volleyballEvent(
        'VakıfBank', 'Imoco Volley Conegliano', '2025-11-15', 5,
        [25, 20, 20, 25, 25, 22, 22, 25, 16, 14], [20, 25, 25, 20, 22, 25, 25, 22, 14, 16],
        cevChampionsLeague, cevCl2526, burhanFelek,
      );
      const imoEcz1 = await volleyballEvent(
        'Imoco Volley Conegliano', 'Eczacıbaşı Dynavit', '2025-12-13', 4,
        [25, 21, 22, 25, 25, 20, 25, 18], [21, 25, 25, 22, 20, 25, 18, 25],
        cevChampionsLeague, cevCl2526, palaVerde,
      );
      const vbEcz2 = await id(
        client,
        `insert into event
           (sport_id, competition_id, season_id, format_id, venue_id, slug,
            starts_at, status, segment_count_actual)
         values ($1, $2, $3, $4, $5, $6, '2026-02-07 20:00+03', 'finished', 3)
         returning id`,
        [
          volleyball, cevChampionsLeague, cevCl2526, volleyballBestOf5, burhanFelek,
          eventSlug({ sides: ['VakıfBank', 'Eczacıbaşı Dynavit'], competition: 'CEV', date: '2026-02-07' }),
        ],
      );
      await client.query(
        `insert into event_participant (event_id, entity_id, side, score, score_detail, outcome) values
           ($1, $2, 1, 3, $4::jsonb, 'win'),
           ($1, $3, 2, 0, $5::jsonb, 'loss')`,
        [
          vbEcz2, clubIds.get('VakıfBank'), clubIds.get('Eczacıbaşı Dynavit'),
          JSON.stringify({ sets: [25, 19, 25, 23, 25, 17] }),
          JSON.stringify({ sets: [19, 25, 23, 25, 17, 25] }),
        ],
      );

      // --- basketball: NBA -------------------------------------------------
      // No score_detail here: a plain final score is enough for a "big
      // centered number" scoreboard (timed_periods topology), unlike the
      // set/innings grids above.
      async function nbaGame(
        home: string,
        away: string,
        homeScore: number,
        awayScore: number,
        date: string,
        venueId: string,
      ): Promise<string> {
        const eventId = await id(
          client,
          `insert into event
             (sport_id, competition_id, season_id, format_id, venue_id, slug,
              starts_at, status, segment_count_actual)
           values ($1, $2, $3, $4, $5, $6, $7, 'finished', 4)
           returning id`,
          [
            basketball, nba, nba2526, basketballRegulation, venueId,
            eventSlug({ sides: [home, away], competition: 'NBA', date }),
            // A UTC-anchored hour, not real Denver/OKC local time: comfortably
            // mid-day under any plausible session timezone, so casting this
            // back to a date never rolls onto the neighbouring day (which a
            // US-timezone offset here could do, and did, when this was tried
            // with a literal -07 offset against a same-day log below).
            `${date} 18:00+00`,
          ],
        );
        await client.query(
          `insert into event_participant (event_id, entity_id, side, score, outcome) values
             ($1, $2, 1, $4, $5),
             ($1, $3, 2, $6, $7)`,
          [
            eventId, clubIds.get(home), clubIds.get(away),
            homeScore, homeScore > awayScore ? 'win' : 'loss',
            awayScore, awayScore > homeScore ? 'win' : 'loss',
          ],
        );
        return eventId;
      }

      // Same score as the very fixture this whole seed's design was modelled
      // after — kept as a small, deliberate nod, not a claim of a real result.
      const thunderNuggets1 = await nbaGame(
        'Oklahoma City Thunder', 'Denver Nuggets', 121, 118, '2025-11-05', paycomCenter,
      );
      const nuggetsLakers1 = await nbaGame(
        'Denver Nuggets', 'Los Angeles Lakers', 114, 109, '2025-12-02', ballArena,
      );
      const thunderCeltics1 = await nbaGame(
        'Oklahoma City Thunder', 'Boston Celtics', 128, 121, '2025-12-20', paycomCenter,
      );
      const nuggetsThunder2 = await nbaGame(
        'Denver Nuggets', 'Oklahoma City Thunder', 102, 107, '2026-01-24', ballArena,
      );

      // --- cricket: The Ashes ---------------------------------------------
      // innings is a flat list of the participant's OWN runs per innings —
      // unlike tennis/volleyball's sets, cricket innings aren't a simultaneous
      // paired score, so there is nothing to interleave with the opponent.
      const ashesMcg = await id(
        client,
        `insert into event
           (sport_id, competition_id, season_id, format_id, venue_id, slug, stage,
            starts_at, status, segment_count_actual)
         values ($1, $2, $3, $4, $5, $6, 'Boxing Day Test',
                 '2025-12-26 10:30+00', 'finished', 4)
         returning id`,
        [
          cricket, theAshes, ashes2526, cricketTest, mcg,
          eventSlug({ sides: ['Australia', 'England'], competition: 'The Ashes', date: '2025-12-26' }),
        ],
      );
      await client.query(
        `insert into event_participant (event_id, entity_id, side, score, score_detail, outcome) values
           ($1, $2, 1, 508, $4::jsonb, 'win'),
           ($1, $3, 2, 435, $5::jsonb, 'loss')`,
        [
          ashesMcg, nationalTeams.get('Australia'), nationalTeams.get('England'),
          JSON.stringify({ innings: [298, 210] }),
          JSON.stringify({ innings: [245, 190] }),
        ],
      );

      // Goes the full five days to a draw — the other half of "did they see
      // the ending" alongside the Boxing Day Test's day-4 finish above.
      const ashesScg = await id(
        client,
        `insert into event
           (sport_id, competition_id, season_id, format_id, venue_id, slug, stage,
            starts_at, status, segment_count_actual)
         values ($1, $2, $3, $4, $5, $6, 'New Year Test',
                 '2026-01-04 10:30+00', 'finished', 5)
         returning id`,
        [
          cricket, theAshes, ashes2526, cricketTest, scg,
          eventSlug({ sides: ['England', 'Australia'], competition: 'The Ashes', date: '2026-01-04' }),
        ],
      );
      await client.query(
        `insert into event_participant (event_id, entity_id, side, score, score_detail, outcome) values
           ($1, $2, 1, 645, $4::jsonb, 'draw'),
           ($1, $3, 2, 401, $5::jsonb, 'draw')`,
        [
          ashesScg, nationalTeams.get('England'), nationalTeams.get('Australia'),
          JSON.stringify({ innings: [356, 289] }),
          JSON.stringify({ innings: [401] }),
        ],
      );

      // --- scheduled fixtures ---------------------------------------------
      // Everything above is 'finished' — the home/competition "upcoming
      // fixtures" calendar has nothing to group by day without at least a
      // few 'scheduled' rows with a real future starts_at. Real Date.now(),
      // not a literal timestamp: this file has no "today" to pin to, and a
      // hardcoded future date would eventually become a past one.
      function daysFromNow(days: number, hour: number, minute = 0): Date {
        const d = new Date();
        d.setDate(d.getDate() + days);
        d.setHours(hour, minute, 0, 0);
        return d;
      }

      async function scheduledFixture(
        sportId: string,
        competitionId: string,
        seasonId: string,
        formatId: string,
        venueId: string,
        home: string,
        away: string,
        homeEntityId: string,
        awayEntityId: string,
        startsAt: Date,
        competitionSlugHint: string,
      ): Promise<string> {
        const eventId = await id(
          client,
          `insert into event (sport_id, competition_id, season_id, format_id, venue_id, slug, starts_at, status)
           values ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
           returning id`,
          [
            sportId, competitionId, seasonId, formatId, venueId,
            eventSlug({
              sides: [home, away],
              competition: competitionSlugHint,
              date: startsAt.toISOString().slice(0, 10),
            }),
            startsAt,
          ],
        );
        await client.query(
          `insert into event_participant (event_id, entity_id, side) values ($1, $2, 1), ($1, $3, 2)`,
          [eventId, homeEntityId, awayEntityId],
        );
        return eventId;
      }

      await scheduledFixture(
        football, superLig, superLig2526, footballRegulation, vodafonePark,
        'Beşiktaş', 'Galatasaray', clubIds.get('Beşiktaş')!, clubIds.get('Galatasaray')!,
        daysFromNow(1, 19, 0), 'Süper Lig',
      );
      await scheduledFixture(
        football, superLig, superLig2526, footballRegulation, ramsPark,
        'Fenerbahçe', 'Beşiktaş', clubIds.get('Fenerbahçe')!, clubIds.get('Beşiktaş')!,
        daysFromNow(4, 20, 0), 'Süper Lig',
      );
      await scheduledFixture(
        volleyball, sultanlarLigi, sultanlarLigi2526, volleyballBestOf5, burhanFelek,
        'Fenerbahçe', 'VakıfBank', clubIds.get('Fenerbahçe')!, clubIds.get('VakıfBank')!,
        daysFromNow(2, 19, 30), 'Voleybol',
      );
      await scheduledFixture(
        volleyball, cevChampionsLeague, cevCl2526, volleyballBestOf5, palaVerde,
        'Eczacıbaşı Dynavit', 'Imoco Volley Conegliano',
        clubIds.get('Eczacıbaşı Dynavit')!, clubIds.get('Imoco Volley Conegliano')!,
        daysFromNow(6, 20, 0), 'CEV',
      );
      await scheduledFixture(
        basketball, nba, nba2526, basketballRegulation, paycomCenter,
        'Oklahoma City Thunder', 'Denver Nuggets',
        clubIds.get('Oklahoma City Thunder')!, clubIds.get('Denver Nuggets')!,
        daysFromNow(3, 18, 0), 'NBA',
      );
      await scheduledFixture(
        cricket, theAshes, ashes2526, cricketTest, mcg,
        'Australia', 'England', nationalTeams.get('Australia')!, nationalTeams.get('England')!,
        daysFromNow(8, 10, 30), 'The Ashes',
      );

      // --- live fixtures ---------------------------------------------------
      // A live match's starts_at is in the (recent) past with no final score
      // yet — the home sidebar's compact calendar renders these with a
      // pulsing "canlı" badge instead of a kickoff time.
      async function liveFixture(
        sportId: string,
        competitionId: string,
        seasonId: string,
        formatId: string,
        venueId: string,
        home: string,
        away: string,
        homeEntityId: string,
        awayEntityId: string,
        startedMinutesAgo: number,
        competitionSlugHint: string,
      ): Promise<string> {
        const startsAt = new Date(Date.now() - startedMinutesAgo * 60_000);
        const eventId = await id(
          client,
          `insert into event (sport_id, competition_id, season_id, format_id, venue_id, slug, starts_at, status)
           values ($1, $2, $3, $4, $5, $6, $7, 'live')
           returning id`,
          [
            sportId, competitionId, seasonId, formatId, venueId,
            eventSlug({
              sides: [home, away],
              competition: competitionSlugHint,
              date: startsAt.toISOString().slice(0, 10),
              suffix: 'canli',
            }),
            startsAt,
          ],
        );
        await client.query(
          `insert into event_participant (event_id, entity_id, side) values ($1, $2, 1), ($1, $3, 2)`,
          [eventId, homeEntityId, awayEntityId],
        );
        return eventId;
      }

      await liveFixture(
        basketball, nba, nba2526, basketballRegulation, paycomCenter,
        'Oklahoma City Thunder', 'Boston Celtics',
        clubIds.get('Oklahoma City Thunder')!, clubIds.get('Boston Celtics')!,
        35, 'NBA',
      );
      await liveFixture(
        volleyball, sultanlarLigi, sultanlarLigi2526, volleyballBestOf5, burhanFelek,
        'VakıfBank', 'Fenerbahçe', clubIds.get('VakıfBank')!, clubIds.get('Fenerbahçe')!,
        50, 'Voleybol',
      );

      // --- user + logs ---------------------------------------------------
      // burkay gets a real password so `npm run dev` + POST /api/auth/login
      // works right away. The three below stay signup-less like burkay used
      // to be: they exist to own logs and follows, not to sign in.
      const user = await id(
        client,
        `insert into app_user (handle, email, display_name, country, password_hash)
         values ('burkay', 'burkay@example.com', 'Burkay', 'TR', $1) returning id`,
        [await hashPasswordForSeed('demo1234')],
      );

      const others = new Map<string, string>();
      for (const [handle, displayName] of [
        ['elif', 'Elif'],
        ['deniz', 'Deniz'],
        ['mert', 'Mert'],
      ] as Array<[string, string]>) {
        others.set(
          handle,
          await id(
            client,
            `insert into app_user (handle, email, display_name, country)
             values ($1, $2, $3, 'TR') returning id`,
            [handle, `${handle}@example.com`, displayName],
          ),
        );
      }
      const elif = others.get('elif')!;
      const deniz = others.get('deniz')!;
      const mert = others.get('mert')!;

      // 1. At the ground, whole match, football and atmosphere rated apart.
      const derbyLog = await id(
        client,
        `insert into log (user_id, event_id, medium, watched_on, rating, atmosphere, review, ticket_ref)
         values ($1, $2, 'stadium', '2026-02-15', $3, $4,
                 'Futbol vasattı ama tribün başka bir şeydi.', 'Kapalı, Blok 214, Sıra 12')
         returning id`,
        [user, derby, starsToPoint(3), starsToPoint(5)],
      );

      // 2. Bailed at 2-0 down. No segment rows for sets 3 and 4 -> saw_ending false.
      const finalLog = await id(
        client,
        `insert into log (user_id, event_id, medium, watched_on, rating, review, is_live_watch)
         values ($1, $2, 'tv', '2008-07-06', $3,
                 '2-0 önde bırakıp kalktım. Hayatımın hatası.', true)
         returning id`,
        [user, final2008, starsToPoint(4.5)],
      );
      await client.query(
        `insert into log_segment (log_id, segment_index) values ($1, 1), ($1, 2)`,
        [finalLog],
      );

      // 3. Channel-hopped: sets 1 and 4 only -> fragmented, but saw the ending.
      const rewatchLog = await id(
        client,
        `insert into log (user_id, event_id, medium, watched_on, rating, review, is_live_watch, is_rewatch)
         values ($1, $2, 'replay', '2024-07-06', $3,
                 'Arada geçtim, en azından son seti gördüm.', false, true)
         returning id`,
        [user, final2008, starsToPoint(5)],
      );
      await client.query(
        `insert into log_segment (log_id, segment_index) values ($1, 1), ($1, 4), ($1, 5)`,
        [rewatchLog],
      );

      void derbyLog;

      // 4. burkay, from the couch — only caught the first half, so
      // saw_ending is false here too, same shape as his Wimbledon log above.
      const thunderNuggetsLog = await id(
        client,
        `insert into log (user_id, event_id, medium, watched_on, rating, review, is_live_watch)
         values ($1, $2, 'stream', '2025-11-05', $3, $4, true)
         returning id`,
        [user, thunderNuggets1, starsToPoint(4), 'Son çeyreği kaçırdım ama gördüğüm kadarı tempo doluydu.'],
      );
      await client.query(
        `insert into log_segment (log_id, segment_index) values ($1, 1), ($1, 2)`,
        [thunderNuggetsLog],
      );

      // 5. burkay, at the ground for a Sultanlar Ligi derby.
      await id(
        client,
        `insert into log (user_id, event_id, medium, watched_on, rating, atmosphere, review, ticket_ref)
         values ($1, $2, 'stadium', '2025-10-18', $3, $4, $5, 'B Blok, Sıra 9')
         returning id`,
        [user, vbFb1, starsToPoint(4), starsToPoint(4.5), 'Beşinci sete kalmadı ama salon yine de doluydu.'],
      );

      // 6. elif — the old derby, highlights only, unimpressed.
      await id(
        client,
        `insert into log (user_id, event_id, medium, watched_on, rating, review, is_live_watch)
         values ($1, $2, 'highlights', '2026-02-16', $3, $4, false)
         returning id`,
        [elif, derby, starsToPoint(2.5), 'Özeti izledim, kaçırdığıma pişman olmadım.'],
      );

      // 7. elif, Eczacıbaşı's straight-sets win.
      await id(
        client,
        `insert into log (user_id, event_id, medium, watched_on, rating, review)
         values ($1, $2, 'tv', '2025-10-25', $3, $4)
         returning id`,
        [elif, eczGs1, starsToPoint(3.5), "Tek taraflı ama Eczacıbaşı'nın servisi izlenmeye değerdi."],
      );

      // 8. elif, the Boxing Day Test, after the fact.
      await id(
        client,
        `insert into log (user_id, event_id, medium, watched_on, rating, review, is_live_watch)
         values ($1, $2, 'stream', '2025-12-28', $3, $4, false)
         returning id`,
        [elif, ashesMcg, starsToPoint(4), "Dördüncü günde bitmesi Avustralya'nın işini kolaylaştırdı."],
      );

      // 9. elif — a private log, the one rating she wouldn't post publicly.
      await id(
        client,
        `insert into log (user_id, event_id, medium, watched_on, rating, review, visibility)
         values ($1, $2, 'tv', '2025-12-02', $3, $4, 'private')
         returning id`,
        [elif, nuggetsLakers1, starsToPoint(2), 'Savunma diye bir şey yoktu.'],
      );

      // 10. deniz, the NBA rematch.
      await id(
        client,
        `insert into log (user_id, event_id, medium, watched_on, rating, review)
         values ($1, $2, 'highlights', '2026-01-25', $3, $4)
         returning id`,
        [deniz, nuggetsThunder2, starsToPoint(3), 'Deplasman galibiyeti özete bile yakıştı.'],
      );

      // 11. deniz, the drawn Sydney Test — tuned in only for the tense final
      // day, segment 5 only, saw_ending true despite the sparse coverage.
      const ashesScgLog = await id(
        client,
        `insert into log (user_id, event_id, medium, watched_on, rating, review)
         values ($1, $2, 'radio', '2026-01-08', $3, $4)
         returning id`,
        [deniz, ashesScg, starsToPoint(4.5), "Son güne sadece radyodan girdim, İngiltere'nin direnişi yeterliydi."],
      );
      await client.query(`insert into log_segment (log_id, segment_index) values ($1, 5)`, [
        ashesScgLog,
      ]);

      // 12. deniz — followers-only take on a CEV night.
      await id(
        client,
        `insert into log (user_id, event_id, medium, watched_on, rating, review, visibility)
         values ($1, $2, 'stadium', '2025-12-13', $3, $4, 'followers')
         returning id`,
        [deniz, imoEcz1, starsToPoint(4), "PalaVerde'de gecenin sahibi Imoco'ydu."],
      );

      // 13. mert, at the ground for VakıfBank's CEV thriller.
      await id(
        client,
        `insert into log (user_id, event_id, medium, watched_on, rating, atmosphere, review, ticket_ref)
         values ($1, $2, 'stadium', '2025-11-15', $3, $4, $5, 'A Blok, Sıra 3')
         returning id`,
        [mert, vbImo1, starsToPoint(5), starsToPoint(5), 'Beşinci set 16-14 bitti, salon ayaktaydı.'],
      );

      // 14. mert, the other NBA fixture.
      await id(
        client,
        `insert into log (user_id, event_id, medium, watched_on, rating, review)
         values ($1, $2, 'tv', '2025-12-21', $3, $4)
         returning id`,
        [mert, thunderCeltics1, starsToPoint(3), 'Thunder ikinci yarıda farkı açtı.'],
      );

      // --- follow ----------------------------------------------------------
      // elif and deniz follow burkay; burkay follows mert. Gives the one
      // profile the UI ever shows a non-zero follower AND following count.
      await client.query(
        `insert into follow (follower_id, followee_id) values
           ($1, $4),
           ($2, $4),
           ($4, $3)`,
        [elif, deniz, mert, user],
      );

      // --- lists -------------------------------------------------------
      // Two of burkay's own, one editorial (user_id null) — exercises both
      // branches of list.user_id and both getFeaturedLists/getListsForUser.
      const fifthSetList = await id(
        client,
        `insert into list (user_id, slug, title, description, is_ranked, visibility)
         values ($1, $2, $3, $4, false, 'public') returning id`,
        [user, 'besinci-sete-kalanlar', 'Gördüğüm en iyi beşinci setler', 'Zirve segmenti beşinci set olan maçlar.'],
      );
      await client.query(
        `insert into list_item (list_id, position, event_id) values ($1, 1, $2), ($1, 2, $3)`,
        [fifthSetList, final2008, vbImo1],
      );

      const missedEndingList = await id(
        client,
        `insert into list (user_id, slug, title, description, is_ranked, visibility)
         values ($1, $2, $3, $4, false, 'public') returning id`,
        [user, 'sonunu-kacirdiklarim', 'Sonunu kaçırdıklarım', 'Bitmeden kapattığım ya da kaçırdığım maçlar.'],
      );
      await client.query(
        `insert into list_item (list_id, position, event_id) values ($1, 1, $2), ($1, 2, $3)`,
        [missedEndingList, final2008, thunderNuggets1],
      );

      const editorialList = await id(
        client,
        `insert into list (user_id, slug, title, description, is_ranked, visibility)
         values (null, $1, $2, $3, true, 'public') returning id`,
        [
          'vidinin-one-cikardiklari',
          "Vidi'nin öne çıkardıkları",
          'Farklı sporlardan öne çıkan dört karşılaşma.',
        ],
      );
      await client.query(
        `insert into list_item (list_id, position, event_id) values
           ($1, 1, $2), ($1, 2, $3), ($1, 3, $4), ($1, 4, $5)`,
        [editorialList, final2008, derby, thunderCeltics1, ashesMcg],
      );
    });

    // --- verify --------------------------------------------------------
    const { rows: coverage } = await client.query(
      `select e.slug as event,
              l.medium,
              l.watched_on,
              c.segments_seen,
              c.segments_total,
              round(c.coverage_fraction, 2) as coverage,
              c.saw_ending,
              c.is_fragmented
         from log_coverage c
         join log l on l.id = c.log_id
         join event e on e.id = c.event_id
        order by l.watched_on`,
    );
    console.table(coverage);

    const { rows: names } = await client.query(
      `select v.display_name as current_name, n.name as name_at_the_time
         from venue v
         join venue_name n on n.venue_id = v.id
        where v.slug = 'rams-park'
          and daterange(n.valid_from, n.valid_to, '[]') @> date '2013-05-12'`,
    );
    console.table(names);
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
