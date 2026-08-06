'use client';

import { formatStars, starsToPoint } from '@vidi/shared';

export function StarPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="font-mono text-[9px] uppercase tracking-wide text-muted">{label}</label>
        <span className="font-display text-[13px] font-bold text-amber">
          {value ? formatStars(starsToPoint(value)) : '–'}
        </span>
      </div>
      <input
        type="range"
        min={0.5}
        max={5}
        step={0.5}
        value={value ?? 0}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-amber"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-1 font-mono text-[9.5px] text-neutral-500 underline"
        >
          puanı temizle
        </button>
      ) : null}
    </div>
  );
}
