import type { ReactNode } from 'react';

import type { Motif } from '@/lib/visuals/competitionTheme';

// Each motif is the sport's own geometry, not decoration bolted on: a
// volleyball net grid, a half-court arc, a cricket seam. Ported 1:1 from the
// original design prototype's art() switch, as plain SVG primitives instead
// of a template-string builder.

function sultanlar(w: number, h: number, a: string): ReactNode {
  const diag: ReactNode[] = [];
  for (let i = -h; i < w + h; i += 13) {
    diag.push(
      <line key={`d${i}`} x1={i} y1={0} x2={i + h} y2={h} stroke={a} strokeOpacity={0.16} strokeWidth={1} />,
    );
  }
  const horiz: ReactNode[] = [];
  for (let i = 0; i < h; i += 13) {
    horiz.push(<line key={`h${i}`} x1={0} y1={i} x2={w} y2={i} stroke={a} strokeOpacity={0.1} strokeWidth={1} />);
  }
  return (
    <>
      {diag}
      {horiz}
      <rect x={0} y={h * 0.3} width={w} height={h * 0.02} fill={a} opacity={0.55} />
    </>
  );
}

function cev(w: number, h: number, a: string): ReactNode {
  const rings: ReactNode[] = [];
  for (let r = 1; r < 9; r += 1) {
    rings.push(
      <circle
        key={r}
        cx={w * 0.5}
        cy={h * 0.34}
        r={r * w * 0.16}
        fill="none"
        stroke={a}
        strokeOpacity={0.2}
        strokeWidth={1.4}
      />,
    );
  }
  return <>{rings}</>;
}

function nba(w: number, h: number, a: string): ReactNode {
  return (
    <>
      <rect
        x={w * 0.28}
        y={0}
        width={w * 0.44}
        height={h * 0.34}
        fill="none"
        stroke={a}
        strokeOpacity={0.32}
        strokeWidth={1.6}
      />
      <circle cx={w * 0.5} cy={h * 0.34} r={w * 0.2} fill="none" stroke={a} strokeOpacity={0.32} strokeWidth={1.6} />
      <path
        d={`M${w * 0.06} 0 L${w * 0.06} ${h * 0.2} Q ${w * 0.5} ${h * 0.62} ${w * 0.94} ${h * 0.2} L${w * 0.94} 0`}
        fill="none"
        stroke={a}
        strokeOpacity={0.2}
        strokeWidth={1.4}
      />
    </>
  );
}

function test(w: number, h: number, a: string): ReactNode {
  return (
    <>
      <path
        d={`M${-w * 0.1} ${h * 0.3} Q ${w * 0.5} ${h * 0.02} ${w * 1.1} ${h * 0.3}`}
        fill="none"
        stroke={a}
        strokeOpacity={0.35}
        strokeWidth={2.5}
        strokeDasharray="7 6"
      />
      <path
        d={`M${-w * 0.1} ${h * 0.4} Q ${w * 0.5} ${h * 0.12} ${w * 1.1} ${h * 0.4}`}
        fill="none"
        stroke={a}
        strokeOpacity={0.18}
        strokeWidth={2}
        strokeDasharray="7 6"
      />
      <rect x={0} y={h * 0.62} width={w} height={1.5} fill={a} opacity={0.3} />
    </>
  );
}

function superlig(w: number, h: number, a: string): ReactNode {
  const stripes: ReactNode[] = [];
  for (let i = 0; i < w; i += w / 9) {
    stripes.push(<rect key={i} x={i} y={0} width={w / 18} height={h} fill={a} opacity={0.13} />);
  }
  return <>{stripes}</>;
}

function wimbledon(w: number, h: number, a: string): ReactNode {
  const stripes: ReactNode[] = [];
  for (let i = 0; i < h; i += h * 0.045) {
    stripes.push(<rect key={i} x={0} y={i} width={w} height={h * 0.0225} fill={a} opacity={0.1} />);
  }
  return (
    <>
      {stripes}
      <line x1={0} y1={h * 0.3} x2={w} y2={h * 0.3} stroke={a} strokeOpacity={0.55} strokeWidth={2} />
    </>
  );
}

// Not in the prototype (nothing there needed a generic case) — for any
// competition slug that falls through to the hash-based theme.
function fallback(w: number, h: number, a: string): ReactNode {
  const diag: ReactNode[] = [];
  for (let i = -h; i < w + h; i += 22) {
    diag.push(<line key={i} x1={i} y1={0} x2={i + h} y2={h} stroke={a} strokeOpacity={0.14} strokeWidth={1} />);
  }
  return (
    <>
      {diag}
      <circle cx={w * 0.5} cy={h * 0.34} r={w * 0.22} fill="none" stroke={a} strokeOpacity={0.3} strokeWidth={1.6} />
    </>
  );
}

const MOTIFS: Record<Motif, (w: number, h: number, accent: string) => ReactNode> = {
  sultanlar,
  cev,
  nba,
  test,
  superlig,
  wimbledon,
  fallback,
};

export function renderMotif(motif: Motif, w: number, h: number, accent: string): ReactNode {
  return MOTIFS[motif](w, h, accent);
}
