# Smart Forms + shadcn/ui Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build 6 smart form components with auto-fill and dynamic dropdowns, migrate 4 existing interactive components to React + shadcn/ui, and add 2 new pages.

**Architecture:** React Islands embedded in Astro pages via `client:visible`/`client:load`. Forms read hackathon data passed as build-time props and fetch OAuth state at runtime. Each form generates a pre-filled GitHub Issue/PR URL.

**Tech Stack:** Astro 5 (hybrid), React 19, shadcn/ui, Tailwind CSS v4, TypeScript

---

## Task 1: Add React Integration + shadcn/ui Dependencies

**Files:**
- Modify: `site/package.json`
- Modify: `site/astro.config.mjs`
- Modify: `site/tsconfig.json`
- Modify: `site/src/styles/global.css`
- Create: `site/src/lib/utils.ts`
- Create: `site/components.json`

**Step 1: Install dependencies**

Run from `site/`:
```bash
cd site && pnpm add @astrojs/react react react-dom class-variance-authority clsx tailwind-merge lucide-react
pnpm add -D @types/react @types/react-dom
```

**Step 2: Configure Astro React integration**

Modify `site/astro.config.mjs`:
```typescript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import yaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  site: 'https://home.synnovator.space',
  integrations: [react()],
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  vite: {
    plugins: [tailwindcss(), yaml()],
    ssr: {
      noExternal: ['class-variance-authority', 'clsx', 'tailwind-merge'],
    },
  },
});
```

**Step 3: Update tsconfig for React JSX**

Modify `site/tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "resolveJsonModule": true,
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

**Step 4: Add shadcn/ui CSS variables to global.css**

Add the following after the existing `@theme` block in `site/src/styles/global.css`:

```css
/* === shadcn/ui CSS Variables (mapped to Neon Forge palette) === */
:root {
  --background: var(--color-surface);
  --foreground: var(--color-light-gray);
  --card: var(--color-dark-bg);
  --card-foreground: var(--color-light-gray);
  --popover: var(--color-dark-bg);
  --popover-foreground: var(--color-light-gray);
  --primary: var(--color-lime-primary);
  --primary-foreground: var(--color-near-black);
  --secondary: var(--color-secondary-bg);
  --secondary-foreground: white;
  --muted: var(--color-secondary-bg);
  --muted-foreground: var(--color-muted);
  --accent: var(--color-secondary-bg);
  --accent-foreground: white;
  --destructive: var(--color-error);
  --destructive-foreground: white;
  --border: var(--color-secondary-bg);
  --input: var(--color-secondary-bg);
  --ring: var(--color-lime-primary);
  --radius: 0.5rem;
}
```

**Step 5: Create shadcn utility**

Create `site/src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 6: Create components.json for shadcn**

Create `site/components.json`:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/global.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**Step 7: Update tsconfig with path aliases**

Add to `site/tsconfig.json` compilerOptions:
```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "resolveJsonModule": true,
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Step 8: Verify build**

```bash
cd site && pnpm run build
```

Expected: Build succeeds with React integration active.

**Step 9: Commit**

```bash
git add site/package.json site/pnpm-lock.yaml site/astro.config.mjs site/tsconfig.json site/src/styles/global.css site/src/lib/utils.ts site/components.json
git commit -m "feat(site): add React integration and shadcn/ui foundation"
```

---

## Task 2: Add shadcn/ui Primitive Components

**Files:**
- Create: `site/src/components/ui/button.tsx`
- Create: `site/src/components/ui/input.tsx`
- Create: `site/src/components/ui/textarea.tsx`
- Create: `site/src/components/ui/label.tsx`
- Create: `site/src/components/ui/select.tsx`
- Create: `site/src/components/ui/checkbox.tsx`
- Create: `site/src/components/ui/slider.tsx`
- Create: `site/src/components/ui/accordion.tsx`
- Create: `site/src/components/ui/alert.tsx`
- Create: `site/src/components/ui/dropdown-menu.tsx`
- Create: `site/src/components/ui/badge.tsx`

**Step 1: Install shadcn/ui components**

Run each from `site/`:
```bash
cd site
pnpm dlx shadcn@latest add button input textarea label select checkbox slider accordion alert dropdown-menu badge
```

If `shadcn` CLI doesn't work with current setup, manually create each component. The components are small — each is a thin wrapper over Radix UI primitives with Tailwind classes.

**Step 2: Install Radix UI deps** (if not installed by shadcn CLI)

```bash
cd site && pnpm add @radix-ui/react-select @radix-ui/react-checkbox @radix-ui/react-slider @radix-ui/react-accordion @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-slot
```

**Step 3: Verify imports work**

Create a temporary test — import one component in an Astro page to confirm the pipeline works:

```astro
---
// Temporary test in any page
import { Button } from '../components/ui/button';
---
<Button client:load>Test</Button>
```

Run: `cd site && pnpm run dev` — verify page loads without errors.

**Step 4: Commit**

```bash
git add site/src/components/ui/ site/package.json site/pnpm-lock.yaml
git commit -m "feat(site): add shadcn/ui primitive components"
```

---

## Task 3: Build Shared Infrastructure

**Files:**
- Create: `site/src/lib/github-url.ts`
- Create: `site/src/hooks/useAuth.ts`
- Create: `site/src/components/forms/form-utils.ts`

**Step 1: Create GitHub URL builder**

Create `site/src/lib/github-url.ts`:
```typescript
const GITHUB_ORG = 'Synnovator';
const GITHUB_REPO = 'monorepo';
const BASE_URL = `https://github.com/${GITHUB_ORG}/${GITHUB_REPO}`;

export interface IssueUrlParams {
  template?: string;
  title: string;
  labels?: string[];
  body?: string;
  /** Field IDs from issue template YAML to pre-fill via query params */
  fields?: Record<string, string>;
}

export interface PRUrlParams {
  filename: string;
  value: string;
  branch?: string;
  message?: string;
}

/**
 * Build a GitHub "new issue" URL with pre-filled fields.
 *
 * GitHub Issue template forms support query param pre-fill:
 * ?template=register.yml&title=xxx&labels=yyy&field_id=value
 *
 * Field IDs correspond to `id` in the YAML template body entries.
 */
