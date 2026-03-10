import Link from 'next/link';
import { t, getLangFromSearchParams } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

const roles = [
  { emoji: '\u{1F680}', titleKey: 'guide.hacker_title', subtitleKey: 'guide.hacker_subtitle', bulletsKey: 'guide.hacker_bullets', href: '/guides/hacker' },
  { emoji: '\u{1F3D7}\uFE0F', titleKey: 'guide.organizer_title', subtitleKey: 'guide.organizer_subtitle', bulletsKey: 'guide.organizer_bullets', href: '/guides/organizer' },
  { emoji: '\u2696\uFE0F', titleKey: 'guide.judge_title', subtitleKey: 'guide.judge_subtitle', bulletsKey: 'guide.judge_bullets', href: '/guides/judge' },
];

export default async function GuidesIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = getLangFromSearchParams(new URLSearchParams(sp as Record<string, string>));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-white mb-3">
          {t(lang, 'guide.index_title')}
        </h1>
        <p className="text-lg text-muted">
          {t(lang, 'guide.index_subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Link
            key={role.href}
            href={role.href}
            className="group block rounded-lg border border-secondary-bg bg-secondary-bg/50 p-6 transition-colors hover:border-lime-primary"
          >
            <div className="text-3xl mb-3">{role.emoji}</div>
            <h2 className="text-xl font-heading font-bold text-white mb-1 group-hover:text-lime-primary transition-colors">
              {t(lang, role.titleKey)}
            </h2>
            <p className="text-sm text-muted mb-4">
              {t(lang, role.subtitleKey)}
            </p>
            <ul className="space-y-1.5">
              {t(lang, role.bulletsKey).split('|').map((bullet: string) => (
                <li key={bullet} className="text-sm text-light-gray flex items-start gap-2">
                  <span className="text-lime-primary mt-0.5">&rsaquo;</span>
                  {bullet}
                </li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
    </div>
  );
}
