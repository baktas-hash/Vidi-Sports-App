import { redirect } from 'next/navigation';

import { getSessionUser } from '@/lib/auth/session';
import { getUserDiary } from '@/lib/queries/logs';
import { getUserIdByHandle, getUserProfile } from '@/lib/queries/users';
import { ProfileTabs } from '@/components/profile/ProfileTabs';

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <b className="block font-display text-[17px] font-extrabold tabular-nums">{value}</b>
      <span className="font-mono text-[8.5px] uppercase tracking-wide text-muted">{label}</span>
    </div>
  );
}

// Own profile only, at a stable /profile URL — viewing other users by handle
// is out of scope for this pass (the design prototype only ever shows one).
const SAMPLE_HANDLE = 'burkay';

export default async function ProfilePage() {
  // Login isn't wired up end-to-end yet (needs a reachable Postgres once
  // this is deployed) — show the seeded demo user's public profile instead
  // of a login wall for now, clearly marked as a sample.
  const user = await getSessionUser();
  const handle = user?.handle ?? SAMPLE_HANDLE;
  const viewerId = user?.id ?? null;
  const profileUserId = user?.id ?? (await getUserIdByHandle(handle));
  if (!profileUserId) redirect('/');

  const [profile, diary] = await Promise.all([
    getUserProfile(handle, viewerId),
    getUserDiary(profileUserId, viewerId),
  ]);
  if (!profile) redirect('/');

  return (
    <div>
      {!user ? (
        <p className="mx-4 mt-4 rounded-lg border border-dashed border-line bg-surface px-3 py-2 font-mono text-[10px] leading-relaxed text-neutral-500 lg:mx-8">
          Giriş yapmadın — bu örnek bir profil. Kendi profilini görmek için giriş yapman gerekir.
        </p>
      ) : null}
      <div className="flex items-center gap-3.5 px-4 pt-4 lg:px-8 lg:pt-8">
        <div
          className="grid h-[58px] w-[58px] flex-none place-items-center rounded-full font-display text-2xl font-extrabold text-neutral-950"
          style={{ background: 'linear-gradient(140deg,#FFB020,#FF7A18)' }}
        >
          {profile.handle[0]?.toUpperCase()}
        </div>
        <div>
          <div className="font-display text-[22px] font-extrabold uppercase leading-none lg:text-[28px]">
            {profile.displayName ?? profile.handle}
          </div>
          {profile.bio ? <p className="mt-1 font-serif text-[12px] text-dim">{profile.bio}</p> : null}
        </div>
      </div>

      <div className="flex gap-5 border-b border-line px-4 py-3 lg:px-8">
        <Stat label="event" value={profile.logCount} />
        <Stat label="takipçi" value={profile.followerCount} />
        <Stat label="takip" value={profile.followingCount} />
      </div>

      <ProfileTabs diary={diary} />
    </div>
  );
}