export function buildIssueUrl(params: IssueUrlParams): string {
  const url = new URL(`${BASE_URL}/issues/new`);
  if (params.template) url.searchParams.set('template', params.template);
  url.searchParams.set('title', params.title);
  if (params.labels?.length) url.searchParams.set('labels', params.labels.join(','));
  if (params.body) url.searchParams.set('body', params.body);
  if (params.fields) {
    for (const [key, value] of Object.entries(params.fields)) {
      if (value) url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

/**
 * Build a GitHub "create file" URL (for PR-based creation).
 * Opens the GitHub file editor with pre-filled content.
 */
export function buildPRUrl(params: PRUrlParams): string {
  const url = new URL(`${BASE_URL}/new/main`);
  url.searchParams.set('filename', params.filename);
  url.searchParams.set('value', params.value);
  if (params.message) url.searchParams.set('message', params.message);
  return url.toString();
}

/**
 * Open a GitHub URL in a new tab.
 */
export function openGitHubUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export { GITHUB_ORG, GITHUB_REPO, BASE_URL };
```

**Step 2: Create useAuth hook**

Create `site/src/hooks/useAuth.ts`:
```typescript
import { useState, useEffect } from 'react';

export interface AuthUser {
  login: string;
  avatar_url: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  isLoggedIn: boolean;
}

/**
 * React hook that fetches the current OAuth state from /api/auth/me.
 * Caches the result for the component's lifecycle.
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!cancelled) {
          if (data.authenticated) {
            setUser({ login: data.login, avatar_url: data.avatar_url });
          } else {
            setUser(null);
          }
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAuth();
    return () => { cancelled = true; };
  }, []);

  return { user, loading, isLoggedIn: !!user };
}
```

**Step 3: Create form utilities and shared types**

Create `site/src/components/forms/form-utils.ts`:
```typescript
/** Shared types used across all smart forms */

export interface Track {
  slug: string;
  name: string;
  name_zh?: string;
}

export interface Criterion {
  name: string;
  name_zh?: string;
  weight: number;
  description?: string;
  score_range?: number[];
}

export interface TeamInfo {
  name: string;
  track: string;
  members: string[];
}

/**
 * Simple object-to-YAML formatter for form submissions.
 * Handles strings, numbers, booleans, arrays, and nested objects.
 */
export function formatYaml(obj: Record<string, unknown>, indent = 0): string {
  const pad = '  '.repeat(indent);
  const lines: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === '') continue;

    if (typeof value === 'string') {
      if (value.includes('\n')) {
        lines.push(`${pad}${key}: |`);
        for (const line of value.split('\n')) {
          lines.push(`${pad}  ${line}`);
        }
      } else {
        lines.push(`${pad}${key}: "${value.replace(/"/g, '\\"')}"`);
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`${pad}${key}: ${value}`);
    } else if (Array.isArray(value)) {
      lines.push(`${pad}${key}:`);
      for (const item of value) {
        if (typeof item === 'string') {
          lines.push(`${pad}  - "${item}"`);
        } else if (typeof item === 'object' && item !== null) {
          const itemLines = formatYaml(item as Record<string, unknown>, indent + 2).split('\n');
          if (itemLines.length > 0) {
            lines.push(`${pad}  - ${itemLines[0].trimStart()}`);
            for (const il of itemLines.slice(1)) {
              lines.push(`${pad}    ${il.trimStart()}`);
            }
          }
        }
      }
    } else if (typeof value === 'object') {
      lines.push(`${pad}${key}:`);
      lines.push(formatYaml(value as Record<string, unknown>, indent + 1));
    }
  }

  return lines.join('\n');
}

/**
 * Validate that required fields are filled.
 * Returns array of missing field names (empty = all valid).
 */
export function validateRequired(fields: Record<string, unknown>): string[] {
  return Object.entries(fields)
    .filter(([, value]) => {
      if (value === undefined || value === null || value === '') return true;
      if (Array.isArray(value) && value.length === 0) return true;
      return false;
    })
    .map(([key]) => key);
}

/**
 * Get localized string based on language.
 */
export function localize(lang: 'zh' | 'en', en?: string, zh?: string): string {
  if (lang === 'zh') return zh || en || '';
  return en || zh || '';
}
```

**Step 4: Commit**

```bash
git add site/src/lib/github-url.ts site/src/hooks/useAuth.ts site/src/components/forms/form-utils.ts
git commit -m "feat(site): add shared infrastructure for smart forms"
```

---

## Task 4: Migrate OAuthButton to React

**Files:**
- Create: `site/src/components/OAuthButton.tsx`
- Modify: `site/src/components/NavBar.astro` (import new React component)
- Remove (after verification): `site/src/components/OAuthButton.astro`

**Step 1: Create OAuthButton.tsx**

Create `site/src/components/OAuthButton.tsx`:
```tsx
import { useAuth } from '@/hooks/useAuth';
import { useState, useRef, useEffect } from 'react';

export function OAuthButton() {
  const { user, loading, isLoggedIn } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-secondary-bg animate-pulse" />;
  }

  if (!isLoggedIn) {
    return (
      <a
        href="/api/auth/login"
        className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        <span className="hidden sm:inline">Sign In</span>
      </a>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 cursor-pointer"
        aria-label="User menu"
      >
        <img src={user!.avatar_url} alt="" className="w-8 h-8 rounded-full border border-secondary-bg" />
        <span className="hidden sm:inline text-sm text-light-gray">{user!.login}</span>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-secondary-bg bg-dark-bg shadow-xl py-1 z-50">
          <a
            href={`/hackers/${user!.login}`}
            className="block px-4 py-2 text-sm text-light-gray hover:bg-secondary-bg hover:text-white transition-colors"
          >
            My Profile
          </a>
          <a
            href="/create-profile"
            className="block px-4 py-2 text-sm text-light-gray hover:bg-secondary-bg hover:text-white transition-colors"
          >
            Create Profile
          </a>
          <a
            href="/api/auth/logout"
            className="block px-4 py-2 text-sm text-light-gray hover:bg-secondary-bg hover:text-white transition-colors"
          >
            Sign Out
          </a>
        </div>
      )}
    </div>
  );
}

export default OAuthButton;
```

**Step 2: Update NavBar.astro**

Modify `site/src/components/NavBar.astro`:
```astro
---
import OAuthButton from './OAuthButton';
---

