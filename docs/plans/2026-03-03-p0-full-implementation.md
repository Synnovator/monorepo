# P0 Full Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete all remaining P0 roadmap items: Cloudflare Pages Hybrid migration, OAuth + R2 presign APIs, GitHub Actions automation, frontend enhancements (ScoreCard, guides, search), and admin tooling.

**Architecture:** Bottom-up 4-batch approach. Batch 1 migrates to CF Pages Hybrid and builds API endpoints. Batch 2 adds GitHub Actions automation. Batch 3 enhances the frontend with interactive components and guide pages. Batch 4 adds admin CLI tools and final verification.

**Tech Stack:** Astro 5 (Hybrid mode), @astrojs/cloudflare adapter, @aws-sdk/client-s3, Tailwind CSS 4, GitHub Actions, shell scripts

**Design Doc:** `docs/plans/2026-03-03-p0-full-implementation-design.md`

---

## Context for Implementers

**Working directory:** `/Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/p0-implementation`

**Package manager:** `pnpm` only (npm/npx forbidden by hook)

**Existing site code lives in `site/`:**
- `site/astro.config.mjs` — current config (output: 'static', no adapter)
- `site/src/pages/` — 4 existing pages (index, hackathons/[...slug], hackers/[...id], 404)
- `site/src/components/` — 10 existing Astro components
- `site/src/lib/i18n.ts` — i18n utilities (t, localize, getCurrentStage)
- `site/src/i18n/zh.yml` + `en.yml` — translation files
- `site/src/styles/global.css` — Neon Forge design tokens
- `site/src/layouts/BaseLayout.astro` — page layout with NavBar + Footer
- `site/src/content.config.ts` — Content Collections (hackathons + profiles)

**Astro Cloudflare pattern for API routes:**
```typescript
import type { APIRoute } from 'astro';
export const prerender = false;
export const GET: APIRoute = async (context) => {
  const { env } = context.locals.runtime;  // CF env vars + bindings
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
```

**Build & verify commands (always run from site/ directory):**
```bash
cd site && pnpm run build    # Must succeed with 0 errors
cd site && pnpm exec astro check  # Must show 0 errors
```

---

## Batch 1: Infrastructure Layer

### Task 1: Cloudflare Pages Hybrid Migration

**Files:**
- Modify: `site/astro.config.mjs`
- Modify: `site/package.json`
- Modify: `site/src/env.d.ts`
- Create: `site/wrangler.toml`

**Context:** The site currently uses `output: 'static'` and deploys to GitHub Pages. We need to switch to `output: 'hybrid'` with the `@astrojs/cloudflare` adapter so that most pages remain static (prerendered) while `/api/*` routes become CF Pages Functions.

**Step 1: Install the Cloudflare adapter**

```bash
cd site && pnpm add @astrojs/cloudflare
```

**Step 2: Update astro.config.mjs**

Replace the entire file with:

```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import yaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  site: 'https://synnovator.pages.dev',
  output: 'hybrid',
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  vite: {
    plugins: [tailwindcss(), yaml()],
  },
});
```

**Step 3: Create wrangler.toml**

Create `site/wrangler.toml`:

```toml
name = "synnovator"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[vars]
SITE_URL = "https://synnovator.pages.dev"
```

Note: R2 bindings are NOT configured in wrangler.toml because we use S3-compatible API with presigned URLs (not Workers R2 bindings). The R2 credentials come from CF Pages environment variables.

**Step 4: Update env.d.ts for Cloudflare runtime types**

Replace `site/src/env.d.ts` with:

```typescript
/// <reference types="astro/client" />

declare module '*.yml' {
  const value: Record<string, unknown>;
  export default value;
}

type Runtime = import('@astrojs/cloudflare').Runtime<{
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  AUTH_SECRET: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_ENDPOINT: string;
  R2_BUCKET_NAME: string;
  SITE_URL: string;
}>;

declare namespace App {
  interface Locals extends Runtime {}
}
```

**Step 5: Build and verify**

```bash
cd site && pnpm run build
```

Expected: Build succeeds. Existing pages remain static (prerendered). Output shows `hybrid` mode.

**Step 6: Commit**

```bash
git add site/astro.config.mjs site/package.json site/pnpm-lock.yaml site/wrangler.toml site/src/env.d.ts
git commit -m "feat(site): migrate to Cloudflare Pages hybrid mode

Switch output from 'static' to 'hybrid' with @astrojs/cloudflare adapter.
All existing pages remain prerendered. Prepares for /api/* server routes."
```

---

### Task 2: Auth Library (Cookie Encryption)

**Files:**
- Create: `site/src/lib/auth.ts`

**Context:** OAuth session data is stored in an encrypted HttpOnly cookie. We use AES-GCM via `crypto.subtle` (native in CF Workers). The `AUTH_SECRET` environment variable (32+ chars) is the encryption key.

**Step 1: Create the auth library**

Create `site/src/lib/auth.ts`:

```typescript
/**
 * Cookie-based session management with AES-GCM encryption.
 * Works in Cloudflare Workers runtime (crypto.subtle).
 */

export interface Session {
  login: string;
  avatar_url: string;
  access_token: string;
}

const COOKIE_NAME = 'session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('synnovator-session'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encrypt(data: Session, secret: string): Promise<string> {
  const key = await deriveKey(secret);
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(data)),
  );
  // Combine iv + ciphertext, encode as base64
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(token: string, secret: string): Promise<Session | null> {
  try {
    const key = await deriveKey(secret);
    const combined = Uint8Array.from(atob(token), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext,
    );
    return JSON.parse(new TextDecoder().decode(decrypted)) as Session;
  } catch {
    return null;
  }
}

export function setSessionCookie(headers: Headers, token: string): void {
  headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
  );
}

export function clearSessionCookie(headers: Headers): void {
  headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
  );
}

export function getSessionCookie(request: Request): string | null {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  return match ? match[1] : null;
}

export async function getSession(request: Request, secret: string): Promise<Session | null> {
  const token = getSessionCookie(request);
  if (!token) return null;
  return decrypt(token, secret);
}
```

**Step 2: Build and verify**

```bash
cd site && pnpm run build
```

Expected: Build succeeds. The auth library is tree-shaken from static pages (only used by API routes).

**Step 3: Commit**

```bash
git add site/src/lib/auth.ts
git commit -m "feat(site): add cookie-based session encryption library

AES-GCM encryption via crypto.subtle for Cloudflare Workers.
Provides encrypt/decrypt/getSession helpers for OAuth flow."
```

---

### Task 3: OAuth API Endpoints

**Files:**
- Create: `site/src/pages/api/auth/login.ts`
- Create: `site/src/pages/api/auth/callback.ts`
- Create: `site/src/pages/api/auth/me.ts`
- Create: `site/src/pages/api/auth/logout.ts`

**Context:** GitHub OAuth redirect flow. User clicks login → GitHub authorizes → callback exchanges code for token → encrypted cookie set. All 4 files must have `export const prerender = false` to run as CF Pages Functions.

**Step 1: Create /api/auth/login.ts**

Create `site/src/pages/api/auth/login.ts`:

```typescript
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  const clientId = env.GITHUB_CLIENT_ID;
  const siteUrl = env.SITE_URL || 'https://synnovator.pages.dev';

  // Use Referer as return URL, fallback to site root
  const returnTo = new URL(request.url).searchParams.get('returnTo')
    || request.headers.get('Referer')
    || '/';

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

**Step 2: Create /api/auth/callback.ts**

Create `site/src/pages/api/auth/callback.ts`:

```typescript
import type { APIRoute } from 'astro';
import { encrypt, setSessionCookie } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const returnTo = url.searchParams.get('state') || '/';

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  // Exchange code for access token
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
    return new Response(`OAuth error: ${tokenData.error || 'unknown'}`, { status: 400 });
  }

  // Fetch user profile
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Synnovator',
    },
  });

  const user = (await userRes.json()) as { login: string; avatar_url: string };

  // Encrypt session and set cookie
  const token = await encrypt(
    {
      login: user.login,
      avatar_url: user.avatar_url,
      access_token: tokenData.access_token,
    },
    env.AUTH_SECRET,
  );

  const headers = new Headers({ Location: returnTo });
  setSessionCookie(headers, token);
  return new Response(null, { status: 302, headers });
};
```

**Step 3: Create /api/auth/me.ts**

Create `site/src/pages/api/auth/me.ts`:

```typescript
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  const session = await getSession(request, env.AUTH_SECRET);

  if (!session) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      authenticated: true,
      login: session.login,
      avatar_url: session.avatar_url,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};
```

**Step 4: Create /api/auth/logout.ts**

Create `site/src/pages/api/auth/logout.ts`:

```typescript
import type { APIRoute } from 'astro';
import { clearSessionCookie } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async () => {
  const headers = new Headers({ Location: '/' });
  clearSessionCookie(headers);
  return new Response(null, { status: 302, headers });
};
```

**Step 5: Build and verify**

```bash
cd site && pnpm run build
```

Expected: Build succeeds. Output shows the 4 API routes as server-rendered (not prerendered).

**Step 6: Commit**

```bash
git add site/src/pages/api/
git commit -m "feat(site): add GitHub OAuth login/callback/me/logout API routes

Implements GitHub OAuth redirect flow via Pages Functions.
Session stored in AES-GCM encrypted HttpOnly cookie."
```

---

### Task 4: R2 Presigned URL API

**Files:**
- Create: `site/src/pages/api/presign.ts`

**Context:** Authenticated users can request presigned URLs to download files from R2. Uses `@aws-sdk/client-s3` with S3-compatible API (not R2 bindings) for presigned URL generation.

**Step 1: Install S3 SDK**

```bash
cd site && pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Step 2: Create /api/presign.ts**

