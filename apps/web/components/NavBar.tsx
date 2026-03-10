'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { t, getLangFromSearchParams } from '@synnovator/shared/i18n';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@synnovator/ui';
import { OAuthButton } from './OAuthButton';
import { ChevronDownIcon } from './icons';

export function NavBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const lang = getLangFromSearchParams(searchParams);

  function langHref(path: string) {
    if (lang === 'en') {
      const sep = path.includes('?') ? '&' : '?';
      return `${path}${sep}lang=en`;
    }
    return path;
  }

  function handleLangSwitch() {
    const url = new URL(window.location.href);
    const next = url.searchParams.get('lang') === 'en' ? 'zh' : 'en';
    if (next === 'zh') url.searchParams.delete('lang');
    else url.searchParams.set('lang', next);
    window.location.href = url.pathname + (url.search ? '?' + url.searchParams.toString() : '') + (url.hash || '');
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-near-black/80 backdrop-blur-md border-b border-secondary-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href={langHref('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/logo-light.svg" alt="Synnovator" width={72} height={36} priority />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href={langHref('/')} className={`text-sm transition-colors ${pathname === '/' ? 'text-light-gray hover:text-white' : 'text-muted hover:text-white'}`}>
            {t(lang, 'nav.hackathons')}
          </Link>
          <Link href={langHref('/proposals')} className="text-muted hover:text-white transition-colors text-sm">
            {t(lang, 'nav.proposals')}
          </Link>
          <Link href={langHref('/guides')} className="text-muted hover:text-white transition-colors text-sm">
            {t(lang, 'nav.guides')}
          </Link>
          <Link href="/admin" className="text-muted hover:text-white transition-colors text-sm">
            {t(lang, 'nav.admin')}
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/90 transition-colors"
                aria-label={t(lang, 'nav.create_btn')}
              >
                <span>{t(lang, 'nav.create_btn')}</span>
                <ChevronDownIcon size={16} aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem] bg-dark-bg border border-secondary-bg rounded-lg shadow-lg">
              <DropdownMenuItem asChild>
                <Link href={langHref('/create-hackathon')} className="block px-4 py-2.5 text-sm text-white hover:bg-secondary-bg hover:text-lime-primary transition-colors">
                  {t(lang, 'nav.create_hackathon')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={langHref('/create-proposal')} className="block px-4 py-2.5 text-sm text-white hover:bg-secondary-bg hover:text-lime-primary transition-colors">
                  {t(lang, 'nav.create_proposal')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button type="button" onClick={handleLangSwitch} className="cursor-pointer py-2 px-1 text-muted hover:text-white text-sm transition-colors relative z-10" aria-label="Switch language">
            {t(lang, 'nav.lang_switch')}
          </button>

          <OAuthButton />
        </div>
      </div>
    </nav>
  );
}