<nav class="fixed top-0 left-0 right-0 z-50 bg-near-black/80 backdrop-blur-md border-b border-secondary-bg">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2 text-lime-primary font-heading font-bold text-xl hover:opacity-80 transition-opacity">
      Synnovator
    </a>

    <div class="hidden md:flex items-center gap-8">
      <a href="/" class="text-light-gray hover:text-white transition-colors text-sm">活动</a>
      <a href="/guides/hacker" class="text-muted hover:text-white transition-colors text-sm">指南</a>
      <a href="/create-hackathon" class="text-muted hover:text-white transition-colors text-sm">创建活动</a>
    </div>

    <div class="flex items-center gap-4">
      <button id="lang-switch" class="text-muted hover:text-white text-sm transition-colors">
        EN / 中
      </button>

      <OAuthButton client:load />

      <a
        href="https://github.com/Synnovator/monorepo"
        target="_blank"
        rel="noopener noreferrer"
        class="text-muted hover:text-white transition-colors"
        aria-label="GitHub"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      </a>
    </div>
  </div>
</nav>
```

**Step 3: Delete old OAuthButton.astro**

```bash
rm site/src/components/OAuthButton.astro
```

**Step 4: Verify**

```bash
cd site && pnpm run build
```

**Step 5: Commit**

```bash
git add site/src/components/OAuthButton.tsx site/src/components/NavBar.astro
git rm site/src/components/OAuthButton.astro
git commit -m "feat(site): migrate OAuthButton to React + add Create Profile/Hackathon nav links"
```

---

## Task 5: Migrate FAQAccordion to React

**Files:**
- Create: `site/src/components/FAQAccordion.tsx`
- Modify: `site/src/pages/hackathons/[...slug].astro` (update import)
- Remove: `site/src/components/FAQAccordion.astro`

**Step 1: Create FAQAccordion.tsx**

Create `site/src/components/FAQAccordion.tsx`:
```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQItem {
  q: string;
  q_en?: string;
  a: string;
  a_en?: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  lang: 'zh' | 'en';
}

function localize(lang: 'zh' | 'en', en?: string, zh?: string): string {
  if (lang === 'zh') return zh || en || '';
  return en || zh || '';
}