Create `site/src/pages/api/presign.ts`:

```typescript
import type { APIRoute } from 'astro';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSession } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  // Verify authentication
  const session = await getSession(request, env.AUTH_SECRET);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse request body
  let body: { key?: string };
  try {
    body = (await request.json()) as { key?: string };
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { key } = body;
  if (!key || typeof key !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing key parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate key format: only allow paths under hackathons/
  if (!key.startsWith('hackathons/') || key.includes('..')) {
    return new Response(JSON.stringify({ error: 'Invalid key path' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Generate presigned URL
  const s3 = new S3Client({
    region: 'auto',
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  const expiresIn = 4 * 60 * 60; // 4 hours
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3, command, { expiresIn });
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return new Response(
    JSON.stringify({ url, expires_at: expiresAt }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};
```

**Step 3: Build and verify**

```bash
cd site && pnpm run build
```

Expected: Build succeeds. `/api/presign` route shows as server-rendered.

**Step 4: Commit**

```bash
git add site/src/pages/api/presign.ts site/package.json site/pnpm-lock.yaml
git commit -m "feat(site): add R2 presigned URL API endpoint

POST /api/presign generates time-limited download URLs for R2 objects.
Requires OAuth session. Validates key path to hackathons/ only."
```

---

### Task 5: Remove Old Deploy Workflow + Build Verification

**Files:**
- Delete: `.github/workflows/deploy.yml`

**Context:** CF Pages is directly connected to GitHub and auto-deploys. The old GitHub Pages deploy workflow is no longer needed.

**Step 1: Remove deploy.yml**

```bash
rm .github/workflows/deploy.yml
```

**Step 2: Full build verification**

```bash
cd site && pnpm run build
cd site && pnpm exec astro check
```

Expected: Build succeeds with hybrid output. `astro check` reports 0 errors.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove GitHub Pages deploy workflow

Cloudflare Pages is now the deployment target, connected directly
to GitHub for auto-deploys. Actions only handle validation tasks."
```

---

## Batch 2: Automation Layer

### Task 6: validate-score GitHub Action

**Files:**
- Create: `.github/workflows/validate-score.yml`

**Context:** When a judge opens an Issue with the `judge-score` label, this Action validates the YAML scores in the Issue body against the hackathon config (criteria names, score ranges, judge authorization).

**Step 1: Create the workflow**

Create `.github/workflows/validate-score.yml`:

```yaml
name: Validate Score

on:
  issues:
    types: [opened, edited]

jobs:
  validate:
    if: contains(github.event.issue.labels.*.name, 'judge-score')
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - name: Parse Issue title
        id: parse
        run: |
          TITLE="${{ github.event.issue.title }}"
          # Expected: [Score] team-name — hackathon-slug / track-slug
          TEAM=$(echo "$TITLE" | sed -n 's/\[Score\] \(.*\) — .*/\1/p' | xargs)
          SLUG=$(echo "$TITLE" | sed -n 's/.*— \(.*\) \/ .*/\1/p' | xargs)
          TRACK=$(echo "$TITLE" | sed -n 's/.*\/ \(.*\)/\1/p' | xargs)
          echo "team=$TEAM" >> "$GITHUB_OUTPUT"
          echo "slug=$SLUG" >> "$GITHUB_OUTPUT"
          echo "track=$TRACK" >> "$GITHUB_OUTPUT"

      - name: Validate score
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const yaml = require('js-yaml');
            const issue = context.payload.issue;
            const slug = '${{ steps.parse.outputs.slug }}';
            const track = '${{ steps.parse.outputs.track }}';
            const author = issue.user.login;
            const errors = [];

            // Check hackathon exists
            const hackathonPath = `hackathons/${slug}/hackathon.yml`;
            if (!fs.existsSync(hackathonPath)) {
              errors.push(`Hackathon not found: ${slug}`);
            } else {
              const data = yaml.load(fs.readFileSync(hackathonPath, 'utf8'));
              const h = data.hackathon;

              // Check track exists
              const trackObj = (h.tracks || []).find(t => t.slug === track);
              if (!trackObj) {
                errors.push(`Track not found: ${track}`);
              }

              // Check judge is authorized
              const judges = (h.judges || []).map(j => j.github);
              if (!judges.includes(author)) {
                errors.push(`User @${author} is not listed as a judge for ${slug}`);
              }

              // Parse scores from Issue body
              const body = issue.body || '';
              const yamlMatch = body.match(/```(?:yaml)?\s*([\s\S]*?)```/) || [null, body];
              try {
                const scoreData = yaml.load(yamlMatch[1]);
                if (scoreData && scoreData.scores && trackObj) {
                  const criteria = trackObj.judging?.criteria || [];
                  for (const s of scoreData.scores) {
                    const criterion = criteria.find(c => c.name === s.criterion);
                    if (!criterion) {
                      errors.push(`Unknown criterion: ${s.criterion}`);
                      continue;
                    }
                    const range = criterion.score_range || [0, 100];
                    if (typeof s.score !== 'number' || s.score < range[0] || s.score > range[1]) {
                      errors.push(`${s.criterion}: score ${s.score} outside range [${range[0]}, ${range[1]}]`);
                    }
                  }
                }
              } catch (e) {
                errors.push(`Failed to parse scores YAML: ${e.message}`);
              }
            }

            if (errors.length > 0) {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                body: `❌ **Score validation failed:**\n\n${errors.map(e => `- ${e}`).join('\n')}\n\nPlease fix and re-edit this issue.`,
              });
            } else {
              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                labels: ['score-validated'],
              });
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                body: `✅ **Score validated successfully.** Thank you, @${author}!`,
              });
            }

      - name: Install js-yaml for script
        if: always()
        run: npm install js-yaml
```

Note: The `actions/github-script` step needs `js-yaml`. We install it in the same job. However, the install needs to happen BEFORE the script runs. Let me restructure:

Actually, `actions/github-script` runs in a Node.js context but doesn't have `js-yaml` available by default. The correct approach is to install it first.

Let me restructure the workflow:

```yaml
name: Validate Score

on:
  issues:
    types: [opened, edited]

jobs:
  validate:
    if: contains(github.event.issue.labels.*.name, 'judge-score')
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - run: npm install js-yaml

      - name: Parse and validate score
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const yaml = require('./node_modules/js-yaml');
            const issue = context.payload.issue;
            const title = issue.title;
            const author = issue.user.login;
            const errors = [];

            // Parse title: [Score] team-name — hackathon-slug / track-slug
            const titleMatch = title.match(/\[Score\]\s*(.*?)\s*—\s*(.*?)\s*\/\s*(.*)/);
            if (!titleMatch) {
              errors.push('Issue title must match: [Score] team-name — hackathon-slug / track-slug');
            }
            const [, team, slug, track] = titleMatch || [null, '', '', ''];

            if (slug) {
              const hackathonPath = `hackathons/${slug.trim()}/hackathon.yml`;
              if (!fs.existsSync(hackathonPath)) {
                errors.push(`Hackathon not found: ${slug.trim()}`);
              } else {
                const data = yaml.load(fs.readFileSync(hackathonPath, 'utf8'));
                const h = data.hackathon;
                const trackSlug = track.trim();

                // Check track exists
                const trackObj = (h.tracks || []).find(t => t.slug === trackSlug);
                if (!trackObj) {
                  errors.push(`Track not found: ${trackSlug}`);
                }

                // Check judge authorization
                const judges = (h.judges || []).map(j => j.github);
                if (!judges.includes(author)) {
                  errors.push(`@${author} is not listed as a judge for ${slug.trim()}`);
                }

                // Parse and validate scores from body
                const body = issue.body || '';
                const yamlBlock = body.match(/```(?:yaml)?\s*\n([\s\S]*?)```/);
                const scoreYaml = yamlBlock ? yamlBlock[1] : body;
                try {
                  const scoreData = yaml.load(scoreYaml);
                  if (scoreData && scoreData.scores && trackObj) {
                    const criteria = (trackObj.judging && trackObj.judging.criteria) || [];
                    for (const s of scoreData.scores) {
                      const criterion = criteria.find(c => c.name === s.criterion);
                      if (!criterion) {
                        errors.push(`Unknown criterion: "${s.criterion}"`);
                        continue;
                      }
                      const range = criterion.score_range || [0, 100];
                      if (typeof s.score !== 'number' || s.score < range[0] || s.score > range[1]) {
                        errors.push(`"${s.criterion}": score ${s.score} outside range [${range[0]}, ${range[1]}]`);
                      }
                    }
                  }
                } catch (e) {
                  errors.push(`Failed to parse scores YAML: ${e.message}`);
                }
              }
            }

            if (errors.length > 0) {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                body: `❌ **Score validation failed:**\n\n${errors.map(e => `- ${e}`).join('\n')}\n\nPlease fix and re-edit this issue.`,
              });
            } else {
              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                labels: ['score-validated'],
              });
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                body: `✅ **Score validated.** Thank you, @${author}!`,
              });
            }
```

**Step 2: Commit**

```bash
git add .github/workflows/validate-score.yml
git commit -m "feat: add validate-score GitHub Action

