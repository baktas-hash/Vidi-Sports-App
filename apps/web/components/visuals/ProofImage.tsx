import { getCompetitionTheme } from '@/lib/visuals/competitionTheme';

export interface ProofImageProps {
  kind: 'stub' | 'crowd';
  logId: string;
  competitionSlug: string | null;
  competitionName: string;
  homeName: string;
  awayName: string;
  venue: string | null;
  date: string;
  seat?: string | null;
  width?: number;
}

// Fake "evidence" — a generated ticket stub / crowd-square, not a real photo
// upload (no schema/storage for that exists). Everything here is deterministic
// from the log id and fixed index math, same as the original prototype —
// there was never a Math.random() in this one to begin with.
export function ProofImage({
  kind,
  logId,
  competitionSlug,
  competitionName,
  homeName,
  awayName,
  venue,
  date,
  seat,
  width = 700,
}: ProofImageProps) {
  const height = Math.round(width * 0.62);
  const theme = getCompetitionTheme(competitionSlug ?? 'no-competition');

  if (kind === 'stub') {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-hidden="true">
        <rect width={width} height={height} fill="#E8DECD" />
        <rect x={0} y={0} width={width} height={height} fill="none" stroke="#C6B79E" strokeWidth={4} />
        <line
          x1={width * 0.68}
          y1={8}
          x2={width * 0.68}
          y2={height - 8}
          stroke="#C6B79E"
          strokeWidth={3}
          strokeDasharray="9 8"
        />
        <text x={34} y={height * 0.2} fontFamily="var(--font-mono)" fontSize={width * 0.021} fill="#7A6A55" letterSpacing={3}>
          {competitionName.toLocaleUpperCase('tr-TR')}
        </text>
        <text x={34} y={height * 0.42} fontFamily="var(--font-display)" fontWeight={800} fontSize={width * 0.062} fill="#241812">
          {homeName}
        </text>
        <text x={34} y={height * 0.57} fontFamily="var(--font-display)" fontWeight={800} fontSize={width * 0.062} fill="#241812">
          {awayName}
        </text>
        <text x={34} y={height * 0.78} fontFamily="var(--font-mono)" fontSize={width * 0.022} fill="#5C4B3D">
          {date}
          {venue ? ` · ${venue}` : ''}
        </text>
        <text x={34} y={height * 0.89} fontFamily="var(--font-mono)" fontSize={width * 0.022} fill="#5C4B3D">
          {seat ?? ''}
        </text>
        <text
          x={width * 0.84}
          y={height * 0.46}
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontWeight={800}
          fontSize={width * 0.05}
          fill="#8C2F22"
        >
          GİRİŞ
        </text>
        <text x={width * 0.84} y={height * 0.6} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={width * 0.02} fill="#7A6A55">
          {logId.replace(/-/g, '').slice(0, 6)}
        </text>
        {Array.from({ length: 26 }, (_, i) => (
          <rect
            key={i}
            x={width * 0.76 + i * (width * 0.006)}
            y={height * 0.7}
            width={(i % 3 ? 1.6 : 3.2) * (width / 740)}
            height={height * 0.14}
            fill="#241812"
          />
        ))}
      </svg>
    );
  }

  const gradientId = `proof-sky-${logId}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={theme.bg} />
          <stop offset="1" stopColor={theme.accent} stopOpacity={0.35} />
        </linearGradient>
      </defs>
      <rect width={width} height={height} fill={`url(#${gradientId})`} />
      {[0.18, 0.5, 0.82].map((p) => (
        <g key={p}>
          <circle cx={width * p} cy={height * 0.13} r={width * 0.028} fill="#FFF6DC" opacity={0.85} />
          <circle cx={width * p} cy={height * 0.13} r={width * 0.075} fill="#FFF6DC" opacity={0.12} />
        </g>
      ))}
      <rect x={0} y={height * 0.3} width={width} height={height * 0.3} fill={theme.accent} opacity={0.22} />
      {Array.from({ length: 9 }, (_, i) => (
        <line
          key={i}
          x1={(width * (i + 1)) / 10}
          y1={height * 0.3}
          x2={(width * (i + 1)) / 10}
          y2={height * 0.6}
          stroke="#FFFFFF"
          strokeOpacity={0.18}
          strokeWidth={2}
        />
      ))}
      <rect
        x={width * 0.22}
        y={height * 0.36}
        width={width * 0.56}
        height={height * 0.18}
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.28}
        strokeWidth={2}
      />
      <rect x={0} y={height * 0.6} width={width} height={height * 0.4} fill="#101317" />
      {Array.from({ length: 170 }, (_, i) => {
        const x = (i * 37) % width;
        const y = height * 0.62 + Math.floor(i / 22) * (height * 0.045) + (i % 3) * 2;
        return <circle key={i} cx={x} cy={y} r={width * 0.007} fill="#0B0D0F" opacity={0.55 + (i % 4) * 0.1} />;
      })}
      <rect x={0} y={height * 0.6} width={width} height={3} fill={theme.accent} opacity={0.5} />
      <text x={width - 22} y={height - 18} textAnchor="end" fontFamily="var(--font-mono)" fontSize={width * 0.02} fill="#FFFFFF" opacity={0.55}>
        {venue ?? ''} · {date}
      </text>
    </svg>
  );
}
