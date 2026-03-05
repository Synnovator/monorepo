# Proposals Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a global "Proposals" listing page (`/proposals`) that aggregates all hackathon submissions, with two view modes (hot/grouped by activity), and add navigation to the header.

**Architecture:** Pure static build with client-side view toggle. Build-time data from `getCollection('submissions')` + `getCollection('hackathons')`. Client-side JS switches between "hot" (sorted by likes) and "grouped by activity" views using display toggling (same pattern as homepage filters).

**Tech Stack:** Astro (static page), Tailwind CSS, existing ProjectCard component, client-side vanilla JS

---

### Task 1: Add i18n translation keys

**Files:**
- Modify: `site/src/i18n/zh.yml`
- Modify: `site/src/i18n/en.yml`

**Step 1: Add Chinese translations**

In `site/src/i18n/zh.yml`, add after the `nav:` section (after line 7):

```yaml
nav:
  hackathons: "活动"
  hackers: "参赛者"
  guides: "指南"
  proposals: "提案"
```

And add a new `proposals:` section at the end of the file (after line 133):

```yaml
proposals:
  title: "提案"
  subtitle: "浏览所有活动的参赛提案"
  sort_hot: "按热门排序"
  sort_activity: "按活动分组"
  empty: "暂无提案"
  likes: "赞"
```

**Step 2: Add English translations**

In `site/src/i18n/en.yml`, add to the `nav:` section (after line 7):

```yaml
nav:
  hackathons: "Events"
  hackers: "Hackers"
  guides: "Guides"
  proposals: "Proposals"
```

And add a new `proposals:` section at the end of the file (after line 132):

```yaml
proposals:
  title: "Proposals"
  subtitle: "Browse all hackathon proposals"
  sort_hot: "Sort by Hot"
  sort_activity: "Group by Activity"
  empty: "No proposals yet"
  likes: "likes"
```

**Step 3: Verify build**

Run: `cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/add-project-page/site && pnpm run build 2>&1 | tail -5`
Expected: Build succeeds (no i18n errors)

**Step 4: Commit**

```bash
git add site/src/i18n/zh.yml site/src/i18n/en.yml
git commit -m "feat(site): add proposals page i18n keys"
```

---

### Task 2: Add `likes` field to submissions schema

**Files:**
- Modify: `site/src/content.config.ts` (line 271-282)

**Step 1: Add likes to submissionSchema**

In `site/src/content.config.ts`, modify the `submissionSchema` (line 269-283). Add `likes` as an optional field inside the `project` object:

Change from:
```typescript
const submissionSchema = z.object({
  synnovator_submission: z.string(),
  project: z.object({
    name: z.string(),
    name_zh: z.string().optional(),
    tagline: z.string().optional(),
    tagline_zh: z.string().optional(),
    track: z.string(),
    team: z.array(submissionTeamMemberSchema),
    deliverables: submissionDeliverablesSchema.optional(),
    tech_stack: z.array(z.string()).optional(),
    description: z.string().optional(),
    description_zh: z.string().optional(),
  }),
});
```

To:
```typescript
const submissionSchema = z.object({
  synnovator_submission: z.string(),
  project: z.object({
    name: z.string(),
    name_zh: z.string().optional(),
    tagline: z.string().optional(),
    tagline_zh: z.string().optional(),
    track: z.string(),
    team: z.array(submissionTeamMemberSchema),
    deliverables: submissionDeliverablesSchema.optional(),
    tech_stack: z.array(z.string()).optional(),
    description: z.string().optional(),
    description_zh: z.string().optional(),
    likes: z.number().optional(),
  }),
});
```

**Step 2: Verify build**

Run: `cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/add-project-page/site && pnpm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site/src/content.config.ts
git commit -m "feat(site): add likes field to submissions schema"
```

---

### Task 3: Update ProjectCard to show optional likes badge

**Files:**
- Modify: `site/src/components/ProjectCard.astro`

**Step 1: Add likes prop and badge**

The current `Props` interface (line 5-22) needs a `likes` field added. Update the component:

Change the Props interface from:
```typescript
interface Props {
  project: {
    name: string;
    name_zh?: string;
    tagline?: string;
    tagline_zh?: string;
    track: string;
    team: Array<{ github: string; role?: string }>;
    tech_stack?: string[];
    deliverables?: {
      repo?: string;
      demo?: string;
    };
  };
  hackathonSlug: string;
  teamSlug: string;
  lang: Lang;
}
```

To:
```typescript
interface Props {
  project: {
    name: string;
    name_zh?: string;
    tagline?: string;
    tagline_zh?: string;
    track: string;
    team: Array<{ github: string; role?: string }>;
    tech_stack?: string[];
    deliverables?: {
      repo?: string;
      demo?: string;
    };
    likes?: number;
  };
  hackathonSlug: string;
  teamSlug: string;
  lang: Lang;
}
```

Then in the template, add a likes badge next to the track badge. Change line 38-40 from:
```astro
    <span class="text-xs px-2 py-1 rounded-full bg-secondary-bg text-muted whitespace-nowrap">
      {project.track}
    </span>
```

