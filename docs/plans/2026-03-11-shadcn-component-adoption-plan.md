# shadcn/ui Component Adoption Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Install 8 missing shadcn/ui components into `@synnovator/ui` and replace ~49 hand-rolled instances across `apps/web/`.

**Architecture:** Components are copied into `packages/ui/src/components/` following the existing v4 pattern (no forwardRef, `data-slot` attrs, `radix-ui` imports, `cn` from `../lib/utils`). The Sidebar component requires a `useIsMobile` hook and depends on Sheet + Tooltip. All dependencies (`radix-ui`) are already consolidated under the single `radix-ui` package.

**Tech Stack:** React 19, Radix UI (via `radix-ui` package), Tailwind CSS v4, class-variance-authority, lucide-react

---

## Phase 1: Install Components

### Task 1: Install simple components (Card, Skeleton, Separator)

**Files:**
- Create: `packages/ui/src/components/card.tsx`
- Create: `packages/ui/src/components/skeleton.tsx`
- Create: `packages/ui/src/components/separator.tsx`
- Modify: `packages/ui/src/components/index.ts`

**Step 1: Create card.tsx**

```tsx
import * as React from "react"

import { cn } from "../lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5 p-6", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("p-6 pt-0", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

Note: We simplify the upstream shadcn Card to match our existing design system — `rounded-lg border border-border bg-card` (matches our current hand-rolled pattern exactly), without the extra `shadow-sm` and `gap-6 py-6` that upstream uses. This ensures zero visual regression when replacing.

**Step 2: Create skeleton.tsx**

```tsx
import * as React from "react"

import { cn } from "../lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

Note: Using `bg-muted` instead of upstream's `bg-accent` since our existing skeleton uses `bg-muted`.

**Step 3: Create separator.tsx**

```tsx
'use client'

import * as React from "react"
import { Separator as SeparatorPrimitive } from "radix-ui"

import { cn } from "../lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
```

**Step 4: Add exports to index.ts**

Append to `packages/ui/src/components/index.ts`:
```ts
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';
export { Skeleton } from './skeleton';
export { Separator } from './separator';
```

**Step 5: Verify**

Run: `pnpm exec tsc --noEmit --project packages/ui/tsconfig.json`
Expected: PASS

**Step 6: Commit**

```bash
git add packages/ui/src/components/card.tsx packages/ui/src/components/skeleton.tsx packages/ui/src/components/separator.tsx packages/ui/src/components/index.ts
git commit -m "feat(ui): add Card, Skeleton, Separator components from shadcn/ui"
```

---

### Task 2: Install Avatar and ScrollArea

**Files:**
- Create: `packages/ui/src/components/avatar.tsx`
- Create: `packages/ui/src/components/scroll-area.tsx`
- Modify: `packages/ui/src/components/index.ts`

**Step 1: Create avatar.tsx**

```tsx
'use client'

import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"

import { cn } from "../lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
```

Note: Simplified from upstream — removed `size` prop/variants and `AvatarBadge`/`AvatarGroup`. Size is controlled via className (`h-8 w-8`, `h-24 w-24`), matching existing patterns. Can add size variants later if needed (YAGNI).

**Step 2: Create scroll-area.tsx**

```tsx
'use client'

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"

import { cn } from "../lib/utils"

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit]"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
```

**Step 3: Add exports to index.ts**

Append to `packages/ui/src/components/index.ts`:
```ts
export { Avatar, AvatarImage, AvatarFallback } from './avatar';
export { ScrollArea, ScrollBar } from './scroll-area';
```

**Step 4: Verify**