export function FAQAccordion({ items, lang }: FAQAccordionProps) {
  return (
    <Accordion type="multiple" className="space-y-2">
      {items.map((item, idx) => (
        <AccordionItem
          key={idx}
          value={`faq-${idx}`}
          className="rounded-lg border border-secondary-bg bg-dark-bg"
        >
          <AccordionTrigger className="px-4 py-3 text-sm text-white font-medium hover:text-lime-primary transition-colors [&[data-state=open]>svg]:rotate-180">
            {localize(lang, item.q_en, item.q)}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 text-sm text-muted">
            {localize(lang, item.a_en, item.a)}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default FAQAccordion;
```

**Step 2: Update hackathons/[...slug].astro**

Change the import from:
```typescript
import FAQAccordion from '../../components/FAQAccordion.astro';
```
to:
```typescript
import FAQAccordion from '../../components/FAQAccordion';
```

And update usage:
```astro
<FAQAccordion client:visible items={h.faq} lang={lang} />
```

**Step 3: Delete old, verify, commit**

```bash
rm site/src/components/FAQAccordion.astro
cd site && pnpm run build
git add -A && git commit -m "feat(site): migrate FAQAccordion to React + shadcn Accordion"
```

---

## Task 6: Migrate DatasetDownload to React

**Files:**
- Create: `site/src/components/DatasetDownload.tsx`
- Modify: `site/src/pages/hackathons/[...slug].astro` (update import)
- Remove: `site/src/components/DatasetDownload.astro`

**Step 1: Create DatasetDownload.tsx**

Create `site/src/components/DatasetDownload.tsx`:
```tsx
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildIssueUrl } from '@/lib/github-url';

interface Dataset {
  name: string;
  name_zh?: string;
  version?: string;
  description?: string;
  access_control?: string;
  format?: string;
  size?: string;
  download_url?: string;
}

interface DatasetDownloadProps {
  datasets: Dataset[];
  hackathonSlug: string;
  lang: 'zh' | 'en';
}

function loc(lang: 'zh' | 'en', en?: string, zh?: string): string {
  if (lang === 'zh') return zh || en || '';
  return en || zh || '';
}

export function DatasetDownload({ datasets, hackathonSlug, lang }: DatasetDownloadProps) {
  return (
    <div className="space-y-4">
      {datasets.map((ds, idx) => (
        <DatasetItem key={idx} dataset={ds} hackathonSlug={hackathonSlug} lang={lang} />
      ))}
    </div>
  );
}

function DatasetItem({ dataset: ds, hackathonSlug, lang }: { dataset: Dataset; hackathonSlug: string; lang: 'zh' | 'en' }) {
  const { isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ndaUrl, setNdaUrl] = useState<string | null>(null);

  const isNdaRequired = ds.access_control === 'nda-required' || ds.access_control === 'nda';

  async function handlePresign() {
    setLoading(true);
    setError(null);
    setNdaUrl(null);

    if (!isLoggedIn) {
      window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    try {
      const res = await fetch('/api/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: `hackathons/${hackathonSlug}/datasets/${ds.name}` }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err.error === 'nda_required') {
          const url = buildIssueUrl({
            template: 'nda-sign.yml',
            title: `[NDA] --- — ${hackathonSlug}`,
            labels: ['nda-sign'],
          });
          setNdaUrl(url);
          setError(err.message || (lang === 'zh' ? '请先签署 NDA' : 'Please sign the NDA first'));
        } else {
          setError(err.error || 'Failed to get download link');
        }
        return;
      }

      const { url } = await res.json();
      window.open(url, '_blank');
    } catch {
      setError(lang === 'zh' ? '网络错误，请重试' : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-secondary-bg bg-dark-bg p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-white font-medium text-sm">{loc(lang, ds.name, ds.name_zh)}</p>
        {ds.version && <span className="text-xs text-muted">v{ds.version}</span>}
      </div>
      {ds.description && <p className="text-muted text-sm mt-1">{ds.description}</p>}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted">
        {ds.format && <span>Format: {ds.format}</span>}
        {ds.size && <span>Size: {ds.size}</span>}
        {ds.access_control && (
          <span className={isNdaRequired
            ? 'px-2 py-0.5 rounded bg-warning/20 text-warning'
            : 'px-2 py-0.5 rounded bg-lime-primary/20 text-lime-primary'
          }>
            {isNdaRequired
              ? (lang === 'zh' ? '需 NDA' : 'NDA Required')
              : (lang === 'zh' ? '公开' : 'Public')}
          </span>
        )}
      </div>

      {ds.download_url ? (
        <a
          href={ds.download_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-secondary-bg text-white text-sm hover:bg-secondary-bg/80 transition-colors"
        >
          {lang === 'zh' ? '下载' : 'Download'}
        </a>
      ) : isNdaRequired ? (
        <button
          onClick={handlePresign}
          disabled={loading}
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-lime-primary/20 text-lime-primary text-sm hover:bg-lime-primary/30 transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? '...' : (lang === 'zh' ? '获取下载链接' : 'Get Download Link')}
        </button>
      ) : null}

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm">
          {error}
          {ndaUrl && (
            <a href={ndaUrl} target="_blank" rel="noopener" className="underline ml-2 font-medium hover:text-white">
              {lang === 'zh' ? '→ 签署 NDA' : '→ Sign NDA'}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default DatasetDownload;
```

**Step 2: Update import in hackathons/[...slug].astro, delete old, verify, commit**

Same pattern as Task 5. Change import, add `client:visible`, delete `.astro` file.

```bash
rm site/src/components/DatasetDownload.astro
cd site && pnpm run build
git add -A && git commit -m "feat(site): migrate DatasetDownload to React"
```

---

## Task 7: Migrate ScoreCard to React

**Files:**
- Create: `site/src/components/ScoreCard.tsx`
- Modify: `site/src/pages/hackathons/[...slug].astro` (update import)
- Remove: `site/src/components/ScoreCard.astro`

**Step 1: Create ScoreCard.tsx**

Create `site/src/components/ScoreCard.tsx`:
```tsx
import { useState, useMemo } from 'react';
import { buildIssueUrl, openGitHubUrl } from '@/lib/github-url';

interface Criterion {
  name: string;
  name_zh?: string;
  weight: number;
  description?: string;
  score_range?: number[];
}

interface ScoreCardProps {
  hackathonSlug: string;
  trackSlug: string;
  criteria: Criterion[];
  lang: 'zh' | 'en';
}

export function ScoreCard({ hackathonSlug, trackSlug, criteria, lang }: ScoreCardProps) {
  const [team, setTeam] = useState('');
  const [scores, setScores] = useState<number[]>(
    criteria.map(c => Math.round(((c.score_range?.[0] ?? 0) + (c.score_range?.[1] ?? 100)) / 2))
  );
  const [comments, setComments] = useState<string[]>(criteria.map(() => ''));
  const [overall, setOverall] = useState('');
  const [conflict, setConflict] = useState(false);

  const weightedTotal = useMemo(
    () => scores.reduce((sum, score, i) => sum + score * criteria[i].weight, 0),
    [scores, criteria]
  );

  function updateScore(idx: number, value: number) {
    setScores(prev => { const next = [...prev]; next[idx] = value; return next; });
  }

  function updateComment(idx: number, value: string) {
    setComments(prev => { const next = [...prev]; next[idx] = value; return next; });
  }

  function handleSubmit() {
    const teamName = team || 'team-name';
    let yamlLines = ['scores:'];
    criteria.forEach((c, i) => {
      yamlLines.push(`  - criterion: "${c.name}"`);
      yamlLines.push(`    score: ${scores[i]}`);
      yamlLines.push(`    comment: "${comments[i].replace(/"/g, '\\"')}"`);
    });
    yamlLines.push('');
    yamlLines.push('overall_comment: |');
    yamlLines.push(`  ${overall.replace(/\n/g, '\n  ')}`);
    yamlLines.push('');
    yamlLines.push('conflict_declaration: true');

    const body = '```yaml\n' + yamlLines.join('\n') + '\n```';
    const url = buildIssueUrl({
      title: `[Score] ${teamName} — ${hackathonSlug} / ${trackSlug}`,
      labels: ['judge-score', `hackathon:${hackathonSlug}`],
      body,
    });
    openGitHubUrl(url);
  }

  const t = (zh: string, en: string) => lang === 'zh' ? zh : en;

  return (
    <div className="rounded-lg border border-secondary-bg bg-dark-bg p-6">
      <h3 className="text-lg font-heading font-bold text-white mb-6">
        {t('评分卡', 'Score Card')}
      </h3>

      {/* Team name */}
      <div className="mb-6">
        <label className="block text-sm text-muted mb-2">{t('团队名称', 'Team Name')}</label>
        <input
          type="text"
          value={team}
          onChange={e => setTeam(e.target.value)}
          placeholder="team-alpha"
          className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none"
        />
      </div>

      {/* Criteria */}
      <div className="space-y-6">
        {criteria.map((c, idx) => {
          const min = c.score_range?.[0] ?? 0;
          const max = c.score_range?.[1] ?? 100;
          return (
            <div key={idx} className="border-b border-secondary-bg pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">
                  {lang === 'zh' && c.name_zh ? c.name_zh : c.name}
                </span>
                <span className="text-xs text-muted">
                  {t('权重', 'Weight')}: {(c.weight * 100).toFixed(0)}%
                </span>
              </div>
              {c.description && <p className="text-xs text-muted mb-3">{c.description}</p>}
              <div className="flex items-center gap-4 mb-3">
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={scores[idx]}
                  onChange={e => updateScore(idx, Number(e.target.value))}
                  className="flex-1 accent-lime-primary"
                />
                <input
                  type="number"
                  min={min}
                  max={max}
                  value={scores[idx]}
                  onChange={e => updateScore(idx, Number(e.target.value))}
                  className="w-16 bg-surface border border-secondary-bg rounded-md px-2 py-1 text-white text-sm text-center"
                />
              </div>
              <textarea
                value={comments[idx]}
                onChange={e => updateComment(idx, e.target.value)}
                placeholder={t('评语（可选）', 'Comment (optional)')}
                className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm resize-none h-16 focus:border-lime-primary focus:outline-none"
              />
            </div>
          );
        })}
      </div>

      {/* Overall comment */}
      <div className="mt-6">
        <label className="block text-sm text-muted mb-2">{t('整体评语', 'Overall Comment')}</label>
        <textarea
          value={overall}
          onChange={e => setOverall(e.target.value)}
          placeholder={t('整体评语...', 'Overall comment...')}
          className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm resize-none h-24 focus:border-lime-primary focus:outline-none"
        />
      </div>

      {/* Conflict checkbox */}
      <div className="mt-6 p-4 rounded-lg border border-secondary-bg bg-surface">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={conflict}
            onChange={e => setConflict(e.target.checked)}
            className="mt-0.5 accent-lime-primary"
          />
          <span className="text-sm text-light-gray">
            {t('我确认与该团队无利益冲突关系', 'I confirm no conflict of interest with this team')}
          </span>
        </label>
      </div>

      {/* Total + submit */}
      <div className="mt-6 flex items-center justify-between">
        <div>
          <span className="text-muted text-sm">{t('加权总分', 'Weighted Total')}: </span>
          <span className="text-lime-primary font-code text-lg font-medium">{weightedTotal.toFixed(1)}</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!conflict}
          className="bg-lime-primary text-near-black px-6 py-2 rounded-lg font-medium text-sm hover:bg-lime-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('提交评分', 'Submit Score')}
        </button>
      </div>
    </div>
  );
}

export default ScoreCard;
```

**Step 2: Update import in hackathons/[...slug].astro, delete old, verify, commit**

```bash
rm site/src/components/ScoreCard.astro
cd site && pnpm run build
git add -A && git commit -m "feat(site): migrate ScoreCard to React"
```

---

## Task 8: Build RegisterForm

**Files:**
- Create: `site/src/components/forms/RegisterForm.tsx`
- Modify: `site/src/pages/hackathons/[...slug].astro` (replace GitHubRedirect register with RegisterForm)

**Step 1: Create RegisterForm.tsx**

Create `site/src/components/forms/RegisterForm.tsx`:
```tsx
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildIssueUrl, openGitHubUrl } from '@/lib/github-url';
import type { Track } from './form-utils';

interface RegisterFormProps {
  hackathonSlug: string;
  hackathonName: string;
  tracks: Track[];
  ndaRequired: boolean;
  lang: 'zh' | 'en';
}

const ROLES = [
  { value: 'Participant (Solo)', zh: '个人参赛', en: 'Participant (Solo)' },
  { value: 'Team Lead', zh: '队长', en: 'Team Lead' },
  { value: 'Team Member', zh: '队员', en: 'Team Member' },
];

export function RegisterForm({ hackathonSlug, hackathonName, tracks, ndaRequired, lang }: RegisterFormProps) {
  const { user, loading, isLoggedIn } = useAuth();
  const [track, setTrack] = useState('');
  const [role, setRole] = useState('');
  const [teamName, setTeamName] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [profileConfirmed, setProfileConfirmed] = useState(false);

  const t = (zh: string, en: string) => lang === 'zh' ? zh : en;
  const isSolo = role === 'Participant (Solo)';
  const canSubmit = isLoggedIn && track && role && termsAgreed && profileConfirmed && (!isSolo ? teamName : true);

  function handleSubmit() {
    if (!user || !canSubmit) return;
    const url = buildIssueUrl({
      template: 'register.yml',
      title: `[Register] ${user.login} — ${hackathonSlug}`,
      labels: ['registration', `hackathon:${hackathonSlug}`],
      fields: {
        hackathon: hackathonSlug,
        github: user.login,
        track,
        role,
        team: isSolo ? '' : teamName,
      },
    });
    openGitHubUrl(url);
  }

  return (
    <div className="rounded-lg border border-secondary-bg bg-dark-bg p-6">
      <h3 className="text-lg font-heading font-bold text-white mb-6">
        {t('活动报名', 'Register for Hackathon')}
      </h3>

      {/* Login prompt */}
      {!loading && !isLoggedIn && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
          <p className="text-warning text-sm mb-3">{t('请先登录 GitHub', 'Please sign in with GitHub first')}</p>
          <a
            href={`/api/auth/login?returnTo=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : ''}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors"
          >
            {t('登录 GitHub', 'Sign in with GitHub')}
          </a>
        </div>
      )}

      <fieldset disabled={!isLoggedIn || loading} className="space-y-5">
        {/* Hackathon (read-only) */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('活动', 'Hackathon')}</label>
          <input
            type="text"
            value={hackathonName}
            readOnly
            className="w-full bg-surface/50 border border-secondary-bg rounded-md px-3 py-2 text-muted text-sm cursor-not-allowed"
          />
        </div>

        {/* GitHub username (auto-filled) */}
        <div>
          <label className="block text-sm text-muted mb-2">GitHub Username</label>
          <input
            type="text"
            value={loading ? '...' : (user?.login ?? '')}
            readOnly
            className="w-full bg-surface/50 border border-secondary-bg rounded-md px-3 py-2 text-muted text-sm cursor-not-allowed"
          />
        </div>

        {/* Track select */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('赛道', 'Track')}</label>
          <select
            value={track}
            onChange={e => setTrack(e.target.value)}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none"
          >
            <option value="">{t('请选择赛道', 'Select a track')}</option>
            {tracks.map(tr => (
              <option key={tr.slug} value={tr.slug}>
                {lang === 'zh' && tr.name_zh ? tr.name_zh : tr.name}
              </option>
            ))}
          </select>
        </div>

        {/* Role select */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('角色', 'Role')}</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none"
          >
            <option value="">{t('请选择角色', 'Select a role')}</option>
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>
                {lang === 'zh' ? r.zh : r.en}
              </option>
            ))}
          </select>
        </div>

        {/* Team name (conditional) */}
        {role && !isSolo && (
          <div>
            <label className="block text-sm text-muted mb-2">{t('队伍名称', 'Team Name')}</label>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="team-alpha"
              className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none"
            />
          </div>
        )}

        {/* Checkboxes */}
        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)} className="mt-0.5 accent-lime-primary" />
            <span className="text-sm text-light-gray">{t('已阅读比赛规则并同意条款', 'I have read the rules and agree to the terms')}</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={profileConfirmed} onChange={e => setProfileConfirmed(e.target.checked)} className="mt-0.5 accent-lime-primary" />
            <span className="text-sm text-light-gray">{t('Profile 已创建且信息最新', 'My profile is created and up to date')}</span>
          </label>
        </div>

        {/* NDA warning */}
        {ndaRequired && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm">
            {t('此活动需要签署 NDA，请在报名前完成签署', 'This hackathon requires NDA signing. Please sign before registering.')}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full bg-lime-primary text-near-black px-6 py-3 rounded-lg font-medium text-sm hover:bg-lime-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('前往 GitHub 提交报名', 'Submit Registration on GitHub')} →
        </button>
      </fieldset>
    </div>
  );
}

export default RegisterForm;
```

**Step 2: Update hackathons/[...slug].astro — replace GitHubRedirect register**

In the hero action buttons section, replace:
```astro
{(stage === 'registration') && (
  <GitHubRedirect action="register" hackathonSlug={h.slug} label={t(lang, 'hackathon.register')} class="bg-lime-primary text-near-black hover:bg-lime-primary/80" />
)}
```
with reference to the new form section. Add after the ScoreCard section in the main content area:
```astro
{(stage === 'registration') && (
  <section>
    <h2 class="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.register')}</h2>
    <RegisterForm
      client:visible
      hackathonSlug={h.slug}
      hackathonName={localize(lang, h.name, h.name_zh)}
      tracks={h.tracks?.map(tr => ({ slug: tr.slug, name: tr.name, name_zh: tr.name_zh })) ?? []}
      ndaRequired={h.legal?.nda?.required ?? false}
      lang={lang}
    />
  </section>
)}
```

Keep a simple anchor link in the hero section to scroll to the form:
```astro
{(stage === 'registration') && (
  <a href="#register-section" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors">
    {t(lang, 'hackathon.register')}
  </a>
)}
```

**Step 3: Verify and commit**

```bash
cd site && pnpm run build
git add -A && git commit -m "feat(site): add RegisterForm smart component with auto-fill"
```

---

## Task 9: Build NDASignForm

**Files:**
- Create: `site/src/components/forms/NDASignForm.tsx`
- Modify: `site/src/pages/hackathons/[...slug].astro` (replace NDA section hardcoded link)

**Step 1: Create NDASignForm.tsx**

Create `site/src/components/forms/NDASignForm.tsx`:
```tsx
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildIssueUrl, openGitHubUrl } from '@/lib/github-url';

interface NDASignFormProps {
  hackathonSlug: string;
  ndaDocumentUrl?: string;
  ndaSummary?: string;
  lang: 'zh' | 'en';
}

export function NDASignForm({ hackathonSlug, ndaDocumentUrl, ndaSummary, lang }: NDASignFormProps) {
  const { user, loading, isLoggedIn } = useAuth();
  const [checks, setChecks] = useState([false, false, false]);

  const t = (zh: string, en: string) => lang === 'zh' ? zh : en;
  const allChecked = checks.every(Boolean);

  function toggleCheck(idx: number) {
    setChecks(prev => { const next = [...prev]; next[idx] = !next[idx]; return next; });
  }

  function handleSubmit() {
    if (!user || !allChecked) return;
    const url = buildIssueUrl({
      template: 'nda-sign.yml',
      title: `[NDA] ${user.login} — ${hackathonSlug}`,
      labels: ['nda-sign'],
      fields: {
        hackathon: hackathonSlug,
        github: user.login,
      },
    });
    openGitHubUrl(url);
  }

  const checkboxLabels = [
    t('我已阅读并同意 NDA 条款', 'I have read and agree to the NDA terms'),
    t('我了解保密和数据处理要求', 'I understand the confidentiality and data handling requirements'),
    t('我知晓违反可能导致取消资格和法律后果', 'I acknowledge violations may result in disqualification and legal action'),
  ];

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 p-6 space-y-4">
      <p className="text-sm text-warning font-medium">
        {t('此活动要求签署保密协议 (NDA)', 'This hackathon requires NDA signing')}
      </p>

      {ndaSummary && (
        <div>
          <p className="text-xs text-muted mb-1">{t('NDA 摘要', 'NDA Summary')}</p>
          <p className="text-sm text-light-gray">{ndaSummary}</p>
        </div>
      )}

      {ndaDocumentUrl && (
        <a
          href={ndaDocumentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary-bg text-white text-sm hover:bg-secondary-bg/80 transition-colors"
        >
          {t('下载 NDA 文档', 'Download NDA Document')}
        </a>
      )}

      {/* Login prompt */}
      {!loading && !isLoggedIn && (
        <div className="p-3 rounded-lg bg-secondary-bg text-muted text-sm">
          {t('请先登录后再签署 NDA', 'Please sign in to sign the NDA')}
        </div>
      )}

      <fieldset disabled={!isLoggedIn || loading} className="space-y-3">
        <p className="text-xs text-muted">{t('签署人', 'Signer')}: {loading ? '...' : (user?.login ?? '—')}</p>

        {checkboxLabels.map((label, idx) => (
          <label key={idx} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checks[idx]}
              onChange={() => toggleCheck(idx)}
              className="mt-0.5 accent-lime-primary"
            />
            <span className="text-sm text-light-gray">{label}</span>
          </label>
        ))}

        <button
          onClick={handleSubmit}
          disabled={!allChecked}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-primary/20 text-lime-primary text-sm hover:bg-lime-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('前往 GitHub 签署 NDA', 'Sign NDA on GitHub')} →
        </button>
      </fieldset>
    </div>
  );
}

export default NDASignForm;
```

**Step 2: Replace NDA section in hackathons/[...slug].astro**

Replace the hardcoded NDA section with:
```astro
import NDASignForm from '../../components/forms/NDASignForm';

{h.legal?.nda?.required && (
  <section>
    <h2 class="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.nda_sign')}</h2>
    <NDASignForm
      client:visible
      hackathonSlug={h.slug}
      ndaDocumentUrl={h.legal.nda.document_url}
      ndaSummary={h.legal.nda.summary}
      lang={lang}
    />
  </section>
)}
```

**Step 3: Verify and commit**

```bash
cd site && pnpm run build
git add -A && git commit -m "feat(site): add NDASignForm smart component"
```

---

## Task 10: Build AppealForm

**Files:**
- Create: `site/src/components/forms/AppealForm.tsx`
- Modify: `site/src/pages/hackathons/[...slug].astro`

**Step 1: Create AppealForm.tsx**

Create `site/src/components/forms/AppealForm.tsx`:
```tsx
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildIssueUrl, openGitHubUrl } from '@/lib/github-url';
import type { Track, TeamInfo } from './form-utils';

interface AppealFormProps {
  hackathonSlug: string;
  tracks: Track[];
  teams: TeamInfo[];
  lang: 'zh' | 'en';
}

const EXPECTED_RESULTS = ['Re-scoring', 'Ranking adjustment', 'Rule clarification', 'Other'];
const APPEAL_TYPES = ['Scoring dispute', 'Rule interpretation', 'Technical issue during submission', 'Other'];

export function AppealForm({ hackathonSlug, tracks, teams, lang }: AppealFormProps) {
  const { user, loading, isLoggedIn } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [appealType, setAppealType] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  const t = (zh: string, en: string) => lang === 'zh' ? zh : en;

  // Filter teams to show only the ones the logged-in user belongs to
  const myTeams = useMemo(() => {
    if (!user) return teams;
    return teams.filter(team => team.members.includes(user.login));
  }, [user, teams]);

  const selectedTeam = myTeams.find(team => team.name === teamName);
  const trackSlug = selectedTeam?.track ?? '';

  const canSubmit = isLoggedIn && teamName && expectedResult && appealType && description && acknowledged;

  function handleSubmit() {
    if (!user || !canSubmit) return;
    const url = buildIssueUrl({
      template: 'appeal.yml',
      title: `[Appeal] ${teamName} — ${hackathonSlug}${trackSlug ? `/${trackSlug}` : ''}`,
      labels: ['appeal', `hackathon:${hackathonSlug}`],
      fields: {
        hackathon: hackathonSlug,
        team: teamName,
        track: trackSlug,
        expected_result: expectedResult,
        appeal_type: appealType,
        description,
        evidence,
      },
    });
    openGitHubUrl(url);
  }

  return (
    <div className="rounded-lg border border-secondary-bg bg-dark-bg p-6">
      <h3 className="text-lg font-heading font-bold text-white mb-6">
        {t('提起申诉', 'Submit Appeal')}
      </h3>

      {!loading && !isLoggedIn && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
          <p className="text-warning text-sm">{t('请先登录', 'Please sign in first')}</p>
        </div>
      )}

      <fieldset disabled={!isLoggedIn || loading} className="space-y-5">
        {/* Team select */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('团队', 'Team')}</label>
          <select value={teamName} onChange={e => setTeamName(e.target.value)}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none">
            <option value="">{t('选择团队', 'Select team')}</option>
            {myTeams.map(team => (
              <option key={team.name} value={team.name}>{team.name}</option>
            ))}
          </select>
        </div>

        {/* Track (auto-filled) */}
        {trackSlug && (
          <div>
            <label className="block text-sm text-muted mb-2">{t('赛道', 'Track')}</label>
            <input type="text" value={tracks.find(tr => tr.slug === trackSlug)?.name ?? trackSlug} readOnly
              className="w-full bg-surface/50 border border-secondary-bg rounded-md px-3 py-2 text-muted text-sm cursor-not-allowed" />
          </div>
        )}

        {/* Expected result */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('期望结果', 'Expected Result')}</label>
          <select value={expectedResult} onChange={e => setExpectedResult(e.target.value)}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none">
            <option value="">{t('选择期望结果', 'Select expected result')}</option>
            {EXPECTED_RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Appeal type */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('申诉类型', 'Appeal Type')}</label>
          <select value={appealType} onChange={e => setAppealType(e.target.value)}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none">
            <option value="">{t('选择类型', 'Select type')}</option>
            {APPEAL_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('详细描述', 'Description')} *</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder={t('请详细描述申诉原因...', 'Please describe your appeal in detail...')}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm resize-none h-32 focus:border-lime-primary focus:outline-none" />
        </div>

        {/* Evidence */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('支持证据', 'Supporting Evidence')}</label>
          <textarea value={evidence} onChange={e => setEvidence(e.target.value)}
            placeholder={t('链接、截图等...', 'Links, screenshots, etc...')}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm resize-none h-20 focus:border-lime-primary focus:outline-none" />
        </div>

        {/* Acknowledgment */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} className="mt-0.5 accent-lime-primary" />
          <span className="text-sm text-light-gray">{t('我理解主办方的最终决定具有约束力', "I understand that the organizer's final decision is binding")}</span>
        </label>

        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full bg-secondary-bg text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-secondary-bg/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {t('前往 GitHub 提交申诉', 'Submit Appeal on GitHub')} →
        </button>
      </fieldset>
    </div>
  );
}

export default AppealForm;
```

**Step 2: Integrate into hackathons page, verify, commit**

```bash
cd site && pnpm run build
git add -A && git commit -m "feat(site): add AppealForm smart component"
```

---

## Task 11: Build TeamFormationForm

**Files:**
- Create: `site/src/components/forms/TeamFormationForm.tsx`
- Modify: `site/src/pages/hackathons/[...slug].astro`

**Step 1: Create TeamFormationForm.tsx**

Similar pattern to RegisterForm. Key fields: hackathon slug (auto), team name, track (dropdown), purpose (dropdown: Looking for teammates / Announcing formed team), members (dynamic add/remove list), looking_for (textarea), project_idea (textarea). Generates Issue URL with template=team-formation.yml.

**Step 2: Integrate into hackathons page during registration/development stages**

**Step 3: Verify and commit**

```bash
cd site && pnpm run build
git add -A && git commit -m "feat(site): add TeamFormationForm smart component"
```

---

## Task 12: Build ProfileCreateForm + Page

**Files:**
- Create: `site/src/components/forms/ProfileCreateForm.tsx`
- Create: `site/src/pages/create-profile.astro`

**Step 1: Create ProfileCreateForm.tsx**

Multi-step wizard with 5 steps:
1. Basic Info: github (auto from OAuth), name, name_zh, bio
2. Identity: type (student/professional/academic), affiliation, degree/major/graduation_year (conditional for student)
3. Skills: category + items list (add/remove)
4. More: interests, looking_for.roles, links (twitter/linkedin/website)
5. Preview: render generated YAML, submit button → buildPRUrl()

The form generates a YAML string matching `profiles/_schema.yml` v2.0 format and creates a GitHub file creation URL.

**Step 2: Create page**

Create `site/src/pages/create-profile.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ProfileCreateForm from '../components/forms/ProfileCreateForm';
---

<BaseLayout title="Create Profile" description="Create your Synnovator hacker profile">
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-3xl font-heading font-bold text-white mb-8">Create Your Profile</h1>
    <ProfileCreateForm client:load lang="zh" />
  </div>
</BaseLayout>
```

**Step 3: Verify and commit**

```bash
cd site && pnpm run build
git add -A && git commit -m "feat(site): add ProfileCreateForm + /create-profile page"
```

---

## Task 13: Build CreateHackathonForm + Page

**Files:**
- Create: `site/src/components/forms/CreateHackathonForm.tsx`
- Create: `site/src/pages/create-hackathon.astro`

**Step 1: Create CreateHackathonForm.tsx**

Multi-step wizard with 9 steps (matching synnovator-admin create-hackathon flow):
1. Type Selection: community / enterprise / youth-league → loads template defaults
2. Basic Info: name, name_zh, slug (auto from name), tagline, description
3. Organizers: add/remove entries (name, role, website)
4. Timeline: 7 stage date pickers
5. Tracks: add/remove tracks with rewards, criteria (weight validation = 1.0), deliverables
6. Legal: license, IP, NDA config
7. Settings: language, ai toggles, multi-track rule
8. Preview: full hackathon.yml YAML preview
9. Submit: buildPRUrl() to create hackathons/{slug}/hackathon.yml

This is the most complex form. The templates from `docs/templates/*/hackathon.yml` are loaded at build time and passed as props to provide sensible defaults when a type is selected.

**Step 2: Create page**

Create `site/src/pages/create-hackathon.astro`:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import CreateHackathonForm from '../components/forms/CreateHackathonForm';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

// Load templates at build time
const templateTypes = ['community', 'enterprise', 'youth-league'] as const;
const templates: Record<string, unknown> = {};
for (const type of templateTypes) {
  const templatePath = path.resolve(`docs/templates/${type}/hackathon.yml`);
  if (fs.existsSync(templatePath)) {
    try {
      const raw = fs.readFileSync(templatePath, 'utf8');
      templates[type] = yaml.load(raw);
    } catch { /* skip */ }
  }
}
---

<BaseLayout title="Create Hackathon" description="Create a new hackathon on Synnovator">
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-3xl font-heading font-bold text-white mb-8">Create a Hackathon</h1>
    <CreateHackathonForm client:load templates={templates} lang="zh" />
  </div>
</BaseLayout>
```

**Step 3: Verify and commit**

```bash
cd site && pnpm run build
git add -A && git commit -m "feat(site): add CreateHackathonForm + /create-hackathon page"
```

---

## Task 14: Update Hackathon Detail Page Integration

**Files:**
- Modify: `site/src/pages/hackathons/[...slug].astro`

**Step 1: Replace all GitHubRedirect usages**

Update the page to:
1. Import all new React components
2. Replace GitHubRedirect `register` → RegisterForm (anchor in hero + form below)
3. Replace GitHubRedirect `appeal` → AppealForm (anchor in hero + form below)
4. Replace GitHubRedirect `submit` → keep as link for now (submission is PR-based, more complex)
5. Add TeamFormationForm section during registration/development stages
6. Replace NDA hardcoded link → NDASignForm
7. Update ScoreCard, FAQAccordion, DatasetDownload imports to React versions with `client:visible`

**Step 2: Remove GitHubRedirect.astro** (no longer needed — forms handle URL generation)

Actually, keep GitHubRedirect.astro for the `submit` action and any edge cases. Update its usage only for cases not yet covered by smart forms.

**Step 3: Verify and commit**

```bash
cd site && pnpm run build
git add -A && git commit -m "feat(site): integrate all smart forms into hackathon detail page"
```

---

## Task 15: Final Cleanup and Verification

**Step 1: Remove unused imports and old component files**

- Remove `GitHubRedirect.astro` if all actions are covered
- Or keep it for backward compatibility and simpler actions

**Step 2: Full build test**

```bash
cd site && pnpm run build
```

Expected: Build succeeds, all pages generated.

**Step 3: Dev server smoke test**

```bash
cd site && pnpm run dev
```

Manually verify:
- Homepage loads ✓
- Hackathon detail page loads ✓
- OAuthButton shows login/avatar ✓
- RegisterForm renders with track dropdown ✓
- NDASignForm renders with checkboxes ✓
- ScoreCard renders with sliders ✓
- FAQAccordion expands/collapses ✓
- DatasetDownload buttons work ✓
- /create-profile page loads ✓
- /create-hackathon page loads ✓

**Step 4: Final commit**

```bash
git add -A && git commit -m "chore(site): cleanup after smart forms migration"
```

---

## Summary

| Task | Component | Type | Est. Complexity |
|------|-----------|------|-----------------|
| 1 | React + shadcn setup | Infrastructure | Medium |
| 2 | shadcn/ui primitives | Infrastructure | Low (CLI) |
| 3 | Shared utils/hooks | Infrastructure | Low |
| 4 | OAuthButton.tsx | Migration | Low |
| 5 | FAQAccordion.tsx | Migration | Low |
| 6 | DatasetDownload.tsx | Migration | Medium |
| 7 | ScoreCard.tsx | Migration | Medium |
| 8 | RegisterForm.tsx | New Form | Medium |
| 9 | NDASignForm.tsx | New Form | Low |
| 10 | AppealForm.tsx | New Form | Medium |
| 11 | TeamFormationForm.tsx | New Form | Medium |
| 12 | ProfileCreateForm.tsx + page | New Form + Page | High |
| 13 | CreateHackathonForm.tsx + page | New Form + Page | High |
| 14 | Page integration | Integration | Medium |
| 15 | Cleanup + verification | Cleanup | Low |
