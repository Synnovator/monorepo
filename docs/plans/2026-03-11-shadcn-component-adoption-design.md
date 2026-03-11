# shadcn/ui Component Adoption Design

## Goal

Eliminate hand-rolled UI patterns by installing missing shadcn/ui components into `@synnovator/ui` and replacing all manual implementations across the codebase. This is prerequisite infrastructure for the tweakable-theme feature — theme tokens must flow through component abstractions, not scattered utility classes.

## Architecture

Install 8 shadcn/ui components (6 target + 2 dependencies) into `packages/ui/`, then systematically replace ~40 hand-rolled instances across `apps/web/`.

## Components to Install

| Component | Radix Dependency | New? | Purpose |
|-----------|-----------------|------|---------|
| **Card** | none | — | Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription |
| **Avatar** | `@radix-ui/react-avatar` | yes | AvatarImage + AvatarFallback for graceful degradation |
| **Separator** | `@radix-ui/react-separator` | yes | Semantic dividers replacing `<hr>` |
| **ScrollArea** | `@radix-ui/react-scroll-area` | yes | Custom scrollbars replacing `overflow-auto` |
| **Skeleton** | none | — | Loading placeholder replacing `animate-pulse` div |
| **Sidebar** | uses Sheet + Tooltip internally | — | Full navigation sidebar with collapse/mobile support |
| **Sheet** | `@radix-ui/react-dialog` | yes | Required by Sidebar (mobile drawer) |
| **Tooltip** | `@radix-ui/react-tooltip` | yes | Required by Sidebar (collapsed icon labels) |

New Radix packages: `@radix-ui/react-avatar`, `@radix-ui/react-separator`, `@radix-ui/react-scroll-area`, `@radix-ui/react-dialog`, `@radix-ui/react-tooltip` (5 total).

## Replacement Strategy

### Card (14+ instances)

**All card scenarios use `<Card>`, zero exceptions.**

Pure display cards:
```tsx
// Before
<div className="rounded-lg border border-border bg-card p-6">...</div>

// After
<Card className="p-6">...</Card>
```

Link cards (HackathonCard, ProjectCard):
```tsx
// Before
<Link className="block rounded-lg border border-border bg-card p-5 hover:border-primary/30">

// After
<Card className={hackathonCardClass(type)}>
  <Link href={...} className="block p-6">...</Link>
</Card>
```

Type-specific styles (`rounded-xl`, `rounded-sm`, `dashed`) override Card's default `rounded` via className.

Files to change:
- `components/JudgeCard.tsx`
- `components/ProjectCard.tsx`
- `components/ScoreCard.tsx`
- `components/TrackSection.tsx`
- `components/DatasetSection.tsx`
- `components/HackathonCard.tsx`
- `components/admin/theme/ComponentPreview.tsx`
- `components/admin/theme/PagePreview.tsx`
- `components/admin/ReviewList.tsx`
- `components/LoginForm.tsx`
- `app/(public)/hackers/[id]/page.tsx`
- `app/(public)/results/[slug]/page.tsx`
- `app/(public)/projects/[hackathon]/[team]/page.tsx`
- `components/TeamsTab.tsx`

### Avatar (6 instances)

```tsx
// Before
<img src={`https://github.com/${login}.png?size=40`} className="w-8 h-8 rounded-full" />

// After
<Avatar className="h-8 w-8">
  <AvatarImage src={`https://github.com/${login}.png?size=40`} alt={login} />
  <AvatarFallback>{login[0].toUpperCase()}</AvatarFallback>
</Avatar>
```

Benefit: graceful fallback when image fails to load.

Files to change:
- `components/JudgeCard.tsx`
- `components/ProjectCard.tsx`
- `components/OAuthButton.tsx`
- `app/(public)/hackers/[id]/page.tsx`
- `app/(public)/projects/[hackathon]/[team]/page.tsx`

### Separator (12+ instances)

Replace only explicit `<hr className="border-border" />` dividers. Do NOT replace `border-b border-border` used as container edge borders (Footer, NavBar).

```tsx
// Before
<hr className="border-border" />

// After
<Separator />
```

Files to change:
- `app/(public)/hackathons/[slug]/page.tsx` (6 instances)
- `components/admin/theme/PagePreview.tsx` (4 instances)
- `components/ScoreCard.tsx` (1 instance)

### ScrollArea (8 instances)

```tsx
// Before
<div className="overflow-y-auto">...</div>

// After
<ScrollArea className="...">...</ScrollArea>
```

Files to change:
- `components/admin/theme/ThemeEditorPage.tsx` (2)
- `components/admin/theme/PreviewPanel.tsx` (1)
- `app/(public)/results/[slug]/page.tsx` (1)
- `components/forms/CreateHackathonForm.tsx` (2)
- `components/forms/ProfileCreateForm.tsx` (1)
- `components/forms/CreateProposalForm.tsx` (2)

### Skeleton (1 instance)

```tsx
// Before
<div className="w-8 h-8 rounded-full bg-muted animate-pulse" />

// After
<Skeleton className="h-8 w-8 rounded-full" />
```

Files to change:
- `components/OAuthButton.tsx`

### Sidebar (AdminSidebar refactor)

Full adoption of shadcn/ui Sidebar with `collapsible="icon"` and mobile Sheet drawer.

**admin/layout.tsx:**
```tsx
<SidebarProvider>
  <AdminSidebar user={session} />
  <SidebarInset>
    <div className="p-8">{children}</div>
  </SidebarInset>
</SidebarProvider>
```

**AdminSidebar.tsx** rewrite:
```tsx
<Sidebar collapsible="icon">
  <SidebarHeader>
    <h2>管理</h2>
    <p>@{user.login}</p>
  </SidebarHeader>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map(item => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href}>
                <Link href={item.href}>{t(lang, item.key)}</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>
  <SidebarRail />
</Sidebar>
```

Add `SidebarTrigger` in admin layout header for mobile toggle.

## Scope

All changes in this branch (`tweakable-theme`). No separate PR needed — this is prerequisite infrastructure.

## Files Changed Summary

| Category | New Files | Modified Files |
|----------|-----------|---------------|
| UI package (install) | 8 component files | `packages/ui/src/components/index.ts`, `packages/ui/package.json` |
| Card replacement | 0 | 14 files |
| Avatar replacement | 0 | 5 files |
| Separator replacement | 0 | 3 files |
| ScrollArea replacement | 0 | 7 files |
| Skeleton replacement | 0 | 1 file |
| Sidebar refactor | 0 | 2 files (AdminSidebar + layout) |

## Verification

1. `pnpm exec tsc --noEmit --project apps/web/tsconfig.json` — type check
2. `pnpm build` — production build
3. Visual verification via agent-browser at `/admin/theme` and public pages