Run: `pnpm exec tsc --noEmit --project packages/ui/tsconfig.json`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/ui/src/components/avatar.tsx packages/ui/src/components/scroll-area.tsx packages/ui/src/components/index.ts
git commit -m "feat(ui): add Avatar, ScrollArea components from shadcn/ui"
```

---

### Task 3: Install Tooltip and Sheet (Sidebar dependencies)

**Files:**
- Create: `packages/ui/src/components/tooltip.tsx`
- Create: `packages/ui/src/components/sheet.tsx`
- Modify: `packages/ui/src/components/index.ts`

**Step 1: Create tooltip.tsx**

```tsx
'use client'

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "../lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 4,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-fit rounded-md bg-foreground px-3 py-1.5 text-xs text-background animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
```

**Step 2: Create sheet.tsx**

```tsx
'use client'

import * as React from "react"
import { XIcon } from "lucide-react"
import { Dialog as SheetPrimitive } from "radix-ui"

import { cn } from "../lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-background shadow-lg transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:animate-in data-[state=open]:duration-500",
          side === "right" &&
            "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
          side === "left" &&
            "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
          side === "top" &&
            "inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
          side === "bottom" &&
            "inset-x-0 bottom-0 h-auto border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
```

**Step 3: Add exports to index.ts**

Append:
```ts
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip';
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from './sheet';
```

**Step 4: Verify**

Run: `pnpm exec tsc --noEmit --project packages/ui/tsconfig.json`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/ui/src/components/tooltip.tsx packages/ui/src/components/sheet.tsx packages/ui/src/components/index.ts
git commit -m "feat(ui): add Tooltip, Sheet components from shadcn/ui"
```

---

### Task 4: Install Sidebar component + useIsMobile hook

**Files:**
- Create: `packages/ui/src/hooks/use-mobile.ts`
- Create: `packages/ui/src/components/sidebar.tsx`
- Modify: `packages/ui/src/components/index.ts`
- Modify: `packages/ui/src/index.ts`

The Sidebar component is large (~500 lines). It imports `Button`, `Input`, `Separator`, `Sheet`, `Skeleton`, `Tooltip` as sibling components and uses a `useIsMobile` hook.

**Step 1: Create use-mobile.ts**

```ts
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
```

**Step 2: Create sidebar.tsx**

Fetch the full sidebar source from shadcn/ui v4 (`apps/v4/registry/new-york-v4/ui/sidebar.tsx`). Adjust imports:
- `@/lib/utils` → `../lib/utils`
- `@/hooks/use-mobile` → `../hooks/use-mobile`
- `@/components/ui/button` → `./button`
- `@/components/ui/input` → `./input`
- `@/components/ui/separator` → `./separator`
- `@/components/ui/sheet` → `./sheet`
- `@/components/ui/skeleton` → `./skeleton`
- `@/components/ui/tooltip` → `./tooltip`
- `lucide-react` import for `PanelLeftIcon` stays as-is
- `"radix-ui"` import for `Slot` stays as-is

The component exports: `SidebarProvider`, `Sidebar`, `SidebarTrigger`, `SidebarRail`, `SidebarInset`, `SidebarInput`, `SidebarHeader`, `SidebarFooter`, `SidebarContent`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupAction`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuAction`, `SidebarMenuBadge`, `SidebarMenuSkeleton`, `SidebarMenuSub`, `SidebarMenuSubItem`, `SidebarMenuSubButton`, `SidebarSeparator`, `useSidebar`.

**Step 3: Add exports to index.ts**

Append to `packages/ui/src/components/index.ts`:
```ts
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from './sidebar';
```

Update `packages/ui/src/index.ts` to also export hooks:
```ts
export { cn } from './lib/utils';
export * from './components';
export * from './icons';
export { useIsMobile } from './hooks/use-mobile';
```

**Step 4: Verify**