To:
```astro
    <div class="flex items-center gap-2">
      {(project.likes != null && project.likes > 0) && (
        <span class="text-xs px-2 py-1 rounded-full bg-neon-pink/10 text-neon-pink whitespace-nowrap flex items-center gap-1">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/></svg>
          {project.likes}
        </span>
      )}
      <span class="text-xs px-2 py-1 rounded-full bg-secondary-bg text-muted whitespace-nowrap">
        {project.track}
      </span>
    </div>
```

**Step 2: Verify build**

Run: `cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/add-project-page/site && pnpm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site/src/components/ProjectCard.astro
git commit -m "feat(site): add optional likes badge to ProjectCard"
```

---

### Task 4: Add "提案" navigation link to NavBar

**Files:**
- Modify: `site/src/components/NavBar.astro` (line 12-16)

**Step 1: Add proposals link**

Change lines 12-16 from:
```astro
    <div class="hidden md:flex items-center gap-8">
      <a href="/" class="text-light-gray hover:text-white transition-colors text-sm">活动</a>
      <a href="/guides/hacker" class="text-muted hover:text-white transition-colors text-sm">指南</a>
      <a href="/create-hackathon" class="text-muted hover:text-white transition-colors text-sm">创建活动</a>
    </div>
```

To:
```astro
    <div class="hidden md:flex items-center gap-8">
      <a href="/" class="text-light-gray hover:text-white transition-colors text-sm">活动</a>
      <a href="/proposals" class="text-muted hover:text-white transition-colors text-sm">提案</a>
      <a href="/guides/hacker" class="text-muted hover:text-white transition-colors text-sm">指南</a>
      <a href="/create-hackathon" class="text-muted hover:text-white transition-colors text-sm">创建活动</a>
    </div>
```

**Step 2: Verify build**

Run: `cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/add-project-page/site && pnpm run build 2>&1 | tail -5`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add site/src/components/NavBar.astro
git commit -m "feat(site): add proposals nav link to header"
```

---

### Task 5: Create the proposals page

**Files:**
- Create: `site/src/pages/proposals.astro`

**Step 1: Create the proposals page**

Create `site/src/pages/proposals.astro` with this content:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import ProjectCard from '../components/ProjectCard.astro';
import { getCollection } from 'astro:content';
import { t, localize } from '../lib/i18n';
import type { Lang } from '../lib/i18n';

const lang: Lang = 'zh';

const allSubmissions = await getCollection('submissions');
const allHackathons = await getCollection('hackathons');

// Build hackathon name lookup: slug -> { name, name_zh }
const hackathonMap = new Map<string, { name: string; name_zh?: string; slug: string }>();
for (const h of allHackathons) {
  hackathonMap.set(h.data.hackathon.slug, {
    name: h.data.hackathon.name,
    name_zh: h.data.hackathon.name_zh,
    slug: h.data.hackathon.slug,
  });
}

// Extract hackathon slug and team slug from submission id
// ID format: {hackathon-slug}/submissions/{team-slug}/project
function parseSubmissionId(id: string) {
  const parts = id.split('/');
  return { hackathonSlug: parts[0], teamSlug: parts[2] };
}

// Enrich submissions with hackathon info
const submissions = allSubmissions.map(sub => {
  const { hackathonSlug, teamSlug } = parseSubmissionId(sub.id);
  const hackathon = hackathonMap.get(hackathonSlug);
  return {
    ...sub,
    hackathonSlug,
    teamSlug,
    hackathonName: hackathon?.name || hackathonSlug,
    hackathonNameZh: hackathon?.name_zh,
    likes: sub.data.project.likes || 0,
  };
});

// Sort by likes descending for hot view
const hotSorted = [...submissions].sort((a, b) => b.likes - a.likes);

// Group by hackathon for activity view
const grouped = new Map<string, typeof submissions>();
for (const sub of submissions) {
  const key = sub.hackathonSlug;
  if (!grouped.has(key)) grouped.set(key, []);
  grouped.get(key)!.push(sub);
}
---

<BaseLayout title={t(lang, 'proposals.title')}>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <!-- Hero -->
    <div class="mb-12">
      <h1 class="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
        {t(lang, 'proposals.title')}
      </h1>
      <p class="text-lg text-muted max-w-2xl">
        {t(lang, 'proposals.subtitle')}
      </p>
    </div>

    <!-- View toggle -->
    <div class="mb-8">
      <div class="flex flex-wrap gap-2" id="view-tabs">
        <button class="view-tab active text-sm px-4 py-1.5 rounded-full border transition-colors" data-view="hot">
          {t(lang, 'proposals.sort_hot')}
        </button>
        <button class="view-tab text-sm px-4 py-1.5 rounded-full border transition-colors" data-view="activity">
          {t(lang, 'proposals.sort_activity')}
        </button>
      </div>
    </div>

    {submissions.length === 0 ? (
      <div class="text-center py-24">
        <p class="text-muted text-lg">{t(lang, 'proposals.empty')}</p>
      </div>
    ) : (
      <>
        <!-- Hot view (default) -->
        <div id="view-hot">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotSorted.map(sub => (
              <ProjectCard
                project={sub.data.project}
                hackathonSlug={sub.hackathonSlug}
                teamSlug={sub.teamSlug}
                lang={lang}
              />
            ))}
          </div>
        </div>

        <!-- Activity grouped view (hidden by default) -->
        <div id="view-activity" style="display:none">
          {[...grouped.entries()].map(([slug, subs]) => {
            const hackathon = hackathonMap.get(slug);
            const name = hackathon ? localize(lang, hackathon.name, hackathon.name_zh) : slug;
            return (
              <div class="mb-10">
                <h2 class="text-xl font-heading font-bold text-white mb-4 flex items-center gap-3">
                  <span class="w-1 h-6 bg-lime-primary rounded-full inline-block"></span>
                  <a href={`/hackathons/${slug}`} class="hover:text-lime-primary transition-colors">{name}</a>
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subs.map(sub => (
                    <ProjectCard
                      project={sub.data.project}
                      hackathonSlug={sub.hackathonSlug}
                      teamSlug={sub.teamSlug}
                      lang={lang}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </>
    )}
  </div>
</BaseLayout>

<style>
  .view-tab {
    border-color: var(--color-secondary-bg, #2a2a2a);
    color: var(--color-muted, #888);
    background: transparent;
    cursor: pointer;
  }
  .view-tab:hover {
    border-color: var(--color-lime-primary, #BBFD3B);
    color: var(--color-white, #fff);
  }
  .view-tab.active {
    border-color: var(--color-lime-primary, #BBFD3B);
    background-color: color-mix(in srgb, var(--color-lime-primary, #BBFD3B) 20%, transparent);
    color: var(--color-lime-primary, #BBFD3B);
  }
</style>

<script>
  const viewTabs = document.querySelectorAll('.view-tab');
  const hotView = document.getElementById('view-hot');
  const activityView = document.getElementById('view-activity');

  viewTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      viewTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const view = (tab as HTMLElement).dataset.view;
      if (hotView) hotView.style.display = view === 'hot' ? '' : 'none';
      if (activityView) activityView.style.display = view === 'activity' ? '' : 'none';
    });
  });
</script>
```

