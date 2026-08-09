import type { FollowedUser } from '@/lib/queries/users';
import { Avatar } from '@/components/ui/Avatar';

// TODO: same temporary visual-preview fallback as the home sidebar panels —
// shows the design prototype's own placeholder followees when the viewer
// follows nobody yet (logged out, or a fresh account with an empty follow
// graph). Drop once there's a real viewer with real follows to render.
const MOCK_FOLLOWING: FollowedUser[] = [
  { handle: 'ece', displayName: 'ece', logCount: 2 },
  { handle: 'kerem', displayName: 'kerem', logCount: 1 },
  { handle: 'deniz', displayName: 'deniz', logCount: 2 },
  { handle: 'tolga', displayName: 'tolga', logCount: 1 },
];

export function FollowingPanel({ following }: { following: FollowedUser[] }) {
  const shown = following.length ? following : MOCK_FOLLOWING;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="mb-3 font-display text-[13px] font-bold uppercase tracking-wide text-muted">
        Takip ettiklerin
      </h3>
      <div className="flex flex-col">
        {shown.map((user, index) => (
          <div
            key={user.handle}
            className={`flex items-center gap-2.5 py-2.5 ${index > 0 ? 'border-t border-line/60' : ''}`}
          >
            <Avatar handle={user.handle} size={34} />
            <div className="min-w-0">
              <div className="truncate font-display text-[14px] font-bold">{user.displayName ?? user.handle}</div>
              <div className="font-mono text-[9.5px] text-muted">{user.logCount} log</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
