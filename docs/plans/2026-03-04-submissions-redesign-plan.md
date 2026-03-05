# Submissions Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the submissions system to support rich MDX project pages, independent detail pages at `/projects/{hackathon}/{team}`, and a 3-tab hackathon detail page (Details / Submissions / Leaderboard) with persistent sidebar.

**Architecture:** Add `@astrojs/mdx` integration. Create a `submissions` content collection loading `project.yml` files via glob. Read MDX content at build time from colocated `README.mdx` files. Refactor the hackathon detail page into a 3-tab layout using Radix UI Tabs (consistent with existing shadcn/ui pattern). Create new `/projects/[hackathon]/[team]` route for submission detail pages.

**Tech Stack:** Astro 5.5, @astrojs/mdx, Radix UI Tabs, React 19, Tailwind CSS 4, Zod, js-yaml

---

### Task 1: Install Dependencies and Configure MDX

**Files:**
- Modify: `site/package.json`
- Modify: `site/astro.config.mjs`

**Step 1: Install @astrojs/mdx**

Run:
```bash
cd site && pnpm add @astrojs/mdx
```

**Step 2: Add MDX integration to Astro config**

In `site/astro.config.mjs`, add the MDX import and integration:

```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import yaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  site: 'https://home.synnovator.space',
  integrations: [react(), mdx()],
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  vite: {
    plugins: [tailwindcss(), yaml()],
    resolve: {
      alias: import.meta.env.PROD
        ? { 'react-dom/server': 'react-dom/server.edge' }
        : {},
    },
    ssr: {
      noExternal: ['class-variance-authority', 'clsx', 'tailwind-merge'],
    },
  },
});
```

**Step 3: Verify build succeeds**

Run: `cd site && pnpm run build`
Expected: Build completes without errors.

**Step 4: Commit**

```bash
git add site/package.json site/pnpm-lock.yaml site/astro.config.mjs
git commit -m "feat(site): add @astrojs/mdx integration for submission pages"
```

---

### Task 2: Add i18n Keys

**Files:**
- Modify: `site/src/i18n/zh.yml`
- Modify: `site/src/i18n/en.yml`

**Step 1: Add tab and submission detail keys to zh.yml**

After the existing `project:` section (line ~106), add/update:

```yaml
tab:
  details: "详情"
  submissions: "提案"
  leaderboard: "排行榜"
project:
  submissions: "提交作品"
  no_submissions: "暂无提交"
  tech_stack: "技术栈"
  vote: "去投票"
  view_repo: "查看代码"
  back_to_hackathon: "返回活动"
  team_members: "团队成员"
  deliverables: "交付物"
  references: "参考资料"
  description: "项目介绍"
  no_readme: "详细介绍暂未提供"
  leaderboard_pending: "评审结果尚未公布"
  filter_all: "全部"
```

**Step 2: Add tab and submission detail keys to en.yml**

```yaml
tab:
  details: "Details"
  submissions: "Submissions"
  leaderboard: "Leaderboard"
project:
  submissions: "Submissions"
  no_submissions: "No submissions yet"
  tech_stack: "Tech Stack"
  vote: "Vote on GitHub"
  view_repo: "View Code"
  back_to_hackathon: "Back to Hackathon"
  team_members: "Team Members"
  deliverables: "Deliverables"
  references: "References"
  description: "About"
  no_readme: "Detailed description not yet provided"
  leaderboard_pending: "Judging results have not been published yet"
  filter_all: "All"
```

**Step 3: Verify build succeeds**

Run: `cd site && pnpm run build`
Expected: Build completes without errors.

**Step 4: Commit**

```bash
git add site/src/i18n/zh.yml site/src/i18n/en.yml
git commit -m "feat(site): add i18n keys for tabs and submission detail page"
```

---

### Task 3: Create Tabs UI Component (shadcn Pattern)

**Files:**
- Create: `site/src/components/ui/tabs.tsx`

**Step 1: Create the tabs component**

Following the exact pattern from `site/src/components/ui/accordion.tsx` — import from `"radix-ui"`, use `cn()` from `"@/lib/utils"`:

```tsx
import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-10 items-center gap-1 rounded-lg bg-secondary-bg/50 p-1",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-all",
        "hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-primary/50",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-surface data-[state=active]:text-lime-primary data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-primary/50",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

**Step 2: Verify build succeeds**

Run: `cd site && pnpm run build`
Expected: Build completes (component isn't imported yet but should compile).

**Step 3: Commit**

```bash
git add site/src/components/ui/tabs.tsx
git commit -m "feat(site): add shadcn Tabs UI component using Radix UI"
```

---

### Task 4: Add Submissions Content Collection

**Files:**
- Modify: `site/src/content.config.ts`

**Step 1: Add submission schema and collection**

Add the following after the existing profile collection definition (before the `export`):

```typescript
// === Submission sub-schemas ===

const submissionTeamMemberSchema = z.object({
  github: z.string(),
  role: z.string().optional(),
});

const submissionDeliverablesSchema = z.object({
  repo: z.string().optional(),
  demo: z.string().optional(),
  video: z.string().optional(),
  document: z.object({
    local_path: z.string().optional(),
    r2_url: z.string().optional(),
  }).optional(),
});

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

