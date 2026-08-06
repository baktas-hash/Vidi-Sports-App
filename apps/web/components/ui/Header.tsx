import Link from 'next/link';

export function Header({ currentUser }: { currentUser: { handle: string } | null }) {
  return (
    <header className="flex items-end justify-between border-b border-line bg-canvas px-4 pb-2.5 pt-3">
      <div className="font-display text-2xl font-extrabold uppercase tracking-wide">
        VID<span className="text-amber">I</span>
      </div>
      {currentUser ? (
        <Link
          href="/notifications"
          aria-label="Bildirimler"
          className="relative grid h-9 w-9 flex-none place-items-center rounded-full border border-line bg-surface"
        >
          <svg
            viewBox="0 0 24 24"
            width={16}
            height={16}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            aria-hidden="true"
            className="text-dim"
          >
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-canvas bg-amber" />
        </Link>
      ) : (
        <Link href="/login" className="font-display text-sm font-semibold uppercase tracking-wide text-amber">
          Giriş yap
        </Link>
      )}
    </header>
  );
}
