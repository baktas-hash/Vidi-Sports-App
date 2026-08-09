import { redirect } from 'next/navigation';

import { getSessionUser } from '@/lib/auth/session';
import { CreateListForm } from '@/components/list/CreateListForm';

export default async function NewListPage() {
  // Same "bounce to home instead of a login wall" pattern as logs/new.
  const user = await getSessionUser();
  if (!user) redirect('/');

  return (
    <div className="px-4 pt-4 lg:mx-auto lg:max-w-2xl lg:px-8">
      <h1 className="mb-4 font-display text-[23px] font-extrabold uppercase">Yeni liste</h1>
      <CreateListForm />
    </div>
  );
}
