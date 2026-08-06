// URL slugs. First-day decision, expensive to change later, so it is hand
// written rather than pulled from a library.
//
// The Turkish trap that most slugify libraries get wrong:
//   'İ'.toLowerCase()    -> 'i' + U+0307  (two code points, not 'i')
//   'ı'.normalize('NFD') -> 'ı'           (no diacritic to strip)
// So the letters are mapped to ASCII BEFORE any lowercasing or normalising.
// Get this wrong and "İstanbul" or "Fenerbahçe Şükrü Saracoğlu" produce
// broken URLs.

const LETTER_MAP: Record<string, string> = {
  // Turkish
  'İ': 'i', I: 'i', 'ı': 'i', // İ, I, ı
  'Ş': 's', 'ş': 's',         // Ş, ş
  'Ğ': 'g', 'ğ': 'g',         // Ğ, ğ
  'Ü': 'u', 'ü': 'u',         // Ü, ü
  'Ö': 'o', 'ö': 'o',         // Ö, ö
  'Ç': 'c', 'ç': 'c',         // Ç, ç
  // Other Latin letters NFD cannot decompose
  'ß': 'ss',                        // ß
  'Ø': 'o', 'ø': 'o',         // Ø, ø
  'Æ': 'ae', 'æ': 'ae',       // Æ, æ
  'Œ': 'oe', 'œ': 'oe',       // Œ, œ
  'Ð': 'd', 'ð': 'd',         // Ð, ð
  'Þ': 'th', 'þ': 'th',       // Þ, þ
  'Ł': 'l', 'ł': 'l',         // Ł, ł
  'Đ': 'd', 'đ': 'd',         // Đ, đ
};

const LETTER_RE = new RegExp(`[${Object.keys(LETTER_MAP).join('')}]`, 'g');
const COMBINING_RE = /[\u0300-\u036f]/g;

export function slugify(input: string): string {
  return input
    .replace(LETTER_RE, (ch) => LETTER_MAP[ch] ?? ch)
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_RE, '')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** `['Galatasaray', 'Fenerbahçe']` -> `galatasaray-v-fenerbahce-2026-04-12` */
export function eventSlug(parts: {
  sides: string[];
  date?: string | undefined; // ISO date; disambiguates repeat fixtures
  competition?: string | undefined;
  suffix?: string | undefined; // manual tiebreaker for same-day repeats
}): string {
  const segments = [
    parts.sides.map(slugify).join('-v-'),
    parts.competition ? slugify(parts.competition) : undefined,
    parts.date,
    parts.suffix ? slugify(parts.suffix) : undefined,
  ].filter((s): s is string => Boolean(s));

  return slugify(segments.join('-'));
}
