'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { t, getLangFromSearchParams } from '@synnovator/shared/i18n';
import { OAuthButton } from './OAuthButton';

export function NavBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const lang = getLangFromSearchParams(searchParams);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

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
          <div className="relative" ref={wrapRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/90 transition-colors"
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              aria-label={t(lang, 'nav.create_btn')}
            >
              <span>{t(lang, 'nav.create_btn')}</span>
              <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 min-w-[10rem] py-1 bg-dark-bg border border-secondary-bg rounded-lg shadow-lg z-50" role="menu">
                <Link href={langHref('/create-hackathon')} className="block px-4 py-2.5 text-sm text-white hover:bg-secondary-bg hover:text-lime-primary transition-colors first:rounded-t-lg" role="menuitem">
                  {t(lang, 'nav.create_hackathon')}
                </Link>
                <Link href={langHref('/create-proposal')} className="block px-4 py-2.5 text-sm text-white hover:bg-secondary-bg hover:text-lime-primary transition-colors last:rounded-b-lg" role="menuitem">
                  {t(lang, 'nav.create_proposal')}
                </Link>
              </div>
            )}
          </div>

          <button type="button" onClick={handleLangSwitch} className="cursor-pointer py-2 px-1 text-muted hover:text-white text-sm transition-colors relative z-10" aria-label="Switch language">
            {t(lang, 'nav.lang_switch')}
          </button>

          <OAuthButton />
        </div>
      </div>
    </nav>
  );
}
