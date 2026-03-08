import Link from 'next/link';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface GuideTabBarProps {
  activeRole: 'hacker' | 'organizer' | 'judge';
  lang: Lang;
}

const tabs = [
  { role: 'hacker' as const, href: '/guides/hacker', labelKey: 'guide.hacker_title' },
  { role: 'organizer' as const, href: '/guides/organizer', labelKey: 'guide.organizer_title' },
  { role: 'judge' as const, href: '/guides/judge', labelKey: 'guide.judge_title' },
];

export function GuideTabBar({ activeRole, lang }: GuideTabBarProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <nav className="flex gap-6 border-b border-secondary-bg" aria-label="Guide tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.role}
            href={tab.href}
            className={`pb-3 text-sm transition-colors ${
              activeRole === tab.role
                ? 'border-b-2 border-lime-primary text-lime-primary font-medium'
                : 'text-muted hover:text-white'
            }`}
            aria-current={activeRole === tab.role ? 'page' : undefined}
          >
            {t(lang, tab.labelKey)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