Run: `pnpm exec tsc --noEmit --project packages/ui/tsconfig.json`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/ui/src/hooks/use-mobile.ts packages/ui/src/components/sidebar.tsx packages/ui/src/components/index.ts packages/ui/src/index.ts
git commit -m "feat(ui): add Sidebar component from shadcn/ui with useIsMobile hook"
```

---

## Phase 2: Card Replacement (23 instances)

### Task 5: Replace Card in admin/theme components

**Files:**
- Modify: `apps/web/components/admin/theme/ComponentPreview.tsx:91,98`
- Modify: `apps/web/components/admin/theme/PagePreview.tsx:237`
- Modify: `apps/web/components/admin/ReviewList.tsx:26`

**Step 1: ComponentPreview.tsx**

Add `Card` to imports:
```tsx
import { Card } from '@synnovator/ui';
```

Replace line 91:
```tsx
// Before
<div className="rounded-lg border border-border bg-card p-4">
// After
<Card className="p-4">
```
And matching closing `</div>` → `</Card>`.

Same for line 98:
```tsx
// Before
<div className="rounded-lg border border-border bg-muted p-4">
// After (keep bg-muted override)
<Card className="bg-muted p-4">
```

**Step 2: PagePreview.tsx**

Add `Card` import. Replace line 237:
```tsx
// Before
<div className="rounded-lg border border-border bg-card p-4">
// After
<Card className="p-4">
```

**Step 3: ReviewList.tsx**

Add `Card` import. Replace line 26:
```tsx
// Before
className="bg-card border border-border rounded-lg p-5 flex items-start justify-between gap-4"
// After
<Card className="p-5 flex items-start justify-between gap-4">
```

**Step 4: Verify**

Run: `pnpm exec tsc --noEmit --project apps/web/tsconfig.json`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/components/admin/theme/ComponentPreview.tsx apps/web/components/admin/theme/PagePreview.tsx apps/web/components/admin/ReviewList.tsx
git commit -m "refactor(web): use Card component in admin theme + review"
```

---

### Task 6: Replace Card in public page components

**Files:**
- Modify: `apps/web/components/JudgeCard.tsx:25`
- Modify: `apps/web/components/ProjectCard.tsx:26`
- Modify: `apps/web/components/ScoreCard.tsx:37`
- Modify: `apps/web/components/TrackSection.tsx:20`
- Modify: `apps/web/components/DatasetSection.tsx:80`
- Modify: `apps/web/components/HackathonCard.tsx:41`

**Step 1:** For each file, add `import { Card } from '@synnovator/ui';` and replace the hand-rolled card div.

JudgeCard.tsx line 25:
```tsx
// Before
<div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
// After
<Card className="flex items-start gap-4 p-4">
```

ProjectCard.tsx line 26 — Link card pattern:
```tsx
// Before
<Link href={detailUrl} className="block rounded-lg border border-border bg-card p-5 hover:border-primary/30 transition-colors group">
// After
<Card className="hover:border-primary/30 transition-colors group">
  <Link href={detailUrl} className="block p-5">
```
(Move `p-5` to Link, card styling to Card. Add matching `</Card>` after `</Link>`.)

ScoreCard.tsx line 37:
```tsx
// Before
<div className="rounded-lg border border-border bg-card p-6">
// After
<Card className="p-6">
```

TrackSection.tsx line 20:
```tsx
// Before
<div className="rounded-lg border border-border bg-card p-6">
// After
<Card className="p-6">
```

DatasetSection.tsx line 80:
```tsx
// Before
<div className="rounded-lg border border-border bg-card p-6">
// After
<Card className="p-6">
```

HackathonCard.tsx line 41 — Link card with type-specific classes:
```tsx
// Before
<Link ... className={`block group border border-border bg-card hover:border-primary/40 transition-all duration-200 p-6 h-full flex flex-col ${hackathonCardClass(hackathon.type)} ${hackathonHoverClass(hackathon.type)}`}>
// After
<Card className={`hover:border-primary/40 transition-all duration-200 h-full flex flex-col ${hackathonCardClass(hackathon.type)} ${hackathonHoverClass(hackathon.type)}`}>
  <Link ... className="block p-6 h-full flex flex-col">
```
Note: `hackathonCardClass` returns classes like `rounded-xl border-t-4 border-t-brand` — these override Card's default `rounded-lg` and add the type-specific top border. Verify `hackathonCardClass` doesn't duplicate `border border-border bg-card`.

