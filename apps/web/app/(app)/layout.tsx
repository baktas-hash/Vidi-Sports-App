import Link from 'next/link';

import { getSessionUser } from '@/lib/auth/session';
import { searchEvents } from '@/lib/queries/events';
import { Header } from '@/components/ui/Header';
import { TabBar } from '@/components/ui/TabBar';
import { Ticker } from '@/components/ui/Ticker';
import { TopNav } from '@/components/ui/TopNav';

// Not an auth gate — most of the app works logged out (searchEvents/getFeed
// both accept a null viewer). Only /profile and /logs/new check the session
// themselves, same as the API layer gates POST /api/logs individually rather
// than behind a blanket rule.
//
// Below `lg` this is the phone-app layout (bottom tabs, FAB, narrow column).
// At `lg` and up it becomes a website: top nav bar, full-width shell, wider
// grids (each page opts into the extra width itself; list/grid pages do,
// article-shaped pages like an event or a log stay reading-width).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, recentScores] = await Promise.all([
    getSessionUser(),
    searchEvents({ status: 'finished', limit: 10 }),
  ]);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="lg:hidden">
        <Header currentUser={user} />
      </div>
      <div className="hidden border-b border-line lg:block">
        <TopNav currentUser={user} />
      </div>

      <Ticker events={recentScores} />

      <div className="mx-auto w-full max-w-2xl lg:max-w-6xl">
        <main className="pb-6 lg:pb-16">{children}</main>
      </div>

      {user ? (
        <Link
          href="/logs/new"
          aria-label="Log oluştur"
          className="fixed bottom-20 z-30 grid h-[52px] w-[52px] place-items-center rounded-full bg-amber text-neutral-950 shadow-lg shadow-amber/30 lg:hidden"
          style={{ right: 'max(1rem, calc((100vw - 42rem) / 2 + 1rem))' }}
        >
          <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
      ) : null}

      <div className="lg:hidden">
        <TabBar />
      </div>
    </div>
  );
}
