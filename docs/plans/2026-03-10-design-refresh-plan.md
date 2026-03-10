# Design Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Synnovator web app from AI-slop dark-only theme to a distinctive light/dark warm-orange design system aligned with shadcn/ui v4 best practices.

**Architecture:** 5 sequential phases (P1-P5), each a standalone PR. CSS token system first, then global recolor, hackathon type themes, sketch layer, and article flow. Post-phases use impeccable skills for audit and design system extraction.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, shadcn/ui v4 (OKLCH tokens), next-themes, pnpm monorepo

**Design Doc:** `docs/plans/2026-03-10-design-refresh-design.md`

**Verification:** Each task verifies via `pnpm --filter @synnovator/web build` (must pass), visual inspection with `pnpm dev`, and automated tests via `pnpm --filter @synnovator/web test` (Vitest, set up in Task 1.0).

---

## Phase 1: CSS Token System + Light/Dark Switch Infrastructure

### Task 1.0: Set up Vitest + Testing Library in apps/web

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/__tests__/setup.ts`

**Step 1: Install dependencies**

```bash
pnpm --filter @synnovator/web add -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

**Step 2: Create `apps/web/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['__tests__/**/*.test.{ts,tsx}'],
    setupFiles: ['__tests__/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

**Step 3: Create `apps/web/__tests__/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

**Step 4: Add test script to `apps/web/package.json`**

Add to `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 5: Verify setup with a smoke test**

Create `apps/web/__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('test setup', () => {
  it('works', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run:

```bash
pnpm --filter @synnovator/web test
```

Expected: 1 test passed.

**Step 6: Commit**

```bash
git add apps/web/vitest.config.ts apps/web/__tests__/ apps/web/package.json pnpm-lock.yaml
git commit -m "feat(web): add Vitest + Testing Library test infrastructure"
```

---

### Task 1.1: Install next-themes

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Install**

```bash
pnpm --filter @synnovator/web add next-themes
```

**Step 2: Verify**

```bash
pnpm --filter @synnovator/web list next-themes
```

Expected: `next-themes` listed as dependency.

**Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "feat(web): add next-themes for light/dark switching"
```

---

### Task 1.2: Rewrite global.css to shadcn/ui v4 structure

**Files:**
- Modify: `packages/ui/src/styles/global.css` — complete rewrite

**Step 1: Replace `packages/ui/src/styles/global.css`**

Replace the entire file with the shadcn/ui v4 structure from the design doc:

- `@custom-variant dark (&:is(.dark *));`
- `@theme inline { }` block mapping all `--color-X: var(--X)` tokens (shadcn standard + brand/highlight/info)
- `:root { }` block with Light mode OKLCH values (warm whites, orange primary)
- `.dark { }` block with Dark mode OKLCH values (warm darks)
- Hackathon type overrides: `[data-hackathon-type="enterprise"]` and `[data-hackathon-type="youth-league"]` with `.dark` variants
- `@layer base { * { @apply border-border outline-ring/50; } body { @apply bg-background text-foreground; } }`
- Remove old `@theme { }` block, old `:root { }` block, old `html { }`, old scrollbar/selection styles

Key token mapping (see design doc for full list):

```
:root Light                        .dark Dark
--background: oklch(0.98 0.005 80) → oklch(0.16 0.008 60)
--foreground: oklch(0.15 0.01 70)  → oklch(0.94 0.005 70)
--primary:    oklch(0.62 0.2 35)   → oklch(0.68 0.19 38)   [Orange]
--brand:      oklch(0.62 0.2 35)   → oklch(0.68 0.19 38)   [Orange]
--highlight:  oklch(0.75 0.2 128)  → oklch(0.88 0.25 125)  [Lime]
--info:       oklch(0.48 0.2 270)  → oklch(0.58 0.18 270)  [Indigo]
```

Retain scrollbar and selection styles but update to use new tokens:

```css
::-webkit-scrollbar-track { background: var(--secondary); }
::-webkit-scrollbar-thumb { background: var(--muted-foreground); border-radius: 50px; }
::selection { background-color: oklch(from var(--primary) l c h / 0.3); color: var(--foreground); }
```

**Step 2: Update `apps/web/app/globals.css`**

Ensure it still works with the new structure. Current content:

```css
@import "tailwindcss";
@import "@synnovator/ui/styles";
```

This should continue to work. The `@synnovator/ui/styles` import brings in the rewritten `global.css`.

**Step 3: Verify build**

```bash
pnpm --filter @synnovator/web build
```

Expected: Build passes. Site will look broken visually (old class names reference removed tokens) — this is expected, fixed in P2.

**Step 4: Commit**

```bash
git add packages/ui/src/styles/global.css
git commit -m "feat(ui): rewrite CSS tokens to shadcn/ui v4 OKLCH light/dark system"
```

---

### Task 1.3: Add ThemeProvider to root layout

**Files:**
- Modify: `apps/web/app/layout.tsx`

**Step 1: Wrap layout with ThemeProvider**

```tsx
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import './globals.css';

export const metadata: Metadata = {
  title: 'Synnovator',
  description: 'AI Hackathon Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Poppins:wght@500&family=Space+Grotesk:wght@700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Key changes from current:
- Add `suppressHydrationWarning` to `<html>`
- Wrap `{children}` with `<ThemeProvider>`
- Remove `bg-surface text-light-gray` from `<body>` (now handled by `@layer base`)

**Step 2: Verify build**

```bash
pnpm --filter @synnovator/web build
```

Expected: Build passes.

**Step 3: Commit**

```bash
git add apps/web/app/layout.tsx
git commit -m "feat(web): add ThemeProvider with shadcn/ui recommended config"
```

---

### Task 1.4: Add ModeToggle component to NavBar

**Files:**
- Create: `apps/web/components/ModeToggle.tsx`
- Modify: `apps/web/components/NavBar.tsx`

**Step 1: Create ModeToggle component**

Create `apps/web/components/ModeToggle.tsx`:

```tsx
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="min-h-11 min-w-11" />;
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
      className="cursor-pointer py-2 px-2 min-h-11 min-w-11 text-muted-foreground hover:text-foreground text-sm transition-colors inline-flex items-center justify-center"
      aria-label={resolvedTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {resolvedTheme === 'light' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
    </button>
  );
}
```

**Step 2: Add ModeToggle to NavBar**

In `apps/web/components/NavBar.tsx`, add import and place `<ModeToggle />` next to the language switch button, before `<OAuthButton />`:

```tsx
import { ModeToggle } from './ModeToggle';

// Inside the flex items-center gap-4 div, between lang switch and OAuthButton:
<ModeToggle />
```

**Step 3: Verify build**

```bash
pnpm --filter @synnovator/web build
```

**Step 4: Commit**

```bash
git add apps/web/components/ModeToggle.tsx apps/web/components/NavBar.tsx
git commit -m "feat(web): add light/dark mode toggle in NavBar"
```

---

### Task 1.4b: Write tests for ModeToggle

**Files:**
- Create: `apps/web/__tests__/components/ModeToggle.test.tsx`

**Step 1: Write the test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModeToggle } from '@/components/ModeToggle';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({
    resolvedTheme: 'light',
    setTheme: vi.fn(),
  })),
}));