**Step 2: Verify hackathonCardClass and hackathonHoverClass**

Read `apps/web/components/HackathonCard.tsx` to check what these functions return. If they include `border` or `bg-card` classes, remove those from the functions since Card provides them.

**Step 3: Verify**

Run: `pnpm exec tsc --noEmit --project apps/web/tsconfig.json`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/web/components/JudgeCard.tsx apps/web/components/ProjectCard.tsx apps/web/components/ScoreCard.tsx apps/web/components/TrackSection.tsx apps/web/components/DatasetSection.tsx apps/web/components/HackathonCard.tsx
git commit -m "refactor(web): use Card component in public page components"
```

---

### Task 7: Replace Card in page files + forms

**Files:**
- Modify: `apps/web/app/(public)/hackers/[id]/page.tsx:91,110,125,145`
- Modify: `apps/web/app/(public)/results/[slug]/page.tsx:49,53`
- Modify: `apps/web/app/(public)/projects/[hackathon]/[team]/page.tsx:78`
- Modify: `apps/web/components/TeamsTab.tsx:18`
- Modify: `apps/web/components/LoginForm.tsx:51`
- Modify: `apps/web/components/FAQAccordion.tsx:31`

**Step 1:** For each file, add Card import and replace pattern.

hackers/[id]/page.tsx — 4 instances (lines 91, 110, 125, 145):
```tsx
// Before (all 4)
<div className="rounded-lg border border-border bg-card p-4 ...">
// After
<Card className="p-4 ...">
```

results/[slug]/page.tsx — 2 instances (lines 49, 53):
```tsx
// Before
<div className="rounded-lg border border-border bg-card p-12 text-center">
// After
<Card className="p-12 text-center">
```

projects/[hackathon]/[team]/page.tsx — 1 instance (line 78):
```tsx
// Before
<div className="rounded-lg border border-border bg-card p-12 text-center">
// After
<Card className="p-12 text-center">
```

TeamsTab.tsx — 1 instance (line 18):
```tsx
// Before
<div className="rounded-lg border border-border bg-card p-12 text-center">
// After
<Card className="p-12 text-center">
```

LoginForm.tsx — 1 instance (line 51):
```tsx
// Before
<div className="w-full max-w-sm bg-card border border-border rounded-lg p-8">
// After
<Card className="w-full max-w-sm p-8">
```

FAQAccordion.tsx — 1 instance (line 31):
```tsx
// Before
<AccordionItem ... className="rounded-lg border border-border bg-card">
// After
<AccordionItem ... className="rounded-lg border border-border bg-card">
```
Note: FAQAccordion applies card styling to AccordionItem, which is a Radix primitive — leave as-is since Card wrapping here would be semantically wrong.

**Step 2:** Also replace card patterns in forms:
- `apps/web/components/forms/AppealForm.tsx:60`
- `apps/web/components/forms/CreateHackathonForm.tsx:453`
- `apps/web/components/forms/ProfileCreateForm.tsx:184`
- `apps/web/components/forms/RegisterForm.tsx:77`
- `apps/web/components/forms/CreateProposalForm.tsx:184`
- `apps/web/components/forms/TeamFormationForm.tsx:75`

Same pattern: `<div className="rounded-lg border border-border bg-card p-6">` → `<Card className="p-6">`.

**Step 3: Verify**

Run: `pnpm exec tsc --noEmit --project apps/web/tsconfig.json`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/web/app/(public)/hackers/ apps/web/app/(public)/results/ apps/web/app/(public)/projects/ apps/web/components/TeamsTab.tsx apps/web/components/LoginForm.tsx apps/web/components/forms/
git commit -m "refactor(web): use Card component in pages and forms"
```

---

## Phase 3: Avatar Replacement

### Task 8: Replace Avatar in all components

