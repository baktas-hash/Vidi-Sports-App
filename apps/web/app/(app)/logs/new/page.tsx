import { redirect } from 'next/navigation';

import { getSessionUser } from '@/lib/auth/session';
import { getEventBySlug } from '@/lib/queries/events';
import { LogComposer } from '@/components/log/LogComposer';

export default async function NewLogPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const { event: eventSlug } = await searchParams;
  const prefillEvent = eventSlug ? await getEventBySlug(eventSlug) : null;

  return (
    <div className="px-4 pt-4 lg:mx-auto lg:max-w-2xl lg:px-8">
      <h1 className="mb-4 font-display text-[23px] font-extrabold uppercase">Logla</h1>
      <LogComposer prefillEvent={prefillEvent} />
    </div>
  );
}
