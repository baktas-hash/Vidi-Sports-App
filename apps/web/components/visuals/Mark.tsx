import { useId } from 'react';

import { getEntityTheme, initialsFor, isLightColor } from '@/lib/visuals/entityTheme';

import { BadgeClipShape, shapeForSport } from './shapes';

export interface MarkEntity {
  slug: string;
  name: string;
  shortName?: string | null;
}

// Individual-athlete sports don't get a generic badge — three initials in a
// circle reads worse than the plain name for a single person, unlike a club.
const INDIVIDUAL_SPORTS = new Set(['tennis', 'boxing', 'mma']);

export function Mark({
  entity,
  sportSlug,
  size = 32,
  className,
}: {
  entity: MarkEntity;
  sportSlug: string;
  size?: number;
  className?: string;
}) {
  const clipId = useId();

  if (INDIVIDUAL_SPORTS.has(sportSlug)) return null;

  const { c1, c2 } = getEntityTheme(entity.slug);
  const initials = initialsFor(entity.name, entity.shortName);
  const shape = shapeForSport(sportSlug);
  const textColor = isLightColor(c1) ? '#141414' : '#FFFFFF';

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={entity.name}
      className={className}
      style={{ flexShrink: 0 }}
    >
      <defs>
        <clipPath id={clipId}>
          <BadgeClipShape shape={shape} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="100" height="100" fill={c1} />
        <path d="M0 62 100 30V100H0Z" fill={c2} opacity={0.92} />
      </g>
      <text
        x="50"
        y="63"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontWeight={800}
        fontSize={42}
        fill={textColor}
        stroke="rgba(0,0,0,.35)"
        strokeWidth={1}
        paintOrder="stroke"
      >
        {initials}
      </text>
      <g fill="none" stroke="rgba(255,255,255,.28)" strokeWidth={3} clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="100" height="100" />
      </g>
    </svg>
  );
}