Validates judge score Issues: checks hackathon exists, track exists,
author is authorized judge, and scores are within defined ranges."
```

---

### Task 7: upload-assets GitHub Action

**Files:**
- Create: `.github/workflows/upload-assets.yml`

**Context:** When a PR adds files to `hackathons/**/submissions/**`, this Action uploads non-YAML files (PDF, images, model weights) to R2, updates `project.yml` with the R2 URLs, and commits the change back to the PR branch.

**Step 1: Create the workflow**

Create `.github/workflows/upload-assets.yml`:

```yaml
name: Upload Assets to R2

on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - 'hackathons/**/submissions/**'

jobs:
  upload:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref }}
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install AWS CLI
        run: |
          curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
          unzip -q awscliv2.zip
          sudo ./aws/install

      - name: Find asset files in submissions
        id: find
        run: |
          # Get changed files in submissions directories (non-YAML only)
          FILES=$(git diff --name-only ${{ github.event.pull_request.base.sha }} HEAD -- 'hackathons/**/submissions/**' | grep -vE '\.(yml|yaml)$' || true)
          echo "files<<EOF" >> "$GITHUB_OUTPUT"
          echo "$FILES" >> "$GITHUB_OUTPUT"
          echo "EOF" >> "$GITHUB_OUTPUT"
          if [ -z "$FILES" ]; then
            echo "has_files=false" >> "$GITHUB_OUTPUT"
          else
            echo "has_files=true" >> "$GITHUB_OUTPUT"
          fi

      - name: Upload to R2
        if: steps.find.outputs.has_files == 'true'
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          R2_ENDPOINT: ${{ secrets.R2_ENDPOINT }}
          R2_BUCKET: ${{ secrets.R2_BUCKET_NAME }}
        run: |
          while IFS= read -r file; do
            [ -z "$file" ] && continue
            [ ! -f "$file" ] && continue
            echo "Uploading $file..."
            aws s3 cp "$file" "s3://${R2_BUCKET}/${file}" \
              --endpoint-url "${R2_ENDPOINT}"
            echo "  → s3://${R2_BUCKET}/${file}"
          done <<< "${{ steps.find.outputs.files }}"

      - name: Update project.yml r2_url fields
        if: steps.find.outputs.has_files == 'true'
        env:
          R2_ENDPOINT: ${{ secrets.R2_ENDPOINT }}
          R2_BUCKET: ${{ secrets.R2_BUCKET_NAME }}
        run: |
          # For each uploaded file, find its parent project.yml and update r2_url
          while IFS= read -r file; do
            [ -z "$file" ] && continue
            [ ! -f "$file" ] && continue

            BASENAME=$(basename "$file")
            DIR=$(dirname "$file")
            PROJECT_YML="${DIR}/project.yml"

            # Walk up directories to find project.yml
            while [ ! -f "$PROJECT_YML" ] && [ "$DIR" != "." ]; do
              DIR=$(dirname "$DIR")
              PROJECT_YML="${DIR}/project.yml"
            done

            if [ -f "$PROJECT_YML" ]; then
              # Construct public R2 URL
              R2_URL="${R2_ENDPOINT}/${R2_BUCKET}/${file}"
              # Update the r2_url field for this file using sed
              sed -i "s|local_path: \"./${BASENAME}\"|local_path: \"./${BASENAME}\"\n        r2_url: \"${R2_URL}\"|" "$PROJECT_YML" 2>/dev/null || true
              echo "Updated $PROJECT_YML with R2 URL for $BASENAME"
            fi
          done <<< "${{ steps.find.outputs.files }}"

      - name: Commit R2 URL updates
        if: steps.find.outputs.has_files == 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          if git diff --quiet; then
            echo "No changes to commit"
          else
            git add -A
            git commit -m "chore: update R2 URLs for uploaded assets [skip ci]"
            git push
          fi
```

**Step 2: Commit**

```bash
git add .github/workflows/upload-assets.yml
git commit -m "feat: add upload-assets GitHub Action

Uploads non-YAML files from submission PRs to R2 via S3-compatible API.
Updates project.yml r2_url fields and commits back to PR branch."
```

---

### Task 8: status-update GitHub Action

**Files:**
- Create: `.github/workflows/status-update.yml`

**Context:** Daily cron job that checks all hackathon timelines and updates labels when stage transitions occur.

**Step 1: Create the workflow**

Create `.github/workflows/status-update.yml`:

```yaml
name: Update Hackathon Status

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at UTC 00:00
  workflow_dispatch:

jobs:
  update-status:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - run: npm install js-yaml glob

      - name: Update hackathon stages
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const yaml = require('./node_modules/js-yaml');
            const { globSync } = require('./node_modules/glob');
            const now = new Date();

            const stages = ['draft', 'registration', 'development', 'submission', 'judging', 'announcement', 'award'];

            function getCurrentStage(timeline) {
              for (const stage of stages) {
                const range = timeline[stage];
                if (!range) continue;
                const start = new Date(range.start);
                const end = new Date(range.end);
                if (now >= start && now <= end) return stage;
              }
              const lastStage = timeline['award'];
              if (lastStage && now > new Date(lastStage.end)) return 'ended';
              return 'draft';
            }

            const files = globSync('hackathons/*/hackathon.yml');
            for (const file of files) {
              const data = yaml.load(fs.readFileSync(file, 'utf8'));
              const h = data.hackathon;
              if (!h.timeline) continue;

              const stage = getCurrentStage(h.timeline);
              const slug = h.slug;
              console.log(`${slug}: current stage = ${stage}`);

              // Find issues with hackathon label and update stage labels
              const { data: issues } = await github.rest.issues.listForRepo({
                owner: context.repo.owner,
                repo: context.repo.repo,
                labels: `hackathon:${slug}`,
                state: 'open',
                per_page: 100,
              });

              const stageLabel = `stage:${stage}`;
              for (const issue of issues) {
                const existingStageLabels = issue.labels
                  .filter(l => l.name.startsWith('stage:'))
                  .map(l => l.name);

                if (existingStageLabels.includes(stageLabel)) continue;

                // Remove old stage labels
                for (const old of existingStageLabels) {
                  await github.rest.issues.removeLabel({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    issue_number: issue.number,
                    name: old,
                  }).catch(() => {});
                }

                // Add new stage label
                await github.rest.issues.addLabels({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: issue.number,
                  labels: [stageLabel],
                });
              }
            }
```

**Step 2: Commit**

```bash
git add .github/workflows/status-update.yml
git commit -m "feat: add status-update cron Action

Daily job checks hackathon timelines and updates stage labels
on associated Issues. Also available via workflow_dispatch."
```

---

### Task 9: NDA Issue Template + CODEOWNERS

**Files:**
- Create: `.github/ISSUE_TEMPLATE/nda-sign.yml`
- Create: `.github/CODEOWNERS`

**Step 1: Create NDA Issue Template**

Create `.github/ISSUE_TEMPLATE/nda-sign.yml`:

```yaml
name: "NDA Signing Confirmation"
description: "Confirm NDA signing for a hackathon with NDA requirements"
title: "[NDA] {username} — {hackathon-slug}"
labels: ["nda-sign"]
body:
  - type: input
    id: hackathon
    attributes:
      label: "Hackathon Slug"
      description: "The slug of the hackathon requiring NDA"
      placeholder: "enterprise-fintech-risk-2025"
    validations:
      required: true

  - type: input
    id: github
    attributes:
      label: "GitHub Username"
      placeholder: "your-username"
    validations:
      required: true

  - type: checkboxes
    id: confirmation
    attributes:
      label: "NDA Confirmation"
      description: "Please confirm you have read and agree to the NDA terms"
      options:
        - label: "I have read and agree to the NDA terms for this hackathon"
          required: true
        - label: "I understand the confidentiality requirements and data handling policies"
          required: true
        - label: "I acknowledge that violation of the NDA may result in disqualification and legal action"
          required: true
```

**Step 2: Create CODEOWNERS**

Create `.github/CODEOWNERS`:

```
# Synnovator CODEOWNERS
# See: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners

# Default: maintainers review all
*                              @Synnovator/maintainers

# Hackathon data: maintainers (specific hackathon owners can be added per-slug)
/hackathons/                   @Synnovator/maintainers

# Profile data: maintainers
/profiles/                     @Synnovator/maintainers

# Site code: developers
/site/                         @Synnovator/developers

# CI/CD and repo config: admins only
/.github/                      @Synnovator/admins

# Documentation: anyone can contribute, developers review
/docs/                         @Synnovator/developers
```

**Step 3: Commit**

```bash
git add .github/ISSUE_TEMPLATE/nda-sign.yml .github/CODEOWNERS
git commit -m "feat: add NDA issue template and CODEOWNERS

NDA template for hackathons requiring confidentiality agreements.
CODEOWNERS establishes review routing for different directory paths."
```

---

## Batch 3: Frontend Enhancement Layer

### Task 10: OAuthButton + NavBar Auth Integration

**Files:**
- Create: `site/src/components/OAuthButton.astro`
- Modify: `site/src/components/NavBar.astro`
- Modify: `site/src/i18n/zh.yml`
- Modify: `site/src/i18n/en.yml`

**Context:** Add a login/user avatar button to the NavBar. Uses client-side JS to check `/api/auth/me` and show appropriate state.

**Step 1: Add i18n keys**

Add to `site/src/i18n/zh.yml` under a new `auth:` section (after `common:`):

```yaml
auth:
  login: "登录"
  login_github: "GitHub 登录"
  logout: "退出"
  my_profile: "我的 Profile"
```

Add the same to `site/src/i18n/en.yml`:

```yaml
auth:
  login: "Sign In"
  login_github: "Sign in with GitHub"
  logout: "Sign Out"
  my_profile: "My Profile"
```

**Step 2: Create OAuthButton.astro**

Create `site/src/components/OAuthButton.astro`:

```astro
---
// OAuthButton — shows login button or user avatar with dropdown
---

