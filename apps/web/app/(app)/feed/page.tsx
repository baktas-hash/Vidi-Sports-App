import { getSessionUser } from '@/lib/auth/session';
import { getFeed } from '@/lib/queries/logs';
import { getFollowing } from '@/lib/queries/users';
import { FeedTabs } from '@/components/feed/FeedTabs';
import { FollowingPanel } from '@/components/feed/FollowingPanel';
import { RankingInfoPanel } from '@/components/feed/RankingInfoPanel';

export default async function FeedPage() {
  const user = await getSessionUser();
  const viewerId = user?.id ?? null;

  const [following, discover, followingList] = await Promise.all([
    viewerId ? getFeed({ scope: 'following', viewerId, limit: 10 }) : Promise.resolve({ items: [], nextCursor: null }),
    getFeed({ scope: 'global', viewerId, limit: 10 }),
    viewerId ? getFollowing(viewerId) : Promise.resolve([]),
  ]);

  return (
    <div className="lg:grid lg:grid-cols-[1fr_296px] lg:items-start lg:gap-6 lg:px-8 lg:pt-6">
      <div className="lg:min-w-0">
        <FeedTabs initialFollowing={following} initialDiscover={discover} loggedIn={Boolean(viewerId)} />
      </div>
      <aside className="mt-4 flex flex-col gap-3 px-4 lg:mt-0 lg:px-0">
        <RankingInfoPanel />
        <FollowingPanel following={followingList} />
      </aside>
    </div>
  );
}
