const PLACEHOLDER_NOTIFS: Array<[string, string]> = [
  ['★', 'Bir kullanıcı, senin logun üzerinden bu event\'i takip listesine aldı.'],
  ['💬', 'Bir kullanıcı logunla ilgili yorum yaptı.'],
  ['♥', 'Birkaç kullanıcı son logunu beğendi.'],
  ['➕', 'Bir kullanıcı senin logun üzerinden bu event\'i izleme listesine aldı.'],
  ['🤝', 'Bir kullanıcı seni takip etmeye başladı.'],
];

// No notifications table/pipeline exists yet — this is placeholder content
// showing the screen's shape, not real activity. Deliberately generic (no
// fake usernames) so it never reads as if it were.
export default function NotificationsPage() {
  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <p className="mx-4 mt-4 rounded-lg border border-dashed border-line bg-surface px-3 py-2 font-mono text-[10px] leading-relaxed text-neutral-500 lg:mx-8">
        Bildirim sistemi henüz yok — bu ekran gerçek etkinliğe bağlanana kadar örnek içerik gösteriyor.
      </p>
      <div className="mt-2">
        {PLACEHOLDER_NOTIFS.map(([icon, text], i) => (
          <div key={i} className="flex gap-3 border-b border-line/50 px-4 py-3 lg:px-8">
            <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-surface-2 text-[13px]">
              {icon}
            </div>
            <p className="font-sans text-[12.5px] leading-relaxed text-dim">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
