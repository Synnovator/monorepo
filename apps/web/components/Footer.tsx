'use client';

import Link from 'next/link';
import Image from 'next/image';
import { t } from '@synnovator/shared/i18n';
import { useLangHref } from '@/hooks/useLangHref';
import { GitHubIcon } from './icons';

export function Footer() {
  const { lang, langHref } = useLangHref();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background py-12 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Brand */}
          <div>
            <Link href={langHref('/')}>
              <Image src="/logo-dark.svg" alt="Synnovator" width={72} height={36} className="dark:hidden" />
              <Image src="/logo-light.svg" alt="Synnovator" width={72} height={36} className="hidden dark:block" />
            </Link>
            <p className="text-muted-foreground text-sm mt-2 max-w-xs">
              {t(lang, 'site.tagline')}
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12">
            <div>
              <h4 className="text-foreground text-sm font-medium mb-3">{t(lang, 'footer.platform')}</h4>
              <ul className="space-y-2">
                <li><Link href={langHref('/')} className="text-muted-foreground hover:text-foreground text-sm transition-colors">{t(lang, 'footer.events_list')}</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">{t(lang, 'footer.hackers')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground text-sm font-medium mb-3">{t(lang, 'footer.guides')}</h4>
              <ul className="space-y-2">
                <li><Link href={langHref('/guides/hacker')} className="text-muted-foreground hover:text-foreground text-sm transition-colors">{t(lang, 'footer.hacker_guide')}</Link></li>
                <li><Link href={langHref('/guides/organizer')} className="text-muted-foreground hover:text-foreground text-sm transition-colors">{t(lang, 'footer.organizer_guide')}</Link></li>
                <li><Link href={langHref('/guides/judge')} className="text-muted-foreground hover:text-foreground text-sm transition-colors">{t(lang, 'footer.judge_guide')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground text-sm font-medium mb-3">{t(lang, 'footer.resources')}</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://github.com/Synnovator/monorepo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    <GitHubIcon size={20} className="shrink-0" aria-hidden="true" />
                    {t(lang, 'footer.platform_code')}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-muted-foreground text-xs">
            {currentYear} Synnovator. Built by OneSyn.ai
          </p>
        </div>
      </div>
    </footer>
  );
}
