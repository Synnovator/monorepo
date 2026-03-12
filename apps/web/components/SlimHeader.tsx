'use client';

import Link from 'next/link';
import { t } from '@synnovator/shared/i18n';
import { useLangHref } from '@/hooks/useLangHref';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  SidebarTrigger,
} from '@synnovator/ui';
import { CommandSearch } from './CommandSearch';
import { OAuthButton } from './OAuthButton';
import { ModeToggle } from './ModeToggle';
import { ChevronDownIcon } from './icons';

export function SlimHeader() {
  const { lang, langHref } = useLangHref();

  function handleLangSwitch() {
    const url = new URL(window.location.href);
    const next = url.searchParams.get('lang') === 'en' ? 'zh' : 'en';
    if (next === 'zh') url.searchParams.delete('lang');
    else url.searchParams.set('lang', next);
    window.location.href =
      url.pathname +
      (url.search ? '?' + url.searchParams.toString() : '') +
      (url.hash || '');
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4">
      {/* Sidebar toggle */}
      <SidebarTrigger />

      {/* Search trigger — fills available space */}
      <div className="flex-1 min-w-0">
        <CommandSearch />
      </div>

      {/* Right actions — shrink to fit, never steal space from search */}
      <div className="flex items-center gap-2 shrink-0">
        {/* "+ 创建" CTA dropdown */}
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
          <DropdownMenuContent
            align="end"
            className="min-w-[10rem] bg-card border border-border rounded-lg shadow-lg"
          >
            <DropdownMenuItem asChild>
              <Link
                href={langHref('/create-hackathon')}
                className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted hover:text-primary transition-colors"
              >
                {t(lang, 'nav.create_hackathon')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={langHref('/create-proposal')}
                className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted hover:text-primary transition-colors"
              >
                {t(lang, 'nav.create_proposal')}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language switch */}
        <button
          type="button"
          onClick={handleLangSwitch}
          className="cursor-pointer py-2 px-2 min-h-11 min-w-11 text-muted-foreground hover:text-foreground text-sm transition-colors relative z-10 inline-flex items-center justify-center"
          aria-label="Switch language"
        >
          {t(lang, 'nav.lang_switch')}
        </button>

        {/* Theme toggle */}
        <ModeToggle />

        {/* Auth / user menu */}
        <OAuthButton />
      </div>
    </header>
  );
}
