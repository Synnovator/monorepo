# Login Page Redesign + Onboarding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the `/login` page with a left-right split layout (brand panel + form) and add a cookie-based Welcome Dialog for first-time users after login.

**Architecture:** Move login from `(public)` to `(auth)` route group for an immersive full-screen layout without NavBar/Footer. Add a shadcn/ui Dialog component to `@synnovator/ui`. Create a `WelcomeDialog` client component that reads/writes a `synnovator_onboarded` cookie to show onboarding only to new users.

**Tech Stack:** Next.js 15 App Router, Radix UI Dialog, Tailwind CSS, OKLCH design tokens, i18n via `@synnovator/shared`

**Design doc:** `docs/plans/2026-03-11-login-page-onboarding-design.md`

---

### Task 1: Add Dialog component to @synnovator/ui

**Files:**
- Create: `packages/ui/src/components/dialog.tsx`
- Modify: `packages/ui/src/components/index.ts`

**Step 1: Create the Dialog component**

Create `packages/ui/src/components/dialog.tsx` following the same pattern as `sheet.tsx` (which already uses `Dialog` from `radix-ui` internally). The Dialog component uses the same Radix primitive but with centered overlay positioning instead of slide-in.

```tsx
'use client'

import * as React from "react"
import { XIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { cn } from "../lib/utils"

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("flex flex-col gap-1.5 text-center sm:text-left", className)} {...props} />
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-footer" className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2", className)} {...props} />
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
}
```

**Step 2: Export from index.ts**

Add to `packages/ui/src/components/index.ts`:

```ts
export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
} from './dialog';
```

**Step 3: Verify it compiles**

Run: `pnpm --filter @synnovator/web build` (or just `pnpm tsc --noEmit` from `packages/ui/`)

Expected: No TypeScript errors. The `radix-ui` package (v1.4.3, already installed) includes the Dialog primitive.

**Step 4: Commit**

```bash
git add packages/ui/src/components/dialog.tsx packages/ui/src/components/index.ts
git commit -m "feat(ui): add Dialog component based on shadcn/ui + Radix"
```

---

### Task 2: Add i18n translation keys

**Files:**
- Modify: `packages/shared/src/i18n/zh.json`
- Modify: `packages/shared/src/i18n/en.json`

**Step 1: Add Chinese translations**

Add these keys inside the JSON object in `zh.json`. Place them in alphabetical order among the top-level key groups. The `auth.*` keys go with the existing `auth` section, and `welcome.*` is a new section:

Auth section additions (add alongside existing `auth.*` keys):
```json
"auth.brand_tagline": "Git 原生的 AI Hackathon 平台",
"auth.brand_highlight_1": "浏览并参与 AI Hackathon",
"auth.brand_highlight_2": "组建团队，提交项目",
"auth.brand_highlight_3": "展示成果，赢得认可",
"auth.no_account_hint": "还没有账号？通过 GitHub 登录即可自动创建"
```

New `welcome` section:
```json
"welcome.title": "欢迎来到 Synnovator！",
"welcome.subtitle": "一站式 AI Hackathon 平台",
"welcome.browse_title": "浏览活动",
"welcome.browse_desc": "发现正在进行的 AI Hackathon",
"welcome.profile_title": "创建档案",
"welcome.profile_desc": "展示你的技能，匹配理想队友",
"welcome.submit_title": "提交项目",
"welcome.submit_desc": "组队参赛，提交作品，赢得认可",
"welcome.cta": "开始探索"
```

**Step 2: Add English translations**

Add corresponding keys to `en.json`:

Auth section additions:
```json
"auth.brand_tagline": "Git-Native AI Hackathon Platform",
"auth.brand_highlight_1": "Browse and join AI Hackathons",
"auth.brand_highlight_2": "Build teams, submit projects",
"auth.brand_highlight_3": "Showcase results, earn recognition",
"auth.no_account_hint": "No account? Sign in with GitHub to create one automatically"
```

