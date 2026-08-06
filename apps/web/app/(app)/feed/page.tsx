import { getSessionUser } from '@/lib/auth/session';
import { getFeed } from '@/lib/queries/logs';
import { FeedTabs } from '@/components/feed/FeedTabs';

export default async function FeedPage() {
  const user = await getSessionUser();
  const viewerId = user?.id ?? null;

  const [following, discover] = await Promise.all([
    viewerId ? getFeed({ scope: 'following', viewerId, limit: 10 }) : Promise.resolve({ items: [], nextCursor: null }),
    getFeed({ scope: 'global', viewerId, limit: 10 }),
  ]);

  return <FeedTabs initialFollowing={following} initialDiscover={discover} loggedIn={Boolean(viewerId)} />;
}
