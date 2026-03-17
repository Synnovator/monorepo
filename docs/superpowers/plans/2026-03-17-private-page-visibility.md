# Private Page Visibility Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "unlisted" visibility model so hackathons and submissions start as private (excluded from public listings) and can be published by admins via the admin panel.

**Architecture:** A `visibility` field (`'public' | 'private'`) is added to hackathon and submission YAML schemas. The build script produces public-only subsets in `static-data.json`. Listing pages use the public subset; detail pages show all content with an "under review" banner for private items. The admin panel gets a publish/unpublish button that creates a PR via GitHub App.

**Tech Stack:** Zod schemas, Next.js App Router, Cloudflare Workers (SSG), GitHub App API (Octokit), js-yaml, i18n JSON

**Spec:** `docs/superpowers/specs/2026-03-17-private-page-visibility-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `packages/shared/src/schemas/hackathon.ts:99` | Add `visibility` to inner hackathon object |
| Modify | `packages/shared/src/schemas/submission.ts:23` | Add `visibility` to inner project object |
| Modify | `packages/shared/src/data/provider.ts:20` | Add `listPublicHackathons()`, `listPublicSubmissions()` to interface |
| Modify | `packages/shared/src/data/fs-provider.ts:57` | Implement public listing methods |
| Modify | `apps/web/scripts/generate-static-data.mjs:438` | Produce `hackathonsPublic`, `submissionsPublic` subsets |
| Modify | `apps/web/app/_generated/data.ts:19` | Add public subset casts + accessor functions |
| Modify | `apps/web/lib/static-provider.ts:19` | Implement public listing methods |
| Modify | `packages/shared/src/i18n/zh.json` | Add i18n keys for banner + admin |
| Modify | `packages/shared/src/i18n/en.json` | Add i18n keys for banner + admin |
| Modify | `apps/web/app/(public)/page.tsx:1` | Swap to `listPublicHackathons()` |
| Modify | `apps/web/app/(public)/hackathons/[slug]/page.tsx:2,70` | Filter submissions to public; add banner |
| Modify | `apps/web/app/(public)/projects/[hackathon]/[team]/page.tsx:26` | Add banner |
| Create | `apps/web/components/UnlistedBanner.tsx` | Reusable banner component |
| Modify | `apps/web/app/(admin)/admin/hackathons/page.tsx` | Add visibility section |
| Modify | `apps/web/app/(admin)/admin/submissions/page.tsx` | Add visibility section |
| Create | `apps/web/components/admin/VisibilitySection.tsx` | Client component for publish/unpublish toggles |
| Create | `apps/web/app/api/admin/visibility/route.ts` | API route: create PR to change visibility |
| Modify | `scripts/create-hackathon.sh:58` | Add `visibility: private` to generated YAML |
| Modify | `scripts/submit-project.sh:65` | Add `visibility: private` to generated YAML |
| Modify | `scripts/validate-hackathon.sh:44` | Add visibility field validation rule |

---

## Chunk 1: Schema + Data Layer

### Task 1: Add `visibility` field to Zod schemas

**Files:**
- Modify: `packages/shared/src/schemas/hackathon.ts:99-176`
- Modify: `packages/shared/src/schemas/submission.ts:20-37`
- Test: `packages/shared/src/schemas/__tests__/visibility.test.ts` (create)

- [ ] **Step 1: Write failing tests for visibility field**

Create `packages/shared/src/schemas/__tests__/visibility.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { HackathonSchema } from '../hackathon';
import { SubmissionSchema } from '../submission';

describe('HackathonSchema visibility', () => {
  it('accepts visibility: public', () => {
    const data = makeMinimalHackathon({ visibility: 'public' });
    const result = HackathonSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.hackathon.visibility).toBe('public');
  });

  it('accepts visibility: private', () => {
    const data = makeMinimalHackathon({ visibility: 'private' });
    const result = HackathonSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.hackathon.visibility).toBe('private');
  });

  it('defaults to public when visibility is omitted', () => {
    const data = makeMinimalHackathon({});
    const result = HackathonSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.hackathon.visibility).toBe('public');
  });

  it('rejects invalid visibility value', () => {
    const data = makeMinimalHackathon({ visibility: 'draft' });
    const result = HackathonSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('SubmissionSchema visibility', () => {
  it('accepts visibility: private', () => {
    const data = makeMinimalSubmission({ visibility: 'private' });
    const result = SubmissionSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.project.visibility).toBe('private');
  });

  it('defaults to public when visibility is omitted', () => {
    const data = makeMinimalSubmission({});
    const result = SubmissionSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.project.visibility).toBe('public');
  });
});

