# Preview Deployment & OAuth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable isolated Cloudflare Pages preview deployments for PRs with working GitHub OAuth via a second OAuth App and cross-subdomain cookies.

**Architecture:** Switch from `wrangler deploy` to native Pages build (`astro build`). Use per-environment variables in Pages dashboard for production vs preview. Add domain-aware cookie logic so OAuth sessions work across `*.synnovator.pages.dev` subdomains.

**Tech Stack:** Astro 5, Cloudflare Pages, GitHub OAuth, AES-GCM session cookies

**Design doc:** `docs/plans/2026-03-04-preview-deploy-oauth-design.md`

---

### Task 1: Add `getCookieDomain` helper and update cookie functions in `auth.ts`

**Files:**
- Modify: `site/src/lib/auth.ts:70-82`

**Step 1: Add `getCookieDomain` utility function**

Add after the `COOKIE_MAX_AGE` constant (line 13), before `deriveKey`:

```typescript
/**
 * Derive cookie Domain attribute for cross-subdomain sharing.
 * On *.pages.dev, returns the registrable domain (e.g. synnovator.pages.dev)
 * so cookies are shared across preview subdomains.
 * Returns undefined for custom domains (cookie scoped to exact host).
 */
export function getCookieDomain(hostname: string): string | undefined {
  if (hostname.endsWith('.pages.dev')) {
    const parts = hostname.split('.');
    // e.g. "abc123.synnovator.pages.dev" → "synnovator.pages.dev"
    // e.g. "synnovator.pages.dev" → "synnovator.pages.dev"
    return parts.slice(-3).join('.');
  }
  return undefined;
}
```

**Step 2: Update `setSessionCookie` to accept optional domain**

Replace lines 70-75:

