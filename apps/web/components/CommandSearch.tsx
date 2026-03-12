'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@synnovator/shared/i18n';
import { useLangHref } from '@/hooks/useLangHref';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@synnovator/ui';
import { listHackathons } from '@/app/_generated/data';

function getSearchText(h: { name: string; name_zh?: string; tagline?: string; tagline_zh?: string; type: string }): string {
  return `${h.name} ${h.name_zh || ''} ${h.tagline || ''} ${h.tagline_zh || ''} ${h.type}`.toLowerCase();
}

const pageItems = [
  { href: '/', labelKey: 'sidebar.events' },
  { href: '/proposals', labelKey: 'sidebar.proposals' },
  { href: '/guides/hacker', labelKey: 'sidebar.guide_hacker' },
  { href: '/guides/organizer', labelKey: 'sidebar.guide_organizer' },
  { href: '/guides/judge', labelKey: 'sidebar.guide_judge' },
  { href: '/admin', labelKey: 'sidebar.admin_dashboard' },
] as const;

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { lang, langHref } = useLangHref();

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function handleSelect(href: string) {
    setOpen(false);
    router.push(langHref(href));
  }

  const hackathons = useMemo(() => listHackathons(), []);

  return (
    <>
      {/* Search trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground text-sm hover:bg-muted transition-colors cursor-pointer"
        aria-label={t(lang, 'nav.search_placeholder')}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="hidden sm:inline flex-1 text-left">
          {t(lang, 'nav.search_placeholder')}
        </span>
        <kbd className="hidden sm:inline-flex ml-auto items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
          {t(lang, 'nav.search_hint')}
        </kbd>
      </button>

      {/* Command dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t(lang, 'nav.search_placeholder')} />
        <CommandList>
          <CommandEmpty>{t(lang, 'nav.search_no_results')}</CommandEmpty>

          {/* Events group */}
          <CommandGroup heading={t(lang, 'nav.search_group_events')}>
            {hackathons.map(entry => {
              const h = entry.hackathon;
              const displayName = lang === 'en'
                ? h.name
                : (h.name_zh || h.name);
              return (
                <CommandItem
                  key={h.slug}
                  value={getSearchText(h)}
                  onSelect={() => handleSelect(`/${h.slug}`)}
                >
                  <span>{displayName}</span>
                  {h.tagline && (
                    <span className="ml-2 text-muted-foreground text-xs truncate">
                      {lang === 'en' ? h.tagline : (h.tagline_zh || h.tagline)}
                    </span>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>

          {/* Pages group */}
          <CommandGroup heading={t(lang, 'nav.search_group_pages')}>
            {pageItems.map(item => (
              <CommandItem
                key={item.href}
                value={t(lang, item.labelKey)}
                onSelect={() => handleSelect(item.href)}
              >
                <span>{t(lang, item.labelKey)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