// --- Helpers ---

function makeMinimalHackathon(overrides: Record<string, unknown>) {
  return {
    synnovator_version: '2.0',
    hackathon: {
      name: 'Test',
      slug: 'test',
      type: 'community',
      ...overrides,
    },
  };
}

function makeMinimalSubmission(overrides: Record<string, unknown>) {
  return {
    synnovator_submission: '2.0',
    project: {
      name: 'Test Project',
      track: 'default',
      team_ref: 'team-test',
      ...overrides,
    },
  };
}
```

- [ ] **Step 2: Run tests — expect failures**

```bash
pnpm --filter @synnovator/shared test -- --run src/schemas/__tests__/visibility.test.ts
```

Expected: FAIL — `visibility` field not recognized / not in schema output.

- [ ] **Step 3: Add `visibility` to HackathonSchema**

In `packages/shared/src/schemas/hackathon.ts`, inside the `hackathon: z.object({...})` at line 99, add after `type` (line 105):

```typescript
    visibility: z.enum(['public', 'private']).default('public'),
```

- [ ] **Step 4: Add `visibility` to SubmissionSchema**

In `packages/shared/src/schemas/submission.ts`, inside the `project: z.object({...})` at line 23, add after `likes` (line 35):

```typescript
    visibility: z.enum(['public', 'private']).default('public'),
```

- [ ] **Step 5: Run tests — expect pass**

```bash
pnpm --filter @synnovator/shared test -- --run src/schemas/__tests__/visibility.test.ts
```

Expected: All 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/schemas/hackathon.ts packages/shared/src/schemas/submission.ts packages/shared/src/schemas/__tests__/visibility.test.ts
git commit -m "feat(shared): add visibility field to hackathon and submission schemas"
```

---

### Task 2: Add public listing methods to DataProvider interface

**Files:**
- Modify: `packages/shared/src/data/provider.ts:20-36`

- [ ] **Step 1: Add methods to DataProvider interface**

In `packages/shared/src/data/provider.ts`, add two methods after `listSubmissions()` (line 27):

```typescript
  listPublicHackathons(): Hackathon[];
  listPublicSubmissions(): SubmissionWithMeta[];
```

- [ ] **Step 2: Implement in FsDataProvider**

In `packages/shared/src/data/fs-provider.ts`, add after `listSubmissions()` (line 79):

```typescript
  listPublicHackathons(): Hackathon[] {
    return this.hackathons.filter(h => h.hackathon.visibility !== 'private');
  }

  listPublicSubmissions(): SubmissionWithMeta[] {
    const privateHackathonSlugs = new Set(
      this.hackathons
        .filter(h => h.hackathon.visibility === 'private')
        .map(h => h.hackathon.slug),
    );
    return this.submissions.filter(
      s => s.project.visibility !== 'private' && !privateHackathonSlugs.has(s._hackathonSlug),
    );
  }
```

Note: `s.project.visibility` accesses the Zod-parsed type which now includes `visibility`. The `SubmissionWithMeta` type extends `Submission` with `_hackathonSlug` and `_teamSlug`.

- [ ] **Step 3: Verify build**

```bash
pnpm --filter @synnovator/shared test -- --run
```

Expected: All existing tests still pass. TypeScript compilation succeeds.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/data/provider.ts packages/shared/src/data/fs-provider.ts
git commit -m "feat(shared): add listPublicHackathons/listPublicSubmissions to DataProvider"
```

---

### Task 3: Update build pipeline — `generate-static-data.mjs`

**Files:**
- Modify: `apps/web/scripts/generate-static-data.mjs:424-455`

- [ ] **Step 1: Add public subset filtering in `main()`**

In `apps/web/scripts/generate-static-data.mjs`, after line 436 (`collectEditorMdx(DATA_ROOT)`), and before the `data` object construction at line 438, add:

```javascript
  // Filter public-only subsets for listing pages
  const hackathonsPublic = hackathons.filter(h => h.hackathon?.visibility !== 'private');
  const privateHackathonSlugs = new Set(
    hackathons.filter(h => h.hackathon?.visibility === 'private').map(h => h.hackathon?.slug),
  );
  const submissionsPublic = submissions.filter(
    s => s.project?.visibility !== 'private' && !privateHackathonSlugs.has(s._hackathonSlug),
  );