**Files:**
- Modify: `apps/web/components/JudgeCard.tsx`
- Modify: `apps/web/components/ProjectCard.tsx`
- Modify: `apps/web/components/OAuthButton.tsx:45,61`
- Modify: `apps/web/app/(public)/hackers/[id]/page.tsx:35-39`
- Modify: `apps/web/app/(public)/projects/[hackathon]/[team]/page.tsx:92-96`

**Step 1:** For each file, add `import { Avatar, AvatarImage, AvatarFallback } from '@synnovator/ui';`.

JudgeCard.tsx — judge avatar (large):
```tsx
// Before
<img src={`https://github.com/${judge.github}.png?size=80`} alt={...} className="w-12 h-12 rounded-full bg-muted" loading="lazy" />
// After
<Avatar className="h-12 w-12">
  <AvatarImage src={`https://github.com/${judge.github}.png?size=80`} alt={...} />
  <AvatarFallback>{judge.github[0].toUpperCase()}</AvatarFallback>
</Avatar>
```

ProjectCard.tsx — team member avatars (small, in a row):
```tsx
// Before
<img src={`https://github.com/${m.github}.png?size=40`} alt={m.github} className="w-4 h-4 rounded-full" loading="lazy" />
// After
<Avatar className="h-4 w-4">
  <AvatarImage src={`https://github.com/${m.github}.png?size=40`} alt={m.github} />
  <AvatarFallback className="text-[8px]">{m.github[0].toUpperCase()}</AvatarFallback>
</Avatar>
```

OAuthButton.tsx — skeleton (line 45) + avatar (line 61):
```tsx
// Line 45 Before
<div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
// Line 45 After (use Skeleton)
<Skeleton className="h-8 w-8 rounded-full" />

// Line 61 Before
<img src={user!.avatar_url} alt={user!.login} className="w-8 h-8 rounded-full border border-border" />
// Line 61 After
<Avatar className="h-8 w-8 border border-border">
  <AvatarImage src={user!.avatar_url} alt={user!.login} />
  <AvatarFallback>{user!.login[0].toUpperCase()}</AvatarFallback>
</Avatar>
```

hackers/[id]/page.tsx — profile hero avatar (line 35-39):
```tsx
// Before
<img src={`https://github.com/${h.github}.png?size=192`} alt={...} className="w-24 h-24 rounded-full bg-muted" />
// After
<Avatar className="h-24 w-24">
  <AvatarImage src={`https://github.com/${h.github}.png?size=192`} alt={...} />
  <AvatarFallback className="text-2xl">{h.github[0].toUpperCase()}</AvatarFallback>
</Avatar>
```

projects/[hackathon]/[team]/page.tsx — team member list (line 92-96):
```tsx
// Before
<img src={`https://github.com/${member.github}.png?size=40`} alt={member.github} className="w-8 h-8 rounded-full" loading="lazy" />
// After
<Avatar className="h-8 w-8">
  <AvatarImage src={`https://github.com/${member.github}.png?size=40`} alt={member.github} />
  <AvatarFallback>{member.github[0].toUpperCase()}</AvatarFallback>
</Avatar>
```

**Step 2: Verify**

Run: `pnpm exec tsc --noEmit --project apps/web/tsconfig.json`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/components/JudgeCard.tsx apps/web/components/ProjectCard.tsx apps/web/components/OAuthButton.tsx apps/web/app/(public)/hackers/ apps/web/app/(public)/projects/
git commit -m "refactor(web): use Avatar + Skeleton components for all avatar images"
```

---

## Phase 4: Separator + ScrollArea

### Task 9: Replace Separator in all files

**Files:**
- Modify: `apps/web/app/(public)/hackathons/[slug]/page.tsx` (6 instances: lines 150, 169, 183, 206, 216, 235)
- Modify: `apps/web/components/admin/theme/PagePreview.tsx` (4 instances: lines 83, 112, 166, 224)

**Step 1:** Add `import { Separator } from '@synnovator/ui';` to each file.

Replace all `<hr className="border-border" />` with `<Separator />`.