New `welcome` section:
```json
"welcome.title": "Welcome to Synnovator!",
"welcome.subtitle": "Your all-in-one AI Hackathon platform",
"welcome.browse_title": "Browse Events",
"welcome.browse_desc": "Discover ongoing AI Hackathons",
"welcome.profile_title": "Create Profile",
"welcome.profile_desc": "Showcase your skills, find teammates",
"welcome.submit_title": "Submit Project",
"welcome.submit_desc": "Join a team, submit your work, earn recognition",
"welcome.cta": "Start Exploring"
```

**Step 3: Verify i18n loads**

Run: `pnpm --filter @synnovator/shared test`

Expected: All existing tests pass (translations are loaded dynamically, no test needed for new keys specifically).

**Step 4: Commit**

```bash
git add packages/shared/src/i18n/zh.json packages/shared/src/i18n/en.json
git commit -m "feat(shared): add i18n keys for login redesign and welcome dialog"
```

---

### Task 3: Create (auth) route group and layout

**Files:**
- Create: `apps/web/app/(auth)/layout.tsx`
- Move: `apps/web/app/(public)/login/page.tsx` → `apps/web/app/(auth)/login/page.tsx`
- Delete: `apps/web/app/(public)/login/` directory

The `(auth)` layout is minimal — no NavBar, no Footer, just a wrapper that provides the full-screen container. The root `layout.tsx` already has `ThemeProvider`, so `(auth)/layout.tsx` does not need to repeat it.

**Step 1: Create the (auth) layout**

Create `apps/web/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex">
      {children}
    </div>
  );
}
```

This is deliberately minimal: `min-h-dvh` for full viewport height, `flex` to enable the left-right split in the login page.

**Step 2: Move the login page**

```bash
mkdir -p apps/web/app/\(auth\)/login
mv apps/web/app/\(public\)/login/page.tsx apps/web/app/\(auth\)/login/page.tsx
rmdir apps/web/app/\(public\)/login
```

The login page content (`<Suspense><LoginForm /></Suspense>`) stays the same for now — it will be redesigned in Task 4.

**Step 3: Verify routing**

Run: `pnpm dev` and navigate to `/login`.