// === Submission Collection ===

const submissions = defineCollection({
  loader: glob({ pattern: '**/submissions/*/project.yml', base: '../hackathons' }),
  schema: submissionSchema,
});
```

Update the export to include submissions:

```typescript
export const collections = { hackathons, profiles, submissions };
```

**Step 2: Verify build succeeds**

Run: `cd site && pnpm run build`
Expected: Build completes, submissions collection is loaded (4 existing submissions should be found).

**Step 3: Commit**

```bash
git add site/src/content.config.ts
git commit -m "feat(site): add submissions content collection with Zod schema"
```

---

### Task 5: Create HackathonTabs Component

**Files:**
- Create: `site/src/components/HackathonTabs.tsx`

**Step 1: Create the tab wrapper component**

This is a React client component that manages 3 tabs with URL hash synchronization. It receives the tab content as children via slots (rendered HTML strings from Astro).

```tsx
import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface HackathonTabsProps {
  detailsLabel: string;
  submissionsLabel: string;
  leaderboardLabel: string;
  children: React.ReactNode;
}

const TAB_IDS = ['details', 'submissions', 'leaderboard'] as const;
type TabId = typeof TAB_IDS[number];

function getInitialTab(): TabId {
  if (typeof window === 'undefined') return 'details';
  const hash = window.location.hash.replace('#', '');
  if (TAB_IDS.includes(hash as TabId)) return hash as TabId;
  return 'details';
}