```

- [ ] **Step 2: Add public subsets to output JSON**

Change line 438 from:

```javascript
  const data = { hackathons, profiles, submissions, teams, results, themes: themeData };
```

To:

```javascript
  const data = { hackathons, hackathonsPublic, profiles, submissions, submissionsPublic, teams, results, themes: themeData };
```

- [ ] **Step 3: Add public counts to console output**

After line 449 (`console.log(\`  submissions: ...\`)`), add:

```javascript
  console.log(`  hackathonsPublic: ${hackathonsPublic.length}`);
  console.log(`  submissionsPublic: ${submissionsPublic.length}`);
```

- [ ] **Step 4: Run generate script to verify**

```bash
node apps/web/scripts/generate-static-data.mjs
```

Expected: Script completes. `static-data.json` now has `hackathonsPublic` and `submissionsPublic` keys. Since no existing YAML files have `visibility: private`, the public counts should equal the total counts.

- [ ] **Step 5: Commit**

```bash
git add apps/web/scripts/generate-static-data.mjs
git commit -m "feat(web): generate public-only hackathon and submission subsets in static data"
```

---

### Task 4: Add public accessors to `data.ts` and `StaticDataProvider`

**Files:**
- Modify: `apps/web/app/_generated/data.ts:19-65`
- Modify: `apps/web/lib/static-provider.ts:1-52`

- [ ] **Step 1: Add public subset casts in `data.ts`**

In `apps/web/app/_generated/data.ts`, after line 23 (`const teams = ...`), add:

```typescript
const hackathonsPublic = (staticData as any).hackathonsPublic as unknown as Hackathon[];
const submissionsPublic = (staticData as any).submissionsPublic as unknown as SubmissionWithMeta[];
```

- [ ] **Step 2: Add public accessor functions in `data.ts`**

After `listSubmissions()` (line 65), add:

```typescript
export function listPublicHackathons(): Hackathon[] {
  return hackathonsPublic;
}

export function listPublicSubmissions(): SubmissionWithMeta[] {
  return submissionsPublic;
}
```

- [ ] **Step 3: Update `StaticDataProvider`**

In `apps/web/lib/static-provider.ts`, add imports for new accessors (line 8):

```typescript
import {
  listHackathons,
  getHackathon,
  listProfiles,
  getProfile,
  listSubmissions,
  getResults,
  listPublicHackathons,
  listPublicSubmissions,
} from '@/app/_generated/data';
```

Add methods to the class after `listSubmissions()` (line 48):

```typescript
  listPublicHackathons() {
    return listPublicHackathons();
  }

  listPublicSubmissions() {
    return listPublicSubmissions();
  }
```

- [ ] **Step 4: Verify build**

```bash
pnpm --filter @synnovator/web build
```

Expected: Build succeeds. No type errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/_generated/data.ts apps/web/lib/static-provider.ts
git commit -m "feat(web): add listPublicHackathons/listPublicSubmissions accessors"
```

---

## Chunk 2: i18n + UI Components

### Task 5: Add i18n keys

**Files:**
- Modify: `packages/shared/src/i18n/zh.json`
- Modify: `packages/shared/src/i18n/en.json`

- [ ] **Step 1: Add keys to zh.json**

In the `"common"` section (after `"not_found_desc"`), add:

```json
    "unlisted_banner": "此内容正在审核中，尚未公开展示。"
```

In the `"admin"` section (after existing keys around line 152), add:

```json
    "visibility": "内容可见性",
    "publish": "发布",
    "unpublish": "取消发布",
    "visibility_private": "未发布",
    "visibility_public": "已发布",
    "publish_success": "发布 PR 已创建",
    "publish_error": "操作失败，请重试",
    "visibility_warning_parent_private": "注意：该活动尚未发布，提交内容在活动发布前不会出现在公开列表中"
```

- [ ] **Step 2: Add keys to en.json**

Mirror the same keys in English:

In `"common"`:
```json
    "unlisted_banner": "This content is under review and not yet publicly listed."
