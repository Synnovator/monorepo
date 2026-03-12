# Header Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate nav links from Header to a unified MainSidebar, slim the Header into a search + action bar, and add cmdk CommandDialog for global search.

**Architecture:** AppShell component wraps both public and admin layouts with SidebarProvider + MainSidebar + SlimHeader + SidebarInset. CommandSearch uses cmdk for Cmd+K search dialog. AdminSidebar is deleted; its items become a collapsible group in MainSidebar.

**Tech Stack:** Next.js 15 App Router, shadcn/ui Sidebar system, cmdk, @synnovator/ui, Tailwind CSS v4

**Design doc:** `docs/plans/2026-03-11-header-refactor-design.md`

---

### Task 1: Install cmdk and add shadcn Command component

**Files:**
- Modify: `apps/web/package.json`
- Create: `packages/ui/src/components/command.tsx`
- Modify: `packages/ui/src/components/index.ts`

**Step 1: Install cmdk dependency**

Run:
```bash
cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/refactor-header && pnpm --filter @synnovator/ui add cmdk
```

**Step 2: Create Command component**

Create `packages/ui/src/components/command.tsx` — the standard shadcn Command component built on cmdk:

```tsx
'use client'

import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { SearchIcon } from 'lucide-react'

import { cn } from '../lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog'

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
        className,
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = 'Command Palette',
  description = 'Search for pages and commands',
  children,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
}) {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:size-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:size-5 [&_[cmdk-group]]:px-2">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center border-b px-3" data-slot="command-input-wrapper">
      <SearchIcon className="mr-2 size-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          'flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}
      {...props}
    />
  )
}

function CommandEmpty({
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-6 text-center text-sm"
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        'overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn('-mx-1 h-px bg-border', className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden data-[disabled=true]:pointer-events-none data-[selected='true']:bg-accent data-[selected='true']:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn('ml-auto text-xs tracking-widest text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
```

**Step 3: Export Command from UI index**

Add to `packages/ui/src/components/index.ts`:

```ts
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from './command';
```

**Step 4: Verify build**

Run:
```bash
cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/refactor-header && pnpm --filter @synnovator/ui build
```
Expected: BUILD SUCCESS

**Step 5: Commit**

```bash
git add packages/ui/src/components/command.tsx packages/ui/src/components/index.ts packages/ui/package.json pnpm-lock.yaml
git commit -m "feat(ui): add shadcn Command component based on cmdk"
```

---

### Task 2: Add i18n keys for sidebar and search

**Files:**
- Modify: `packages/shared/src/i18n/zh.yml`
- Modify: `packages/shared/src/i18n/en.yml`

**Step 1: Add i18n keys**

Add the following keys to both yml files.

`zh.yml` — add after the existing `nav:` section keys:

```yaml
nav:
  # ... existing keys ...
  admin: "管理"
  search_placeholder: "搜索活动、页面..."
  search_hint: "⌘K"
  search_no_results: "没有找到结果"
  search_group_events: "活动"
  search_group_pages: "页面"
sidebar:
  events: "活动"
  proposals: "提案"
  guides: "指南"
  guide_hacker: "参赛者指南"
  guide_organizer: "组织者指南"
  guide_judge: "评委指南"
  admin: "管理"
  admin_dashboard: "仪表盘"
  admin_hackathons: "活动管理"
  admin_profiles: "档案管理"
  admin_submissions: "提交管理"
  admin_theme: "主题编辑"
```

`en.yml` — add equivalent:

```yaml
nav:
  # ... existing keys ...
  admin: "Admin"
  search_placeholder: "Search events, pages..."
  search_hint: "⌘K"
  search_no_results: "No results found"
  search_group_events: "Events"
  search_group_pages: "Pages"
sidebar:
  events: "Events"
  proposals: "Proposals"
  guides: "Guides"
  guide_hacker: "Hacker Guide"
  guide_organizer: "Organizer Guide"
  guide_judge: "Judge Guide"
  admin: "Admin"
  admin_dashboard: "Dashboard"
  admin_hackathons: "Hackathons"
  admin_profiles: "Profiles"
  admin_submissions: "Submissions"
  admin_theme: "Theme Editor"
```

**Step 2: Build shared package to verify**

