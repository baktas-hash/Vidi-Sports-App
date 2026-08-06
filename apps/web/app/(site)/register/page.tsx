import Link from 'next/link';

import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold text-neutral-50">Kayıt ol</h1>
      <RegisterForm />
      <p className="text-sm text-neutral-400">
        Zaten hesabın var mı?{' '}
        <Link href="/login" className="text-amber-400">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