<div id="auth-container" class="relative">
  <!-- Loading state (hidden quickly) -->
  <div id="auth-loading" class="w-8 h-8 rounded-full bg-secondary-bg animate-pulse"></div>

  <!-- Logged out state -->
  <a
    id="auth-login"
    href="/api/auth/login"
    class="hidden items-center gap-2 text-sm text-muted hover:text-white transition-colors"
  >
    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
    <span class="hidden sm:inline">Sign In</span>
  </a>

  <!-- Logged in state -->
  <button
    id="auth-user"
    class="hidden items-center gap-2 cursor-pointer"
    aria-label="User menu"
  >
    <img id="auth-avatar" src="" alt="" class="w-8 h-8 rounded-full border border-secondary-bg" />
    <span id="auth-name" class="hidden sm:inline text-sm text-light-gray"></span>
  </button>

  <!-- Dropdown menu -->
  <div
    id="auth-dropdown"
    class="hidden absolute right-0 top-full mt-2 w-48 rounded-lg border border-secondary-bg bg-dark-bg shadow-xl py-1 z-50"
  >
    <a href="#" id="auth-profile-link" class="block px-4 py-2 text-sm text-light-gray hover:bg-secondary-bg hover:text-white transition-colors">
      My Profile
    </a>
    <a href="/api/auth/logout" class="block px-4 py-2 text-sm text-light-gray hover:bg-secondary-bg hover:text-white transition-colors">
      Sign Out
    </a>
  </div>
</div>

<script>
  async function initAuth() {
    const loading = document.getElementById('auth-loading');
    const loginBtn = document.getElementById('auth-login');
    const userBtn = document.getElementById('auth-user');
    const dropdown = document.getElementById('auth-dropdown');
    const avatar = document.getElementById('auth-avatar') as HTMLImageElement;
    const name = document.getElementById('auth-name');
    const profileLink = document.getElementById('auth-profile-link') as HTMLAnchorElement;

    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      loading?.classList.add('hidden');

      if (data.authenticated) {
        if (avatar) avatar.src = data.avatar_url;
        if (name) name.textContent = data.login;
        if (profileLink) profileLink.href = `/hackers/${data.login}`;
        userBtn?.classList.remove('hidden');
        userBtn?.classList.add('flex');

        // Toggle dropdown
        userBtn?.addEventListener('click', () => {
          dropdown?.classList.toggle('hidden');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
          if (!document.getElementById('auth-container')?.contains(e.target as Node)) {
            dropdown?.classList.add('hidden');
          }
        });
      } else {
        loginBtn?.classList.remove('hidden');
        loginBtn?.classList.add('flex');
      }
    } catch {
      loading?.classList.add('hidden');
      loginBtn?.classList.remove('hidden');
      loginBtn?.classList.add('flex');
    }
  }

  initAuth();
</script>
```

**Step 3: Update NavBar.astro**

Replace the `<!-- Right side -->` div in `site/src/components/NavBar.astro`. The full updated NavBar:

```astro
---
import OAuthButton from './OAuthButton.astro';
---

<nav class="fixed top-0 left-0 right-0 z-50 bg-near-black/80 backdrop-blur-md border-b border-secondary-bg">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
    <!-- Logo -->
    <a href="/" class="flex items-center gap-2 text-lime-primary font-heading font-bold text-xl hover:opacity-80 transition-opacity">
      Synnovator
    </a>

    <!-- Navigation Links -->
    <div class="hidden md:flex items-center gap-8">
      <a href="/" class="text-light-gray hover:text-white transition-colors text-sm">活动</a>
      <a href="/guides/hacker" class="text-muted hover:text-white transition-colors text-sm">指南</a>
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-4">
      <!-- Language switcher placeholder -->
      <button id="lang-switch" class="text-muted hover:text-white text-sm transition-colors">
        EN / 中
      </button>

      <!-- Auth button -->
      <OAuthButton />

      <!-- GitHub link -->
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

**Step 4: Build and verify**

```bash
cd site && pnpm run build
```

**Step 5: Commit**

```bash
git add site/src/components/OAuthButton.astro site/src/components/NavBar.astro site/src/i18n/zh.yml site/src/i18n/en.yml
git commit -m "feat(site): add OAuthButton with NavBar auth integration

Shows login button or user avatar+dropdown in NavBar.
Client-side JS checks /api/auth/me for authentication state."
```

---

### Task 11: ScoreCard Interactive Component

**Files:**
- Create: `site/src/components/ScoreCard.astro`
- Modify: `site/src/pages/hackathons/[...slug].astro` (add ScoreCard to judging stage)
- Modify: `site/src/i18n/zh.yml` (add score keys)
- Modify: `site/src/i18n/en.yml` (add score keys)

**Context:** Interactive client-side component for judges to score submissions. Reads criteria from hackathon data, provides sliders, computes weighted total, generates YAML, and opens a pre-filled GitHub Issue.

**Step 1: Add i18n keys**

Add to `site/src/i18n/zh.yml` after `auth:`:

```yaml
score:
  title: "评分卡"
  criterion: "评审维度"
  weight: "权重"
  comment: "评语"
  overall: "整体评语"
  total: "加权总分"
  submit: "提交评分"
  select_team: "选择团队"
  team_name: "团队名称"
```

Same for `en.yml`:

```yaml
score:
  title: "Score Card"
  criterion: "Criterion"
  weight: "Weight"
  comment: "Comment"
  overall: "Overall Comment"
  total: "Weighted Total"
  submit: "Submit Score"
  select_team: "Select Team"
  team_name: "Team Name"
```

**Step 2: Create ScoreCard.astro**

Create `site/src/components/ScoreCard.astro`:

```astro
---
interface Criterion {
  name: string;
  name_zh?: string;
  weight: number;
  description?: string;
  score_range?: number[];
}

interface Props {
  hackathonSlug: string;
  trackSlug: string;
  criteria: Criterion[];
  lang: 'zh' | 'en';
}

const { hackathonSlug, trackSlug, criteria, lang } = Astro.props;

const GITHUB_ORG = 'Synnovator';
const GITHUB_REPO = 'monorepo';
---

<div class="rounded-lg border border-secondary-bg bg-dark-bg p-6" id="scorecard" data-slug={hackathonSlug} data-track={trackSlug}>
  <h3 class="text-lg font-heading font-bold text-white mb-6">
    {lang === 'zh' ? '评分卡' : 'Score Card'}
  </h3>

  <!-- Team name input -->
  <div class="mb-6">
    <label class="block text-sm text-muted mb-2" for="sc-team">
      {lang === 'zh' ? '团队名称' : 'Team Name'}
    </label>
    <input
      type="text"
      id="sc-team"
      placeholder="team-alpha"
      class="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none"
    />
  </div>

  <!-- Criteria -->
  <div class="space-y-6">
    {criteria.map((c, idx) => {
      const min = c.score_range?.[0] ?? 0;
      const max = c.score_range?.[1] ?? 100;
      return (
        <div class="border-b border-secondary-bg pb-4" data-criterion={c.name}>
          <div class="flex items-center justify-between mb-2">
            <span class="text-white text-sm font-medium">
              {lang === 'zh' && c.name_zh ? c.name_zh : c.name}
            </span>
            <span class="text-xs text-muted">
              {lang === 'zh' ? '权重' : 'Weight'}: {(c.weight * 100).toFixed(0)}%
            </span>
          </div>
          {c.description && (
            <p class="text-xs text-muted mb-3">{c.description}</p>
          )}
          <div class="flex items-center gap-4 mb-3">
            <input
              type="range"
              min={min}
              max={max}
              value={Math.round((min + max) / 2)}
              class="sc-slider flex-1 accent-lime-primary"
              data-idx={idx}
            />
            <input
              type="number"
              min={min}
              max={max}
              value={Math.round((min + max) / 2)}
              class="sc-number w-16 bg-surface border border-secondary-bg rounded-md px-2 py-1 text-white text-sm text-center"
              data-idx={idx}
            />
          </div>
          <textarea
            placeholder={lang === 'zh' ? '评语（可选）' : 'Comment (optional)'}
            class="sc-comment w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm resize-none h-16 focus:border-lime-primary focus:outline-none"
            data-idx={idx}
          />
        </div>
      );
    })}
  </div>

  <!-- Overall comment -->
  <div class="mt-6">
    <label class="block text-sm text-muted mb-2">
      {lang === 'zh' ? '整体评语' : 'Overall Comment'}
    </label>
    <textarea
      id="sc-overall"
      class="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm resize-none h-24 focus:border-lime-primary focus:outline-none"
      placeholder={lang === 'zh' ? '整体评语...' : 'Overall comment...'}
    />
  </div>

  <!-- Weighted total + submit -->
  <div class="mt-6 flex items-center justify-between">
    <div>
      <span class="text-muted text-sm">{lang === 'zh' ? '加权总分' : 'Weighted Total'}: </span>
      <span id="sc-total" class="text-lime-primary font-code text-lg font-medium">0</span>
    </div>
    <button
      id="sc-submit"
      class="bg-lime-primary text-near-black px-6 py-2 rounded-lg font-medium text-sm hover:bg-lime-primary/80 transition-colors"
    >
      {lang === 'zh' ? '提交评分' : 'Submit Score'}
    </button>
  </div>
</div>

<script define:vars={{ criteria, hackathonSlug, trackSlug, GITHUB_ORG, GITHUB_REPO }}>
  const container = document.getElementById('scorecard');
  if (container) {
    const sliders = container.querySelectorAll('.sc-slider');
    const numbers = container.querySelectorAll('.sc-number');
    const comments = container.querySelectorAll('.sc-comment');
    const totalEl = document.getElementById('sc-total');

    function updateTotal() {
      let total = 0;
      sliders.forEach((slider, i) => {
        total += Number(slider.value) * criteria[i].weight;
      });
      if (totalEl) totalEl.textContent = total.toFixed(1);
    }

    // Sync slider ↔ number
    sliders.forEach((slider, i) => {
      slider.addEventListener('input', () => {
        numbers[i].value = slider.value;
        updateTotal();
      });
    });
    numbers.forEach((num, i) => {
      num.addEventListener('input', () => {
        sliders[i].value = num.value;
        updateTotal();
      });
    });

    updateTotal();

    // Submit button → generate YAML → open GitHub Issue
    document.getElementById('sc-submit')?.addEventListener('click', () => {
      const team = (document.getElementById('sc-team'))?.value || 'team-name';
      const overall = (document.getElementById('sc-overall'))?.value || '';

      let yamlLines = ['scores:'];
      sliders.forEach((slider, i) => {
        const comment = comments[i]?.value || '';
        yamlLines.push(`  - criterion: "${criteria[i].name}"`);
        yamlLines.push(`    score: ${slider.value}`);
        yamlLines.push(`    comment: "${comment.replace(/"/g, '\\"')}"`);
      });
      yamlLines.push('');
      yamlLines.push(`overall_comment: |`);
      yamlLines.push(`  ${overall.replace(/\n/g, '\n  ')}`);

      const body = '```yaml\n' + yamlLines.join('\n') + '\n```';
      const title = `[Score] ${team} — ${hackathonSlug} / ${trackSlug}`;
      const labels = `judge-score,hackathon:${hackathonSlug}`;
      const url = `https://github.com/${GITHUB_ORG}/${GITHUB_REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=${encodeURIComponent(labels)}`;

      window.open(url, '_blank');
    });
  }
