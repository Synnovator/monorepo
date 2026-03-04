# Preview Deployment & OAuth Design

**Date:** 2026-03-04
**Status:** Approved

## Problem

The current Cloudflare Pages build configuration uses `cd site && pnpm run deploy` (wrangler deploy) for both the "Deploy command" and "Version command". This deploys to a single Cloudflare Worker named "synnovator" regardless of branch, meaning PR preview deployments overwrite production. There is no isolated preview environment, and GitHub OAuth callbacks are hardcoded to the production domain.

## Decision

**Approach A: Two GitHub OAuth Apps + Native Cloudflare Pages Deployment**

Switch from `wrangler deploy` to native Cloudflare Pages build (`astro build`), use per-environment variables for production vs preview, and create a second GitHub OAuth App for preview deployments with cross-subdomain cookie sharing.

## Architecture

### Deployment Flow

```
Git Push to main  → Pages build (astro build) → Production at home.synnovator.space
Git Push to PR    → Pages build (astro build) → Preview at <hash>.synnovator.pages.dev
```

### OAuth Flow (Preview)

```
Developer on abc123.synnovator.pages.dev
  → clicks Login
  → login.ts reads SITE_URL=https://synnovator.pages.dev
  → redirects to GitHub with redirect_uri=synnovator.pages.dev/api/auth/callback
  → GitHub redirects to synnovator.pages.dev/api/auth/callback
  → callback sets cookie with Domain=synnovator.pages.dev
  → redirects to abc123.synnovator.pages.dev (from state parameter)
  → preview subdomain receives the cookie — session works
```

Key insight: `pages.dev` is on the public suffix list, so `synnovator.pages.dev` is a registrable domain. Cookies set with `Domain=synnovator.pages.dev` are sent to all `*.synnovator.pages.dev` subdomains.

## Infrastructure Changes

### Cloudflare Pages Dashboard

| Setting | Current | New |
|---------|---------|-----|
| Build command | `cd site && pnpm run deploy` | `cd site && pnpm run build` |
| Build output directory | N/A (Worker deploy) | `site/dist` |
| Root directory | `/` | `/` |
| Production branch | `main` | `main` |

### Environment Variables (Pages Dashboard)

| Variable | Production | Preview |
|----------|-----------|---------|
| `SITE_URL` | `https://home.synnovator.space` | `https://synnovator.pages.dev` |
| `GITHUB_CLIENT_ID` | `Iv23liQaa34mwXMU912V` | `<preview-app-id>` |
| `GITHUB_CLIENT_SECRET` | `<prod-secret>` | `<preview-secret>` |
| `AUTH_SECRET` | `<shared>` | `<shared>` |
| `GITHUB_OWNER` | `Synnovator` | `Synnovator` |
| `GITHUB_REPO` | `monorepo` | `monorepo` |
| `R2_*` credentials | Same for both | Same for both |

### GitHub OAuth Apps

| App | Callback URL | Usage |
|-----|-------------|-------|
| Synnovator (existing) | `https://home.synnovator.space/api/auth/callback` | Production |
| Synnovator Preview (new) | `https://synnovator.pages.dev/api/auth/callback` | PR previews |

## Code Changes

### 1. `site/src/lib/auth.ts` — Cross-subdomain cookie

Add `cookieDomain` parameter to `setSessionCookie` and `clearSessionCookie`:

```typescript
export function setSessionCookie(headers: Headers, token: string, cookieDomain?: string): void {
  let cookie = `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
  if (cookieDomain) {
    cookie += `; Domain=${cookieDomain}`;
  }
  headers.append('Set-Cookie', cookie);
}

export function clearSessionCookie(headers: Headers, cookieDomain?: string): void {
  let cookie = `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
  if (cookieDomain) {
    cookie += `; Domain=${cookieDomain}`;
  }
  headers.append('Set-Cookie', cookie);
}
```

### 2. `site/src/pages/api/auth/login.ts` — Full URL in OAuth state

When the request origin differs from `SITE_URL`, include the full origin in `returnTo` so the callback can redirect back to the preview subdomain:

```typescript
const requestOrigin = new URL(request.url).origin;
const siteOrigin = new URL(siteUrl).origin;

let returnTo = new URL(request.url).searchParams.get('returnTo')
  || request.headers.get('Referer')
  || '/';

// If on a preview subdomain, preserve full URL for cross-origin redirect
if (requestOrigin !== siteOrigin && !returnTo.startsWith('http')) {
  returnTo = `${requestOrigin}${returnTo}`;
}
```

### 3. `site/src/pages/api/auth/callback.ts` — Redirect validation + domain-aware cookie

```typescript
// Validate returnTo against allowed origins (prevent open redirect)
const ALLOWED_PATTERNS = [
  /^https:\/\/home\.synnovator\.space(\/|$)/,
  /^https:\/\/([a-z0-9-]+\.)?synnovator\.pages\.dev(\/|$)/,
  /^\//,  // relative paths
];

function isAllowedRedirect(url: string): boolean {
  return ALLOWED_PATTERNS.some(p => p.test(url));
}

// Derive cookie domain for cross-subdomain sharing on *.pages.dev
function getCookieDomain(requestUrl: string): string | undefined {
  const host = new URL(requestUrl).hostname;
  if (host.endsWith('.pages.dev')) {
    // e.g., synnovator.pages.dev from synnovator.pages.dev
    return host.split('.').slice(-3).join('.');
  }
  return undefined;
}
```

### 4. `site/src/pages/api/auth/logout.ts` — Domain-aware cookie clearing

Pass `cookieDomain` to `clearSessionCookie` using the same `getCookieDomain` logic.

### 5. `site/wrangler.toml` — Local dev defaults

Update `[vars]` to serve as local development defaults only:

```toml
[vars]
SITE_URL = "http://localhost:4321"
GITHUB_CLIENT_ID = "Iv23liQaa34mwXMU912V"
GITHUB_OWNER = "Synnovator"
GITHUB_REPO = "monorepo"
```

Production and preview values are set via the Cloudflare Pages dashboard.

### 6. No changes needed

- `package.json` — keep `deploy` script for manual use
- `astro.config.mjs` — keep `site` hardcoded (only affects SEO/canonical URLs)
- `auth.ts` encrypt/decrypt — no changes
- `me.ts` — no changes (reads cookie normally)

## Manual Setup Steps (Not Code)

1. **Create "Synnovator Preview" GitHub OAuth App** at github.com/organizations/Synnovator/settings/applications
   - Application name: `Synnovator Preview`
   - Homepage URL: `https://synnovator.pages.dev`
   - Authorization callback URL: `https://synnovator.pages.dev/api/auth/callback`
2. **Update Cloudflare Pages dashboard**:
   - Change build command to `cd site && pnpm run build`
   - Set per-environment variables (see table above)
3. **Generate client secret** for the preview OAuth App and add to Pages preview env vars

## Testing

- Push a PR branch → verify preview URL is generated at `*.synnovator.pages.dev`
- On preview URL, click Login → verify OAuth flow redirects through `synnovator.pages.dev` and back to preview
- Verify session cookie works across preview subdomains
- Verify production deployment at `home.synnovator.space` is unaffected
