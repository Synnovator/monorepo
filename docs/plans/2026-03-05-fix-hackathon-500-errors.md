# Fix Hackathon 500 Errors & MDX Rendering

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 500 errors on hackathon detail, project, results, and create pages caused by `prerender=false` + `getStaticPaths` conflict, and fix MDX README rendering.

**Architecture:** Remove `getStaticPaths()` from 4 dynamic route pages, replace with `getCollection().find()` for SSR data fetching. Replace all Node.js `fs` usage with Astro content collections or Vite static imports (Cloudflare Workers has no `fs`). Add `readmes` and `results` content collections. Use Astro's `render()` API for proper MDX/markdown rendering.

**Tech Stack:** Astro 5 (hybrid SSR), `astro:content` glob loader, `@astrojs/mdx`, Cloudflare Pages adapter

---

### Task 1: Add readmes and results content collections

**Files:**
- Modify: `site/src/content.config.ts`

**Step 1: Add readmes collection**

After the `submissions` collection (line 291), add:

```ts
const readmes = defineCollection({
  loader: glob({ pattern: '**/submissions/*/README.{md,mdx}', base: '../hackathons' }),
});
```

No schema needed — README files have no frontmatter. Astro handles this with an empty default.

**Step 2: Add results collection**

```ts
const results = defineCollection({
  loader: glob({ pattern: '**/results/*.json', base: '../hackathons' }),
  schema: z.object({
    calculated_at: z.string(),
    total_judges: z.number(),
    total_teams: z.number(),
    rankings: z.array(z.object({
      rank: z.number(),
      team: z.string(),
      final_score: z.number(),
      criteria_breakdown: z.array(z.object({
        criterion: z.string(),
        weight: z.number(),
        average: z.number(),
      })).optional(),
    })),
  }),
});
```

**Step 3: Export both collections**

Change the exports line to:

```ts
export const collections = { hackathons, profiles, submissions, readmes, results };
```

**Step 4: Commit**

```bash
git add site/src/content.config.ts
git commit -m "feat(site): add readmes and results content collections"
```

---

### Task 2: Fix hackathons/[...slug].astro

**Files:**
- Modify: `site/src/pages/hackathons/[...slug].astro`

**Step 1: Replace frontmatter (lines 1-92)**

Remove:
- `import fs from 'node:fs'` (line 22)
- `import path from 'node:path'` (line 23)
- Entire `getStaticPaths()` function (lines 25-31)
- `const { entry } = Astro.props;` (line 33)
- The `fs`-based results loading block (lines 57-69)

Replace lines 25-34 with:

```ts
const { slug } = Astro.params;
const allHackathons = await getCollection('hackathons');
const entry = allHackathons.find(e => e.data.hackathon.slug === slug);
if (!entry) return Astro.redirect('/404');
```

Replace lines 57-69 (fs results loading) with:

```ts
const allResults = await getCollection('results');
const showLeaderboard = ['announcement', 'award', 'ended'].includes(stage);
let trackResults: Array<{ track: string; data: any }> = [];
if (showLeaderboard) {
  trackResults = allResults
    .filter(r => r.id.startsWith(`${h.slug}/`))
    .map(r => {
      const parts = r.id.split('/');
      const track = parts[parts.length - 1];
      return { track, data: r.data };
    });
}
```

**Step 2: Commit**

```bash
git add site/src/pages/hackathons/\[\...slug\].astro
git commit -m "fix(site): fix hackathon detail page SSR data fetching"
```

---

### Task 3: Fix hackers/[...id].astro

**Files:**
- Modify: `site/src/pages/hackers/[...id].astro`

**Step 1: Replace getStaticPaths with collection query**

Remove the entire `getStaticPaths()` function (lines 10-17) and `const { entry } = Astro.props;` (line 19).

Replace with:

```ts
const { id } = Astro.params;
const allProfiles = await getCollection('profiles');
const entry = allProfiles.find(e => e.id === id);
if (!entry) return Astro.redirect('/404');
```

**Step 2: Commit**

```bash
git add site/src/pages/hackers/\[\...id\].astro
git commit -m "fix(site): fix hacker profile page SSR data fetching"
```

---

### Task 4: Fix projects/[hackathon]/[team].astro

**Files:**
- Modify: `site/src/pages/projects/[hackathon]/[team].astro`

**Step 1: Replace frontmatter**

Remove:
- `import fs from 'node:fs'` (line 7)
- `import path from 'node:path'` (line 8)
- Entire `getStaticPaths()` function (lines 10-22)
- `const { entry } = Astro.props;` (line 24)
- The fs README reading block (lines 29-37)

Replace lines 10-37 with:

```ts
const { hackathon, team } = Astro.params;
const allSubmissions = await getCollection('submissions');
const entry = allSubmissions.find(s => {
  const parts = s.id.split('/');
  return parts[0] === hackathon && parts[2] === team;
});
if (!entry) return Astro.redirect('/404');
const project = entry.data.project;
const lang: Lang = getLangFromUrl(Astro.url);

// Load README via content collection (renders MDX properly)
const allReadmes = await getCollection('readmes');
const readmeEntry = allReadmes.find(r => r.id.startsWith(`${hackathon}/submissions/${team}/`));
let ReadmeContent: any = null;
if (readmeEntry) {
  const rendered = await readmeEntry.render();
  ReadmeContent = rendered.Content;
}
```

**Step 2: Update template to use Content component**

Replace lines 84-96 (the readme rendering block) with:

```astro
{ReadmeContent ? (
  <div class="prose prose-invert prose-sm max-w-none text-light-gray">
    <ReadmeContent />
  </div>
) : project.description ? (
  <div class="prose prose-invert prose-sm max-w-none text-light-gray">
    <p>{localize(lang, project.description, project.description_zh)}</p>
  </div>
) : (
  <div class="rounded-lg border border-secondary-bg bg-dark-bg p-12 text-center">
    <p class="text-muted">{t(lang, 'project.no_readme')}</p>
  </div>
)}
```

**Step 3: Commit**

```bash
git add site/src/pages/projects/\[hackathon\]/\[team\].astro
git commit -m "fix(site): fix project page SSR + MDX rendering"
```

---

### Task 5: Fix results/[...slug].astro

**Files:**
- Modify: `site/src/pages/results/[...slug].astro`

**Step 1: Replace frontmatter**

Remove:
- `import fs from 'node:fs'` (line 7)
- `import path from 'node:path'` (line 8)
- Entire `getStaticPaths()` function (lines 10-16)
- `const { entry } = Astro.props;` (line 18)
- The fs results loading block (lines 25-36)

Replace lines 10-36 with:

```ts
const { slug } = Astro.params;
const allHackathons = await getCollection('hackathons');
const entry = allHackathons.find(e => e.data.hackathon.slug === slug);
if (!entry) return Astro.redirect('/404');
const h = entry.data.hackathon;
const lang: Lang = getLangFromUrl(Astro.url);
const stage = h.timeline ? getCurrentStage(h.timeline) : 'draft';
const showResults = ['announcement', 'award', 'ended'].includes(stage);

// Load results from content collection
const allResults = await getCollection('results');
let trackResults: Array<{ track: string; data: any }> = [];
if (showResults) {
  trackResults = allResults
    .filter(r => r.id.startsWith(`${h.slug}/`))
    .map(r => {
      const parts = r.id.split('/');
      const track = parts[parts.length - 1];
      return { track, data: r.data };
    });
}
```

**Step 2: Commit**

```bash
git add site/src/pages/results/\[\...slug\].astro
git commit -m "fix(site): fix results page SSR data fetching"
```

---

### Task 6: Fix create-proposal.astro

**Files:**
- Modify: `site/src/pages/create-proposal.astro`

**Step 1: Replace fs-based hackathon loading**

Remove:
- `import fs from 'node:fs'` (line 7)
- `import path from 'node:path'` (line 8)
- `import yaml from 'js-yaml'` (line 9)
- The entire fs reading block (lines 26-53)

Add import and replace with:

```ts
import { getCollection } from 'astro:content';

const lang: Lang = getLangFromUrl(Astro.url);

interface TrackInfo {
  name: string;
  name_zh?: string;
  slug: string;
}

interface HackathonInfo {
  slug: string;
  name: string;
  name_zh?: string;
  tracks: TrackInfo[];
}

const allHackathons = await getCollection('hackathons');
const hackathons: HackathonInfo[] = allHackathons.map(e => ({
  slug: e.data.hackathon.slug,
  name: e.data.hackathon.name,
  name_zh: e.data.hackathon.name_zh,
  tracks: (e.data.hackathon.tracks || []).map(t => ({
    name: t.name,
    name_zh: t.name_zh,
    slug: t.slug,
  })),
}));
```

**Step 2: Commit**

```bash
git add site/src/pages/create-proposal.astro
git commit -m "fix(site): replace fs reads with getCollection in create-proposal"
```

---

### Task 7: Fix create-hackathon.astro

**Files:**
- Modify: `site/src/pages/create-hackathon.astro`

**Step 1: Replace fs template loading with import.meta.glob**

Remove:
- `import fs from 'node:fs'` (line 7)
- `import path from 'node:path'` (line 8)
- `import yaml from 'js-yaml'` (line 9)
- The entire template loading block (lines 14-24)

Replace with:

```ts
// Load templates via Vite static import (resolved at build time, works on Cloudflare)
const templateModules = import.meta.glob('../../../docs/templates/*/hackathon.yml', { eager: true });
const templates: Record<string, unknown> = {};
for (const [filepath, mod] of Object.entries(templateModules)) {
  const match = filepath.match(/\/templates\/([^/]+)\/hackathon\.yml$/);
  if (match) {
    templates[match[1]] = (mod as any).default;
  }
}
```

This uses Vite's `import.meta.glob` which resolves at build time. If no template files exist, `templates` is simply empty (same as current behavior).

**Step 2: Commit**

```bash
git add site/src/pages/create-hackathon.astro
git commit -m "fix(site): replace fs reads with import.meta.glob in create-hackathon"
```

---

### Task 8: Build verification

**Step 1: Run build**

```bash
cd site && pnpm run build
```

Expected: Build succeeds with no errors.

**Step 2: Run dev server and test pages**

```bash
pnpm run dev
```

Test URLs:
- `http://localhost:4321/hackathons/dishuihu-ai-opc-global-challenge-2026/` — should render hackathon detail
- `http://localhost:4321/create-hackathon` — should render form
- `http://localhost:4321/projects/dishuihu-ai-opc-global-challenge-2026/team-onebot` — should render with formatted README (headings, bold, lists)
- `http://localhost:4321/?lang=en` — should show English
- `http://localhost:4321/hackathons/dishuihu-ai-opc-global-challenge-2026/?lang=en` — should show English

**Step 3: Final commit if any fixups needed, then done**