Run:
```bash
cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/refactor-header && pnpm --filter @synnovator/shared build
```
Expected: BUILD SUCCESS

**Step 3: Commit**

```bash
git add packages/shared/src/i18n/zh.yml packages/shared/src/i18n/en.yml
git commit -m "feat(shared): add i18n keys for sidebar and command search"
```

---

### Task 3: Create MainSidebar component

**Files:**
- Create: `apps/web/components/MainSidebar.tsx`

**Step 1: Create the MainSidebar**

Create `apps/web/components/MainSidebar.tsx`:

```tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { t, getLangFromSearchParams } from '@synnovator/shared/i18n';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@synnovator/ui';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@synnovator/ui';
import { TrophyIcon, ClipboardListIcon, SparklesIcon, ShieldCheckIcon } from './icons';
import { ChevronDownIcon } from './icons';

// NOTE: Collapsible needs to be exported from @synnovator/ui.
// If not available, import from radix: import * as Collapsible from '@radix-ui/react-collapsible';

interface MainSidebarProps {
  showAdmin?: boolean;
}

const guideSubItems = [
  { href: '/guides/hacker', key: 'sidebar.guide_hacker' },
  { href: '/guides/organizer', key: 'sidebar.guide_organizer' },
  { href: '/guides/judge', key: 'sidebar.guide_judge' },
] as const;

const adminSubItems = [
  { href: '/admin', key: 'sidebar.admin_dashboard' },
  { href: '/admin/hackathons', key: 'sidebar.admin_hackathons' },
  { href: '/admin/profiles', key: 'sidebar.admin_profiles' },
  { href: '/admin/submissions', key: 'sidebar.admin_submissions' },
  { href: '/admin/theme', key: 'sidebar.admin_theme' },
] as const;

export function MainSidebar({ showAdmin = false }: MainSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = getLangFromSearchParams(searchParams);
  const { state } = useSidebar();

  function langHref(path: string) {
    if (lang === 'en') {
      const sep = path.includes('?') ? '&' : '?';
      return `${path}${sep}lang=en`;
    }
    return path;
  }

  const isGuidesActive = pathname.startsWith('/guides');
  const isAdminActive = pathname.startsWith('/admin');

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <Link href={langHref('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image src="/logo-dark.svg" alt="Synnovator" width={24} height={24} className="dark:hidden" />
          <Image src="/logo-light.svg" alt="Synnovator" width={24} height={24} className="hidden dark:block" />
          <span className="font-heading text-sm font-bold group-data-[collapsible=icon]:hidden">
            Synnovator
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Events (top-level) */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/' || pathname === ''}
                  tooltip={t(lang, 'sidebar.events')}
                >
                  <Link href={langHref('/')}>
                    <TrophyIcon size={18} />
                    <span>{t(lang, 'sidebar.events')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Proposals (top-level) */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/proposals'}
                  tooltip={t(lang, 'sidebar.proposals')}
                >
                  <Link href={langHref('/proposals')}>
                    <ClipboardListIcon size={18} />
                    <span>{t(lang, 'sidebar.proposals')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Guides (collapsible) */}
              <Collapsible defaultOpen={isGuidesActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isGuidesActive}
                      tooltip={t(lang, 'sidebar.guides')}
                    >
                      <SparklesIcon size={18} />
                      <span>{t(lang, 'sidebar.guides')}</span>
                      <ChevronDownIcon
                        size={16}
                        className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {guideSubItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === item.href}
                          >
                            <Link href={langHref(item.href)}>
                              {t(lang, item.key)}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Admin (collapsible, permission-gated) */}
              {showAdmin && (
                <Collapsible defaultOpen={isAdminActive} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={isAdminActive}
                        tooltip={t(lang, 'sidebar.admin')}
                      >
                        <ShieldCheckIcon size={18} />
                        <span>{t(lang, 'sidebar.admin')}</span>
                        <ChevronDownIcon
                          size={16}
                          className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {adminSubItems.map((item) => (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === item.href}
                            >
                              <Link href={item.href}>
                                {t(lang, item.key)}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
```