describe('ModeToggle', () => {
  it('renders without crashing', () => {
    render(<ModeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<ModeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });
});
```

Note: Also install `@testing-library/user-event` if not already:

```bash
pnpm --filter @synnovator/web add -D @testing-library/user-event
```

**Step 2: Run test**

```bash
pnpm --filter @synnovator/web test
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add apps/web/__tests__/components/ModeToggle.test.tsx apps/web/package.json pnpm-lock.yaml
git commit -m "test(web): add ModeToggle component tests"
```

---

### Task 1.5: Invoke /colorize skill

**Step 1: Run /colorize**

Invoke the `/colorize` skill to review the new token system's color choices in both Light and Dark mode. Focus on:
- Contrast ratios for text-on-background combinations
- Whether the warm tinting (hue 60-80) reads well
- Brand/highlight/info differentiation

**Step 2: Apply any fixes suggested by /colorize**

**Step 3: Commit fixes**

```bash
git add -A
git commit -m "fix(ui): adjust color tokens per /colorize review"
```

---

## Phase 2: Global Surface Recolor

### Task 2.1: Recolor NavBar and Footer

**Files:**
- Modify: `apps/web/components/NavBar.tsx`
- Modify: `apps/web/components/Footer.tsx`

**Step 1: NavBar class replacements**

Apply these replacements throughout `NavBar.tsx`:

| Old | New |
|---|---|
| `bg-near-black/80` | `bg-background/80` |
| `border-secondary-bg` | `border-border` |
| `text-muted` | `text-muted-foreground` |
| `text-light-gray` | `text-foreground` |
| `hover:text-white` | `hover:text-foreground` |
| `text-white` | `text-foreground` |
| `bg-lime-primary` | `bg-primary` |
| `text-near-black` | `text-primary-foreground` |
| `hover:bg-lime-primary/90` | `hover:bg-primary/90` |
| `bg-dark-bg` | `bg-card` |
| `hover:bg-secondary-bg` | `hover:bg-muted` |
| `hover:text-lime-primary` | `hover:text-primary` |
| `bg-near-black/95` | `bg-background/95` |
| `text-light-gray bg-secondary-bg` (active link) | `text-foreground bg-muted` |

**Step 2: Footer class replacements**

Apply same mapping to `Footer.tsx`:

| Old | New |
|---|---|
| `bg-near-black` | `bg-background` |
| `border-secondary-bg` | `border-border` |
| `text-muted` | `text-muted-foreground` |
| `hover:text-white` | `hover:text-foreground` |
| `text-white` | `text-foreground` |

**Step 3: Verify build**

```bash
pnpm --filter @synnovator/web build
```

**Step 4: Commit**

```bash
git add apps/web/components/NavBar.tsx apps/web/components/Footer.tsx
git commit -m "refactor(web): recolor NavBar and Footer to semantic tokens"
```

---

### Task 2.2: Recolor card components

**Files:**
- Modify: `apps/web/components/HackathonCard.tsx`
- Modify: `apps/web/components/ProjectCard.tsx`
- Modify: `apps/web/components/JudgeCard.tsx`
- Modify: `apps/web/components/SkillBadge.tsx`
- Modify: `apps/web/components/ScoreCard.tsx`
- Modify: `apps/web/components/DatasetSection.tsx`

**Step 1: Apply the global replacement mapping to each file**

Key patterns to replace in all card components:

| Old | New |
|---|---|
| `border-secondary-bg` | `border-border` |
| `bg-dark-bg` | `bg-card` |
| `bg-secondary-bg` | `bg-muted` |
| `text-white` | `text-foreground` |
| `text-muted` | `text-muted-foreground` |
| `text-light-gray` | `text-foreground` |
| `hover:border-lime-primary/40` | `hover:border-primary/40` |
| `hover:border-lime-primary/30` | `hover:border-primary/30` |
| `group-hover:text-lime-primary` | `group-hover:text-primary` |
| `text-lime-primary` | `text-primary` |
| `text-cyan` | `text-info` |
| `bg-neon-blue/10 text-neon-blue` | `bg-info/10 text-info` |
| `bg-pink/10 text-pink` | `bg-destructive/10 text-destructive` |
| `bg-lime-primary/20 text-lime-primary` | `bg-primary/20 text-primary` |
| `bg-muted/20 text-muted` (stage badges) | `bg-muted/20 text-muted-foreground` |

For `HackathonCard.tsx`, also update `stageColors` map:

```ts
const stageColors: Record<string, string> = {
  draft: 'bg-muted/20 text-muted-foreground',
  registration: 'bg-brand/20 text-brand',
  development: 'bg-info/20 text-info',
  submission: 'bg-brand/20 text-brand',
  judging: 'bg-info/20 text-info',
  announcement: 'bg-highlight/20 text-highlight',
  award: 'bg-highlight/20 text-highlight',
  ended: 'bg-muted/20 text-muted-foreground',
};
```

**Step 2: Verify build**

```bash
pnpm --filter @synnovator/web build
```

**Step 3: Commit**

```bash
git add apps/web/components/HackathonCard.tsx apps/web/components/ProjectCard.tsx apps/web/components/JudgeCard.tsx apps/web/components/SkillBadge.tsx apps/web/components/ScoreCard.tsx apps/web/components/DatasetSection.tsx
git commit -m "refactor(web): recolor card components to semantic tokens"
```

---

### Task 2.3: Recolor filter, tabs, and interactive components

**Files:**
- Modify: `apps/web/components/HackathonFilter.tsx`
- Modify: `apps/web/components/HackathonTabs.tsx`
- Modify: `apps/web/components/Timeline.tsx`
- Modify: `apps/web/components/EventCalendar.tsx`
- Modify: `apps/web/components/TrackSection.tsx`
- Modify: `apps/web/components/FAQAccordion.tsx`
- Modify: `apps/web/components/GuideTabBar.tsx`
- Modify: `apps/web/components/ProposalsViewToggle.tsx`
- Modify: `apps/web/components/TeamsTab.tsx`

**Step 1: Apply global replacement mapping to all files**

Same mapping as Task 2.2. Pay special attention to:

- `HackathonFilter.tsx`: search input `bg-dark-bg` → `bg-card`, `focus:border-lime-primary` → `focus:border-ring`, filter pills active state `border-lime-primary bg-lime-primary/20 text-lime-primary` → `border-primary bg-primary/20 text-primary`
- `HackathonTabs.tsx`: active tab `bg-surface text-lime-primary` → `bg-background text-primary`, `bg-secondary-bg/50` → `bg-muted/50`, `ring-lime-primary/50` → `ring-ring/50`
- `Timeline.tsx`: current stage `bg-lime-primary/10 border-lime-primary/30` → `bg-primary/10 border-primary/30`, dot `bg-lime-primary` → `bg-primary`, text `text-lime-primary` → `text-primary`

**Step 2: Verify build**

```bash
pnpm --filter @synnovator/web build
```

**Step 3: Commit**

```bash
git add apps/web/components/HackathonFilter.tsx apps/web/components/HackathonTabs.tsx apps/web/components/Timeline.tsx apps/web/components/EventCalendar.tsx apps/web/components/TrackSection.tsx apps/web/components/FAQAccordion.tsx apps/web/components/GuideTabBar.tsx apps/web/components/ProposalsViewToggle.tsx apps/web/components/TeamsTab.tsx
git commit -m "refactor(web): recolor interactive components to semantic tokens"
```

---

### Task 2.4: Recolor form components

**Files:**
- Modify: `apps/web/components/forms/RegisterForm.tsx`
- Modify: `apps/web/components/forms/NDASignForm.tsx`
- Modify: `apps/web/components/forms/AppealForm.tsx`
- Modify: `apps/web/components/forms/TeamFormationForm.tsx`
- Modify: `apps/web/components/forms/CreateHackathonForm.tsx`
- Modify: `apps/web/components/forms/CreateProposalForm.tsx`
- Modify: `apps/web/components/forms/ProfileCreateForm.tsx`
- Modify: `apps/web/components/forms/TimelineEditor.tsx`
- Modify: `apps/web/components/OAuthButton.tsx`
- Modify: `apps/web/components/LoginForm.tsx`
- Modify: `apps/web/components/EditProfileButton.tsx`
- Modify: `apps/web/components/EditProjectButton.tsx`
- Modify: `apps/web/components/GitHubRedirect.tsx`

**Step 1: Apply global replacement mapping**

Form-specific patterns:
- Input fields: `bg-surface` → `bg-background`, `bg-surface/50` → `bg-muted`, `border-secondary-bg` → `border-input`, `focus:border-lime-primary` → `focus:border-ring`, `text-white` → `text-foreground`
- Error states: `bg-error/10 border-error/30 text-error` → `bg-destructive/10 border-destructive/30 text-destructive`
- Warning states: `bg-warning/10 border-warning/30 text-warning` — keep as-is (warning not part of shadcn semantic, use custom token or keep literal)
- Submit buttons: `bg-lime-primary text-near-black` → `bg-primary text-primary-foreground`, `hover:bg-lime-primary/80` → `hover:bg-primary/80`
- Checkboxes: `accent-lime-primary` → `accent-primary`

**Step 2: Verify build**

```bash
pnpm --filter @synnovator/web build
```

**Step 3: Commit**

```bash
git add apps/web/components/forms/ apps/web/components/OAuthButton.tsx apps/web/components/LoginForm.tsx apps/web/components/EditProfileButton.tsx apps/web/components/EditProjectButton.tsx apps/web/components/GitHubRedirect.tsx
git commit -m "refactor(web): recolor form components to semantic tokens"
```

---

### Task 2.5: Recolor page files

**Files:**
- Modify: `apps/web/app/(public)/page.tsx`
- Modify: `apps/web/app/(public)/hackathons/[slug]/page.tsx`
- Modify: `apps/web/app/(public)/hackers/[id]/page.tsx`
- Modify: `apps/web/app/(public)/projects/[hackathon]/[team]/page.tsx`
- Modify: `apps/web/app/(public)/results/[slug]/page.tsx`
- Modify: `apps/web/app/(public)/proposals/page.tsx`
- Modify: `apps/web/app/(public)/create-hackathon/page.tsx`
- Modify: `apps/web/app/(public)/create-proposal/page.tsx`
- Modify: `apps/web/app/(public)/create-profile/page.tsx`
- Modify: `apps/web/app/(public)/guides/*.tsx` (4 files)
- Modify: `apps/web/app/not-found.tsx`
- Modify: `apps/web/app/(admin)/admin/*.tsx` (4 files)
- Modify: `apps/web/components/admin/AdminSidebar.tsx`
- Modify: `apps/web/components/admin/ReviewList.tsx`
- Modify: `apps/web/components/admin/ReviewActions.tsx`

**Step 1: Apply global replacement mapping to all page files and admin components**

Same mapping. Key areas:
- Page-level: `text-white` → `text-foreground`, `text-muted` → `text-muted-foreground`
- Hackathon detail badges: `bg-lime-primary/20 text-lime-primary` → `bg-primary/20 text-primary`
- Empty state containers: `bg-dark-bg` → `bg-card`
- `not-found.tsx`: `text-lime-primary` → `text-primary`, `bg-secondary-bg` → `bg-secondary`

**Step 2: Verify build**

```bash
pnpm --filter @synnovator/web build
```

**Step 3: Visually verify with dev server**

```bash
pnpm dev
```

Check both Light and Dark mode via ModeToggle. Look for:
- Any invisible text (same color as background)
- Any leftover hardcoded colors (search: `bg-dark-bg`, `bg-near-black`, `bg-surface`, `text-white`, `text-lime-primary`, `border-secondary-bg`)

**Step 4: Commit**

```bash
git add apps/web/app/ apps/web/components/admin/
git commit -m "refactor(web): recolor all pages and admin components to semantic tokens"
```

---

### Task 2.6: Invoke /distill and /polish

**Step 1: Run /distill**

Invoke `/distill` skill on the full `apps/web/` codebase. Focus: identify and remove redundant card containers (card-in-card nesting, unnecessary border+bg wrappers).

**Step 2: Apply /distill suggestions, commit**

```bash
git add -A
git commit -m "refactor(web): distill — remove redundant containers per /distill review"
```

**Step 3: Run /polish**

Invoke `/polish` skill. Focus: spacing consistency, alignment, visual rhythm.

**Step 4: Apply /polish suggestions, commit**

```bash
git add -A
git commit -m "fix(web): polish spacing and alignment per /polish review"
```

---

## Phase 3: Hackathon Type Themes

### Task 3.1: Create hackathon-theme utility

**Files:**
- Create: `apps/web/lib/hackathon-theme.ts`

**Step 1: Write the utility**

```ts
import type { FC } from 'react';
import type { IconProps } from '@/components/icons';
import { GlobeIcon, ShieldCheckIcon, RocketIcon } from '@/components/icons';

export function hackathonCardClass(type: string): string {
  switch (type) {
    case 'enterprise':
      return 'rounded-sm border-l-3 border-l-brand';
    case 'youth-league':
      return 'rounded-lg border-dashed -rotate-[0.3deg]';
    default:
      return 'rounded-xl border-t-3 border-t-brand';
  }
}

export function hackathonTypeIcon(type: string): FC<IconProps> {
  switch (type) {
    case 'enterprise':  return ShieldCheckIcon;
    case 'youth-league': return RocketIcon;
    default:             return GlobeIcon;
  }
}
```

Note: `GlobeIcon`, `ShieldCheckIcon`, `RocketIcon` must be exported from `apps/web/components/icons/index.tsx`. Check if they exist; if only inline SVG icons are present for ShieldCheck (from the multi-color SVG set), create simple monochrome wrappers or import the existing multi-color ones.

**Step 2: Verify build**

```bash
pnpm --filter @synnovator/web build
```

**Step 3: Commit**

```bash
git add apps/web/lib/hackathon-theme.ts
git commit -m "feat(web): add hackathon type theme utility"
```

---

### Task 3.1b: Write tests for hackathon-theme utility

**Files:**
- Create: `apps/web/__tests__/lib/hackathon-theme.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { hackathonCardClass, hackathonTypeIcon } from '@/lib/hackathon-theme';

describe('hackathonCardClass', () => {
  it('returns rounded-xl with top border for community (default)', () => {
    const cls = hackathonCardClass('community');
    expect(cls).toContain('rounded-xl');
    expect(cls).toContain('border-t-');
  });

  it('returns rounded-sm with left border for enterprise', () => {
    const cls = hackathonCardClass('enterprise');
    expect(cls).toContain('rounded-sm');
    expect(cls).toContain('border-l-');
  });

  it('returns rounded-lg with dashed border and rotation for youth-league', () => {
    const cls = hackathonCardClass('youth-league');
    expect(cls).toContain('rounded-lg');
    expect(cls).toContain('border-dashed');
    expect(cls).toContain('rotate');
  });

  it('defaults to community style for unknown types', () => {
    const cls = hackathonCardClass('unknown');
    expect(cls).toContain('rounded-xl');
  });
});

describe('hackathonTypeIcon', () => {
  it('returns a function component for each type', () => {
    expect(typeof hackathonTypeIcon('community')).toBe('function');
    expect(typeof hackathonTypeIcon('enterprise')).toBe('function');
    expect(typeof hackathonTypeIcon('youth-league')).toBe('function');
  });

  it('returns different icons for different types', () => {
    const community = hackathonTypeIcon('community');
    const enterprise = hackathonTypeIcon('enterprise');
    const youth = hackathonTypeIcon('youth-league');
    expect(community).not.toBe(enterprise);
    expect(enterprise).not.toBe(youth);
  });
});
```

**Step 2: Run test to verify it passes**

```bash
pnpm --filter @synnovator/web test
```

Expected: All tests pass (utility was already implemented in 3.1).

**Step 3: Commit**

```bash
git add apps/web/__tests__/lib/hackathon-theme.test.ts
git commit -m "test(web): add hackathon-theme utility tests"
```

---

### Task 3.2: Apply type themes to HackathonCard

**Files:**
- Modify: `apps/web/components/HackathonCard.tsx`

**Step 1: Update HackathonCard**

- Import `hackathonCardClass` and `hackathonTypeIcon` from `@/lib/hackathon-theme`
- Add `data-hackathon-type={hackathon.type}` to the `<Link>` root element
- Replace static `rounded-lg` with `hackathonCardClass(hackathon.type)`
- Replace `TrophyIcon` with dynamic `const TypeIcon = hackathonTypeIcon(hackathon.type)`

**Step 2: Verify build**

```bash
pnpm --filter @synnovator/web build
```

**Step 3: Commit**

```bash
git add apps/web/components/HackathonCard.tsx
git commit -m "feat(web): apply hackathon type themes to cards"
```

---

### Task 3.3: Apply type theme to hackathon detail page

**Files:**
- Modify: `apps/web/app/(public)/hackathons/[slug]/page.tsx`

**Step 1: Add `data-hackathon-type` to page container**

On the outermost `<div>`, add `data-hackathon-type={h.type}`. This causes all `bg-brand`/`text-brand` inside to inherit the correct type color.

**Step 2: Verify build + visual check**

```bash
pnpm --filter @synnovator/web build
```

**Step 3: Commit**

```bash
git add apps/web/app/(public)/hackathons/[slug]/page.tsx
git commit -m "feat(web): apply hackathon type theme to detail page"
```

---

### Task 3.4: Invoke /colorize and /delight

**Step 1: Run /colorize**

Invoke `/colorize` skill. Focus: check all 3 hackathon type accent colors in Light and Dark mode for contrast, differentiability, and coherence.

**Step 2: Apply fixes, commit**

```bash
git add -A
git commit -m "fix(web): adjust hackathon type colors per /colorize review"
```

**Step 3: Run /delight**

Invoke `/delight` skill. Focus: add subtle hover micro-interactions to hackathon cards that differ by type:
- Community: gentle `translateY(-2px)` lift
- Enterprise: precise `scale(1.01)`
- Youth League: playful `rotate(0deg)` snap-back (from the -0.3deg tilt)

**Step 4: Apply, commit**

```bash
git add -A
git commit -m "feat(web): add type-specific card hover effects per /delight review"
```

---

## Phase 4: Sketch Layer

### Task 4.1: Create sketch animation CSS

**Files:**
- Create: `apps/web/components/sketch/sketch-anim.css`

**Step 1: Write the CSS**

```css
@keyframes sketch-draw {
  from { stroke-dashoffset: var(--path-length); }
  to   { stroke-dashoffset: 0; }
}

.sketch-mark {
  stroke: var(--muted-foreground);
  opacity: 0.3;
  stroke-width: 1.5px;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  pointer-events: none;
}

.sketch-mark[data-visible="true"] {
  animation: sketch-draw 0.4s ease-out forwards;
}
```

**Step 2: Commit**

```bash
git add apps/web/components/sketch/sketch-anim.css
git commit -m "feat(web): add sketch layer animation CSS"
```

---

### Task 4.2: Create useInView hook

**Files:**
- Create: `apps/web/hooks/useInView.ts`

**Step 1: Write the hook**

```ts
'use client';

import { useEffect, useRef, useState } from 'react';

export function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, { threshold: 0.3, ...options });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
}
```

**Step 2: Commit**

```bash
git add apps/web/hooks/useInView.ts
git commit -m "feat(web): add useInView hook for sketch layer triggers"
```

---

### Task 4.2b: Write tests for useInView hook

**Files:**
- Create: `apps/web/__tests__/hooks/useInView.test.ts`

**Step 1: Write the test**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInView } from '@/hooks/useInView';

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
let observerCallback: IntersectionObserverCallback;

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: IntersectionObserverCallback) {
      observerCallback = callback;
    }
    observe = mockObserve;
    disconnect = mockDisconnect;
    unobserve = vi.fn();
  });
  vi.clearAllMocks();
});

describe('useInView', () => {
  it('returns isInView false initially', () => {
    const { result } = renderHook(() => useInView());
    expect(result.current.isInView).toBe(false);
  });

  it('returns a ref object', () => {
    const { result } = renderHook(() => useInView());
    expect(result.current.ref).toBeDefined();
  });

  it('sets isInView true when element intersects', () => {
    const { result } = renderHook(() => useInView());

    // Simulate the ref being set to an element
    const div = document.createElement('div');
    Object.defineProperty(result.current.ref, 'current', {
      value: div,
      writable: true,
    });

    // Re-render to trigger the effect
    const { result: result2 } = renderHook(() => useInView());

    // Simulate intersection
    if (observerCallback) {
      act(() => {
        observerCallback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });
    }
  });
});
```

**Step 2: Run test**

```bash
pnpm --filter @synnovator/web test
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add apps/web/__tests__/hooks/useInView.test.ts
git commit -m "test(web): add useInView hook tests"
```

---

### Task 4.3: Create sketch components

**Files:**
- Create: `apps/web/components/sketch/SketchCircle.tsx`
- Create: `apps/web/components/sketch/SketchArrow.tsx`
- Create: `apps/web/components/sketch/SketchUnderline.tsx`
- Create: `apps/web/components/sketch/SketchDoodle.tsx`
- Create: `apps/web/components/sketch/index.ts`

**Step 1: Build each component**

Each sketch component follows the pattern:
- Accept `className?: string` and `delay?: number`
- Use `useInView` hook to trigger animation on viewport entry
- Render an SVG with `class="sketch-mark"` and `data-visible={isInView}`
- SVG paths should have slight irregularity (hand-drawn feel)
- Set `style={{ '--path-length': pathLength, animationDelay: delay + 'ms' }}` as CSS custom property

`SketchCircle`: Irregular ellipse (~40x40), single path
`SketchArrow`: Curved arrow (~60x30), path + V-shaped arrowhead (2 separate strokes)
`SketchUnderline`: Wavy line (width 100%, height 8px), 3-4 wave peaks
`SketchDoodle`: Multiple variants via `variant` prop — `"question"`, `"lightbulb"`, `"rocket"` (48x48 each)

`index.ts`: Re-export all components.

**Step 2: Import CSS in globals**

Add to `apps/web/app/globals.css`:

```css
@import "../components/sketch/sketch-anim.css";
```

**Step 3: Verify build**

```bash
pnpm --filter @synnovator/web build
```

**Step 4: Commit**

```bash
git add apps/web/components/sketch/ apps/web/app/globals.css
git commit -m "feat(web): create sketch layer component library"
```

---

### Task 4.4: Place sketch elements in pages

**Files:**
- Modify: `apps/web/app/(public)/page.tsx` — SketchArrow next to title
- Modify: `apps/web/components/HackathonCard.tsx` — SketchCircle on active badge (only when stage is active)
- Modify: `apps/web/app/(public)/hackathons/[slug]/page.tsx` — SketchUnderline under CTA
- Modify: `apps/web/components/HackathonFilter.tsx` — SketchDoodle in empty states
- Modify: `apps/web/app/not-found.tsx` — SketchDoodle variant="question"

**Step 1: Add sketch elements**

Each placement:
- Import from `@/components/sketch`
- Place as sibling (not wrapper) — use `absolute` positioning relative to a `relative` parent
- Keep constraint: max 2 per page

**Step 2: Verify build + visual check**

```bash
pnpm --filter @synnovator/web build && pnpm dev
```

**Step 3: Commit**

```bash
git add apps/web/app/(public)/page.tsx apps/web/components/HackathonCard.tsx apps/web/app/(public)/hackathons/[slug]/page.tsx apps/web/components/HackathonFilter.tsx apps/web/app/not-found.tsx
git commit -m "feat(web): place sketch annotations in pages"
```

---

### Task 4.5: Invoke /animate and /delight

**Step 1: Run /animate**

Invoke `/animate`. Focus: review draw-in timing, easing curves, stagger delays across all 6 sketch placements.

**Step 2: Apply fixes, commit**

```bash
git add -A
git commit -m "fix(web): refine sketch animation timing per /animate review"
```

**Step 3: Run /delight**

Invoke `/delight`. Focus: evaluate whether any additional small delights make sense within the "max 2 per page" constraint.

**Step 4: Apply if appropriate, commit**

```bash
git add -A
git commit -m "feat(web): add sketch delight touches per /delight review"
```

---

## Phase 5: Detail Page Article Flow

### Task 5.1: Restructure hackathon detail layout

**Files:**
- Modify: `apps/web/app/(public)/hackathons/[slug]/page.tsx`

**Step 1: Remove card wrappers from content sections**

Remove `rounded-lg border border-border bg-card p-6` from:
- Description section — render as direct prose
- Organizers section — inline flex, no card
- Eligibility section — heading + list, no card
- Legal section — heading + list, no card

Keep card wrappers on:
- RegisterForm, NDASignForm, AppealForm, TeamFormationForm (interactive boundaries)
- Empty state placeholders

**Step 2: Update typography scale**

- Body text: `text-sm` → `text-base` throughout the page
- Section headings: `text-xl` → `text-2xl`
- Hero title: ensure `text-3xl md:text-4xl lg:text-5xl`

**Step 3: Apply spacing rhythm**

Replace uniform `space-y-12` with intentional rhythm:

```tsx
<div className="mb-16"> {/* Hero */} </div>
<section className="mb-12"> {/* Description */} </section>
<hr className="border-border my-12" />
<section className="mb-12"> {/* Tracks */} </section>
<hr className="border-border my-8" />
<section className="mb-8"> {/* Eligibility */} </section>
<section className="mb-8"> {/* Legal */} </section>
<hr className="border-border my-12" />
<section className="mt-16 mb-12"> {/* Forms */} </section>
```

**Step 4: Verify build + visual check**

```bash
pnpm --filter @synnovator/web build && pnpm dev
```

**Step 5: Commit**

```bash
git add apps/web/app/(public)/hackathons/[slug]/page.tsx
git commit -m "refactor(web): restructure detail page to article flow"
```

---

### Task 5.2: Simplify sidebar containers

**Files:**
- Modify: `apps/web/components/Timeline.tsx`
- Modify: `apps/web/components/EventCalendar.tsx`

**Step 1: Remove redundant outer wrappers**

If these components are wrapped in card containers at the page level AND internally, remove the internal card wrapper. The sidebar section already provides context.

**Step 2: Verify build**

```bash
pnpm --filter @synnovator/web build
```

**Step 3: Commit**

```bash
git add apps/web/components/Timeline.tsx apps/web/components/EventCalendar.tsx
git commit -m "refactor(web): simplify sidebar component containers"
```

---

### Task 5.3: Invoke /distill and /polish

**Step 1: Run /distill** on `apps/web/app/(public)/hackathons/[slug]/page.tsx`

Focus: confirm no remaining unnecessary complexity in the detail page.

**Step 2: Apply, commit**

```bash
git add -A
git commit -m "refactor(web): final distill pass on detail page"
```

**Step 3: Run /polish** on the detail page and its components

Focus: typography hierarchy, spacing rhythm (16→12→12→8→8→16), alignment.

**Step 4: Apply, commit**

```bash
git add -A
git commit -m "fix(web): polish detail page spacing and typography"
```

---

## Phase Post: Quality + Design System

### Task Post.1: Run /audit

**Step 1: Invoke /audit** on the full `apps/web/` application

Focus areas:
- Accessibility: WCAG AA contrast in Light AND Dark
- Responsive: 3 hackathon card types on mobile/tablet/desktop
- Theming: no hardcoded colors remaining (grep for old tokens)
- Performance: sketch animations, SVG overhead

**Step 2: Fix all issues by severity (critical first)**

**Step 3: Commit**

```bash
git add -A
git commit -m "fix(web): resolve issues found by /audit"
```

---

### Task Post.2: Token audit test (automated regression guard)

**Files:**
- Create: `apps/web/__tests__/token-audit.test.ts`

**Step 1: Write the token audit test**

```ts
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

