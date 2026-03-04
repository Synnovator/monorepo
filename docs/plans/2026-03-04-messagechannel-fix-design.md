# Fix: MessageChannel is not defined on Cloudflare Workers

**Date**: 2026-03-04
**Status**: Approved
**Scope**: site/astro.config.mjs

## Problem

Cloudflare Workers deployment fails with:

```
Uncaught ReferenceError: MessageChannel is not defined
  at requireReactDomServer_browser_production (...)
```

React 19's `react-dom/server.browser` uses `MessageChannel` for cooperative scheduling during SSR. Cloudflare Workers runtime (`compatibility_date = "2024-09-23"`) does not provide `MessageChannel` as a global API, causing the Worker script to fail validation (error code 10021).

## Root Cause

The Astro build resolves `react-dom/server` to `react-dom/server.browser` (the browser production build) for the Workers target. This entry point assumes all browser Web APIs are available — including `MessageChannel` — which is true in browsers but not in Cloudflare Workers.

React 19 ships three server entry points:
- `react-dom/server` — Node.js (uses `node:worker_threads` MessageChannel)
- `react-dom/server.browser` — Browsers (uses global `MessageChannel`)
- `react-dom/server.edge` — Edge runtimes (avoids `MessageChannel` entirely)

## Solution

Add a Vite resolve alias in `site/astro.config.mjs` to redirect `react-dom/server` to `react-dom/server.edge` in production builds:

```js
vite: {
  resolve: {
    alias: import.meta.env.PROD
      ? { 'react-dom/server': 'react-dom/server.edge' }
      : {},
  },
}
```

### Why conditional on PROD

- **Production** (`astro build` → `wrangler dev` / `wrangler deploy`): Uses edge version, avoids `MessageChannel` dependency
- **Dev** (`astro dev`, if used): Uses default Node.js version with full scheduling capabilities

### Why NOT other approaches

- **Updating `compatibility_date`**: Cloudflare added `MessageChannel` on 2025-08-11, but jumping from `2024-09-23` to `2025-09-01` risks unrelated breaking changes. Should be done as a separate maintenance task.
- **Polyfill**: Adds unnecessary runtime code when a proper entry point exists.

## Impact

| Area | Impact |
|------|--------|
| Modified files | `site/astro.config.mjs` only (3 lines) |
| SSR behavior | Scheduler changes from MessageChannel-based to edge-simplified; negligible for `client:*` hydration components |
| API routes | `/api/auth/*`, `/api/presign` — no React SSR, unaffected |
| Client-side | Browser hydration unaffected (alias only applies to SSR build) |

## Verification

1. `pnpm build` succeeds without errors
2. `wrangler dev` runs without `MessageChannel` error
3. `wrangler deploy` deploys successfully

## References

- [Astro Issue #12824](https://github.com/withastro/astro/issues/12824)
- [React Issue #31827](https://github.com/facebook/react/issues/31827)
- [Cloudflare MessageChannel changelog](https://developers.cloudflare.com/changelog/post/2025-08-11-messagechannel/)