**Important notes:**
- `Collapsible` and `CollapsibleTrigger`/`CollapsibleContent` must be available from `@synnovator/ui`. If not currently exported, add them (they are standard Radix UI primitives — `@radix-ui/react-collapsible`). Check `packages/ui/src/components/` for a `collapsible.tsx` file. If missing, create one and export it.
- The icons (`TrophyIcon`, `ClipboardListIcon`, `SparklesIcon`, `ShieldCheckIcon`) are existing design-system icons from `components/icons/index.tsx`.

**Step 2: Verify no TypeScript errors**

Run:
```bash
cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/refactor-header && pnpm --filter @synnovator/web exec tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add apps/web/components/MainSidebar.tsx
git commit -m "feat(web): add MainSidebar with collapsible nav groups"
```

---

### Task 4: Create CommandSearch component

**Files:**
- Create: `apps/web/components/CommandSearch.tsx`

**Step 1: Create CommandSearch**

Create `apps/web/components/CommandSearch.tsx`:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { t, getLangFromSearchParams } from '@synnovator/shared/i18n';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@synnovator/ui';
import { listHackathons } from '@/app/_generated/data';

// Reuse the same search text logic from HackathonFilter
function getSearchText(h: { name: string; name_zh?: string; tagline?: string; tagline_zh?: string; type: string }): string {
  return `${h.name} ${h.name_zh || ''} ${h.tagline || ''} ${h.tagline_zh || ''} ${h.type}`.toLowerCase();
}

