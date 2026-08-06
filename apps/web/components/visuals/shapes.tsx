export type BadgeShape = 'shield' | 'pentagon' | 'roundedRect' | 'ellipse' | 'circle';

// Badge shape is a cosmetic/branding choice keyed by sport, not by topology
// (topology drives Scoreboard's layout instead — a different axis). Anything
// not listed here (basketball, tennis, american-football, boxing, mma) gets
// the circle default, matching the original prototype's spec.
const SHAPE_BY_SPORT: Record<string, BadgeShape> = {
  football: 'shield',
  volleyball: 'pentagon',
  cricket: 'roundedRect',
  'rugby-union': 'ellipse',
  'rugby-league': 'ellipse',
};

export function shapeForSport(sportSlug: string): BadgeShape {
  return SHAPE_BY_SPORT[sportSlug] ?? 'circle';
}

export function BadgeClipShape({ shape }: { shape: BadgeShape }) {
  switch (shape) {
    case 'shield':
      return <path d="M50 4 92 18v34c0 26-20 39-42 46C28 91 8 78 8 52V18z" />;
    case 'pentagon':
      return <path d="M50 5 89 27v46L50 95 11 73V27z" />;
    case 'roundedRect':
      return <rect x="8" y="8" width="84" height="84" rx="20" />;
    case 'ellipse':
      return <ellipse cx="50" cy="50" rx="46" ry="34" />;
    case 'circle':
      return <circle cx="50" cy="50" r="45" />;
  }
}
