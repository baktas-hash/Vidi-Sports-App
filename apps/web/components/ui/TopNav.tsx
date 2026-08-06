'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Ana' },
  { href: '/feed', label: 'Akış' },
  { href: '/competitions', label: 'Turnuva' },
  { href: '/recommendations', label: 'Öneri' },
];

export function TopNav({ currentUser }: { currentUser: { handle: string } | null }) {
  const pathname = usePathname();
  // Logged in: the avatar on the right already links to /profile. Logged
  // out: there's no avatar, so surface it as a plain nav link instead —
  // /profile itself falls back to a sample profile when there's no session.
  const links = currentUser ? NAV_LINKS : [...NAV_LINKS, { href: '/profile', label: 'Profil' }];

  return (
    <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-3">
      <div className="flex items-center gap-9">
        <Link href="/" className="font-display text-xl font-extrabold uppercase tracking-wide">
          VID<span className="text-amber">I</span>
        </Link>
        <nav className="flex items-center gap-6">
          {links.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-display text-[13px] font-bold uppercase tracking-wide ${
                  active ? 'text-amber' : 'text-dim'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {currentUser ? (
          <>
            <Link
              href="/logs/new"
              className="rounded-full bg-amber px-4 py-2 font-display text-[12.5px] font-bold uppercase tracking-wide text-neutral-950"
            >
              ＋ Logla
            </Link>
            <Link
              href="/notifications"
              aria-label="Bildirimler"
              className="relative grid h-9 w-9 place-items-center rounded-full border border-line bg-surface"
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
            <Link
              href="/profile"
              className="grid h-9 w-9 place-items-center rounded-full font-display text-[13px] font-bold text-neutral-950"
              style={{ background: 'linear-gradient(140deg,#FFB020,#FF7A18)' }}
            >
              {currentUser.handle[0]?.toUpperCase()}
            </Link>
          </>
        ) : (
          <>
            <Link href="/login" className="font-display text-[13px] font-semibold uppercase tracking-wide text-dim">
              Giriş yap
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-amber px-4 py-2 font-display text-[12.5px] font-bold uppercase tracking-wide text-neutral-950"
            >
              Kayıt ol
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
