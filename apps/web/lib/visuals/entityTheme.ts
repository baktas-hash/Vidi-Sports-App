import { hashString } from './hash';

export interface EntityTheme {
  c1: string;
  c2: string;
}

// Keyed by entity.slug. Plain color pairs, not logos/crests — deliberately,
// to stay clear of trademark use while still reading as "that club" at a
// glance. Ported from the original design prototype's team-color table.
const CURATED: Record<string, EntityTheme> = {
  galatasaray: { c1: '#A90432', c2: '#FBB03B' },
  fenerbahce: { c1: '#003B70', c2: '#FFEC00' },
  besiktas: { c1: '#111111', c2: '#FFFFFF' },
  vakifbank: { c1: '#FFD200', c2: '#141414' },
  'eczacibasi-dynavit': { c1: '#F26A1B', c2: '#FFFFFF' },
  'imoco-volley-conegliano': { c1: '#E4007C', c2: '#1A1A1A' },
  'denver-nuggets': { c1: '#0E2240', c2: '#FEC524' },
  'oklahoma-city-thunder': { c1: '#0072CE', c2: '#EF3B24' },
  'boston-celtics': { c1: '#007A33', c2: '#BA9653' },
  'los-angeles-lakers': { c1: '#552583', c2: '#FDB927' },
  england: { c1: '#F5F5F5', c2: '#12266B' },
  australia: { c1: '#F2C14E', c2: '#0B6E4F' },
  'roger-federer': { c1: '#D52B1E', c2: '#FFFFFF' },
  'rafael-nadal': { c1: '#C60B1E', c2: '#F2C14E' },
};

function fallbackTheme(slug: string): EntityTheme {
  const hue = hashString(slug) % 360;
  return { c1: `hsl(${hue} 45% 28%)`, c2: `hsl(${(hue + 40) % 360} 70% 88%)` };
}

export function getEntityTheme(slug: string): EntityTheme {
  return CURATED[slug] ?? fallbackTheme(slug);
}

// short_name (e.g. 'GS', 'DEN') wins when the DB has one; individual persons
// in the current seed (Federer, Nadal) don't, so this always needs the
// word-initials fallback path too.
export function initialsFor(displayName: string, shortName?: string | null): string {
  if (shortName) return shortName.slice(0, 3).toUpperCase();
  const words = displayName.split(/\s+/).filter(Boolean);
  return words
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

// Only meaningful for literal #rrggbb values — hash-fallback c1 is an hsl()
// string with a fixed dark band by construction, so this only has to handle
// the curated palette's occasional near-white c1 (VakıfBank, Beşiktaş).
export function isLightColor(color: string): boolean {
  if (!color.startsWith('#') || color.length !== 7) return false;
  const n = Number.parseInt(color.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 186;
}
