import { queryMaybeOne, queryOne } from '@vidi/db';

export interface UserProfile {
  handle: string;
  displayName: string | null;
  bio: string | null;
  country: string | null;
  createdAt: string;
  logCount: number;
  followerCount: number;
  followingCount: number;
}

interface UserRow {
  id: string;
  handle: string;
  display_name: string | null;
  bio: string | null;
  country: string | null;
  created_at: Date;
}

interface CountsRow {
  log_count: number;
  follower_count: number;
  following_count: number;
}

export async function getUserProfile(
  handle: string,
  viewerId: string | null,
): Promise<UserProfile | null> {
  const user = await queryMaybeOne<UserRow>(
    `select id, handle, display_name, bio, country, created_at
       from app_user where handle = $1`,
    [handle],
  );
  if (!user) return null;

  // Public counts unless the viewer is looking at their own profile —
  // visibility lives in the query, same discipline as getFeed/getLogForViewer.
  const isSelf = viewerId === user.id;
  const counts = await queryOne<CountsRow>(
    `select
       (select count(*) from log l
         where l.user_id = $1 and ($2::boolean or l.visibility = 'public'))::int as log_count,
       (select count(*) from follow fo where fo.followee_id = $1)::int as follower_count,
       (select count(*) from follow fo where fo.follower_id = $1)::int as following_count`,
    [user.id, isSelf],
  );

  return {
    handle: user.handle,
    displayName: user.display_name,
    bio: user.bio,
    country: user.country,
    createdAt: user.created_at.toISOString(),
    logCount: counts.log_count,
    followerCount: counts.follower_count,
    followingCount: counts.following_count,
  };
}