export function HackathonTabs({
  detailsLabel,
  submissionsLabel,
  leaderboardLabel,
  children,
}: HackathonTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (TAB_IDS.includes(hash as TabId)) {
        setActiveTab(hash as TabId);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  function handleTabChange(value: string) {
    const tab = value as TabId;
    setActiveTab(tab);
    window.history.replaceState(null, '', `#${tab}`);
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="details">{detailsLabel}</TabsTrigger>
        <TabsTrigger value="submissions">{submissionsLabel}</TabsTrigger>
        <TabsTrigger value="leaderboard">{leaderboardLabel}</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}

export { TabsContent };
export default HackathonTabs;
```

**Step 2: Verify build succeeds**

Run: `cd site && pnpm run build`
Expected: Build completes.

**Step 3: Commit**

```bash
git add site/src/components/HackathonTabs.tsx
git commit -m "feat(site): add HackathonTabs component with URL hash sync"
```

---

### Task 6: Refactor Hackathon Detail Page with Tabs

**Files:**
- Modify: `site/src/pages/hackathons/[...slug].astro`

This is the largest task. The existing page has a 2-column layout (main content 2/3 + sidebar 1/3). We need to:
1. Replace the ad-hoc `fs` submission loading with content collection data
2. Add leaderboard data loading (same pattern as `results/[...slug].astro`)
3. Wrap the main content area in a 3-tab layout
4. Keep the sidebar outside the tabs (always visible)

**Step 1: Update the frontmatter (script section)**

Replace the submission loading section (lines 36-51 that use `fs.readFileSync`) with content collection loading. Also add leaderboard data loading. The full updated frontmatter should be:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Timeline from '../../components/Timeline.astro';
import TrackSection from '../../components/TrackSection.astro';
import JudgeCard from '../../components/JudgeCard.astro';
import FAQAccordion from '../../components/FAQAccordion';
import EventCalendar from '../../components/EventCalendar.astro';
import GitHubRedirect from '../../components/GitHubRedirect.astro';
import ScoreCard from '../../components/ScoreCard';
import DatasetDownload from '../../components/DatasetDownload';
import ProjectCard from '../../components/ProjectCard.astro';
import HackathonTabs, { TabsContent } from '../../components/HackathonTabs';
import RegisterForm from '../../components/forms/RegisterForm';
import NDASignForm from '../../components/forms/NDASignForm';
import AppealForm from '../../components/forms/AppealForm';
import TeamFormationForm from '../../components/forms/TeamFormationForm';
import { getCollection } from 'astro:content';
import { t, localize, getCurrentStage } from '../../lib/i18n';
import type { Lang } from '../../lib/i18n';
import fs from 'node:fs';
import path from 'node:path';

export async function getStaticPaths() {
  const hackathons = await getCollection('hackathons');
  return hackathons.map(entry => ({
    params: { slug: entry.data.hackathon.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const h = entry.data.hackathon;
const lang: Lang = 'zh';
const stage = h.timeline ? getCurrentStage(h.timeline) : 'draft';

// Load submissions from content collection
const allSubmissions = await getCollection('submissions');
const submissions = allSubmissions.filter(s => {
  // Collection ID format: {hackathon-slug}/submissions/{team-slug}/project
  const parts = s.id.split('/');
  return parts[0] === h.slug;
});

// Extract team slug from collection ID
function getTeamSlug(submissionId: string): string {
  const parts = submissionId.split('/');
  // format: {hackathon}/submissions/{team}/project
  return parts[2];
}

// Collect unique tracks from submissions for filter pills
const submissionTracks = [...new Set(submissions.map(s => s.data.project.track))];

// Load leaderboard results
const resultsDir = path.resolve(`../hackathons/${h.slug}/results`);
const showLeaderboard = ['announcement', 'award', 'ended'].includes(stage);
let trackResults: Array<{ track: string; data: any }> = [];
if (showLeaderboard && fs.existsSync(resultsDir)) {
  const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(resultsDir, file), 'utf8');
      const data = JSON.parse(raw);
      trackResults.push({ track: file.replace('.json', ''), data });
    } catch { /* skip invalid */ }
  }
}

// Map track slugs to track names (for leaderboard)
const trackNameMap: Record<string, { name: string; name_zh?: string }> = {};
for (const track of (h.tracks || [])) {
  trackNameMap[track.slug] = { name: track.name, name_zh: track.name_zh };
}

// Build github → profile slug map for judge links
const profiles = await getCollection('profiles');
const githubToProfile = new Map<string, string>();
for (const p of profiles) {
  if (p.data.hacker.github) {
    githubToProfile.set(p.data.hacker.github, p.id);
  }
}

// Prepare tracks data for form components
const formTracks = (h.tracks ?? []).map((tr: any) => ({
  slug: tr.slug,
  name: tr.name,
  name_zh: tr.name_zh,
}));
---
```

**Step 2: Update the template**

Replace the entire template (everything after the `---` closing) with the new tabbed layout:

```astro
<BaseLayout title={localize(lang, h.name, h.name_zh)} description={localize(lang, h.tagline, h.tagline_zh)}>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

    {/* --- Hero --- */}
    <div class="mb-12">
      <div class="flex items-center gap-3 mb-4">
        <span class="text-xs px-3 py-1 rounded-full bg-secondary-bg text-muted">
          {t(lang, `hackathon.type_${h.type.replace('-', '_')}`)}
        </span>
        <span class="text-xs px-3 py-1 rounded-full bg-lime-primary/20 text-lime-primary">
          {t(lang, `stage.${stage}`)}
        </span>
      </div>

      <h1 class="text-3xl md:text-4xl font-heading font-bold text-white mb-3">
        {localize(lang, h.name, h.name_zh)}
      </h1>

      <p class="text-lg text-muted max-w-3xl mb-6">
        {localize(lang, h.tagline, h.tagline_zh)}
      </p>

      {/* Action buttons */}
      <div class="flex flex-wrap gap-3">
        {(stage === 'registration') && (
          <a
            href="#register-section"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors"
          >
            {t(lang, 'hackathon.register')}
          </a>
        )}
        {(stage === 'submission') && (
          <GitHubRedirect
            action="submit"
            hackathonSlug={h.slug}
            label={t(lang, 'hackathon.submit')}
            class="bg-lime-primary text-near-black hover:bg-lime-primary/80"
          />
        )}
        {(['announcement', 'award', 'ended'].includes(stage)) && (
          <a
            href="#leaderboard"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors"
          >
            {t(lang, 'hackathon.results')}
          </a>
        )}
        {(stage === 'announcement') && (
          <a
            href="#appeal-section"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary-bg text-white text-sm font-medium hover:bg-secondary-bg/80 transition-colors"
          >
            {t(lang, 'hackathon.appeal')}
          </a>
        )}
        {h.legal?.nda?.required && (
          <span class="inline-flex items-center text-xs text-warning px-3 py-2 rounded-lg bg-warning/10">
            {t(lang, 'hackathon.nda_warning')}
          </span>
        )}
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* --- Main content with Tabs (2/3) --- */}
      <div class="lg:col-span-2">
        <HackathonTabs
          client:load
          detailsLabel={t(lang, 'tab.details')}
          submissionsLabel={t(lang, 'tab.submissions')}
          leaderboardLabel={t(lang, 'tab.leaderboard')}
        >
          {/* Tab 1: Details */}
          <TabsContent value="details" client:load>
            <div class="space-y-12 pt-6">

              {/* Description */}
              <section>
                <div class="prose prose-invert prose-sm max-w-none text-light-gray">
                  <p>{localize(lang, h.description, h.description_zh)}</p>
                </div>
              </section>

              {/* Organizers */}
              {h.organizers && h.organizers.length > 0 && (
                <section>
                  <h2 class="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.organizers')}</h2>
                  <div class="flex flex-wrap gap-4">
                    {h.organizers.map(org => (
                      <div class="flex items-center gap-3 px-4 py-3 rounded-lg border border-secondary-bg bg-dark-bg">
                        <div>
                          <p class="text-white text-sm font-medium">{localize(lang, org.name, org.name_zh)}</p>
                          {org.role && <p class="text-muted text-xs">{org.role}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Tracks */}
              {h.tracks && h.tracks.length > 0 && (
                <section>
                  <h2 class="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.tracks')}</h2>
                  <div class="space-y-6">
                    {h.tracks.map(track => (
                      <TrackSection track={track} lang={lang} />
                    ))}
                  </div>
                </section>
              )}

              {/* Eligibility */}
              {h.eligibility && (
                <section>
                  <h2 class="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.eligibility')}</h2>
                  <div class="rounded-lg border border-secondary-bg bg-dark-bg p-6 space-y-3">
                    {h.eligibility.team_size && (
                      <p class="text-sm text-light-gray">
                        Team size: {h.eligibility.team_size.min}–{h.eligibility.team_size.max}
                        {h.eligibility.allow_solo && ' (solo allowed)'}
                      </p>
                    )}
                    {h.eligibility.restrictions && h.eligibility.restrictions.map(r => (
                      <p class="text-sm text-muted">{r}</p>
                    ))}
                    {h.eligibility.blacklist && h.eligibility.blacklist.map(b => (
                      <p class="text-sm text-error">{b}</p>
                    ))}
                  </div>
                </section>
              )}

              {/* Datasets */}
              {h.datasets && h.datasets.length > 0 && (
                <section>
                  <h2 class="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.datasets')}</h2>
                  <DatasetDownload client:visible datasets={h.datasets} hackathonSlug={h.slug} lang={lang} />
                </section>
              )}

              {/* Legal / Compliance */}
              {h.legal && (
                <section>
                  <h2 class="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.legal')}</h2>
                  <div class="rounded-lg border border-secondary-bg bg-dark-bg p-6 space-y-3">
                    {h.legal.license && <p class="text-sm text-light-gray">License: {h.legal.license}</p>}
                    {h.legal.ip_ownership && <p class="text-sm text-light-gray">IP: {h.legal.ip_ownership}</p>}
                    {h.legal.compliance_notes && h.legal.compliance_notes.map(note => (
                      <p class="text-sm text-muted">{note}</p>
                    ))}
                    {h.legal.data_policy && <p class="text-sm text-muted">{h.legal.data_policy}</p>}
                  </div>
                </section>
              )}

              {/* NDA Information — Smart Form */}
              {h.legal?.nda?.required && (
                <section>
                  <h2 class="text-xl font-heading font-bold text-white mb-4">
                    {t(lang, 'hackathon.nda_sign')}
                  </h2>
                  <NDASignForm
                    client:visible
                    hackathonSlug={h.slug}
                    ndaDocumentUrl={h.legal.nda.document_url}
                    ndaSummary={h.legal.nda.summary}
                    lang={lang}
                  />
                </section>
              )}

              {/* Register Form (during registration stage) */}
              {stage === 'registration' && (
                <section id="register-section">
                  <h2 class="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.register')}</h2>
                  <RegisterForm
                    client:visible
                    hackathonSlug={h.slug}
                    hackathonName={localize(lang, h.name, h.name_zh)}
                    tracks={formTracks}
                    ndaRequired={!!h.legal?.nda?.required}
                    lang={lang}
                  />
                </section>
              )}

              {/* Team Formation (during registration/development stages) */}
              {(['registration', 'development'].includes(stage)) && (
                <section id="team-formation-section">
                  <h2 class="text-xl font-heading font-bold text-white mb-4">
                    {lang === 'zh' ? '组队 / 寻找队友' : 'Team Formation'}
                  </h2>
                  <TeamFormationForm
                    client:visible
                    hackathonSlug={h.slug}
                    tracks={formTracks}
                    lang={lang}
                  />
                </section>
              )}

              {/* Appeal Form (during announcement stage) */}
              {stage === 'announcement' && (
                <section id="appeal-section">
                  <h2 class="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.appeal')}</h2>
                  <AppealForm
                    client:visible
                    hackathonSlug={h.slug}
                    tracks={formTracks}
                    teams={[]}
                    lang={lang}
                  />
                </section>
              )}

              {/* FAQ */}
              {h.faq && h.faq.length > 0 && (
                <section>
                  <h2 class="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.faq')}</h2>
                  <FAQAccordion client:visible items={h.faq} lang={lang} />
                </section>
              )}

              {/* ScoreCard (visible during judging stage) */}
              {stage === 'judging' && h.tracks && h.tracks.map(track => (
                track.judging?.criteria && track.judging.criteria.length > 0 && (
                  <section>
                    <h2 class="text-xl font-heading font-bold text-white mb-4">
                      {t(lang, 'score.title')} — {localize(lang, track.name, track.name_zh)}
                    </h2>
                    <ScoreCard
                      client:visible
                      hackathonSlug={h.slug}
                      trackSlug={track.slug}
                      criteria={track.judging.criteria}
                      lang={lang}
                    />
                  </section>
                )
              ))}
            </div>
          </TabsContent>

          {/* Tab 2: Submissions */}
          <TabsContent value="submissions" client:load>
            <div class="space-y-6 pt-6">
              {/* Track filter pills */}
              {submissionTracks.length > 1 && (
                <div class="flex flex-wrap gap-2">
                  <span class="text-xs px-3 py-1.5 rounded-full bg-lime-primary/20 text-lime-primary cursor-pointer">
                    {t(lang, 'project.filter_all')}
                  </span>
                  {submissionTracks.map(trackSlug => (
                    <span class="text-xs px-3 py-1.5 rounded-full bg-secondary-bg text-muted hover:text-white cursor-pointer transition-colors">
                      {trackNameMap[trackSlug] ? localize(lang, trackNameMap[trackSlug].name, trackNameMap[trackSlug].name_zh) : trackSlug}
                    </span>
                  ))}
                </div>
              )}

              {submissions.length === 0 ? (
                <div class="rounded-lg border border-secondary-bg bg-dark-bg p-12 text-center">
                  <p class="text-muted text-lg">{t(lang, 'project.no_submissions')}</p>
                </div>
              ) : (
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {submissions.map(sub => (
                    <ProjectCard
                      project={sub.data.project}
                      hackathonSlug={h.slug}
                      teamSlug={getTeamSlug(sub.id)}
                      lang={lang}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 3: Leaderboard */}
          <TabsContent value="leaderboard" client:load>
            <div class="space-y-8 pt-6">
              {!showLeaderboard ? (
                <div class="rounded-lg border border-secondary-bg bg-dark-bg p-12 text-center">
                  <p class="text-muted text-lg">{t(lang, 'project.leaderboard_pending')}</p>
                </div>
              ) : trackResults.length === 0 ? (
                <div class="rounded-lg border border-secondary-bg bg-dark-bg p-12 text-center">
                  <p class="text-muted text-lg">{t(lang, 'result.no_results')}</p>
                </div>
              ) : (
                trackResults.map(({ track, data }) => {
                  const trackInfo = trackNameMap[track];
                  return (
                    <section>
                      <h2 class="text-xl font-heading font-bold text-white mb-4">
                        {trackInfo ? localize(lang, trackInfo.name, trackInfo.name_zh) : track}
                      </h2>
                      <div class="text-xs text-muted mb-4">
                        {lang === 'zh' ? '计算时间' : 'Calculated'}: {new Date(data.calculated_at).toLocaleString()} ·
                        {data.total_judges} {lang === 'zh' ? '位评委' : 'judges'} ·
                        {data.total_teams} {lang === 'zh' ? '支队伍' : 'teams'}
                      </div>
                      <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                          <thead>
                            <tr class="border-b border-secondary-bg text-muted">
                              <th class="text-left py-3 px-2">{t(lang, 'result.rank')}</th>
                              <th class="text-left py-3 px-2">{t(lang, 'result.team')}</th>
                              <th class="text-right py-3 px-2">{t(lang, 'result.final_score')}</th>
                              {data.rankings[0]?.criteria_breakdown?.map(c => (
                                <th class="text-right py-3 px-2 text-xs">
                                  {c.criterion}<br/>
                                  <span class="text-muted font-normal">({c.weight}%)</span>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.rankings.map(r => (
                              <tr class="border-b border-secondary-bg/50 hover:bg-secondary-bg/20">
                                <td class="py-3 px-2">
                                  <span class={`font-code font-bold ${r.rank <= 3 ? 'text-lime-primary' : 'text-white'}`}>
                                    #{r.rank}
                                  </span>
                                </td>
                                <td class="py-3 px-2 text-white font-medium">{r.team}</td>
                                <td class="py-3 px-2 text-right font-code text-lime-primary font-bold">
                                  {r.final_score.toFixed(1)}
                                </td>
                                {r.criteria_breakdown?.map(c => (
                                  <td class="py-3 px-2 text-right font-code text-light-gray">
                                    {c.average.toFixed(1)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  );
                })
              )}
            </div>
          </TabsContent>
        </HackathonTabs>
      </div>

      {/* --- Sidebar (1/3) — always visible --- */}
      <aside class="space-y-8">
        {/* Timeline */}
        {h.timeline && (
          <section>
            <h2 class="text-lg font-heading font-bold text-white mb-4">{t(lang, 'hackathon.timeline')}</h2>
            <Timeline timeline={h.timeline} lang={lang} />
          </section>
        )}

        {/* Events */}
        {h.events && h.events.length > 0 && (
          <section>
            <h2 class="text-lg font-heading font-bold text-white mb-4">{t(lang, 'hackathon.events')}</h2>
            <EventCalendar events={h.events} lang={lang} />
          </section>
        )}

        {/* Judges */}
        {h.judges && h.judges.length > 0 && (
          <section>
            <h2 class="text-lg font-heading font-bold text-white mb-4">{t(lang, 'hackathon.judges')}</h2>
            <div class="space-y-3">
              {h.judges.map(judge => (
                <JudgeCard judge={judge} lang={lang} profileSlug={githubToProfile.get(judge.github)} />
              ))}
            </div>
          </section>
        )}
      </aside>
    </div>
  </div>
</BaseLayout>
```

**Step 3: Verify build succeeds**

Run: `cd site && pnpm run build`
Expected: Build completes. Hackathon detail pages now render with 3 tabs.

**Step 4: Commit**

```bash
git add site/src/pages/hackathons/\[...slug\].astro
git commit -m "feat(site): refactor hackathon detail page with 3-tab layout"
```

---

### Task 7: Update ProjectCard to Link to Detail Page

**Files:**
- Modify: `site/src/components/ProjectCard.astro`

**Step 1: Update the component**

Add `hackathonSlug` and `teamSlug` props, wrap the card in an `<a>` tag linking to `/projects/{hackathon}/{team}`:

```astro
---
import { localize } from '../lib/i18n';
import type { Lang } from '../lib/i18n';

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

const { project, hackathonSlug, teamSlug, lang } = Astro.props;
const detailUrl = `/projects/${hackathonSlug}/${teamSlug}`;
---

<a href={detailUrl} class="block rounded-lg border border-secondary-bg bg-dark-bg p-5 hover:border-lime-primary/30 transition-colors group">
  <div class="flex items-start justify-between mb-3">
    <div>
      <h4 class="text-white font-medium text-sm group-hover:text-lime-primary transition-colors">
        {localize(lang, project.name, project.name_zh)}
      </h4>
      {project.tagline && (
        <p class="text-muted text-xs mt-1">{localize(lang, project.tagline, project.tagline_zh)}</p>
      )}
    </div>
    <span class="text-xs px-2 py-1 rounded-full bg-secondary-bg text-muted whitespace-nowrap">
      {project.track}
    </span>
  </div>

  <!-- Team -->
  <div class="flex flex-wrap gap-2 mb-3">
    {project.team.map(member => (
      <span class="flex items-center gap-1 text-xs text-muted">
        <img
          src={`https://github.com/${member.github}.png?size=20`}
          alt={member.github}
          class="w-4 h-4 rounded-full"
          loading="lazy"
        />
        {member.github}
      </span>
    ))}
  </div>

  <!-- Tech stack -->
  {project.tech_stack && project.tech_stack.length > 0 && (
    <div class="flex flex-wrap gap-1">
      {project.tech_stack.map(tech => (
        <span class="text-xs px-2 py-0.5 rounded-full bg-neon-blue/10 text-neon-blue">
          {tech}
        </span>
      ))}
    </div>
  )}
