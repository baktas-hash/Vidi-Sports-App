import Link from 'next/link';

import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold text-neutral-50">Giriş yap</h1>
      <LoginForm />
      <p className="text-sm text-neutral-400">
        Hesabın yok mu?{' '}
        <Link href="/register" className="text-amber-400">
          Kayıt ol
        </Link>
      </p>
    </div>
  );
}
