'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/courses', label: 'Courses' },
  // Payments and Certifications review queues use endpoints that already
  // exist on the backend (GET /payments/pending, GET /users/certifications/pending)
  // — add their links here once those list pages are built.
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="hidden w-56 shrink-0 border-r border-brand-100 bg-white px-4 py-6 md:block">
      <ul className="space-y-1">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-black hover:bg-brand-50 hover:text-brand-700'
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