</script>
```

**Step 3: Add ScoreCard to hackathon detail page**

In `site/src/pages/hackathons/[...slug].astro`, add an import at the top:

```typescript
import ScoreCard from '../../components/ScoreCard.astro';
```

Then add a ScoreCard section after the FAQ section (inside the main 2/3 column, around line 183 before `</div>` closing the `lg:col-span-2`):

```astro
        {/* ScoreCard (visible during judging stage) */}
        {stage === 'judging' && h.tracks && h.tracks.map(track => (
          track.judging?.criteria && track.judging.criteria.length > 0 && (
            <section>
              <h2 class="text-xl font-heading font-bold text-white mb-4">
                {t(lang, 'score.title')} — {localize(lang, track.name, track.name_zh)}
              </h2>
              <ScoreCard
                hackathonSlug={h.slug}
                trackSlug={track.slug}
                criteria={track.judging.criteria}
                lang={lang}
              />
            </section>
          )
        ))}
```

**Step 4: Build and verify**

```bash
cd site && pnpm run build
```

**Step 5: Commit**

```bash
git add site/src/components/ScoreCard.astro site/src/pages/hackathons/\[...slug\].astro site/src/i18n/zh.yml site/src/i18n/en.yml
git commit -m "feat(site): add ScoreCard interactive judging component

Client-side scoring with sliders, weighted total calculation,
and YAML generation that opens pre-filled GitHub Issue."
```

---

### Task 12: DatasetDownload Component

**Files:**
- Create: `site/src/components/DatasetDownload.astro`
- Modify: `site/src/pages/hackathons/[...slug].astro` (replace static datasets section)

**Context:** Replaces the existing static dataset display with an interactive component that can request presigned URLs for authenticated users.

**Step 1: Create DatasetDownload.astro**

Create `site/src/components/DatasetDownload.astro`:

```astro
---
import { localize } from '../lib/i18n';
import type { Lang } from '../lib/i18n';

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

interface Props {
  datasets: Dataset[];
  hackathonSlug: string;
  lang: Lang;
}

const { datasets, hackathonSlug, lang } = Astro.props;
---

<div class="space-y-4" id="dataset-list" data-slug={hackathonSlug}>
  {datasets.map((ds, idx) => (
    <div class="rounded-lg border border-secondary-bg bg-dark-bg p-6">
      <div class="flex items-center justify-between mb-2">
        <p class="text-white font-medium text-sm">{localize(lang, ds.name, ds.name_zh)}</p>
        {ds.version && <span class="text-xs text-muted">v{ds.version}</span>}
      </div>
      {ds.description && <p class="text-muted text-sm mt-1">{ds.description}</p>}
      <div class="flex flex-wrap gap-4 mt-3 text-xs text-muted">
        {ds.format && <span>Format: {ds.format}</span>}
        {ds.size && <span>Size: {ds.size}</span>}
        {ds.access_control && (
          <span class={ds.access_control === 'nda' ? 'text-warning' : 'text-muted'}>
            Access: {ds.access_control}
          </span>
        )}
      </div>
      {ds.download_url ? (
        <a
          href={ds.download_url}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-secondary-bg text-white text-sm hover:bg-secondary-bg/80 transition-colors"
        >
          {lang === 'zh' ? '下载' : 'Download'}
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      ) : ds.access_control === 'nda' ? (
        <button
          class="ds-download inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-lime-primary/20 text-lime-primary text-sm hover:bg-lime-primary/30 transition-colors cursor-pointer"
          data-idx={idx}
          data-key={`hackathons/${hackathonSlug}/datasets/${ds.name}`}
        >
          {lang === 'zh' ? '获取下载链接' : 'Get Download Link'}
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </button>
      ) : null}
    </div>
  ))}
</div>

<script>
  document.querySelectorAll('.ds-download').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const key = btn.getAttribute('data-key');
      if (!key) return;

      btn.textContent = '...';
      btn.setAttribute('disabled', 'true');

      try {
        // Check auth first
        const authRes = await fetch('/api/auth/me');
        const auth = await authRes.json();
        if (!auth.authenticated) {
          window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
          return;
        }

        // Request presigned URL
        const res = await fetch('/api/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        });

        if (!res.ok) {
          const err = await res.json();
          alert(err.error || 'Failed to get download link');
          return;
        }

        const { url } = await res.json();
        window.open(url, '_blank');
      } catch {
        alert('Network error. Please try again.');
      } finally {
        btn.removeAttribute('disabled');
        btn.innerHTML = 'Get Download Link';
      }
    });
  });
</script>
```

**Step 2: Replace datasets section in hackathon detail page**

In `site/src/pages/hackathons/[...slug].astro`, add import:

```typescript
import DatasetDownload from '../../components/DatasetDownload.astro';
```

Replace the existing datasets section (around lines 145-160) with:

```astro
        {/* Datasets */}
        {h.datasets && h.datasets.length > 0 && (
          <section>
            <h2 class="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.datasets')}</h2>
            <DatasetDownload datasets={h.datasets} hackathonSlug={h.slug} lang={lang} />
          </section>
        )}
```

**Step 3: Build and verify**

```bash
cd site && pnpm run build
```

**Step 4: Commit**

```bash
git add site/src/components/DatasetDownload.astro site/src/pages/hackathons/\[...slug\].astro
git commit -m "feat(site): add DatasetDownload component with presign integration

Interactive dataset download with auth check and R2 presigned URLs
for NDA-gated datasets. Falls back to direct URL for public datasets."
```

---

### Task 13: ProjectCard + ProjectShowcase

**Files:**
- Create: `site/src/components/ProjectCard.astro`
- Modify: `site/src/pages/hackathons/[...slug].astro` (add submissions section)
- Modify: `site/src/i18n/zh.yml`
- Modify: `site/src/i18n/en.yml`

**Context:** Display submitted projects on the hackathon detail page. Reads project.yml files from the hackathon's submissions directory at build time.

**Step 1: Add i18n keys**

Add to `zh.yml` after `score:`:

```yaml
project:
  submissions: "提交作品"
  no_submissions: "暂无提交"
  tech_stack: "技术栈"
  vote: "去投票"
  view_repo: "查看代码"
```

Same for `en.yml`:

```yaml
project:
  submissions: "Submissions"
  no_submissions: "No submissions yet"
  tech_stack: "Tech Stack"
  vote: "Vote on GitHub"
  view_repo: "View Code"
```

**Step 2: Create ProjectCard.astro**

Create `site/src/components/ProjectCard.astro`:

```astro
---
import { localize } from '../lib/i18n';
import type { Lang } from '../lib/i18n';

interface Props {
  project: {
    name: string;
    name_zh?: string;
    tagline?: string;
    track: string;
    team: Array<{ github: string; role?: string }>;
    tech_stack?: string[];
    deliverables?: {
      repo?: string;
      demo?: string;
    };
  };
  lang: Lang;
}

const { project, lang } = Astro.props;
---

<div class="rounded-lg border border-secondary-bg bg-dark-bg p-5 hover:border-lime-primary/30 transition-colors">
  <div class="flex items-start justify-between mb-3">
    <div>
      <h4 class="text-white font-medium text-sm">
        {localize(lang, project.name, project.name_zh)}
      </h4>
      {project.tagline && (
        <p class="text-muted text-xs mt-1">{project.tagline}</p>
      )}
    </div>
    <span class="text-xs px-2 py-1 rounded-full bg-secondary-bg text-muted whitespace-nowrap">
      {project.track}
    </span>
  </div>

  <!-- Team -->
  <div class="flex flex-wrap gap-2 mb-3">
    {project.team.map(member => (
      <a
        href={`https://github.com/${member.github}`}
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1 text-xs text-muted hover:text-lime-primary transition-colors"
      >
        <img
          src={`https://github.com/${member.github}.png?size=20`}
          alt={member.github}
          class="w-4 h-4 rounded-full"
          loading="lazy"
        />
        {member.github}
      </a>
    ))}
  </div>

  <!-- Tech stack -->
  {project.tech_stack && project.tech_stack.length > 0 && (
    <div class="flex flex-wrap gap-1 mb-3">
      {project.tech_stack.map(tech => (
        <span class="text-xs px-2 py-0.5 rounded-full bg-neon-blue/10 text-neon-blue">
          {tech}
        </span>
      ))}
    </div>
  )}

  <!-- Links -->
  <div class="flex gap-3 mt-3">
    {project.deliverables?.repo && (
      <a
        href={project.deliverables.repo}
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-lime-primary hover:underline"
      >
        {lang === 'zh' ? '查看代码' : 'View Code'} →
      </a>
    )}
    {project.deliverables?.demo && (
      <a
        href={project.deliverables.demo}
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-cyan hover:underline"
      >
        Demo →
      </a>
    )}
  </div>