const PAGE_ITEMS = [
  { href: '/', key: 'sidebar.events', keywords: 'events hackathons 活动' },
  { href: '/proposals', key: 'sidebar.proposals', keywords: 'proposals 提案' },
  { href: '/guides/hacker', key: 'sidebar.guide_hacker', keywords: 'hacker guide 参赛者指南' },
  { href: '/guides/organizer', key: 'sidebar.guide_organizer', keywords: 'organizer guide 组织者指南' },
  { href: '/guides/judge', key: 'sidebar.guide_judge', keywords: 'judge guide 评委指南' },
] as const;

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = getLangFromSearchParams(searchParams);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      const langSuffix = lang === 'en' ? (href.includes('?') ? '&lang=en' : '?lang=en') : '';
      router.push(`${href}${langSuffix}`);
    },
    [router, lang],
  );

  // Load hackathon data for search
  let hackathons: Array<{ hackathon: { name: string; name_zh?: string; slug: string; tagline?: string; tagline_zh?: string; type: string } }> = [];
  try {
    hackathons = listHackathons();
  } catch {
    // Static data may not be available in some contexts
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors w-full max-w-sm"
        aria-label={t(lang, 'nav.search_placeholder')}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-50" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <span className="flex-1 text-left truncate">{t(lang, 'nav.search_placeholder')}</span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t(lang, 'nav.search_placeholder')} />
        <CommandList>
          <CommandEmpty>{t(lang, 'nav.search_no_results')}</CommandEmpty>

          {/* Events group */}
          {hackathons.length > 0 && (
            <CommandGroup heading={t(lang, 'nav.search_group_events')}>
              {hackathons.map((entry) => (
                <CommandItem
                  key={entry.hackathon.slug}
                  value={getSearchText(entry.hackathon)}
                  onSelect={() => handleSelect(`/hackathons/${entry.hackathon.slug}`)}
                >
                  <span>{lang === 'en' ? entry.hackathon.name : (entry.hackathon.name_zh || entry.hackathon.name)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          {/* Pages group */}
          <CommandGroup heading={t(lang, 'nav.search_group_pages')}>
            {PAGE_ITEMS.map((item) => (
              <CommandItem
                key={item.href}
                value={`${t(lang, item.key)} ${item.keywords}`}
                onSelect={() => handleSelect(item.href)}
              >
                <span>{t(lang, item.key)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/CommandSearch.tsx
git commit -m "feat(web): add CommandSearch with cmdk dialog and Cmd+K shortcut"
```

---

### Task 5: Create SlimHeader component

**Files:**
- Create: `apps/web/components/SlimHeader.tsx`

**Step 1: Create SlimHeader**

Create `apps/web/components/SlimHeader.tsx`. This replaces the NavBar, keeping only: SidebarTrigger, Logo, CommandSearch trigger, + Create dropdown, language switch, ModeToggle, OAuthButton.

```tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { t, getLangFromSearchParams } from '@synnovator/shared/i18n';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  SidebarTrigger,
} from '@synnovator/ui';
import { OAuthButton } from './OAuthButton';
import { ModeToggle } from './ModeToggle';
import { CommandSearch } from './CommandSearch';
import { ChevronDownIcon } from './icons';

export function SlimHeader() {
  const searchParams = useSearchParams();
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
    <header className="flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4">
      {/* Sidebar toggle */}
      <SidebarTrigger className="-ml-1" />

      {/* Search — grows to fill center */}
      <div className="flex-1 max-w-lg">
        <CommandSearch />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 ml-auto">
        {/* + Create CTA */}
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

        {/* Language switch */}
        <button
          type="button"
          onClick={handleLangSwitch}
          className="cursor-pointer py-1.5 px-2 text-muted-foreground hover:text-foreground text-sm transition-colors inline-flex items-center justify-center rounded-md"
          aria-label="Switch language"
        >
          {t(lang, 'nav.lang_switch')}
        </button>

        {/* Theme toggle */}
        <ModeToggle />

        {/* Auth */}
        <OAuthButton />
      </div>
    </header>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/SlimHeader.tsx
git commit -m "feat(web): add SlimHeader with search trigger and CTA"
```

---

### Task 6: Create AppShell component

**Files:**
- Create: `apps/web/components/AppShell.tsx`

**Step 1: Create AppShell**

Create `apps/web/components/AppShell.tsx`:

```tsx
'use client';

import { SidebarProvider, SidebarInset } from '@synnovator/ui';
import { MainSidebar } from './MainSidebar';
import { SlimHeader } from './SlimHeader';

interface AppShellProps {
  children: React.ReactNode;
  showAdmin?: boolean;
  defaultOpen?: boolean;
}

export function AppShell({ children, showAdmin = false, defaultOpen = true }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <MainSidebar showAdmin={showAdmin} />
      <SidebarInset>
        <SlimHeader />
        <div className="flex-1">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/AppShell.tsx
git commit -m "feat(web): add AppShell layout component"
```

---

### Task 7: Integrate AppShell into public layout

**Files:**
- Modify: `apps/web/app/(public)/layout.tsx`

**Step 1: Replace NavBar with AppShell**

Replace the entire content of `apps/web/app/(public)/layout.tsx`:

```tsx
import { Suspense } from 'react';
import { AppShell } from '@/components/AppShell';
import { Footer } from '@/components/Footer';
import { WelcomeDialog } from '@/components/WelcomeDialog';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md">
        Skip to main content
      </a>
      <Suspense>
        <AppShell>
          <main id="main-content">{children}</main>
          <Suspense>
            <Footer />
          </Suspense>
        </AppShell>
      </Suspense>
      <Suspense>
        <WelcomeDialog />
      </Suspense>
    </>
  );
}
```

**Key changes:**
- Removed `NavBar` import
- Wrapped children in `AppShell` (no `showAdmin` since public)
- Removed `pt-16` from main (no longer needed — Sidebar + SlimHeader manage their own space)
- Footer now lives inside `SidebarInset` area

**Step 2: Verify dev server**

Run:
```bash
cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/refactor-header && pnpm dev &
sleep 5 && curl -s http://localhost:3000 | head -5
```
Expected: HTML output without errors

**Step 3: Commit**

```bash
git add apps/web/app/\(public\)/layout.tsx
git commit -m "refactor(web): replace NavBar with AppShell in public layout"
```

---

### Task 8: Integrate AppShell into admin layout

**Files:**
- Modify: `apps/web/app/(admin)/admin/layout.tsx`

**Step 1: Replace admin layout**

The admin layout needs to keep auth-checking logic but replace NavBar + AdminSidebar with AppShell. Replace the content:

```tsx
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decrypt, type Session } from '@synnovator/shared/auth';
import { createGitHubClient } from '@synnovator/shared/data';
import { t } from '@synnovator/shared/i18n';
import { AppShell } from '@/components/AppShell';
import { Footer } from '@/components/Footer';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) redirect('/login?returnTo=/admin');

  const session = await decrypt(sessionCookie, process.env.AUTH_SECRET!) as Session | null;
  if (!session) redirect('/login?returnTo=/admin');

  // Skip GitHub permission check for dev login
  let permission = 'admin';
  if (session.access_token !== 'dev-token') {
    const client = createGitHubClient(session.access_token);
    permission = await client.checkRepoPermission(
      process.env.GITHUB_OWNER || 'Synnovator',
      process.env.GITHUB_REPO || 'monorepo',
      session.login,
    );
  }

  if (!['admin', 'maintain', 'write'].includes(permission)) {
    return (
      <Suspense>
        <AppShell>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-heading text-destructive mb-2">{t('zh', 'admin.access_denied')}</h1>
              <p className="text-muted-foreground">{t('zh', 'admin.access_denied_desc')}</p>
              <p className="text-muted-foreground text-sm mt-1">{t('en', 'admin.access_denied_desc')}</p>
            </div>
          </div>
          <Suspense><Footer /></Suspense>
        </AppShell>
      </Suspense>
    );
  }

  return (
    <Suspense>
      <AppShell showAdmin>
        <div className="p-8">{children}</div>
        <Suspense><Footer /></Suspense>
      </AppShell>
    </Suspense>
  );
}
```

**Key changes:**
- Removed `NavBar`, `AdminSidebar`, `SidebarProvider`, `SidebarInset`, `SidebarTrigger` imports
- Used `<AppShell showAdmin>` which enables the admin group in MainSidebar
- Removed `pt-16` (no fixed NavBar)
- Removed the inner `<header>` with mobile SidebarTrigger (now in SlimHeader)

**Step 2: Commit**

```bash
git add apps/web/app/\(admin\)/admin/layout.tsx
git commit -m "refactor(web): replace AdminSidebar with AppShell in admin layout"
```

---

### Task 9: Delete old NavBar and AdminSidebar

**Files:**
- Delete: `apps/web/components/NavBar.tsx`
- Delete: `apps/web/components/admin/AdminSidebar.tsx`

**Step 1: Check for remaining imports**

Run:
```bash
cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/refactor-header && grep -r "NavBar\|AdminSidebar" apps/web/ --include="*.tsx" --include="*.ts" -l
```

Expected: Only `NavBar.tsx` and `AdminSidebar.tsx` themselves (or nothing if already updated). Fix any remaining imports before deleting.

**Step 2: Delete files**

```bash
rm apps/web/components/NavBar.tsx apps/web/components/admin/AdminSidebar.tsx
```

**Step 3: Verify build**

Run:
```bash
cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/refactor-header && pnpm --filter @synnovator/web build 2>&1 | tail -10
```
Expected: BUILD SUCCESS

**Step 4: Commit**

```bash
git add -u apps/web/components/NavBar.tsx apps/web/components/admin/AdminSidebar.tsx
git commit -m "refactor(web): delete NavBar and AdminSidebar (replaced by AppShell)"
```

---

### Task 10: Ensure Collapsible is exported from UI package

**Files:**
- Possibly create: `packages/ui/src/components/collapsible.tsx`
- Modify: `packages/ui/src/components/index.ts`

**Step 1: Check if Collapsible exists**

Run:
```bash
ls /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/refactor-header/packages/ui/src/components/collapsible* 2>/dev/null || echo "NOT FOUND"
```

**Step 2: If not found, create it**

Install the Radix primitive:
```bash
cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/refactor-header && pnpm --filter @synnovator/ui add @radix-ui/react-collapsible
```

Create `packages/ui/src/components/collapsible.tsx`:
```tsx
'use client'

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
```

Export from `packages/ui/src/components/index.ts`:
```ts
export { Collapsible, CollapsibleTrigger, CollapsibleContent } from './collapsible';
```

**Step 3: Commit**

```bash
git add packages/ui/src/components/collapsible.tsx packages/ui/src/components/index.ts packages/ui/package.json pnpm-lock.yaml
git commit -m "feat(ui): add Collapsible component from Radix UI"
```

> **Note:** This task should actually be executed BEFORE Task 3 (MainSidebar needs Collapsible). Implementer should reorder if needed.

---

### Task 11: Update PagePreview to show new layout

**Files:**
- Modify: `apps/web/components/admin/theme/PagePreview.tsx`

**Step 1: Add layout preview skeleton**

Update the default (no-slug) branch of `PagePreview` to wrap content in a mini AppShell-like layout preview. Add a mini SlimHeader and Sidebar skeleton before the existing content:

```tsx
// Add at the top of the default (no hackathonSlug) return block,
// before the existing <section> elements:

return (
  <div className="space-y-0 [&_a]:pointer-events-none">
    {/* Mini layout preview — SlimHeader + Sidebar skeleton */}
    <div className="flex border border-border rounded-lg overflow-hidden mb-6">
      {/* Mini sidebar */}
      <div className="w-10 shrink-0 bg-sidebar border-r border-border flex flex-col items-center py-2 gap-2">
        <div className="w-5 h-5 rounded bg-primary/20" />
        <div className="w-5 h-5 rounded bg-muted" />
        <div className="w-5 h-5 rounded bg-muted" />
        <div className="w-5 h-5 rounded bg-muted" />
      </div>
      {/* Mini header + content area */}
      <div className="flex-1">
        {/* Mini SlimHeader */}
        <div className="flex items-center gap-2 h-8 px-2 border-b border-border bg-background/80">
          <div className="w-4 h-4 rounded bg-muted" />
          <div className="flex-1 h-5 rounded bg-muted/50 max-w-[120px]" />
          <div className="h-5 px-2 rounded bg-primary/20 text-[8px] text-primary-foreground flex items-center">+ 创建</div>
          <div className="w-4 h-4 rounded-full bg-muted" />
        </div>
        {/* Content placeholder */}
        <div className="p-3">
          <div className="h-3 w-24 rounded bg-muted mb-2" />
          <div className="h-2 w-32 rounded bg-muted/50" />
        </div>
      </div>
    </div>

    {/* Existing preview content below */}
    <section className="text-center py-8">
      {/* ... existing Badge, h1, buttons ... */}
    </section>
    {/* ... rest of existing code ... */}
  </div>
);
```

Keep the existing HackathonCard and ProjectCard previews below — they still demonstrate theme colors on real components.

**Step 2: Commit**

```bash
git add apps/web/components/admin/theme/PagePreview.tsx
git commit -m "feat(web): update PagePreview with AppShell layout skeleton"
```

---

### Task 12: Remove pt-16 spacer from pages if needed

**Files:**
- Search and fix: any component or page that uses `pt-16` specifically to account for the old fixed NavBar

**Step 1: Search for pt-16 usage**

Run:
```bash
cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/refactor-header && grep -rn "pt-16" apps/web/ --include="*.tsx"
```

**Step 2: Remove or adjust**

The `pt-16` padding was used because NavBar was `fixed top-0`. Since the new layout uses `SidebarInset` (flexbox), fixed positioning is no longer used and `pt-16` should be removed from any component where it was compensating for the NavBar.

**Step 3: Commit**

```bash
git add -A apps/web/
git commit -m "fix(web): remove pt-16 navbar compensation from layout"
```

---

### Task 13: Final build verification and cleanup

**Step 1: Full build**

Run:
```bash
cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/refactor-header && pnpm build 2>&1 | tail -20
```
Expected: BUILD SUCCESS

**Step 2: Fix any remaining issues**

Address TypeScript errors, missing imports, or broken references.

**Step 3: Final commit if needed**

```bash
git add -A
git commit -m "fix(web): resolve build issues from header refactor"
```

---

## Task Dependency Order

```
Task 1 (cmdk + Command)
Task 2 (i18n keys)
Task 10 (Collapsible) ← should run before Task 3
Task 3 (MainSidebar) ← depends on 1, 2, 10
Task 4 (CommandSearch) ← depends on 1, 2
Task 5 (SlimHeader) ← depends on 4
Task 6 (AppShell) ← depends on 3, 5
Task 7 (public layout) ← depends on 6
Task 8 (admin layout) ← depends on 6
Task 9 (delete old files) ← depends on 7, 8
Task 11 (PagePreview) ← independent, after 6
Task 12 (pt-16 cleanup) ← depends on 7, 8
Task 13 (final verification) ← last
```

## Post-Implementation

After all tasks are complete:
1. Run `/teach-impeccable` to gather design system context
2. Run `/audit` to audit the new UI for accessibility, responsiveness, and design consistency
3. Create PR for review
