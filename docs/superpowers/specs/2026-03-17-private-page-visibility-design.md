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

In `packages/shared/src/schemas/hackathon.ts`:
```typescript
visibility: z.enum(['public', 'private']).default('public')
```

In `packages/shared/src/schemas/submission.ts`:
```typescript
visibility: z.enum(['public', 'private']).default('public')
```

Zod default is `'public'` so existing YAML files without the field remain public. Creation scripts/skills explicitly set `visibility: private` for new content.

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

Filtering logic in the script:
```javascript
const hackathonsPublic = hackathons.filter(h => h.visibility !== 'private')
const submissionsPublic = submissions.filter(s => s.project?.visibility !== 'private')
```

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

Add `listPublicHackathons()` and `listPublicSubmissions()` to the interface. Both `StaticDataProvider` and `FsDataProvider` implementations updated.

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
    {lang === 'zh'
      ? '此内容正在审核中，尚未公开展示。'
      : 'This content is under review and not yet publicly listed.'}
  </p>
</div>
```

### 4. Admin Panel

#### Content Visibility Section

On admin hackathon and submission pages (`(admin)/admin/hackathons/`, `(admin)/admin/submissions/`), add a section listing all content with:
- Content name/slug
- Visibility badge (`private` / `public`)
- Toggle button: "Publish" (private → public) or "Unpublish" (public → private)

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
1. Validate admin session
2. Determine YAML file path from type + slug
3. Create branch `data/visibility-{type}-{slug}`
4. Read current YAML via GitHub Contents API
5. Update `visibility` field
6. Commit change to branch
7. Create PR targeting main with title: `data(visibility): publish {type} {slug}` or `data(visibility): unpublish {type} {slug}`
8. Return PR URL to frontend

**Auth:** Reuse existing admin session validation. GitHub API calls use admin's `access_token` from session — PRs are authored by the admin.

### 5. Creation Scripts

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