</div>
```

**Step 3: Add submissions section to hackathon detail page**

In `site/src/pages/hackathons/[...slug].astro`, add imports:

```typescript
import ProjectCard from '../../components/ProjectCard.astro';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
```

After the `getStaticPaths()` function and before the template, add submission loading logic:

```typescript
// Load submissions for this hackathon
const submissionsDir = path.resolve(`hackathons/${h.slug}/submissions`);
let submissions: any[] = [];
if (fs.existsSync(submissionsDir)) {
  const teamDirs = fs.readdirSync(submissionsDir);
  for (const team of teamDirs) {
    const projectPath = path.join(submissionsDir, team, 'project.yml');
    if (fs.existsSync(projectPath)) {
      try {
        const raw = fs.readFileSync(projectPath, 'utf8');
        const data = yaml.load(raw) as any;
        if (data?.project) submissions.push(data.project);
      } catch { /* skip invalid */ }
    }
  }
}
```

Add the submissions section in the template (after ScoreCard section, before closing `</div>` of `lg:col-span-2`):

```astro
        {/* Submissions */}
        {submissions.length > 0 && (
          <section>
            <h2 class="text-xl font-heading font-bold text-white mb-4">{t(lang, 'project.submissions')}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submissions.map(project => (
                <ProjectCard project={project} lang={lang} />
              ))}
            </div>
          </section>
        )}
```

Note: This requires `js-yaml` as a dependency:

```bash
cd site && pnpm add js-yaml && pnpm add -D @types/js-yaml
```

**Step 4: Build and verify**

```bash
cd site && pnpm run build
```

**Step 5: Commit**

```bash
git add site/src/components/ProjectCard.astro site/src/pages/hackathons/\[...slug\].astro site/src/i18n/zh.yml site/src/i18n/en.yml site/package.json site/pnpm-lock.yaml
git commit -m "feat(site): add ProjectCard and submissions showcase

Loads project.yml files at build time and displays submitted projects
on the hackathon detail page with team, tech stack, and links."
```

---

### Task 14: Guide Pages

**Files:**
- Create: `site/src/pages/guides/hacker.astro`
- Create: `site/src/pages/guides/organizer.astro`
- Create: `site/src/pages/guides/judge.astro`
- Modify: `site/src/i18n/zh.yml` (add guide keys)
- Modify: `site/src/i18n/en.yml` (add guide keys)

**Context:** Three self-document guide pages with step-by-step instructions for each role. Use the Neon Forge design system's step layout.

**Step 1: Add i18n keys**

Add to `zh.yml` after `project:`:

```yaml
guide:
  hacker_title: "参赛者指南"
  hacker_subtitle: "从注册到提交，完整参赛流程"
  organizer_title: "组织者指南"
  organizer_subtitle: "如何创建和管理 Hackathon 活动"
  judge_title: "评委指南"
  judge_subtitle: "评审流程与评分卡使用说明"
  step: "步骤"
  back_to_guides: "返回指南"
```

Same for `en.yml`:

```yaml
guide:
  hacker_title: "Hacker Guide"
  hacker_subtitle: "From registration to submission — the complete flow"
  organizer_title: "Organizer Guide"
  organizer_subtitle: "How to create and manage a Hackathon"
  judge_title: "Judge Guide"
  judge_subtitle: "Judging process and how to use the Score Card"
  step: "Step"
  back_to_guides: "Back to Guides"
```

**Step 2: Create hacker guide**

Create `site/src/pages/guides/hacker.astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { t } from '../../lib/i18n';
import type { Lang } from '../../lib/i18n';

const lang: Lang = 'zh';

const steps = [
  {
    title: lang === 'zh' ? '注册 Profile' : 'Register Profile',
    content: lang === 'zh'
      ? '在 GitHub 上 Fork 本仓库，在 `profiles/` 目录下创建你的 Profile YAML 文件（`your-github-username-xxxx.yml`），然后提交 PR。PR 合并后你的 Profile 即生效。'
      : 'Fork the repository, create your Profile YAML file under `profiles/` directory (`your-github-username-xxxx.yml`), and submit a PR. Your profile goes live when merged.',
    icon: '1',
  },
  {
    title: lang === 'zh' ? '浏览活动' : 'Browse Events',
    content: lang === 'zh'
      ? '在首页浏览所有活动，使用筛选功能找到感兴趣的 Hackathon。点击进入活动详情页查看赛道、时间线、数据集等信息。'
      : 'Browse all events on the homepage. Use filters to find interesting hackathons. Click through to see tracks, timeline, datasets, and more.',
    icon: '2',
  },
  {
    title: lang === 'zh' ? '报名参赛' : 'Register for Event',
    content: lang === 'zh'
      ? '在活动详情页点击「报名」按钮，系统会预填 Issue 内容并跳转到 GitHub。确认信息后提交 Issue 即完成报名。如果活动需要 NDA，会额外引导签署流程。'
      : 'Click "Register" on the event page. The system pre-fills an Issue and redirects to GitHub. Submit the Issue to complete registration. NDA events will guide you through the signing process.',
    icon: '3',
  },
  {
    title: lang === 'zh' ? '组队（可选）' : 'Form a Team (Optional)',
    content: lang === 'zh'
      ? '通过组队 Issue 模板寻找队友，或在活动社区中发布组队请求。团队信息在项目提交时填写。'
      : 'Use the team formation Issue template to find teammates, or post in the event community. Team info is filled in during project submission.',
    icon: '4',
  },
  {
    title: lang === 'zh' ? '提交项目' : 'Submit Project',
    content: lang === 'zh'
      ? '在提交阶段，通过 PR 将 `project.yml` 和相关文件提交到活动的 `submissions/` 目录。PDF 等大文件会自动上传到云存储。'
      : 'During submission phase, create a PR adding `project.yml` and related files to the event\'s `submissions/` directory. Large files like PDFs are automatically uploaded to cloud storage.',
    icon: '5',
  },
];
---

<BaseLayout title={t(lang, 'guide.hacker_title')}>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="mb-12">
      <h1 class="text-3xl md:text-4xl font-heading font-bold text-white mb-3">
        {t(lang, 'guide.hacker_title')}
      </h1>
      <p class="text-lg text-muted">{t(lang, 'guide.hacker_subtitle')}</p>
    </div>

    <div class="space-y-8">
      {steps.map((step) => (
        <div class="flex gap-6">
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-lime-primary/20 text-lime-primary flex items-center justify-center font-code font-medium text-sm">
            {step.icon}
          </div>
          <div class="flex-1 pt-1">
            <h3 class="text-white font-heading font-bold text-lg mb-2">{step.title}</h3>
            <p class="text-light-gray text-sm leading-relaxed">{step.content}</p>
          </div>
        </div>
      ))}
    </div>

    <div class="mt-12 pt-8 border-t border-secondary-bg">
      <a href="/" class="text-lime-primary hover:underline text-sm">← {t(lang, 'common.back_home')}</a>
    </div>
  </div>
</BaseLayout>
```

**Step 3: Create organizer guide**

Create `site/src/pages/guides/organizer.astro` with similar structure but organizer-specific steps:
- Step 1: Use GitHub Template Repo to create hackathon
- Step 2: Configure hackathon.yml (tracks, timeline, rewards, eligibility)
- Step 3: Submit PR to register hackathon
- Step 4: Manage registrations and submissions
- Step 5: Configure judges and review scores

**Step 4: Create judge guide**

Create `site/src/pages/guides/judge.astro` with judge-specific steps:
- Step 1: Set up judge profile (judge_profile in profile.yml)
- Step 2: Review assigned submissions
- Step 3: Use Score Card to evaluate
- Step 4: Submit scores via GitHub Issue
- Step 5: Declare conflicts of interest

**Step 5: Build and verify**

```bash
cd site && pnpm run build
```

Expected: Build shows the 3 new guide pages (total ~8 pages now).

**Step 6: Commit**

```bash
git add site/src/pages/guides/ site/src/i18n/zh.yml site/src/i18n/en.yml
git commit -m "feat(site): add hacker, organizer, and judge guide pages