```

In `"admin"`:
```json
    "visibility": "Content Visibility",
    "publish": "Publish",
    "unpublish": "Unpublish",
    "visibility_private": "Private",
    "visibility_public": "Public",
    "publish_success": "Publish PR created",
    "publish_error": "Operation failed, please try again",
    "visibility_warning_parent_private": "Note: The parent hackathon is still private. This submission won't appear in public listings until the hackathon is also published."
```

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/i18n/zh.json packages/shared/src/i18n/en.json
git commit -m "feat(shared): add i18n keys for visibility banner and admin controls"
```

---

### Task 6: Create `UnlistedBanner` component

**Files:**
- Create: `apps/web/components/UnlistedBanner.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

export function UnlistedBanner({ lang }: { lang: Lang }) {
  return (
    <div className="bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 mb-6">
      <p className="text-sm text-warning-foreground">
        {t(lang, 'common.unlisted_banner')}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/UnlistedBanner.tsx
git commit -m "feat(web): add UnlistedBanner component for private content"
```

---

### Task 7: Update listing pages to use public accessors

**Files:**
- Modify: `apps/web/app/(public)/page.tsx:1,15`
- Modify: `apps/web/app/(public)/hackathons/[slug]/page.tsx:2,70-71`

- [ ] **Step 1: Update home page**

In `apps/web/app/(public)/page.tsx`:

Line 1 — change import:
```typescript
import { listPublicHackathons } from '@/app/_generated/data';
```

Line 15 — change function call:
```typescript
  const hackathons = listPublicHackathons();
```

- [ ] **Step 2: Update hackathon detail page — submissions filter**

In `apps/web/app/(public)/hackathons/[slug]/page.tsx`:

Line 2 — add `listPublicSubmissions` to imports:
```typescript
import { getHackathon, listHackathons, listPublicSubmissions, listProfiles, getTeamsByHackathon } from '@/app/_generated/data';
```

Lines 70-71 — change submissions loading to use public accessor:
```typescript
  const allSubmissions = listPublicSubmissions();
  const submissions = allSubmissions.filter(s => s._hackathonSlug === slug);
```

Note: `generateStaticParams()` (line 27) still uses `listHackathons()` (all) — this is intentional so private hackathon pages are still built.

- [ ] **Step 3: Verify dev server**

```bash
pnpm dev
```

Visit home page — should show same hackathons (none are private yet). Visit a hackathon detail — submissions tab should work.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/(public)/page.tsx apps/web/app/(public)/hackathons/[slug]/page.tsx
git commit -m "feat(web): use public-only accessors in listing pages"
```

---

### Task 8: Add unlisted banner + noindex to detail pages

**Files:**
- Modify: `apps/web/app/(public)/hackathons/[slug]/page.tsx:1-5,63-66,100`
- Modify: `apps/web/app/(public)/projects/[hackathon]/[team]/page.tsx:1-7,26-30,57`

- [ ] **Step 1: Add banner to hackathon detail page**

In `apps/web/app/(public)/hackathons/[slug]/page.tsx`:

Add import at top:
```typescript
import { UnlistedBanner } from '@/components/UnlistedBanner';
```

After line 64 (`if (!entry) notFound();`), add:
```typescript
  const isPrivate = entry.hackathon.visibility === 'private';
```

Inside the return JSX, right after the opening `<div className="max-w-7xl ...">` (line 101), add:
```tsx
      {isPrivate && <UnlistedBanner lang={lang} />}
```

- [ ] **Step 2: Add noindex metadata for private hackathons**

Add a `generateMetadata` export to the hackathon detail page (before the default export):

```typescript
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getHackathon(slug);
  if (!entry) return {};
  if (entry.hackathon.visibility === 'private') {
    return { robots: { index: false, follow: false } };
  }
  return {};
}
```

- [ ] **Step 3: Add banner to project detail page**

In `apps/web/app/(public)/projects/[hackathon]/[team]/page.tsx`:

Add import at top:
```typescript
import { UnlistedBanner } from '@/components/UnlistedBanner';
```

After line 30 (`const project = entry.project;`), add:
```typescript
  const isPrivate = project.visibility === 'private';
```

Inside the return JSX, after the breadcrumb Link (line 59), add:
```tsx
      {isPrivate && <UnlistedBanner lang={lang} />}