Expected: Login page renders without NavBar/Footer. The URL `/login` works unchanged (route groups like `(auth)` don't affect the URL path).

**Step 4: Commit**

```bash
git add apps/web/app/\(auth\)/layout.tsx apps/web/app/\(auth\)/login/page.tsx
git rm apps/web/app/\(public\)/login/page.tsx
git commit -m "feat(web): move login to (auth) route group with minimal layout"
```

---

### Task 4: Redesign LoginForm with left-right split

**Files:**
- Modify: `apps/web/components/LoginForm.tsx`
- Modify: `apps/web/app/(auth)/login/page.tsx`

This is the main visual redesign. The login page becomes a left-right split:
- Left 55%: Brand panel with logo, tagline, highlights, sketch decorations
- Right 45%: Login form (existing logic, upgraded styling)
- Mobile: Left panel hidden, simplified tagline above form

**Step 1: Update the login page to pass layout concerns**

Replace `apps/web/app/(auth)/login/page.tsx`:

```tsx
import { Suspense } from 'react';
import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
```

No change needed — the page is already just a Suspense wrapper. The `(auth)/layout.tsx` provides `min-h-dvh flex`.

**Step 2: Rewrite LoginForm.tsx with split layout**

Replace the entire `LoginForm` component. Key changes:
- Outer container: `flex w-full` (fills the `flex min-h-dvh` from layout)
- Left panel: `hidden lg:flex` with brand content, `w-[55%]`, `bg-muted`
- Right panel: `w-full lg:w-[45%]` with login form, `bg-background`
- Mobile: tagline shown above form (`lg:hidden`), left panel hidden
- Form logic unchanged (tabs, password login, GitHub login, returnTo)

```tsx
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { getLangFromSearchParams, t } from '@synnovator/shared/i18n';
import { Card } from '@synnovator/ui';
import { GitHubIcon } from './icons';
import { SketchUnderline, SketchDoodle } from './sketch';

export function LoginForm() {
  const searchParams = useSearchParams();
  const lang = getLangFromSearchParams(searchParams);
  const returnTo = searchParams.get('returnTo') || '/';

  const [tab, setTab] = useState<'password' | 'github'>('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        await res.json();
        setError(t(lang, 'auth.invalid_credentials'));
        return;
      }

      window.location.href = returnTo;
    } catch {
      setError(t(lang, 'auth.network_error'));
    } finally {
      setLoading(false);
    }
  }

  function handleGitHubLogin() {
    window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  }

  return (
    <div className="flex w-full">
      {/* Brand Panel — hidden on mobile */}
      <div className="hidden lg:flex w-[55%] bg-muted flex-col justify-center px-16 xl:px-24 relative overflow-hidden">
        <div className="max-w-md">
          <Image src="/logo-dark.svg" alt="Synnovator" width={120} height={60} className="dark:hidden mb-8" />
          <Image src="/logo-light.svg" alt="Synnovator" width={120} height={60} className="hidden dark:block mb-8" />

          <h2 className="text-3xl xl:text-4xl font-heading font-bold text-foreground mb-2">
            {t(lang, 'auth.brand_tagline')}
          </h2>
          <SketchUnderline width={200} delay={300} className="mb-8" />

          <ul className="space-y-4 text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="text-primary mt-0.5">&#9670;</span>
              <span>{t(lang, 'auth.brand_highlight_1')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-0.5">&#9670;</span>
              <span>{t(lang, 'auth.brand_highlight_2')}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-0.5">&#9670;</span>
              <span>{t(lang, 'auth.brand_highlight_3')}</span>
            </li>
          </ul>
        </div>

        <SketchDoodle variant="rocket" className="absolute bottom-12 right-12 opacity-40" delay={600} />
      </div>

      {/* Login Form Panel */}
      <div className="w-full lg:w-[45%] bg-background flex flex-col items-center justify-center px-6 sm:px-12">
        {/* Mobile-only tagline */}
        <p className="lg:hidden text-sm text-muted-foreground mb-6 text-center">
          {t(lang, 'auth.brand_tagline')}
        </p>

        <Card className="w-full max-w-sm p-8">
          <h1 className="text-2xl font-heading text-foreground mb-6 text-center">
            {t(lang, 'auth.login')}
          </h1>

          <div role="tablist" className="flex mb-6 border-b border-border">
            <button
              type="button"
              role="tab"
              id="login-tab-password"
              aria-selected={tab === 'password'}
              aria-controls="login-panel-password"
              onClick={() => setTab('password')}
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                tab === 'password'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(lang, 'auth.login_password')}
            </button>
            <button
              type="button"
              role="tab"
              id="login-tab-github"
              aria-selected={tab === 'github'}
              aria-controls="login-panel-github"
              onClick={() => setTab('github')}
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                tab === 'github'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(lang, 'auth.login_github')}
            </button>
          </div>

          {tab === 'password' ? (
            <div role="tabpanel" id="login-panel-password" aria-labelledby="login-tab-password">
              <form onSubmit={handlePasswordLogin} className="space-y-4" aria-describedby={error ? 'login-error' : undefined}>
                <div>
                  <label htmlFor="username" className="block text-sm text-muted-foreground mb-1">
                    {t(lang, 'auth.username')}
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    aria-required="true"
                    aria-invalid={!!error}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm focus:outline-none focus:border-ring"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm text-muted-foreground mb-1">
                    {t(lang, 'auth.password')}
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    aria-required="true"
                    aria-invalid={!!error}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm focus:outline-none focus:border-ring"
                    autoComplete="current-password"
                  />
                </div>

                {error && <p id="login-error" role="alert" className="text-destructive text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? t(lang, 'auth.signing_in') : t(lang, 'auth.sign_in')}
                </button>
              </form>

              <p className="text-muted-foreground text-xs text-center mt-4">
                admin / 12345
              </p>
            </div>
          ) : (
            <div role="tabpanel" id="login-panel-github" aria-labelledby="login-tab-github" className="space-y-4">
              <p className="text-muted-foreground text-sm text-center">
                {t(lang, 'auth.sign_in_with_github')}
              </p>
              <button
                type="button"
                onClick={handleGitHubLogin}
                className="w-full py-2 px-4 bg-muted text-foreground font-medium rounded-md hover:bg-card transition-colors text-sm flex items-center justify-center gap-2"
              >
                <GitHubIcon size={20} aria-hidden="true" />
                GitHub
              </button>
            </div>
          )}
        </Card>

        <p className="text-muted-foreground text-xs text-center mt-6 max-w-sm">
          {t(lang, 'auth.no_account_hint')}
        </p>
      </div>
    </div>
  );
}
```

**Step 3: Verify visually**

Run: `pnpm dev` → navigate to `/login`

Expected:
- Desktop (≥1024px): Left brand panel with logo, tagline, highlights, SketchUnderline, SketchDoodle. Right panel with login card.
- Mobile (<1024px): Only right panel visible, with tagline text above the card.
- Dark mode: Logo switches, colors follow theme.
- Login still works (password tab, GitHub tab, returnTo).

**Step 4: Commit**

```bash
git add apps/web/components/LoginForm.tsx
git commit -m "feat(web): redesign login page with left-right brand split layout"
```

---

### Task 5: Create WelcomeDialog component

**Files:**
- Create: `apps/web/components/WelcomeDialog.tsx`

This client component:
1. On mount, reads `synnovator_onboarded` cookie
2. If cookie exists → renders nothing
3. If cookie absent → shows Dialog with 3 feature cards
4. On any close (CTA, X, overlay, ESC) → writes cookie + closes

**Step 1: Create the component**

Create `apps/web/components/WelcomeDialog.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, UserRound, Rocket } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from '@synnovator/ui';
import { t } from '@synnovator/shared/i18n';

const COOKIE_NAME = 'synnovator_onboarded';
const COOKIE_MAX_AGE = 31536000; // 365 days

function hasOnboardedCookie(): boolean {
  return document.cookie.split('; ').some(c => c.startsWith(`${COOKIE_NAME}=`));
}

function setOnboardedCookie() {
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

const features = [
  { icon: Search, titleKey: 'welcome.browse_title', descKey: 'welcome.browse_desc' },
  { icon: UserRound, titleKey: 'welcome.profile_title', descKey: 'welcome.profile_desc' },
  { icon: Rocket, titleKey: 'welcome.submit_title', descKey: 'welcome.submit_desc' },
] as const;

export function WelcomeDialog({ lang }: { lang: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasOnboardedCookie()) {
      setOpen(true);
    }
  }, []);

  function handleClose() {
    setOnboardedCookie();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl font-heading">
            {t(lang, 'welcome.title')}
          </DialogTitle>
          <DialogDescription>
            {t(lang, 'welcome.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
          {features.map(({ icon: Icon, titleKey, descKey }) => (
            <div key={titleKey} className="bg-muted rounded-lg p-4 text-center">
              <Icon className="mx-auto mb-2 text-primary" size={28} aria-hidden="true" />
              <h3 className="font-medium text-foreground text-sm mb-1">
                {t(lang, titleKey)}
              </h3>
              <p className="text-muted-foreground text-xs">
                {t(lang, descKey)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button onClick={handleClose} className="px-8">
            {t(lang, 'welcome.cta')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Verify it compiles**

Run: `pnpm tsc --noEmit` from `apps/web/` (or the full build).

Expected: No TypeScript errors. The component imports Dialog from `@synnovator/ui` (Task 1) and `t` from `@synnovator/shared/i18n`.

Note: `Button` is already exported from `@synnovator/ui`. `lucide-react` icons (`Search`, `UserRound`, `Rocket`) are available since `lucide-react` is a dependency of `@synnovator/ui` and also installed in `apps/web`.

**Step 3: Commit**

```bash
git add apps/web/components/WelcomeDialog.tsx
git commit -m "feat(web): add WelcomeDialog with cookie-based new user detection"
```

---

### Task 6: Integrate WelcomeDialog into public layout

**Files:**
- Modify: `apps/web/app/(public)/layout.tsx`

The `WelcomeDialog` renders inside the public layout so it appears on any page the user lands on after login (respecting `returnTo`). The layout is a Server Component but `WelcomeDialog` is a Client Component — it handles its own cookie check internally.

**Step 1: Add WelcomeDialog to the layout**

Modify `apps/web/app/(public)/layout.tsx`. The layout doesn't have access to `searchParams` directly (it's a layout, not a page), so we need `WelcomeDialog` to read lang from searchParams itself.

Update `WelcomeDialog` to use `useSearchParams` internally instead of receiving `lang` as a prop. This simplifies the integration.

Actually, since the layout is a Server Component and can't easily pass dynamic lang, update `WelcomeDialog.tsx` to get lang internally:

In `WelcomeDialog.tsx`, change the component to not require a `lang` prop — instead use `useSearchParams`:

```tsx
// Change the export to:
export function WelcomeDialog() {
  const searchParams = useSearchParams();
  const lang = getLangFromSearchParams(searchParams);
  // ... rest of component
}
```

Add imports:
```tsx
import { useSearchParams } from 'next/navigation';
import { getLangFromSearchParams, t } from '@synnovator/shared/i18n';
```

Then in `apps/web/app/(public)/layout.tsx`, add:

```tsx
import { Suspense } from 'react';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { WelcomeDialog } from '@/components/WelcomeDialog';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md">
        Skip to main content
      </a>
      <Suspense>
        <NavBar />
      </Suspense>
      <main id="main-content" className="pt-16">{children}</main>
      <Suspense>
        <Footer />
      </Suspense>
      <Suspense>
        <WelcomeDialog />
      </Suspense>
    </>
  );
}
```

**Step 2: Verify the integration**

Run: `pnpm dev`

Test flow:
1. Clear cookies (DevTools → Application → Cookies → delete `synnovator_onboarded`)
2. Navigate to `/` → Welcome Dialog should appear
3. Click "开始探索" → Dialog closes, cookie `synnovator_onboarded=1` is set
4. Refresh page → Dialog does NOT appear
5. Navigate to `/login` → Dialog does NOT appear (different layout)

**Step 3: Commit**

```bash
git add apps/web/components/WelcomeDialog.tsx apps/web/app/\(public\)/layout.tsx
git commit -m "feat(web): integrate WelcomeDialog into public layout"
```

---

### Task 7: Verify full flow end-to-end

**Files:** None (verification only)

**Step 1: Test the complete login → onboarding flow**

Run: `pnpm dev`

1. Clear all cookies
2. Go to `/` → Welcome Dialog appears (first visit, not logged in yet)
3. Close it → cookie set
4. Go to `/login` → See brand split layout (no NavBar/Footer)
5. Login with admin/12345 → Redirects to `/`
6. Welcome Dialog does NOT appear again (cookie already set)

**Step 2: Test new user flow (cookie cleared)**

1. Clear `synnovator_onboarded` cookie only (keep session)
2. Refresh → Welcome Dialog appears
3. Click CTA → Dialog closes, cookie set
4. Verify cookie in DevTools: `synnovator_onboarded=1`, path `/`

**Step 3: Test responsive layout**

1. `/login` at desktop (≥1024px) → Left-right split visible
2. `/login` at mobile (<1024px) → Only form visible with tagline
3. Welcome Dialog at mobile → Cards stack vertically

**Step 4: Test dark mode**

1. Toggle dark mode
2. `/login` → Logo switches, colors follow theme, brand panel uses muted background
3. Welcome Dialog → Colors follow theme

**Step 5: Test i18n**

1. Navigate to `/?lang=en` → Welcome Dialog in English
2. Navigate to `/login?lang=en` → Brand panel in English

**Step 6: Build check**

Run: `pnpm --filter @synnovator/web build`

Expected: Build succeeds with no errors.

---

## Task Dependency Graph

```
Task 1 (Dialog component) ──┐
Task 2 (i18n keys)         ──┤── Task 4 (LoginForm redesign)
Task 3 ((auth) route group) ─┘
                               ├── Task 5 (WelcomeDialog) → Task 6 (Layout integration)
                               └── Task 7 (E2E verification)
```

Tasks 1, 2, 3 can be done in parallel (no dependencies). Task 4 depends on 1-3. Task 5 depends on 1 and 2. Task 6 depends on 5. Task 7 is final verification.
