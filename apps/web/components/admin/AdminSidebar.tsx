'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Session } from '@synnovator/shared/auth';

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/hackathons', label: 'Hackathons' },
  { href: '/admin/profiles', label: 'Profiles' },
  { href: '/admin/submissions', label: 'Submissions' },
];

export function AdminSidebar({ user }: { user: Session }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-dark-bg border-r border-secondary-bg p-4">
      <div className="mb-8">
        <h2 className="text-lime-primary font-heading text-lg">Admin</h2>
        <p className="text-muted text-sm">@{user.login}</p>
      </div>
      <nav className="space-y-1">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded-md text-sm transition-colors ${
              pathname === item.href
                ? 'bg-secondary-bg text-lime-primary'
                : 'text-muted hover:text-light-gray hover:bg-secondary-bg/50'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