```typescript
export function setSessionCookie(headers: Headers, token: string, cookieDomain?: string): void {
  let cookie = `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
  if (cookieDomain) {
    cookie += `; Domain=${cookieDomain}`;
  }
  headers.append('Set-Cookie', cookie);
}
```

**Step 3: Update `clearSessionCookie` to accept optional domain**

Replace lines 77-82:

```typescript
export function clearSessionCookie(headers: Headers, cookieDomain?: string): void {
  let cookie = `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
  if (cookieDomain) {
    cookie += `; Domain=${cookieDomain}`;
  }
  headers.append('Set-Cookie', cookie);
}
```

**Step 4: Verify build**

Run: `cd site && pnpm run build`
Expected: Build succeeds (no type errors)

**Step 5: Commit**

```bash
git add site/src/lib/auth.ts
git commit -m "feat(site): add cross-subdomain cookie support for preview deploys"
```

---

### Task 2: Add redirect validation helper to `auth.ts`

**Files:**
- Modify: `site/src/lib/auth.ts` (add at end of file)

**Step 1: Add `isAllowedRedirect` function**

Append to `auth.ts`:

```typescript
/**
 * Validate redirect URLs to prevent open redirect attacks.
 * Allows: relative paths, home.synnovator.space, *.synnovator.pages.dev
 */
const ALLOWED_REDIRECT_PATTERNS = [
  /^\/(?!\/)/,  // relative paths (but not protocol-relative //evil.com)
  /^https:\/\/home\.synnovator\.space(\/|$)/,
  /^https:\/\/([a-z0-9-]+\.)?synnovator\.pages\.dev(\/|$)/,
];

export function isAllowedRedirect(url: string): boolean {
  return ALLOWED_REDIRECT_PATTERNS.some((p) => p.test(url));
}
```

**Step 2: Verify build**

Run: `cd site && pnpm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site/src/lib/auth.ts
git commit -m "feat(site): add redirect URL validation for OAuth flow"
```

---

### Task 3: Update `login.ts` — full URL in OAuth state for preview subdomains

**Files:**
- Modify: `site/src/pages/api/auth/login.ts:5-25`

**Step 1: Rewrite the GET handler**

Replace the entire handler body (lines 5-25):

```typescript
export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  const clientId = env.GITHUB_CLIENT_ID;
  const siteUrl = env.SITE_URL || 'https://synnovator.pages.dev';

  const requestUrl = new URL(request.url);
  const requestOrigin = requestUrl.origin;
  const siteOrigin = new URL(siteUrl).origin;

  let returnTo = requestUrl.searchParams.get('returnTo')
    || request.headers.get('Referer')
    || '/';

  // On preview subdomains, preserve full URL so callback can redirect back
  if (requestOrigin !== siteOrigin && !returnTo.startsWith('http')) {
    returnTo = `${requestOrigin}${returnTo}`;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${siteUrl}/api/auth/callback`,
    scope: 'read:user',
    state: returnTo,
  });

  return new Response(null, {
    status: 302,
    headers: { Location: `https://github.com/login/oauth/authorize?${params}` },
  });
};
```

**Step 2: Verify build**

Run: `cd site && pnpm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site/src/pages/api/auth/login.ts
git commit -m "feat(site): preserve preview origin in OAuth state for cross-subdomain redirect"
```

---

### Task 4: Update `callback.ts` — domain-aware cookie + redirect validation

**Files:**
- Modify: `site/src/pages/api/auth/callback.ts:1-59`

**Step 1: Rewrite callback with redirect validation and domain-aware cookie**

Replace the entire file:

```typescript
import type { APIRoute } from 'astro';
import { encrypt, setSessionCookie, getCookieDomain, isAllowedRedirect } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const rawReturnTo = url.searchParams.get('state') || '/';

  // Validate redirect target to prevent open redirect
  const returnTo = isAllowedRedirect(rawReturnTo) ? rawReturnTo : '/';

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenData.access_token) {
    const siteUrl = env.SITE_URL || 'https://synnovator.pages.dev';
    const loginUrl = `${siteUrl}/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
    return new Response(null, { status: 302, headers: { Location: loginUrl } });
  }

  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Synnovator',
    },
  });

  const user = (await userRes.json()) as { login: string; avatar_url: string };

  const token = await encrypt(
    {
      login: user.login,
      avatar_url: user.avatar_url,
      access_token: tokenData.access_token,
    },
    env.AUTH_SECRET,
  );

  const cookieDomain = getCookieDomain(url.hostname);
  const headers = new Headers({ Location: returnTo });
  setSessionCookie(headers, token, cookieDomain);
  return new Response(null, { status: 302, headers });
};
```

**Step 2: Verify build**

Run: `cd site && pnpm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site/src/pages/api/auth/callback.ts
git commit -m "feat(site): add redirect validation and cross-subdomain cookie to OAuth callback"
```

---

### Task 5: Update `logout.ts` — domain-aware cookie clearing

**Files:**
- Modify: `site/src/pages/api/auth/logout.ts:1-11`

**Step 1: Rewrite logout with domain-aware cookie clearing**

Replace the entire file:

```typescript
import type { APIRoute } from 'astro';
import { clearSessionCookie, getCookieDomain } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const cookieDomain = getCookieDomain(new URL(request.url).hostname);
  const headers = new Headers({ Location: '/' });
  clearSessionCookie(headers, cookieDomain);
  return new Response(null, { status: 302, headers });
};
```

**Step 2: Verify build**

Run: `cd site && pnpm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site/src/pages/api/auth/logout.ts
git commit -m "feat(site): add cross-subdomain cookie clearing to logout"
```

---

### Task 6: Update `wrangler.toml` — local dev defaults

**Files:**
- Modify: `site/wrangler.toml:10-14`

**Step 1: Update `[vars]` section for local development**

Replace lines 10-14:

```toml
[vars]
SITE_URL = "http://localhost:4321"
GITHUB_CLIENT_ID = "Iv23liQaa34mwXMU912V"
GITHUB_OWNER = "Synnovator"
GITHUB_REPO = "monorepo"
```

Note: Production and preview values are set via the Cloudflare Pages dashboard (per-environment), not in this file. This file is only used for local `pnpm run dev`.

**Step 2: Verify build**

Run: `cd site && pnpm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site/wrangler.toml
git commit -m "chore(site): update wrangler.toml vars to local dev defaults"
```

---

### Task 7: Final build verification

**Step 1: Clean build**

Run: `cd site && rm -rf dist && pnpm run build`
Expected: Build succeeds with no errors

**Step 2: Verify no TypeScript errors**

Run: `cd site && pnpm exec astro check`
Expected: No errors (warnings OK)

**Step 3: Commit all changes (if any remaining)**

```bash
git status
# If clean, no commit needed
```

---

### Post-Implementation: Manual Setup (not automated)

These steps must be done by a human in the browser:

1. **Create "Synnovator Preview" GitHub OAuth App**
   - Go to: `github.com/organizations/Synnovator/settings/applications` → New OAuth App
   - Application name: `Synnovator Preview`
   - Homepage URL: `https://synnovator.pages.dev`
   - Callback URL: `https://synnovator.pages.dev/api/auth/callback`
   - Generate client secret, save both Client ID and Secret

2. **Update Cloudflare Pages dashboard**
   - Settings → Build → Change build command to: `cd site && pnpm run build`
   - Settings → Build → Set build output directory to: `site/dist`
   - Settings → Environment Variables → Production:
     - `SITE_URL` = `https://home.synnovator.space`
     - `GITHUB_CLIENT_ID` = `Iv23liQaa34mwXMU912V`
     - `GITHUB_CLIENT_SECRET` = (existing prod secret)
     - `AUTH_SECRET` = (existing)
     - `GITHUB_OWNER` = `Synnovator`
     - `GITHUB_REPO` = `monorepo`
     - R2 credentials (existing)
   - Settings → Environment Variables → Preview:
     - `SITE_URL` = `https://synnovator.pages.dev`
     - `GITHUB_CLIENT_ID` = (preview app ID from step 1)
     - `GITHUB_CLIENT_SECRET` = (preview secret from step 1)
     - `AUTH_SECRET` = (same as production)
     - `GITHUB_OWNER` = `Synnovator`
     - `GITHUB_REPO` = `monorepo`
     - R2 credentials (same as production)

3. **Test** — push a PR branch, verify preview URL works, test OAuth login flow
