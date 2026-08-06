'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export function RegisterForm() {
  const router = useRouter();
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle,
        email,
        password,
        displayName: displayName.trim() || undefined,
      }),
    });

    if (res.ok) {
      router.push('/');
      return;
    }

    const body = (await res.json()) as { error?: { message?: string } };
    setError(body.error?.message ?? 'Kayıt başarısız.');
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="handle" className="text-sm text-neutral-400">
          Kullanıcı adı
        </label>
        <input
          id="handle"
          type="text"
          required
          minLength={2}
          maxLength={24}
          pattern="^[a-z0-9_]{2,24}$"
          autoComplete="username"
          value={handle}
          onChange={(event) => setHandle(event.target.value.toLowerCase())}
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-500"
        />
        <p className="text-xs text-neutral-500">2-24 karakter; küçük harf, rakam ve alt çizgi.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="displayName" className="text-sm text-neutral-400">
          Görünen ad (opsiyonel)
        </label>
        <input
          id="displayName"
          type="text"
          maxLength={60}
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-500"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm text-neutral-400">
          E-posta
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-500"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm text-neutral-400">
          Şifre
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={10}
          maxLength={200}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-amber-500"
        />
        <p className="text-xs text-neutral-500">En az 10 karakter.</p>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-neutral-950 disabled:opacity-60"
      >
        {pending ? 'Kayıt olunuyor…' : 'Kayıt ol'}
      </button>
    </form>
  );
}
