// Shape of data/sports.json plus a validator, so the seed script fails on a
// typo in the JSON instead of on a CHECK constraint halfway through.

import { SPORT_TOPOLOGIES, isOneOf, type SportTopology } from './enums';

export interface FormatSeed {
  slug: string;
  name: string;
  segmentLabel: string;
  /** null = open ended (deciding sets, extra innings). */
  segmentCount: number | null;
  isDefault?: boolean;
  notes?: string;
}

export interface SportSeed {
  slug: string;
  name: string;
  topology: SportTopology;
  isTeamSport: boolean;
  sortOrder: number;
  formats: FormatSeed[];
}

export interface SportsFile {
  version: number;
  sports: SportSeed[];
}

export function parseSportsFile(input: unknown): SportsFile {
  const problems: string[] = [];
  const file = input as Partial<SportsFile>;

  if (typeof file?.version !== 'number') problems.push('version must be a number');
  if (!Array.isArray(file?.sports)) problems.push('sports must be an array');

  for (const [i, sport] of (file.sports ?? []).entries()) {
    const at = `sports[${i}]`;
    if (!sport.slug) problems.push(`${at}.slug is required`);
    if (!sport.name) problems.push(`${at}.name is required`);
    if (!isOneOf(SPORT_TOPOLOGIES, sport.topology)) {
      problems.push(`${at}.topology invalid: ${String(sport.topology)}`);
    }
    if (typeof sport.isTeamSport !== 'boolean') problems.push(`${at}.isTeamSport must be a boolean`);
    if (typeof sport.sortOrder !== 'number') problems.push(`${at}.sortOrder must be a number`);
    if (!Array.isArray(sport.formats) || sport.formats.length === 0) {
      problems.push(`${at}.formats must be a non-empty array`);
      continue;
    }

    const defaults = sport.formats.filter((f) => f.isDefault);
    if (defaults.length !== 1) {
      problems.push(`${at}.formats needs exactly one isDefault, found ${defaults.length}`);
    }

    const slugs = new Set<string>();
    for (const [j, format] of sport.formats.entries()) {
      const fAt = `${at}.formats[${j}]`;
      if (!format.slug) problems.push(`${fAt}.slug is required`);
      if (slugs.has(format.slug)) problems.push(`${fAt}.slug duplicated: ${format.slug}`);
      slugs.add(format.slug);
      if (!format.segmentLabel) problems.push(`${fAt}.segmentLabel is required`);
      if (format.segmentCount !== null && !(Number.isInteger(format.segmentCount) && format.segmentCount > 0)) {
        problems.push(`${fAt}.segmentCount must be a positive integer or null`);
      }
    }
  }

  const sportSlugs = (file.sports ?? []).map((s) => s.slug);
  const dupes = sportSlugs.filter((s, i) => sportSlugs.indexOf(s) !== i);
  if (dupes.length) problems.push(`duplicate sport slugs: ${[...new Set(dupes)].join(', ')}`);

  if (problems.length) {
    throw new Error(`sports.json is invalid:\n  - ${problems.join('\n  - ')}`);
  }

  return file as SportsFile;
}