</a>
```

Note: The card itself is now the link — individual repo/demo links are moved to the detail page. Team members are shown as non-clickable avatars on the card (clicking anywhere goes to the detail page).

**Step 2: Verify build succeeds**

Run: `cd site && pnpm run build`
Expected: Build completes. Submission cards now link to `/projects/{hackathon}/{team}`.

**Step 3: Commit**

```bash
git add site/src/components/ProjectCard.astro
git commit -m "feat(site): make ProjectCard clickable with link to detail page"
```

---

### Task 8: Create Submission Detail Page

**Files:**
- Create: `site/src/pages/projects/[hackathon]/[team].astro`

**Step 1: Create the directory**

Run: `mkdir -p site/src/pages/projects/\[hackathon\]`

**Step 2: Create the page**

```astro
---
import BaseLayout from '../../../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';
import { t, localize } from '../../../lib/i18n';
import type { Lang } from '../../../lib/i18n';
import fs from 'node:fs';
import path from 'node:path';

export async function getStaticPaths() {
  const allSubmissions = await getCollection('submissions');
  return allSubmissions.map(entry => {
    // ID format: {hackathon}/submissions/{team}/project
    const parts = entry.id.split('/');
    const hackathon = parts[0];
    const team = parts[2];
    return {
      params: { hackathon, team },
      props: { entry },
    };
  });
}

