'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { Session } from '@synnovator/shared/auth';
import { t, getLangFromSearchParams } from '@synnovator/shared/i18n';

const navItems = [
  { href: '/admin', key: 'admin.dashboard' },
  { href: '/admin/hackathons', key: 'admin.hackathons' },
  { href: '/admin/profiles', key: 'admin.profiles' },
  { href: '/admin/submissions', key: 'admin.submissions' },
] as const;

export function AdminSidebar({ user }: { user: Session }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = getLangFromSearchParams(searchParams);

  return (
    <aside className="w-64 bg-dark-bg border-r border-secondary-bg p-4">
      <div className="mb-8">
        <h2 className="text-lime-primary font-heading text-lg">{t(lang, 'admin.title')}</h2>
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
            {t(lang, item.key)}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
