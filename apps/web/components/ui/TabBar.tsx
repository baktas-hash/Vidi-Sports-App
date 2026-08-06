'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  {
    href: '/',
    label: 'ANA',
    icon: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    href: '/feed',
    label: 'AKIŞ',
    icon: <path d="M4 6h16M4 12h16M4 18h10" />,
  },
  {
    href: '/competitions',
    label: 'TURNUVA',
    icon: (
      <>
        <path d="M6 4h12v5a6 6 0 0 1-12 0z" />
        <path d="M9 19h6M12 15v4" />
      </>
    ),
  },
  {
    href: '/recommendations',
    label: 'ÖNERİ',
    icon: <path d="M12 3l2.4 5.6L20 10l-4.4 3.6L17 20l-5-3-5 3 1.4-6.4L4 10l5.6-1.4z" />,
  },
  {
    href: '/profile',
    label: 'PROFİL',
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21c0-4 3.2-6 7-6s7 2 7 6" />
      </>
    ),
  },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-20 flex border-t border-line bg-canvas/95 pb-2 backdrop-blur-lg">
      {TABS.map((tab) => {
        const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 pt-2 pb-1 font-display text-[11px] font-semibold tracking-wider ${
              active ? 'text-amber' : 'text-neutral-500'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              width={20}
              height={20}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              aria-hidden="true"
            >
              {tab.icon}
            </svg>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
