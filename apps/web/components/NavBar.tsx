'use client';

import { useState } from 'react';
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
import { ModeToggle } from './ModeToggle';
import { ChevronDownIcon } from './icons';

export function NavBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const lang = getLangFromSearchParams(searchParams);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href={langHref('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/logo-dark.svg" alt="Synnovator" width={72} height={36} priority className="dark:hidden" />
          <Image src="/logo-light.svg" alt="Synnovator" width={72} height={36} priority className="hidden dark:block" />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href={langHref('/')} className={`text-sm transition-colors ${pathname === '/' ? 'text-foreground hover:text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t(lang, 'nav.hackathons')}
          </Link>
          <Link href={langHref('/proposals')} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            {t(lang, 'nav.proposals')}
          </Link>
          <Link href={langHref('/guides')} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            {t(lang, 'nav.guides')}
          </Link>
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            {t(lang, 'nav.admin')}
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                aria-label={t(lang, 'nav.create_btn')}
              >
                <span>{t(lang, 'nav.create_btn')}</span>
                <ChevronDownIcon size={16} aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[10rem] bg-card border border-border rounded-lg shadow-lg">
              <DropdownMenuItem asChild>
                <Link href={langHref('/create-hackathon')} className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted hover:text-primary transition-colors">
                  {t(lang, 'nav.create_hackathon')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={langHref('/create-proposal')} className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted hover:text-primary transition-colors">
                  {t(lang, 'nav.create_proposal')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button type="button" onClick={handleLangSwitch} className="cursor-pointer py-2 px-2 min-h-11 min-w-11 text-muted-foreground hover:text-foreground text-sm transition-colors relative z-10 inline-flex items-center justify-center" aria-label="Switch language">
            {t(lang, 'nav.lang_switch')}
          </button>

          <ModeToggle />

          <OAuthButton />

          {/* Hamburger button — mobile only */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center min-h-11 min-w-11 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label="Toggle navigation menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div id="mobile-nav-menu" className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <div className="px-4 py-4 space-y-1">
            <Link href={langHref('/')} onClick={() => setMobileMenuOpen(false)} className={`block px-3 py-3 rounded-lg text-sm transition-colors ${pathname === '/' ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
              {t(lang, 'nav.hackathons')}
            </Link>
            <Link href={langHref('/proposals')} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              {t(lang, 'nav.proposals')}
            </Link>
            <Link href={langHref('/guides')} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              {t(lang, 'nav.guides')}
            </Link>
            <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              {t(lang, 'nav.admin')}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
