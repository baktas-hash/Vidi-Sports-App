// The scoreboard's color is keyed by SPORT, not by competition — one
// consistent "volleyball color" whether it's Sultanlar Ligi or CEV. The
// poster/art background is the other axis (competition-keyed); this is a
// deliberate split carried over from the original design prototype.
const SPORT_ACCENT: Record<string, string> = {
  volleyball: '#FF9E2C',
  football: '#3DD68C',
  cricket: '#F2C14E',
  basketball: '#FF7A18',
  tennis: '#7BD3F7',
  'american-football': '#B39DFF',
  'rugby-union': '#5EEAD4',
  'rugby-league': '#5EEAD4',
  boxing: '#FF6B5B',
  mma: '#FF6B5B',
};

export function getSportAccent(sportSlug: string): string {
  return SPORT_ACCENT[sportSlug] ?? '#FFB020';
}
