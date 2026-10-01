'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/Button';
import { fetchMyProfile, login } from '@/lib/api';
import { decodeJwt } from '@/lib/jwt';
import type { JwtPayload } from '@/lib/api';
import { ErrorAlert } from '@/components/ErrorAlert';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { accessToken } = await login(email, password);
      const payload = decodeJwt<JwtPayload>(accessToken);

      if (payload?.role === 'ADMIN' || payload?.role === 'SUPERADMIN') {
        router.push('/admin/dashboard'); // not built yet — next session
        return;
      }

      const profile = await fetchMyProfile();
      router.push(profile ? '/dashboard' : '/profile-setup'); // neither built yet
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="px-6 py-4">
        <Logo />
      </div>

      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-brand-800">Log in</h1>
          <p className="mt-1 text-sm text-brand-500">
            Welcome back — enter your details below.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {error && <ErrorAlert message={error} />}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Logging in…' : 'Log in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-brand-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-brand-700 hover:text-brand-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