const { entry } = Astro.props;
const { hackathon, team } = Astro.params;
const project = entry.data.project;
const lang: Lang = 'zh';

// Try to read README.mdx for rich content
const readmePath = path.resolve(`../hackathons/${hackathon}/submissions/${team}/README.mdx`);
let readmeContent: string | null = null;
if (fs.existsSync(readmePath)) {
  readmeContent = fs.readFileSync(readmePath, 'utf8');
}

// Also try README.md as fallback
if (!readmeContent) {
  const mdPath = path.resolve(`../hackathons/${hackathon}/submissions/${team}/README.md`);
  if (fs.existsSync(mdPath)) {
    readmeContent = fs.readFileSync(mdPath, 'utf8');
  }
}

// Get hackathon name for breadcrumb
const hackathons = await getCollection('hackathons');
const hackathonEntry = hackathons.find(h => h.data.hackathon.slug === hackathon);
const hackathonName = hackathonEntry
  ? localize(lang, hackathonEntry.data.hackathon.name, hackathonEntry.data.hackathon.name_zh)
  : hackathon;

// Track name lookup
const trackName = hackathonEntry?.data.hackathon.tracks?.find(tr => tr.slug === project.track);
---

<BaseLayout
  title={`${localize(lang, project.name, project.name_zh)} — ${hackathonName}`}
  description={localize(lang, project.tagline, project.tagline_zh) || localize(lang, project.name, project.name_zh)}
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

    {/* Breadcrumb */}
    <a href={`/hackathons/${hackathon}#submissions`} class="text-sm text-muted hover:text-white mb-6 inline-block">
      ← {hackathonName}
    </a>

    {/* Header */}
    <div class="flex items-start justify-between mb-8">
      <div>
        <h1 class="text-3xl font-heading font-bold text-white mb-2">
          {localize(lang, project.name, project.name_zh)}
        </h1>
        {project.tagline && (
          <p class="text-lg text-muted">
            {localize(lang, project.tagline, project.tagline_zh)}
          </p>
        )}
      </div>
      {trackName && (
        <span class="text-xs px-3 py-1.5 rounded-full bg-secondary-bg text-muted whitespace-nowrap">
          {localize(lang, trackName.name, trackName.name_zh)}
        </span>
      )}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main content (2/3) */}
      <div class="lg:col-span-2">
        {readmeContent ? (
          <div class="prose prose-invert prose-sm max-w-none text-light-gray">
            <Fragment set:html={readmeContent} />
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
      </div>

      {/* Sidebar (1/3) */}
      <aside class="space-y-6">

        {/* Team Members */}
        <section>
          <h3 class="text-sm font-medium text-muted mb-3">{t(lang, 'project.team_members')}</h3>
          <div class="space-y-2">
            {project.team.map(member => (
              <a
                href={`https://github.com/${member.github}`}
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary-bg/50 transition-colors"
              >
                <img
                  src={`https://github.com/${member.github}.png?size=40`}
                  alt={member.github}
                  class="w-8 h-8 rounded-full"
                  loading="lazy"
                />
                <div>
                  <p class="text-white text-sm">{member.github}</p>
                  {member.role && <p class="text-muted text-xs">{member.role}</p>}
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        {project.tech_stack && project.tech_stack.length > 0 && (
          <section>
            <h3 class="text-sm font-medium text-muted mb-3">{t(lang, 'project.tech_stack')}</h3>
            <div class="flex flex-wrap gap-1.5">
              {project.tech_stack.map(tech => (
                <span class="text-xs px-2 py-1 rounded-full bg-neon-blue/10 text-neon-blue">
                  {tech}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Deliverables */}
        {project.deliverables && (
          <section>
            <h3 class="text-sm font-medium text-muted mb-3">{t(lang, 'project.deliverables')}</h3>
            <div class="space-y-2">
              {project.deliverables.repo && (
                <a
                  href={project.deliverables.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 p-2 rounded-lg border border-secondary-bg hover:border-lime-primary/30 transition-colors text-sm text-white"
                >
                  <span class="text-lime-primary">→</span> {t(lang, 'project.view_repo')}
                </a>
              )}
              {project.deliverables.demo && (
                <a
                  href={project.deliverables.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 p-2 rounded-lg border border-secondary-bg hover:border-neon-blue/30 transition-colors text-sm text-white"
                >
                  <span class="text-neon-blue">→</span> Demo
                </a>
              )}
              {project.deliverables.video && (
                <a
                  href={project.deliverables.video}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-2 p-2 rounded-lg border border-secondary-bg hover:border-neon-purple/30 transition-colors text-sm text-white"
                >
                  <span class="text-neon-purple">→</span> Video
                </a>
              )}
            </div>
          </section>
        )}
      </aside>
    </div>
  </div>
</BaseLayout>
```

**Step 3: Verify build succeeds**

Run: `cd site && pnpm run build`
Expected: Build completes. 4 pages generated at `/projects/dishuihu-ai-opc-global-challenge-2026/{team}/`.

**Step 4: Commit**

```bash
git add site/src/pages/projects/
git commit -m "feat(site): add submission detail page at /projects/[hackathon]/[team]"
```

---

### Task 9: Create Mock README.mdx Files

**Files:**
- Create: `hackathons/dishuihu-ai-opc-global-challenge-2026/submissions/team-ai-voyager/README.mdx`
- Create: `hackathons/dishuihu-ai-opc-global-challenge-2026/submissions/team-onebot/README.mdx`
- Create: `hackathons/dishuihu-ai-opc-global-challenge-2026/submissions/team-global-bridge/README.mdx`
- Create: `hackathons/dishuihu-ai-opc-global-challenge-2026/submissions/team-smart-cs/README.mdx`

**Step 1: Create README.mdx for team-ai-voyager**

```mdx
# AI Voyager — AI跨境市场研究助手

## 项目概述

AI Voyager 是一款面向独立创业者和一人公司的智能市场研究助手。通过多智能体AI架构，
自动完成50+国家/地区的竞品分析、市场规模评估和法规合规研究。

## 核心功能

- **智能市场扫描**: 输入产品关键词，自动分析目标市场的竞争格局
- **法规合规检查**: 自动检索并总结目标国家的准入法规、数据保护要求
- **多语言报告生成**: 支持中、英、日、韩等语言的自动翻译和本地化建议
- **市场规模预测**: 基于公开数据的TAM/SAM/SOM估算模型

## 技术架构

```
┌─────────────────┐     ┌─────────────────┐
│   Next.js 前端   │────│  Supabase Auth  │
└────────┬────────┘     └─────────────────┘
         │
┌────────▼────────┐
│  LangChain 编排  │
├─────────────────┤
│  Agent: 市场分析 │
│  Agent: 法规检索 │
│  Agent: 报告生成 │
└────────┬────────┘
         │
┌────────▼────────┐
│   OpenAI API    │
└─────────────────┘
```

## 使用方法

1. 注册账号并创建项目
2. 输入产品描述和目标市场
3. 系统自动调度多个AI Agent进行分析
4. 在仪表盘中查看分析报告
```

**Step 2: Create README.mdx for team-onebot**

```mdx
# OneBot — 一站式客服机器人平台

## 项目概述

OneBot 是一个企业级客服机器人平台，支持多渠道接入（微信公众号、企业微信、飞书、钉钉），
通过RAG（检索增强生成）技术实现基于企业知识库的精准回答。

## 核心功能

- **多渠道统一接入**: 一套配置，同时部署到多个IM平台
- **知识库管理**: 支持PDF、Word、网页等多种格式的知识导入
- **对话流设计器**: 可视化拖拽式对话流程设计
- **人工转接**: 智能判断何时将对话转接给人工客服

## 技术亮点

- 使用 LlamaIndex 构建 RAG Pipeline，支持 Hybrid Search
- 基于 WebSocket 的实时对话，延迟 < 500ms
- 向量数据库使用 Qdrant，支持百万级文档检索
```

**Step 3: Create README.mdx for team-global-bridge**

```mdx
# Global Bridge — 跨境电商合规助手

## 项目概述

Global Bridge 帮助跨境电商卖家自动处理多国合规事务，包括产品标签翻译、
海关编码匹配、进口法规查询和资质证书管理。

## 核心功能

- **HS编码智能匹配**: 输入产品描述，自动推荐海关编码
- **多国标签生成**: 根据目标国法规自动生成合规标签
- **证书管理**: 跟踪和提醒各类资质证书的有效期
- **合规风险评估**: 分析产品在目标市场的合规风险等级

## 技术架构

后端采用 FastAPI + PostgreSQL，前端使用 Vue 3 + Naive UI。
合规数据库覆盖 30+ 国家的进出口法规，每周自动更新。
```

**Step 4: Create README.mdx for team-smart-cs**

```mdx
# Smart CS — 智能客服质检系统

## 项目概述

Smart CS 是一款基于大语言模型的客服质检系统，自动分析客服对话记录，
从服务态度、问题解决率、合规话术等维度进行评分和改进建议。

## 核心功能

- **自动质检评分**: 批量分析客服对话，按维度自动评分
- **话术合规检测**: 检测是否包含禁用词、敏感信息泄露
- **情绪分析**: 实时监测客户情绪变化趋势
- **改进报告**: 针对每位客服生成个性化改进建议

## 技术亮点

- 微调 Qwen-7B 模型用于质检评分，准确率 92%+
- 支持实时流式分析，每分钟处理 1000+ 条对话
- 提供 RESTful API，可与现有CRM系统集成
```

**Step 5: Verify build succeeds**

Run: `cd site && pnpm run build`
Expected: Build completes. Detail pages now show README content.

**Step 6: Commit**

```bash
git add hackathons/dishuihu-ai-opc-global-challenge-2026/submissions/*/README.mdx
git commit -m "feat(data): add mock README.mdx for 4 submission teams"
```

---

### Task 10: Update PRD and Specs

**Files:**
- Modify: `docs/specs/synnovator-prd.md` — Add README.mdx to submission structure, add `/projects/` route
- Modify: `docs/acceptance/visitor.spec.md` — Update US-V-004.2 with MDX rendering and tab navigation

**Step 1: Read current PRD and specs**

Read these files to find the exact sections to update.

**Step 2: Update PRD**

In the submission directory structure section, add README.mdx:
```
hackathons/{slug}/submissions/{team-slug}/
├── project.yml          # Metadata
└── README.mdx           # Rich project description (optional)
```

In the routes section, add:
```
/projects/{hackathon}/{team}  — Submission detail page
```

**Step 3: Update visitor spec**

Add/update scenario for US-V-004.2:
```gherkin
Scenario: View submission detail with MDX content
  Given a submission with README.mdx exists
  When I navigate to /projects/{hackathon}/{team}
  Then I see the rendered MDX content
  And the sidebar shows team members, tech stack, and deliverables

Scenario: Hackathon detail page tabs
  Given a hackathon detail page
  When I click the "Submissions" tab
  Then I see submission cards in a grid
  And each card links to the detail page

Scenario: Leaderboard tab
  Given a hackathon in announcement stage
  When I click the "Leaderboard" tab
  Then I see rankings by track with scores
```

**Step 4: Commit**

```bash
git add docs/specs/synnovator-prd.md docs/acceptance/visitor.spec.md
git commit -m "docs: update PRD and visitor spec for submission detail pages and tabs"
```

---

### Task 11: Verify Full Build and Cleanup

**Step 1: Run full build**

Run: `cd site && pnpm run build`
Expected: Build completes with no errors. Pages generated include:
- `/hackathons/{slug}/` (tabbed layout)
- `/projects/{hackathon}/{team}/` (4 submission detail pages)

**Step 2: Manual verification checklist**

- [ ] Hackathon detail page shows 3 tabs
- [ ] "详情" tab contains all existing content
- [ ] "提案" tab shows 4 submission cards
- [ ] "排行榜" tab shows leaderboard (or pending message)
- [ ] Clicking a submission card navigates to `/projects/{hackathon}/{team}`
- [ ] Detail page renders README.mdx content
- [ ] Detail page sidebar shows team, tech stack, deliverables
- [ ] Tab state persists via URL hash
- [ ] Results link in hero points to `#leaderboard` hash

**Step 3: Commit all remaining changes**

```bash
git add -A
git commit -m "feat(site): complete submissions redesign with tabs and detail pages"
```
