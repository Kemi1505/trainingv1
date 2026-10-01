'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/Button';
import { fetchMyProfile, register } from '@/lib/api';
import { decodeJwt } from '@/lib/jwt';
import type { JwtPayload } from '@/lib/api';
import { ErrorAlert } from '@/components/ErrorAlert';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // register() auto-logs the user in — see lib/api.ts for why.
      const { accessToken } = await register(email, password, confirmPassword);
      const payload = decodeJwt<JwtPayload>(accessToken);

      if (payload?.role === 'ADMIN' || payload?.role === 'SUPERADMIN') {
        router.push('/admin/dashboard'); // not built yet — next session
        return;
      }

      // A brand-new user never has a profile yet, but checking keeps this
      // identical to the login page instead of hardcoding that assumption.
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
          <h1 className="text-2xl font-bold text-brand-800">Create your account</h1>
          <p className="mt-1 text-sm text-brand-500">Start your training journey today.</p>

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
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-brand-700"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-brand-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {error && <ErrorAlert message={error} />}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating account…' : 'Sign up'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-brand-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-500">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