Self-document guides with step-by-step instructions for each role.
Neon Forge design system step layout with numbered icons."
```

---

### Task 15: Client-Side Search + Filter

**Files:**
- Modify: `site/src/pages/index.astro` (add search bar + filter logic + search index generation)

**Context:** Add a search input and type/status filter tabs to the homepage. The filtering happens client-side using data embedded in the page at build time.

**Step 1: Update index.astro**

Replace `site/src/pages/index.astro` with:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import HackathonCard from '../components/HackathonCard.astro';
import { getCollection } from 'astro:content';
import { t, getCurrentStage } from '../lib/i18n';
import type { Lang } from '../lib/i18n';

const lang: Lang = 'zh';

const allHackathons = await getCollection('hackathons');

const hackathons = allHackathons
  .map(entry => {
    const h = entry.data.hackathon;
    const stage = h.timeline ? getCurrentStage(h.timeline) : 'draft';
    return { ...entry, stage };
  })
  .sort((a, b) => {
    const aStart = a.data.hackathon.timeline?.registration?.start || '';
    const bStart = b.data.hackathon.timeline?.registration?.start || '';
    return bStart.localeCompare(aStart);
  });

// Build search index for client-side filtering
const searchIndex = hackathons.map(h => ({
  slug: h.data.hackathon.slug,
  name: h.data.hackathon.name || '',
  name_zh: h.data.hackathon.name_zh || '',
  type: h.data.hackathon.type,
  tagline: h.data.hackathon.tagline || '',
  tagline_zh: h.data.hackathon.tagline_zh || '',
  stage: h.stage,
}));
---

<BaseLayout title={t(lang, 'home.title')}>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <!-- Hero -->
    <div class="mb-8">
      <h1 class="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
        {t(lang, 'home.title')}
      </h1>
      <p class="text-lg text-muted max-w-2xl">
        {t(lang, 'home.subtitle')}
      </p>
    </div>

    <!-- Search + Filters -->
    <div class="mb-8 space-y-4">
      <!-- Search input -->
      <div class="relative max-w-md">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          id="search-input"
          placeholder={lang === 'zh' ? '搜索活动...' : 'Search events...'}
          class="w-full pl-10 pr-4 py-2 bg-dark-bg border border-secondary-bg rounded-lg text-white text-sm focus:border-lime-primary focus:outline-none"
        />
      </div>

      <!-- Filter tabs -->
      <div class="flex flex-wrap gap-2">
        <button class="filter-btn active px-3 py-1 rounded-full text-xs transition-colors" data-filter="all">
          {t(lang, 'home.filter_all')}
        </button>
        <button class="filter-btn px-3 py-1 rounded-full text-xs transition-colors" data-filter="active">
          {t(lang, 'home.filter_active')}
        </button>
        <button class="filter-btn px-3 py-1 rounded-full text-xs transition-colors" data-filter="upcoming">
          {t(lang, 'home.filter_upcoming')}
        </button>
        <button class="filter-btn px-3 py-1 rounded-full text-xs transition-colors" data-filter="ended">
          {t(lang, 'home.filter_ended')}
        </button>
      </div>
    </div>

    <!-- Hackathon list -->
    <div id="hackathon-grid">
      {hackathons.length > 0 ? (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map(entry => (
            <div class="hackathon-item" data-slug={entry.data.hackathon.slug} data-stage={entry.stage} data-type={entry.data.hackathon.type}>
              <HackathonCard hackathon={entry.data.hackathon} lang={lang} />
            </div>
          ))}
        </div>
      ) : (
        <div class="text-center py-24">
          <p class="text-muted text-lg mb-4">{t(lang, 'home.empty')}</p>
          <a href="/guides/organizer" class="text-lime-primary hover:underline">
            {t(lang, 'home.empty_cta')}
          </a>
        </div>
      )}
    </div>

    <!-- No results message (hidden by default) -->
    <div id="no-results" class="hidden text-center py-24">
      <p class="text-muted text-lg">{lang === 'zh' ? '没有匹配的活动' : 'No matching events'}</p>
    </div>
  </div>
</BaseLayout>

<style>
  .filter-btn {
    background-color: var(--color-secondary-bg);
    color: var(--color-muted);
  }
  .filter-btn:hover, .filter-btn.active {
    background-color: color-mix(in srgb, var(--color-lime-primary) 20%, transparent);
    color: var(--color-lime-primary);
  }
</style>

<script define:vars={{ searchIndex }}>
  const input = document.getElementById('search-input');
  const items = document.querySelectorAll('.hackathon-item');
  const noResults = document.getElementById('no-results');
  const grid = document.querySelector('#hackathon-grid > div');
  const filterBtns = document.querySelectorAll('.filter-btn');

  let currentFilter = 'all';
  let currentSearch = '';

  const activeStages = ['registration', 'development', 'submission', 'judging', 'announcement'];

  function applyFilters() {
    let visible = 0;
    items.forEach((item) => {
      const slug = item.getAttribute('data-slug');
      const stage = item.getAttribute('data-stage');
      const idx = searchIndex.findIndex((s) => s.slug === slug);
      const entry = idx >= 0 ? searchIndex[idx] : null;

      let show = true;

      // Stage filter
      if (currentFilter === 'active') {
        show = activeStages.includes(stage || '');
      } else if (currentFilter === 'upcoming') {
        show = stage === 'draft';
      } else if (currentFilter === 'ended') {
        show = stage === 'ended' || stage === 'award';
      }

      // Search filter
      if (show && currentSearch && entry) {
        const q = currentSearch.toLowerCase();
        show = entry.name.toLowerCase().includes(q)
          || entry.name_zh.toLowerCase().includes(q)
          || entry.tagline.toLowerCase().includes(q)
          || entry.tagline_zh.toLowerCase().includes(q)
          || entry.type.toLowerCase().includes(q);
      }

      (item).style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (noResults) noResults.classList.toggle('hidden', visible > 0);
    if (grid) grid.classList.toggle('hidden', visible === 0);
  }

  // Search input
  input?.addEventListener('input', (e) => {
    currentSearch = (e.target).value;
    applyFilters();
  });

  // Filter buttons
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter') || 'all';
      applyFilters();
    });
  });
</script>
```

**Step 2: Build and verify**

```bash
cd site && pnpm run build
```

**Step 3: Commit**

```bash
git add site/src/pages/index.astro
git commit -m "feat(site): add client-side search and status/type filtering

Homepage now has search input and filter tabs (All/Active/Upcoming/Ended).
Filtering happens client-side using build-time search index data."
```

---

## Batch 4: Admin + Finish

### Task 16: CLI Scripts

**Files:**
- Create: `scripts/create-hackathon.sh`
- Create: `scripts/create-profile.sh`
- Create: `scripts/submit-project.sh`

**Context:** Shell scripts that generate valid Schema V2 YAML files. Called by the synnovator-admin Skill or used directly by admins.

**Step 1: Create create-hackathon.sh**

Create `scripts/create-hackathon.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/create-hackathon.sh <slug> <type> <name>
# Example: ./scripts/create-hackathon.sh my-hackathon-2026 community "My Hackathon 2026"

SLUG="${1:?Usage: create-hackathon.sh <slug> <type> <name>}"
TYPE="${2:?Type required: community|enterprise|youth-league|open-source}"
NAME="${3:?Name required}"

# Validate type
case "$TYPE" in
  community|enterprise|youth-league|open-source) ;;
  *) echo "ERROR: Invalid type '$TYPE'. Must be: community|enterprise|youth-league|open-source" >&2; exit 1 ;;
esac

DIR="hackathons/${SLUG}"
FILE="${DIR}/hackathon.yml"

if [ -d "$DIR" ]; then
  echo "ERROR: Directory $DIR already exists" >&2
  exit 1
fi

mkdir -p "${DIR}/assets" "${DIR}/submissions"

cat > "$FILE" << YAML
synnovator_version: "2.0"

hackathon:
  name: "${NAME}"
  name_zh: ""
  slug: "${SLUG}"
  tagline: ""
  tagline_zh: ""
  type: "${TYPE}"
  description: ""
  description_zh: ""

  organizers:
    - name: ""
      role: "organizer"

  eligibility:
    open_to: "all"
    team_size:
      min: 1
      max: 5
    allow_solo: true

  timeline:
    registration:
      start: "$(date -u +%Y-%m-%dT00:00:00Z)"
      end: "$(date -u -v+30d +%Y-%m-%dT23:59:59Z 2>/dev/null || date -u -d '+30 days' +%Y-%m-%dT23:59:59Z)"

  tracks:
    - name: "Default Track"
      slug: "default"

  settings:
    language: ["zh", "en"]
YAML

echo "Created hackathon: $FILE"
echo "Next: edit $FILE to fill in details, then commit and create PR"
```

**Step 2: Create create-profile.sh**

Create `scripts/create-profile.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/create-profile.sh <github-username>
# Example: ./scripts/create-profile.sh alice-dev

USERNAME="${1:?Usage: create-profile.sh <github-username>}"

# Generate short UUID suffix
UUID=$(head -c 4 /dev/urandom | xxd -p)
FILE="profiles/${USERNAME}-${UUID}.yml"

if ls profiles/${USERNAME}-*.yml 1>/dev/null 2>&1; then
  echo "ERROR: Profile already exists for ${USERNAME}" >&2
  ls profiles/${USERNAME}-*.yml
  exit 1
fi

cat > "$FILE" << YAML
synnovator_profile: "2.0"

hacker:
  github: "${USERNAME}"
  name: ""
  avatar: "https://github.com/${USERNAME}.png"
  bio: ""
  location: ""
  languages: ["zh", "en"]

  skills:
    - category: ""
      items: []

  interests: []

  looking_for:
    roles: []
    team_size: "3-5"
    collaboration_style: "async-friendly"
YAML

echo "Created profile: $FILE"
echo "Next: edit $FILE to fill in details, then commit and create PR"
```

**Step 3: Create submit-project.sh**