For the conditional one in PagePreview.tsx line 112:
```tsx
// Before
{h.tracks && h.tracks.length > 0 && <hr className="border-border" />}
// After
{h.tracks && h.tracks.length > 0 && <Separator />}
```

**Step 2: Verify**

Run: `pnpm exec tsc --noEmit --project apps/web/tsconfig.json`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/app/(public)/hackathons/ apps/web/components/admin/theme/PagePreview.tsx
git commit -m "refactor(web): use Separator component for dividers"
```

---

### Task 10: Replace ScrollArea in theme editor + forms

**Files:**
- Modify: `apps/web/components/admin/theme/ThemeEditorPage.tsx:540,561`
- Modify: `apps/web/components/admin/theme/PreviewPanel.tsx:60`
- Modify: `apps/web/app/(public)/results/[slug]/page.tsx:72`
- Modify: `apps/web/components/forms/CreateHackathonForm.tsx:455`
- Modify: `apps/web/components/forms/ProfileCreateForm.tsx:520`
- Modify: `apps/web/components/forms/CreateProposalForm.tsx:186,374`

**Step 1:** Add `import { ScrollArea } from '@synnovator/ui';` to each file.

ThemeEditorPage.tsx line 540 (vertical scroll, left panel):
```tsx
// Before
<div className="w-full lg:w-80 shrink-0 overflow-y-auto pr-2">
// After
<ScrollArea className="w-full lg:w-80 shrink-0 pr-2">
```

ThemeEditorPage.tsx line 561 (vertical scroll, right panel):
```tsx
// Before
<div className="flex-1 overflow-y-auto border border-border rounded-lg p-4 bg-background">
// After (use Card for the border/bg, ScrollArea inside)
<Card className="flex-1 p-4">
  <ScrollArea className="h-full">
```
Note: This panel already has `border border-border rounded-lg bg-background` — replace with Card + ScrollArea composition.

PreviewPanel.tsx line 60:
```tsx
// Before
className="flex-1 overflow-y-auto"
// After
<ScrollArea className="flex-1">
```

results/[slug]/page.tsx line 72 (horizontal scroll for table):
```tsx
// Before
<div className="overflow-x-auto">
// After
<ScrollArea className="w-full" type="auto">
```
Note: ScrollArea handles horizontal scrolling when content overflows.

Forms — step indicator scroll (CreateHackathonForm:455, CreateProposalForm:186):
```tsx
// Before
<div aria-label="Progress" className="flex items-center justify-between mb-8 overflow-x-auto">
// After
<ScrollArea className="mb-8" type="auto">
  <div aria-label="Progress" className="flex items-center justify-between">
```

Forms — YAML preview scroll (ProfileCreateForm:520, CreateProposalForm:374):
```tsx
// Before
<pre className="... overflow-x-auto whitespace-pre-wrap">
// After
<ScrollArea type="auto">
  <pre className="... whitespace-pre-wrap">
```

**Step 2: Verify**

Run: `pnpm exec tsc --noEmit --project apps/web/tsconfig.json`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/components/admin/theme/ThemeEditorPage.tsx apps/web/components/admin/theme/PreviewPanel.tsx apps/web/app/(public)/results/ apps/web/components/forms/
git commit -m "refactor(web): use ScrollArea component for scrollable containers"
```

---

## Phase 5: Sidebar Refactor

### Task 11: Refactor AdminSidebar to use shadcn/ui Sidebar

**Files:**
- Rewrite: `apps/web/components/admin/AdminSidebar.tsx`
- Modify: `apps/web/app/(admin)/admin/layout.tsx`

**Step 1: Rewrite AdminSidebar.tsx**