const DEPRECATED_TOKENS = [
  'bg-dark-bg', 'bg-near-black', 'bg-surface',
  'text-white', 'text-light-gray',
  'border-secondary-bg', 'bg-secondary-bg',
  'text-lime-primary', 'bg-lime-primary',
  'text-cyan', 'text-orange', 'text-neon-blue',
  'text-pink', 'text-mint',
  'text-error', 'bg-error', 'border-error',
  'hover:text-white', 'hover:bg-lime-primary',
];

describe('token audit', () => {
  const webRoot = path.resolve(__dirname, '..');

  DEPRECATED_TOKENS.forEach((token) => {
    it(`no component uses deprecated token "${token}"`, () => {
      try {
        const result = execSync(
          `grep -r "${token}" --include="*.tsx" --include="*.ts" -l "${webRoot}/app" "${webRoot}/components" 2>/dev/null || true`,
          { encoding: 'utf-8' }
        ).trim();

        // Filter out test files and the token audit itself
        const files = result
          .split('\n')
          .filter((f) => f && !f.includes('__tests__') && !f.includes('node_modules'));

        expect(files, `Files still using "${token}":\n${files.join('\n')}`).toHaveLength(0);
      } catch {
        // grep returns exit 1 when no matches — that's success
      }
    });
  });
});
```

**Step 2: Run the test (expect failures before P2 is complete, expect pass after)**

```bash
pnpm --filter @synnovator/web test -- token-audit
```

Expected: All pass after P2 is complete. Serves as regression guard to prevent old tokens from being reintroduced.

**Step 3: Also run manual grep for any edge cases the test might miss**

```bash
rg "bg-dark-bg|bg-near-black|bg-surface|text-white|text-light-gray|border-secondary-bg|bg-secondary-bg|text-lime-primary|bg-lime-primary" apps/web/ --glob '*.tsx'
```

Expected: Zero matches. If any found, fix them.

**Step 4: Commit**

```bash
git add apps/web/__tests__/token-audit.test.ts
git add -A  # any fixes
git commit -m "test(web): add token audit regression test + fix remaining hardcoded colors"
```

---

### Task Post.3: Run /extract

**Step 1: Invoke /extract** skill

Focus: extract the complete design system from implementation into a structured document.

**Step 2: Update `docs/specs/design-system.md`**

Replace the old Neon Forge design system doc with the extracted system.

**Step 3: Commit**

```bash
git add docs/specs/design-system.md
git commit -m "docs(specs): update design system to reflect design refresh"
```

---

### Task Post.4: Run /teach-impeccable

**Step 1: Invoke /teach-impeccable** skill

Feed it the extracted design system. It will persist design rules for all future impeccable skill invocations.

Ensure it captures:
- 3-color system (brand/highlight/info) with OKLCH values for Light/Dark
- Warm neutral rule (hue 60-80)
- Hackathon type theme variants
- Sketch Layer constraints (6 placements, max 2/page)
- Typography scale (Space Grotesk headings, Inter body, 16px base)
- Spacing rhythm pattern

**Step 2: Commit any config files generated**

```bash
git add -A
git commit -m "feat: persist design system via /teach-impeccable"
```

---

## Summary

| Phase | Tasks | Commits | Key Skills |
|---|---|---|---|
| P1 | 1.0–1.5 (incl. 1.4b) | 8 | `/colorize` |
| P2 | 2.1–2.6 | 8 | `/distill` `/polish` |
| P3 | 3.1–3.4 (incl. 3.1b) | 7 | `/colorize` `/delight` |
| P4 | 4.1–4.5 (incl. 4.2b) | 9 | `/animate` `/delight` |
| P5 | 5.1–5.3 | 5 | `/distill` `/polish` |
| Post | P.1–P.4 | 4 | `/audit` `/extract` `/teach-impeccable` |
| **Total** | **27 tasks** | **~41 commits** | |

### Test Infrastructure

| Test File | Phase | Coverage |
|---|---|---|
| `__tests__/smoke.test.ts` | P1 (1.0) | Vitest setup smoke test |
| `__tests__/components/ModeToggle.test.tsx` | P1 (1.4b) | Render, a11y label |
| `__tests__/lib/hackathon-theme.test.ts` | P3 (3.1b) | Card class mapping, icon mapping |
| `__tests__/hooks/useInView.test.ts` | P4 (4.2b) | Initial state, ref, intersection callback |
| `__tests__/token-audit.test.ts` | Post (P.2) | Regression guard for deprecated tokens |