```

- [ ] **Step 4: Add noindex metadata for private submissions**

Add a `generateMetadata` export to the project detail page:

```typescript
export async function generateMetadata({ params }: { params: Promise<{ hackathon: string; team: string }> }) {
  const { hackathon, team } = await params;
  const entry = listSubmissions().find(s => s._hackathonSlug === hackathon && s._teamSlug === team);
  if (!entry) return {};
  if (entry.project.visibility === 'private') {
    return { robots: { index: false, follow: false } };
  }
  return {};
}
```

- [ ] **Step 5: Verify dev server**

```bash
pnpm dev
```

No banners should show (all content is currently public). To test the banner, temporarily set a hackathon's `visibility: private` in its YAML, re-run `node apps/web/scripts/generate-static-data.mjs`, and check the page.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/(public)/hackathons/[slug]/page.tsx apps/web/app/(public)/projects/[hackathon]/[team]/page.tsx
git commit -m "feat(web): show unlisted banner and noindex on private detail pages"
```

---

## Chunk 3: Admin Panel + API

### Task 9: Create visibility API route

**Files:**
- Create: `apps/web/app/api/admin/visibility/route.ts`

Reference: `apps/web/app/api/admin/theme/route.ts` for the GitHub App pattern.

- [ ] **Step 1: Create the API route**

