'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from './Logo';
import { logout } from '@/lib/api';

interface AppHeaderProps {
  email?: string;
  notificationCount?: number;
  enrollmentCount?: number;
}

export function AppHeader({
  email,
  notificationCount = 0,
  enrollmentCount = 0,
}: AppHeaderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  const initial = email?.[0]?.toUpperCase() ?? '?';

  return (
    <header className="border-b border-brand-100 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">

        {/* Logo */}
        <Logo />

        {/* Navigation + actions */}
        <div className="flex items-center gap-3 sm:gap-5">

          {/* Main navigation */}
          <nav className="hidden items-center gap-5 md:flex">
            <Link
              href="/courses"
              className="text-sm font-medium text-black transition-colors hover:text-brand-500"
            >
              Courses
            </Link>

            <Link
              href="/help"
              className="text-sm font-medium text-black transition-colors hover:text-brand-500"
            >
              Help
            </Link>

            <Link
              href="/certificates"
              className="text-sm font-medium text-black transition-colors hover:text-brand-500"
            >
              Certificates
            </Link>
          </nav>

          {/* Enrollment / cart */}
          <Link
            href="/enrollments"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-black transition-colors hover:bg-brand-50 hover:text-brand-700"
            aria-label="Enrollments"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437m0 0L6.75 15.75a2.25 2.25 0 002.182 1.7h8.136a2.25 2.25 0 002.182-1.7l1.645-6.478a1.125 1.125 0 00-1.091-1.397H5.106zm3.894 12.375a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0zm9.75 0a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0z"
              />
            </svg>

            {enrollmentCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                {enrollmentCount > 9 ? '9+' : enrollmentCount}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-black transition-colors hover:bg-brand-50 hover:text-brand-700"
            aria-label="Notifications"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9a6 6 0 00-12 0v.75c0 2.06-.59 4.055-1.71 5.772a23.848 23.848 0 005.454 1.31m5.113 0a24.255 24.255 0 01-5.113 0m5.113 0a3 3 0 11-5.113 0"
              />
            </svg>

            {notificationCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Link>

          {/* Profile */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
              aria-label="Account menu"
              aria-expanded={open}
            >
              {initial}
            </button>

            {open && (
              <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-brand-100 bg-white py-1 shadow-lg">
                {email && (
                  <div className="border-b border-brand-100 px-4 py-2 text-sm text-black">
                    {email}
                  </div>
                )}

                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-sm text-black hover:bg-brand-50"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>

                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-black hover:bg-brand-50"
                  onClick={() => setOpen(false)}
                >
                  Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <nav className="border-t border-brand-100 px-4 py-3 md:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6">
          <Link
            href="/courses"
            className="text-sm font-medium text-black hover:text-brand-500"
          >
            Courses
          </Link>

          <Link
            href="/help"
            className="text-sm font-medium text-black hover:text-brand-500"
          >
            Help
          </Link>

          <Link
            href="/certificates"
            className="text-sm font-medium text-black hover:text-brand-500"
          >
            Certificates
          </Link>
        </div>
      </nav>
    </header>
  );
}