**Step 2: Verify build**

Run: `cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/add-project-page/site && pnpm run build 2>&1 | tail -10`
Expected: Build succeeds, `/proposals` page is generated

**Step 3: Verify dev server**

Run: `cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/add-project-page/site && pnpm run dev &`
Then: Open `http://localhost:4321/proposals` and verify:
- Page title "提案" displays
- Toggle buttons work (switch between hot/activity views)
- ProjectCard components render with submission data
- Activity grouped view shows hackathon name headers

**Step 4: Commit**

```bash
git add site/src/pages/proposals.astro
git commit -m "feat(site): add proposals listing page with hot/activity views"
```

---

### Task 6: Add sample likes data to existing submissions

**Files:**
- Modify: `hackathons/*/submissions/*/project.yml` (all existing submission files)

**Step 1: Find all submission files**

Run: `find /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/add-project-page/hackathons -name "project.yml" -path "*/submissions/*"`

**Step 2: Add likes field to each**

For each project.yml, add a `likes:` field under the `project:` key with varying values (e.g., 42, 18, 7, 31) to demonstrate sorting. Add the field after `description_zh` or at the end of the `project:` block.

Example — add to each project.yml:
```yaml
project:
  name: "OneBot Studio"
  # ... existing fields ...
  likes: 42
```

Use different values for each project to demonstrate the hot sort clearly.

**Step 3: Verify build**

Run: `cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/add-project-page/site && pnpm run build 2>&1 | tail -5`
Expected: Build succeeds with likes data parsed

**Step 4: Commit**

```bash
git add hackathons/
git commit -m "feat: add sample likes data to project submissions"
```

---

### Task 7: Final verification and cleanup

**Step 1: Full build check**

Run: `cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/add-project-page/site && pnpm run build`
Expected: Clean build, no warnings

**Step 2: Visual verification checklist**

Start dev server and verify:
- [ ] NavBar shows: 活动 / 提案 / 指南 / 创建活动
- [ ] Click "提案" navigates to `/proposals`
- [ ] Page title "提案" and subtitle display correctly
- [ ] "按热门排序" button is active by default
- [ ] Cards display in 3-column grid (desktop), sorted by likes desc
- [ ] Likes badge (heart + number) shows on cards with likes > 0
- [ ] Click "按活动分组" switches to grouped view
- [ ] Grouped view shows hackathon name headers with lime accent bar
- [ ] Hackathon name links to `/hackathons/{slug}`
- [ ] Click "按热门排序" switches back
- [ ] Mobile responsive: 1 column on small screens

**Step 3: No commit needed for this task (verification only)**