Create `apps/web/app/api/admin/visibility/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@synnovator/shared/auth';
import { getInstallationOctokit } from '@/lib/github-app';
import yaml from 'js-yaml';

const OWNER = process.env.GITHUB_OWNER || 'Synnovator';
const REPO = process.env.GITHUB_REPO || 'monorepo';

function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate session
    const authSecret = process.env.AUTH_SECRET!;
    const session = await getSession(request, authSecret);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check repo permission (must have write access)
    try {
      const { createGitHubClient } = await import('@synnovator/shared/data');
      const client = createGitHubClient(session.access_token);
      const { data: permData } = await client.repos.getCollaboratorPermissionLevel({
        owner: OWNER, repo: REPO, username: session.login,
      });
      const level = permData.permission;
      if (level !== 'admin' && level !== 'write' && level !== 'maintain') {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Failed to verify permissions' }, { status: 403 });
    }

    // 3. Parse and validate body
    let body: { type?: string; slug?: string; visibility?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { type, slug, visibility } = body;
    if (!type || !slug || !visibility) {
      return NextResponse.json({ error: 'Missing required fields: type, slug, visibility' }, { status: 400 });
    }
    if (type !== 'hackathon' && type !== 'submission') {
      return NextResponse.json({ error: 'type must be hackathon or submission' }, { status: 400 });
    }
    if (visibility !== 'public' && visibility !== 'private') {
      return NextResponse.json({ error: 'visibility must be public or private' }, { status: 400 });
    }

    // 4. Check GitHub App env vars
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
    const missing = [
      !appId && 'GITHUB_APP_ID',
      !privateKey && 'GITHUB_APP_PRIVATE_KEY',
      !installationId && 'GITHUB_APP_INSTALLATION_ID',
    ].filter(Boolean);
    if (missing.length) {
      return NextResponse.json(
        { error: `Server configuration error: missing ${missing.join(', ')}` },
        { status: 500 },
      );
    }

    const octokit = getInstallationOctokit({
      GITHUB_APP_ID: appId!,
      GITHUB_APP_PRIVATE_KEY: privateKey!,
      GITHUB_APP_INSTALLATION_ID: installationId!,
    });

    // 5. Determine YAML file path
    let filePath: string;
    if (type === 'hackathon') {
      filePath = `hackathons/${slug}/hackathon.yml`;
    } else {
      // slug format: "hackathon-slug/team-slug"
      const [hackathonSlug, teamSlug] = slug.split('/');
      filePath = `hackathons/${hackathonSlug}/submissions/${teamSlug}/project.yml`;
    }

    // 6. Get main branch SHA
    const { data: ref } = await octokit.git.getRef({
      owner: OWNER, repo: REPO, ref: 'heads/main',
    });
    const mainSha = ref.object.sha;

    // 7. Create branch
    const timestamp = Math.floor(Date.now() / 1000);
    const action = visibility === 'public' ? 'publish' : 'unpublish';
    const branchSlug = slug.replace(/\//g, '-');
    const branchName = `data/visibility-${type}-${branchSlug}-${timestamp}`;

    try {
      await octokit.git.createRef({
        owner: OWNER, repo: REPO,
        ref: `refs/heads/${branchName}`, sha: mainSha,
      });
    } catch (err: unknown) {
      if ((err as { status?: number }).status === 422) {
        const fallback = `${branchName}-${Math.floor(Math.random() * 10000)}`;
        await octokit.git.createRef({
          owner: OWNER, repo: REPO,
          ref: `refs/heads/${fallback}`, sha: mainSha,
        });
      } else throw err;
    }

    // 8. Read current YAML
    let fileSha: string | undefined;
    let currentContent: string;
    try {
      const { data: existing } = await octokit.repos.getContent({
        owner: OWNER, repo: REPO,
        path: filePath,
        ref: branchName,
      });
      if (Array.isArray(existing)) {
        return NextResponse.json({ error: 'Path is a directory' }, { status: 400 });
      }
      fileSha = existing.sha;
      currentContent = fromBase64(existing.content);
    } catch {
      // Cleanup branch on file not found
      try {
        await octokit.git.deleteRef({ owner: OWNER, repo: REPO, ref: `heads/${branchName}` });
      } catch { /* ignore cleanup error */ }
      return NextResponse.json({ error: `File not found: ${filePath}` }, { status: 404 });
    }

    // 9. Update visibility in YAML
    const yamlData = yaml.load(currentContent) as Record<string, any>;
    const innerKey = type === 'hackathon' ? 'hackathon' : 'project';
    if (yamlData[innerKey]) {
      yamlData[innerKey].visibility = visibility;
    }
    const updatedYaml = yaml.dump(yamlData, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false,
    });

    // 10. Commit
    const commitMsg = `data(visibility): ${action} ${type} ${slug}`;
    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER, repo: REPO,
      path: filePath,
      message: commitMsg,
      content: toBase64(updatedYaml),
      sha: fileSha,
      branch: branchName,
    });

    // 11. Create PR
    const { data: pr } = await octokit.pulls.create({
      owner: OWNER, repo: REPO,
      title: commitMsg,
      body: [
        `Submitted by @${session.login}`,
        '',
        `**Action:** ${action} ${type}`,
        `**Target:** \`${slug}\``,
        `**File:** \`${filePath}\``,
        '',
        '---',
        '> Auto-created via [Synnovator Admin Panel](https://home.synnovator.space/admin)',
      ].join('\n'),
      head: branchName,
      base: 'main',
    });

    return NextResponse.json({ url: pr.html_url, number: pr.number });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update visibility';
    console.error('POST /api/admin/visibility error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/api/admin/visibility/route.ts
git commit -m "feat(web): add POST /api/admin/visibility API route"
```

---

### Task 10: Create `VisibilitySection` admin component

**Files:**
- Create: `apps/web/components/admin/VisibilitySection.tsx`

- [ ] **Step 1: Create the client component**

```tsx
'use client';

import { useState } from 'react';
import { Badge } from '@synnovator/ui';
import type { Lang } from '@synnovator/shared/i18n';

interface VisibilityItem {
  name: string;
  slug: string;
  visibility: string;
}

interface VisibilitySectionProps {
  items: VisibilityItem[];
  type: 'hackathon' | 'submission';
  lang: Lang;
  translations: {
    title: string;
    publish: string;
    unpublish: string;
    private: string;
    public: string;
    success: string;
    error: string;
    warningParentPrivate?: string;
  };
  privateHackathonSlugs?: string[];
}

export function VisibilitySection({
  items,
  type,
  lang,
  translations: tr,
  privateHackathonSlugs = [],
}: VisibilitySectionProps) {
  const privateSet = new Set(privateHackathonSlugs);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ slug: string; text: string; url?: string } | null>(null);

  async function toggleVisibility(slug: string, currentVisibility: string) {
    setLoading(slug);
    setMessage(null);

    const newVisibility = currentVisibility === 'public' ? 'private' : 'public';

    try {
      const res = await fetch('/api/admin/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, slug, visibility: newVisibility }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tr.error);
      setMessage({ slug, text: tr.success, url: data.url });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tr.error;
      setMessage({ slug, text: msg });
    } finally {
      setLoading(null);
    }
  }

  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-heading text-foreground mb-4">{tr.title}</h2>
      <div className="space-y-2">
        {items.map(item => {
          const isPrivate = item.visibility === 'private';
          const showParentWarning =
            type === 'submission' &&
            !isPrivate &&
            privateSet.has(item.slug.split('/')[0]);

          return (
            <div key={item.slug} className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-foreground font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.slug}</span>
                  <Badge variant={isPrivate ? 'warning' : 'brand'}>
                    {isPrivate ? tr.private : tr.public}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {message?.slug === item.slug && (
                    <span className="text-xs text-muted-foreground">
                      {message.url ? (
                        <a href={message.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                          {message.text}
                        </a>
                      ) : message.text}
                    </span>
                  )}
                  <button
                    onClick={() => toggleVisibility(item.slug, item.visibility)}
                    disabled={loading === item.slug}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    {loading === item.slug ? '...' : isPrivate ? tr.publish : tr.unpublish}
                  </button>
                </div>
              </div>
              {showParentWarning && tr.warningParentPrivate && (
                <p className="text-xs text-warning mt-1">{tr.warningParentPrivate}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/admin/VisibilitySection.tsx
git commit -m "feat(web): add VisibilitySection admin component"
```

---

### Task 11: Integrate visibility section into admin pages

**Files:**
- Modify: `apps/web/app/(admin)/admin/hackathons/page.tsx`
- Modify: `apps/web/app/(admin)/admin/submissions/page.tsx`

- [ ] **Step 1: Update admin hackathons page**

In `apps/web/app/(admin)/admin/hackathons/page.tsx`, add imports:

```typescript
import { listHackathons } from '@/app/_generated/data';
import { localize } from '@synnovator/shared/i18n';
import { VisibilitySection } from '@/components/admin/VisibilitySection';
```

Before the `return` statement (after `items = ...` block, around line 32), add:

```typescript
  const allHackathons = listHackathons();
  const visibilityItems = allHackathons.map(h => ({
    name: localize(lang, h.hackathon.name, h.hackathon.name_zh),
    slug: h.hackathon.slug,
    visibility: h.hackathon.visibility ?? 'public',
  }));
```

In the return JSX, after `<ReviewList ... />` (line 37), add:

```tsx
      <VisibilitySection
        items={visibilityItems}
        type="hackathon"
        lang={lang}
        translations={{
          title: t(lang, 'admin.visibility'),
          publish: t(lang, 'admin.publish'),
          unpublish: t(lang, 'admin.unpublish'),
          private: t(lang, 'admin.visibility_private'),
          public: t(lang, 'admin.visibility_public'),
          success: t(lang, 'admin.publish_success'),
          error: t(lang, 'admin.publish_error'),
        }}
      />
```

- [ ] **Step 2: Update admin submissions page**

Same pattern in `apps/web/app/(admin)/admin/submissions/page.tsx`. Add imports:

```typescript
import { listHackathons, listSubmissions } from '@/app/_generated/data';
import { localize } from '@synnovator/shared/i18n';
import { VisibilitySection } from '@/components/admin/VisibilitySection';
```

Before the `return`, add:

```typescript
  const allSubmissions = listSubmissions();
  const allHackathons = listHackathons();
  const privateHackathonSlugs =
    allHackathons.filter(h => h.hackathon.visibility === 'private').map(h => h.hackathon.slug);
  const visibilityItems = allSubmissions.map(s => ({
    name: localize(lang, s.project.name, s.project.name_zh),
    slug: `${s._hackathonSlug}/${s._teamSlug}`,
    visibility: s.project.visibility ?? 'public',
  }));
```

In the return JSX, after `<ReviewList ... />`, add:

```tsx
      <VisibilitySection
        items={visibilityItems}
        type="submission"
        lang={lang}
        translations={{
          title: t(lang, 'admin.visibility'),
          publish: t(lang, 'admin.publish'),
          unpublish: t(lang, 'admin.unpublish'),
          private: t(lang, 'admin.visibility_private'),
          public: t(lang, 'admin.visibility_public'),
          success: t(lang, 'admin.publish_success'),
          error: t(lang, 'admin.publish_error'),
          warningParentPrivate: t(lang, 'admin.visibility_warning_parent_private'),
        }}
        privateHackathonSlugs={privateHackathonSlugs}
      />
```

- [ ] **Step 3: Verify dev server — admin panel**

```bash
pnpm dev
```

Visit `/admin/hackathons` and `/admin/submissions`. The visibility section should appear below the review list, showing all content with publish/unpublish buttons.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/(admin)/admin/hackathons/page.tsx apps/web/app/(admin)/admin/submissions/page.tsx
git commit -m "feat(web): add visibility controls to admin hackathon and submission pages"
```

---

## Chunk 4: Creation Scripts + Final Verification

### Task 12: Update creation scripts

**Files:**
- Modify: `scripts/create-hackathon.sh:55-90`
- Modify: `scripts/submit-project.sh:62-86`

- [ ] **Step 1: Add `visibility: private` to `create-hackathon.sh`**

In `scripts/create-hackathon.sh`, inside the heredoc YAML (line 58), add `visibility: private` after `type`:

Change:
```yaml
  type: "${TYPE}"
  description: ""
```

To:
```yaml
  type: "${TYPE}"
  visibility: private
  description: ""
```

- [ ] **Step 2: Add `visibility: private` to `submit-project.sh`**

In `scripts/submit-project.sh`, inside the heredoc YAML (line 65), add `visibility: private` after `name_zh`:

Change:
```yaml
  name_zh: ""
  tagline: ""
```

To:
```yaml
  name_zh: ""
  visibility: private
  tagline: ""
```

- [ ] **Step 3: Commit**

```bash
git add scripts/create-hackathon.sh scripts/submit-project.sh
git commit -m "feat(scripts): set visibility: private for new hackathons and submissions"
```

---

### Task 13: Add visibility validation to CI scripts

**Files:**
- Modify: `scripts/validate-hackathon.sh:44`
- Modify: `.github/workflows/validate-submission.yml` (or its underlying validation script)

- [ ] **Step 1: Add visibility warning to `validate-hackathon.sh`**

In `scripts/validate-hackathon.sh`, after the required fields checks (after line 44), add a new rule:

```bash
# --- Rule: visibility field should be present ---
VISIBILITY=$(yq '.hackathon.visibility' "$FILE")
if [ "$VISIBILITY" = "null" ] || [ -z "$VISIBILITY" ]; then
  echo "WARNING: hackathon.visibility is not set — defaulting to 'public'. New hackathons should set visibility: private" >&2
fi
if [ "$VISIBILITY" != "null" ] && [ -n "$VISIBILITY" ]; then
  case "$VISIBILITY" in
    public|private) ;;
    *) err "hackathon.visibility must be 'public' or 'private' (got \"$VISIBILITY\")" ;;
  esac
fi
```

Note: This is a warning (not an error) for missing visibility, but an error for invalid values. This allows existing hackathons without the field to pass while flagging the omission.

- [ ] **Step 2: Add visibility check to submission validation**

If submission validation uses a similar bash script, add the equivalent check:

```bash
VISIBILITY=$(yq '.project.visibility' "$FILE")
if [ "$VISIBILITY" = "null" ] || [ -z "$VISIBILITY" ]; then
  echo "WARNING: project.visibility is not set — defaulting to 'public'. New submissions should set visibility: private" >&2
fi
if [ "$VISIBILITY" != "null" ] && [ -n "$VISIBILITY" ]; then
  case "$VISIBILITY" in
    public|private) ;;
    *) err "project.visibility must be 'public' or 'private' (got \"$VISIBILITY\")" ;;
  esac
fi
```

If submission validation is handled by the Zod schema in the GitHub Actions workflow directly (via `validate-submission.yml`), the Zod schema change from Task 1 already covers this — the enum will reject invalid values, and the default handles missing values.

- [ ] **Step 3: Commit**

```bash
git add scripts/validate-hackathon.sh
git commit -m "feat(scripts): add visibility field validation to hackathon validator"
```

---

### Task 14: End-to-end verification

- [ ] **Step 1: Run shared package tests**

```bash
pnpm --filter @synnovator/shared test -- --run
```

Expected: All tests pass, including the new visibility tests.

- [ ] **Step 2: Run full build**

```bash
pnpm build
```

Expected: Build succeeds. Static data generation includes public subsets. All pages render.

- [ ] **Step 3: Manual smoke test**

1. Set one hackathon to `visibility: private` in its YAML
2. Run `node apps/web/scripts/generate-static-data.mjs`
3. Run `pnpm dev`
4. Home page — that hackathon should NOT appear in the list
5. Direct URL `/hackathons/{slug}` — page should show with the unlisted banner
6. View page source — `<meta name="robots" content="noindex,nofollow">` should be present
7. Revert the YAML change

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A && git commit -m "fix: address issues found during e2e verification"
```

(Only if fixes are needed.)