```tsx
'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { Session } from '@synnovator/shared/auth';
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
  SidebarRail,
} from '@synnovator/ui';

const navItems = [
  { href: '/admin', key: 'admin.dashboard' },
  { href: '/admin/hackathons', key: 'admin.hackathons' },
  { href: '/admin/profiles', key: 'admin.profiles' },
  { href: '/admin/submissions', key: 'admin.submissions' },
  { href: '/admin/theme', key: 'admin.theme' },
] as const;

export function AdminSidebar({ user }: { user: Session }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = getLangFromSearchParams(searchParams);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <h2 className="text-primary font-heading text-lg group-data-[collapsible=icon]:hidden">
          {t(lang, 'admin.title')}
        </h2>
        <p className="text-muted-foreground text-sm group-data-[collapsible=icon]:hidden">
          @{user.login}
        </p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            {t(lang, 'admin.nav')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={t(lang, item.key)}
                  >
                    <Link href={item.href}>
                      <span>{t(lang, item.key)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
```

Note: `group-data-[collapsible=icon]:hidden` hides text when sidebar is collapsed to icon mode. The `tooltip` prop on `SidebarMenuButton` shows the label in a tooltip when collapsed.

**Step 2: Add i18n key for nav group label**

Add to `packages/shared/src/i18n/en.json` under `admin`:
```json
"admin.nav": "Navigation"
```

Add to `packages/shared/src/i18n/zh.json` under `admin`:
```json
"admin.nav": "导航"
```

**Step 3: Update admin layout**

Modify `apps/web/app/(admin)/admin/layout.tsx`:

Add imports:
```tsx
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@synnovator/ui';
```

Replace the layout structure (lines 47-58):
```tsx
// Before
return (
  <>
    <Suspense><NavBar /></Suspense>
    <div className="flex min-h-screen pt-16">
      <Suspense>
        <AdminSidebar user={session} />
      </Suspense>
      <div className="flex-1 p-8">{children}</div>
    </div>
    <Suspense><Footer /></Suspense>
  </>
);

// After
return (
  <>
    <Suspense><NavBar /></Suspense>
    <div className="flex min-h-screen pt-16">
      <SidebarProvider>
        <Suspense>
          <AdminSidebar user={session} />
        </Suspense>
        <SidebarInset>
          <div className="flex items-center gap-2 p-4 lg:hidden">
            <SidebarTrigger />
          </div>
          <div className="flex-1 p-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
    <Suspense><Footer /></Suspense>
  </>
);
```

Key changes:
- `SidebarProvider` wraps sidebar + content
- `SidebarInset` replaces the raw flex-1 div
- `SidebarTrigger` visible only on mobile (`lg:hidden`) for hamburger toggle

**Step 4: Verify**

Run: `pnpm exec tsc --noEmit --project apps/web/tsconfig.json`
Expected: PASS

**Step 5: Visual test**

Run: `pnpm dev` and check:
1. Desktop: sidebar visible with nav items, collapsible via rail drag
2. Mobile (< 768px): sidebar hidden, hamburger button shows, tap opens Sheet drawer
3. Theme editor: sidebar still reflects theme token changes

**Step 6: Commit**

```bash
git add apps/web/components/admin/AdminSidebar.tsx apps/web/app/(admin)/admin/layout.tsx packages/shared/src/i18n/en.json packages/shared/src/i18n/zh.json
git commit -m "refactor(web): adopt shadcn/ui Sidebar for admin navigation

Replace hand-rolled aside with full Sidebar component supporting
collapsible icon mode and mobile Sheet drawer."
```

---

## Phase 6: Final Verification

### Task 12: Full build + visual verification

**Step 1: Type check**

Run: `pnpm exec tsc --noEmit --project apps/web/tsconfig.json`
Expected: PASS

**Step 2: Production build**

Run: `pnpm build`
Expected: PASS

**Step 3: Visual verification with agent-browser**

Check these pages:
1. `/admin/theme` — Card, ScrollArea, Separator all render correctly
2. `/admin` — Sidebar collapse/expand works
3. `/hackathons/{slug}` — Separator renders, cards render
4. `/hackers/{id}` — Avatar with fallback, Card containers
5. `/projects/{hackathon}/{team}` — Avatar, Card
6. Mobile viewport — Sidebar Sheet drawer works

**Step 4: Commit any fixes**

If visual issues found, fix and commit.
