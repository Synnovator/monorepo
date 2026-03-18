# Private Page Visibility (Unlisted Model)

**Issue:** [#62](https://github.com/Synnovator/monorepo/issues/62)
**Date:** 2026-03-17
**Status:** Design
**Scope:** Hackathons, Submissions

---

## Problem

Users create content (hackathons, submissions) via PR, but cannot preview or edit it visually until merged and publicly visible. If iteration is needed, they must recreate the content from scratch.

## Solution

An "unlisted" visibility model: content is merged immediately upon creation but marked as **private**. Private content is statically generated (direct URL works), but excluded from public listing pages. An admin can publish content via the admin panel, which creates a PR to change the visibility field.

Key properties:
- **No dynamic rendering** — fully static architecture preserved
- **No access control** — anyone with the URL can view private content
- **Soft privacy** — hidden from listings, not from direct access

## Content Types Affected

| Type | Affected | Default for New | Default for Existing |
|------|----------|-----------------|----------------------|
| Hackathons | Yes | `private` | `public` (no migration) |
| Submissions | Yes | `private` | `public` (no migration) |
| Profiles | No | — | — |
| Teams | No | — | — |

---

## Design

### 1. Data Model

#### Hackathon YAML (`hackathons/{slug}/hackathon.yml`)

```yaml
hackathon:
  name: "AI Voyager"
  type: community
  visibility: private  # "private" | "public"
  # ... rest of fields
```

#### Submission YAML (`hackathons/{slug}/submissions/{team}/project.yml`)

```yaml
project:
  name: "My Project"
  visibility: private  # "private" | "public"
  # ... rest of fields
```

#### Zod Schema Changes

In `packages/shared/src/schemas/hackathon.ts`, add `visibility` inside the inner `hackathon` object (`HackathonSchema.shape.hackathon`):
```typescript
visibility: z.enum(['public', 'private']).default('public')
```

In `packages/shared/src/schemas/submission.ts`, add `visibility` inside the inner `project` object (`SubmissionSchema.shape.project`):
```typescript
visibility: z.enum(['public', 'private']).default('public')
```

Zod default is `'public'` so existing YAML files without the field remain public. Creation scripts/skills explicitly set `visibility: private` for new content.

**Validation:** Update `validate-hackathon.sh` and `validate-submission.yml` workflows to warn if a new YAML file is missing the `visibility` field, ensuring new content doesn't accidentally become public via the Zod default.

### 2. Build Pipeline

#### `generate-static-data.mjs`

After collecting hackathons and submissions, produce two subsets in `static-data.json`:

```javascript
{
  hackathons: [...],           // all content (detail pages + admin)
  hackathonsPublic: [...],     // visibility === 'public' only (listing pages)
  submissions: [...],          // all content
  submissionsPublic: [...],    // visibility === 'public' only
  profiles: [...],             // unchanged
  teams: [...],                // unchanged
  results: {...},              // unchanged
  themes: {...}                // unchanged
}
```

Filtering logic in the script (note the nested property paths matching YAML structure):
```javascript
const hackathonsPublic = hackathons.filter(h => h.hackathon?.visibility !== 'private')
const submissionsPublic = submissions.filter(s => s.project?.visibility !== 'private')
```

**Note on bundle size:** The public subsets duplicate some data in `static-data.json`. At current scale (~57KB total) this is negligible. If the dataset grows significantly, consider splitting into separate JSON files.

#### Data Accessors (`data.ts`)

Add new public-only accessors:

```typescript
// Existing (unchanged — returns all, used by detail pages + admin)
export function listHackathons() { ... }
export function listSubmissions() { ... }

// New (returns public only, used by listing pages)
export function listPublicHackathons() { ... }
export function listPublicSubmissions() { ... }
```

#### DataProvider Interface (`provider.ts`)

Add `listPublicHackathons()` and `listPublicSubmissions()` to the interface. Both implementations updated:

- **`StaticDataProvider`** (`apps/web/lib/static-provider.ts`): Read from `staticData.hackathonsPublic` / `staticData.submissionsPublic` with the same type casts as the existing accessors.
- **`FsDataProvider`** (`packages/shared/src/data/fs-provider.ts`): Filter at the provider level: `this.hackathons.filter(h => h.hackathon?.visibility !== 'private')`, similarly for submissions.

### 3. Page Rendering

#### Listing Pages

Swap to public accessors:

| Page | Before | After |
|------|--------|-------|
| `(public)/page.tsx` (home) | `listHackathons()` | `listPublicHackathons()` |
| Hackathon detail submissions tab | `listSubmissions()` | `listPublicSubmissions()` |

#### `generateStaticParams()`

Unchanged — still uses `listHackathons()` / `listSubmissions()` (all content) so that static pages are generated for private content too. The pages exist; they're just not linked.

#### Detail Pages — Unlisted Banner

When `visibility === 'private'`, render a banner at the top of:
- `(public)/hackathons/[slug]/page.tsx`
- `(public)/projects/[hackathon]/[team]/page.tsx`

**`UnlistedBanner` component:**

```tsx
<div className="bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 mb-6">
  <p className="text-sm text-warning-foreground">
    {t(lang, 'common.unlisted_banner')}
  </p>
</div>
```

i18n keys to add: `common.unlisted_banner` (en: "This content is under review and not yet publicly listed.", zh: "此内容正在审核中，尚未公开展示。")

**SEO:** Add `<meta name="robots" content="noindex,nofollow" />` to detail pages when `visibility === 'private'` to prevent search engine indexing of unlisted content.

### 4. Admin Panel

#### Content Visibility Section

On admin hackathon and submission pages (`(admin)/admin/hackathons/`, `(admin)/admin/submissions/`), add a **new section alongside the existing review list**. The existing review list (pending PRs from GitHub API) remains unchanged. The new section lists all content from static data (`listHackathons()` / `listSubmissions()`) with:
- Content name/slug
- Visibility badge (`private` / `public`)
- Toggle button: "Publish" (private → public) or "Unpublish" (public → private)

i18n keys to add: `admin.visibility`, `admin.publish`, `admin.unpublish`, `admin.visibility_private`, `admin.visibility_public`

#### API Route: `POST /api/admin/visibility`

**Request:**
```typescript
{
  type: 'hackathon' | 'submission',
  slug: string,           // hackathon slug, or "hackathon-slug/team-slug" for submissions
  visibility: 'public' | 'private'
}
```

**Flow:**
1. Validate admin session exists
2. Check repo permission via `getInstallationOctokit()` — verify the user has at least `write` permission; return 403 otherwise
3. Determine YAML file path from type + slug
4. Create branch `data/visibility-{type}-{slug}-{timestamp}` (timestamp suffix avoids collision if publish/unpublish happen before prior PR is merged)
5. Read current YAML via GitHub Contents API
6. Update `visibility` field
7. Commit change to branch
8. Create PR targeting main with title: `data(visibility): publish {type} {slug}` or `data(visibility): unpublish {type} {slug}`
9. Return PR URL to frontend
10. On error after branch creation, attempt to delete the orphan branch

**Auth:** Use `getInstallationOctokit()` (GitHub App token) for branch/commit/PR operations, matching the existing `theme` admin route pattern. This avoids dependence on the user's OAuth token scope for repo writes. PRs are authored by the GitHub App bot.

### 5. Edge Cases

**Private hackathon with public submissions:** A submission cannot be public if its parent hackathon is private. The `submissionsPublic` filter should also exclude submissions whose parent hackathon is private:

```javascript
const privateHackathonSlugs = new Set(
  hackathons.filter(h => h.hackathon?.visibility === 'private').map(h => h._slug)
)
const submissionsPublic = submissions.filter(
  s => s.project?.visibility !== 'private' && !privateHackathonSlugs.has(s._hackathonSlug)
)
```

**Public hackathon with all private submissions:** The hackathon's submissions tab will show zero submissions. This is expected — the tab can display a message like "No submissions yet" (same as a hackathon with no submissions).

**Admin publishes a submission whose hackathon is still private:** The API route should warn (but not block) — the submission won't appear in public listings anyway until the hackathon is also published.

### 6. Creation Scripts

Update creation scripts/skills to set `visibility: private` explicitly:
- `scripts/create-hackathon.sh` — add `visibility: private` to generated YAML
- `scripts/submit-project.sh` — add `visibility: private` to generated YAML
- `/synnovator-admin` skill — ensure visibility field is set when creating content

---

## Summary of Changes

| Layer | File(s) | Change |
|-------|---------|--------|
| Schema | `packages/shared/src/schemas/hackathon.ts` | Add `visibility` field |
| Schema | `packages/shared/src/schemas/submission.ts` | Add `visibility` field |
| Build | `apps/web/scripts/generate-static-data.mjs` | Produce public subsets |
| Data | `apps/web/app/_generated/data.ts` | Add `listPublicHackathons()`, `listPublicSubmissions()` |
| Data | `packages/shared/src/data/provider.ts` | Add public listing methods to interface |
| UI | `(public)/page.tsx` | Use public listing |
| UI | Hackathon detail submissions tab | Use public listing |
| UI | `(public)/hackathons/[slug]/page.tsx` | Add unlisted banner |
| UI | `(public)/projects/[hackathon]/[team]/page.tsx` | Add unlisted banner |
| UI | New: `UnlistedBanner` component | Bilingual banner component |
| Admin | `(admin)/admin/hackathons/page.tsx` | Add visibility section with publish/unpublish |
| Admin | `(admin)/admin/submissions/page.tsx` | Add visibility section with publish/unpublish |
| API | New: `app/api/admin/visibility/route.ts` | PR creation endpoint |
| Scripts | `scripts/create-hackathon.sh` | Set `visibility: private` |
| Scripts | `scripts/submit-project.sh` | Set `visibility: private` |
