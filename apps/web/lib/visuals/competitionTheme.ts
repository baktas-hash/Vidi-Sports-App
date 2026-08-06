import { hashString } from './hash';

export type Motif = 'superlig' | 'wimbledon' | 'sultanlar' | 'cev' | 'nba' | 'test' | 'fallback';

export interface CompetitionTheme {
  bg: string;
  ink: string;
  accent: string;
  motif: Motif;
}

const FALLBACK_MOTIFS: Motif[] = ['superlig', 'wimbledon', 'sultanlar', 'cev', 'nba', 'test', 'fallback'];

// Keyed by the real competition slug (db/migrations' competition.slug), not a
// marketing name — colors/motif are frontend-only presentation, nothing in
// the schema carries branding. Ported from the original design prototype.
const CURATED: Record<string, CompetitionTheme> = {
  'super-lig': { bg: '#2A0A0E', ink: '#FFE9EA', accent: '#FF4D5E', motif: 'superlig' },
  wimbledon: { bg: '#0B2E1C', ink: '#F2FFF6', accent: '#C6A2E8', motif: 'wimbledon' },
  'sultanlar-ligi': { bg: '#1A1207', ink: '#FFF3DF', accent: '#FF9E2C', motif: 'sultanlar' },
  'cev-champions-league': { bg: '#0E1030', ink: '#E6E8FF', accent: '#6C7BFF', motif: 'cev' },
  nba: { bg: '#141414', ink: '#FFEFE0', accent: '#FF7A18', motif: 'nba' },
  'the-ashes': { bg: '#1C1610', ink: '#F1E9DE', accent: '#C9793F', motif: 'test' },
};

// Fixed lightness/saturation bands; only the hue varies by hash. Guarantees a
// readable dark-bg/light-ink pair for any competition we never curated —
// real DB content will always outgrow this list.
function fallbackTheme(slug: string): CompetitionTheme {
  const hue = hashString(slug) % 360;
  return {
    bg: `hsl(${hue} 38% 10%)`,
    ink: `hsl(${hue} 25% 94%)`,
    accent: `hsl(${hue} 85% 60%)`,
    motif: FALLBACK_MOTIFS[hashString(`${slug}:motif`) % FALLBACK_MOTIFS.length]!,
  };
}

export function getCompetitionTheme(slug: string): CompetitionTheme {
  return CURATED[slug] ?? fallbackTheme(slug);
}