Create `scripts/submit-project.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/submit-project.sh <hackathon-slug> <team-name> <track-slug>
# Example: ./scripts/submit-project.sh ai-challenge-2026 team-alpha ai-agent

SLUG="${1:?Usage: submit-project.sh <hackathon-slug> <team-name> <track-slug>}"
TEAM="${2:?Team name required}"
TRACK="${3:?Track slug required}"

HACKATHON_DIR="hackathons/${SLUG}"
if [ ! -f "${HACKATHON_DIR}/hackathon.yml" ]; then
  echo "ERROR: Hackathon not found: ${SLUG}" >&2
  exit 1
fi

DIR="${HACKATHON_DIR}/submissions/${TEAM}"
FILE="${DIR}/project.yml"

if [ -d "$DIR" ]; then
  echo "ERROR: Submission directory already exists: $DIR" >&2
  exit 1
fi

mkdir -p "$DIR"

cat > "$FILE" << YAML
synnovator_submission: "2.0"

project:
  name: ""
  name_zh: ""
  tagline: ""
  track: "${TRACK}"

  team:
    - github: ""
      role: "Lead Developer"

  deliverables:
    repo: ""
    video: ""
    demo: ""

  tech_stack: []

  references: []

  description: |
    Project description...
YAML

echo "Created submission: $FILE"
echo "Next: edit $FILE and add deliverables, then commit and create PR"
```

**Step 4: Make scripts executable**

```bash
chmod +x scripts/create-hackathon.sh scripts/create-profile.sh scripts/submit-project.sh
```

**Step 5: Test script syntax**

```bash
bash -n scripts/create-hackathon.sh
bash -n scripts/create-profile.sh
bash -n scripts/submit-project.sh
```

Expected: No output (syntax OK).

**Step 6: Commit**

```bash
git add scripts/
git commit -m "feat: add CLI scripts for hackathon, profile, and submission creation

Shell scripts generate valid Schema V2 YAML skeletons.
Used by synnovator-admin Skill and directly by admins."
```

---

### Task 17: synnovator-admin Skill

**Files:**
- Create: `.claude/skills/synnovator-admin/SKILL.md`

**Context:** Claude Code Skill that provides admin commands for managing the platform. Each command guides the admin through an interactive flow, calls scripts, edits YAML, and creates commits/PRs.

**Step 1: Create the Skill**

Create `.claude/skills/synnovator-admin/SKILL.md`:

```markdown
---
name: synnovator-admin
description: Synnovator platform admin commands — create hackathons, manage timelines, export scores, audit changes. Use when user needs to manage hackathon data, profiles, or platform configuration.
---

# Synnovator Admin

Platform administration commands for the Synnovator Git-native Hackathon platform.

## Available Commands

### /synnovator-admin create-hackathon

Create a new hackathon event.

**Flow:**
1. Ask for: slug, type (community/enterprise/youth-league/open-source), name
2. Run: `bash scripts/create-hackathon.sh <slug> <type> "<name>"`
3. Open the generated `hackathons/<slug>/hackathon.yml` for editing
4. Guide admin through filling required fields (timeline, tracks, eligibility)
5. Commit and offer to create PR

### /synnovator-admin create-profile

Create a new hacker profile.

**Flow:**
1. Ask for: GitHub username
2. Run: `bash scripts/create-profile.sh <username>`
3. Open generated profile for editing
4. Commit and offer to create PR

### /synnovator-admin submit-project

Create a project submission skeleton.

**Flow:**
1. Ask for: hackathon slug, team name, track slug
2. Run: `bash scripts/submit-project.sh <slug> <team> <track>`
3. Open generated project.yml for editing
4. Commit and offer to create PR

### /synnovator-admin update-timeline

Update a hackathon's timeline dates.

**Flow:**
1. Ask for: hackathon slug
2. Read current timeline from `hackathons/<slug>/hackathon.yml`
3. Show current dates, ask which stage to update
4. Edit the YAML with new dates
5. Commit and offer to create PR

### /synnovator-admin export-scores

Export scores for a hackathon to CSV.

**Flow:**
1. Ask for: hackathon slug
2. Use `gh issue list` to find Issues with label `judge-score,hackathon:<slug>`
3. Parse YAML scores from each Issue body
4. Generate CSV output (judge, team, track, criterion, score, comment)
5. Save to file or display

### /synnovator-admin audit

View change history for a hackathon.

**Flow:**
1. Ask for: hackathon slug, optional date range
2. Run: `git log --oneline hackathons/<slug>/`
3. Display formatted results

## Important Rules

- Always validate inputs before running scripts
- Always show generated files for review before committing
- Never commit directly to main — always create a branch and PR
- Use `pnpm` (never npm/npx)
- Follow commit convention: `type(scope): description`
```

**Step 2: Commit**

```bash
git add .claude/skills/synnovator-admin/
git commit -m "feat: add synnovator-admin Claude Code Skill

Admin commands: create-hackathon, create-profile, submit-project,
update-timeline, export-scores, audit. Calls scripts/ for YAML generation."
```

---

### Task 18: Template Repo Content

**Files:**
- Create: `docs/templates/community/hackathon.yml`
- Create: `docs/templates/enterprise/hackathon.yml`
- Create: `docs/templates/youth-league/hackathon.yml`

**Context:** Template YAML files for the 3 hackathon types. These will be used as starting points when creating GitHub Template Repos (manual step by org admin).

**Step 1: Create community template**

Create `docs/templates/community/hackathon.yml`:

```yaml
# Synnovator Community Hackathon Template
# Usage: Copy this file to hackathons/<your-slug>/hackathon.yml and customize
synnovator_version: "2.0"

hackathon:
  name: "Community Hackathon 2026"
  name_zh: "2026 社区 Hackathon"
  slug: "community-hackathon-2026"  # Change this!
  tagline: "Build something amazing with AI"
  tagline_zh: "用 AI 构建令人惊叹的应用"
  type: "community"

  organizers:
    - name: "Your Organization"
      name_zh: "你的组织名称"
      role: "organizer"

  eligibility:
    open_to: "all"
    team_size:
      min: 1
      max: 5
    allow_solo: true

  legal:
    license: "Apache-2.0"
    ip_ownership: "participant"

  timeline:
    registration:
      start: "2026-04-01T00:00:00Z"
      end: "2026-04-15T23:59:59Z"
    development:
      start: "2026-04-16T00:00:00Z"
      end: "2026-05-15T23:59:59Z"
    submission:
      start: "2026-05-16T00:00:00Z"
      end: "2026-05-20T23:59:59Z"
    judging:
      start: "2026-05-21T00:00:00Z"
      end: "2026-05-28T23:59:59Z"
    announcement:
      start: "2026-05-29T00:00:00Z"
      end: "2026-06-01T23:59:59Z"

  tracks:
    - name: "Open Innovation"
      slug: "open-innovation"
      rewards:
        - type: "prize"
          rank: "1st"
          amount: "$1,000"
        - type: "prize"
          rank: "2nd"
          amount: "$500"
      judging:
        mode: "weighted"
        criteria:
          - name: "Innovation"
            weight: 0.3
            score_range: [0, 100]
          - name: "Technical Depth"
            weight: 0.3
            score_range: [0, 100]
          - name: "Usability"
            weight: 0.2
            score_range: [0, 100]
          - name: "Presentation"
            weight: 0.2
            score_range: [0, 100]

  settings:
    language: ["zh", "en"]
    public_vote: "reactions"
    vote_emoji: "👍"
```

**Step 2: Create enterprise template**

Create `docs/templates/enterprise/hackathon.yml` with enterprise defaults:
- `type: "enterprise"`, `ip_ownership: "organizer"`, `nda.required: true`
- Specialized scoring criteria with hard constraints
- Structured deliverables requirements

**Step 3: Create youth-league template**

Create `docs/templates/youth-league/hackathon.yml` with youth-league defaults:
- `type: "youth-league"`, `identity.type: "student"` in eligibility
- `mentor_rules` configured
- Academic-oriented scoring criteria

**Step 4: Commit**

```bash
git add docs/templates/
git commit -m "docs: add hackathon template YAML for 3 event types

Community, enterprise, and youth-league templates with type-specific
defaults. Used as starting points for GitHub Template Repos."
```

---

### Task 19: Final Build Verification + Cleanup

**Files:**
- Possibly modify any files with build/type errors

**Context:** Final end-to-end build verification ensuring everything compiles and all pages render correctly.

**Step 1: Full build**

```bash
cd site && pnpm run build
```

Expected: All pages build successfully. Output should show ~8+ pages (index, hackathon detail, profile, 404, 3 guides) plus API routes.

**Step 2: Type check**

```bash
cd site && pnpm exec astro check
```

Expected: 0 errors, 0 warnings.

**Step 3: Verify file structure**

```bash
ls -la .github/workflows/
ls -la .github/ISSUE_TEMPLATE/
ls -la .github/CODEOWNERS
ls -la scripts/
ls -la .claude/skills/synnovator-admin/
ls -la docs/templates/
```

Expected: All files present:
- Workflows: validate-hackathon, validate-profile, validate-submission, validate-score, upload-assets, status-update
- Issue Templates: register, judge-score, appeal, team-formation, nda-sign
- CODEOWNERS: present
- Scripts: create-hackathon.sh, create-profile.sh, submit-project.sh (executable)
- Skill: synnovator-admin/SKILL.md
- Templates: community/, enterprise/, youth-league/

**Step 4: Fix any issues found**

If build or type check fails, fix the issues.

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore(site): final P0 build verification and cleanup

All pages build successfully, type check passes, all P0 deliverables
verified present in the repository."
```

---

## Summary

| Batch | Tasks | Key Deliverables |
|-------|-------|------------------|
| **1: Infrastructure** | Tasks 1-5 | CF Hybrid, OAuth, R2 presign, deploy cleanup |
| **2: Automation** | Tasks 6-9 | validate-score, upload-assets, status-update Actions, NDA template, CODEOWNERS |
| **3: Frontend** | Tasks 10-15 | OAuthButton, ScoreCard, DatasetDownload, ProjectShowcase, Guides, Search |
| **4: Admin** | Tasks 16-19 | CLI scripts, synnovator-admin Skill, templates, final verification |

**Total: 19 tasks across 4 batches.**

Each batch's build must succeed before proceeding to the next batch.
