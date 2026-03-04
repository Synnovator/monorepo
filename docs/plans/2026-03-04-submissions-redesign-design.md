# Submissions Redesign — Design Document

**Date:** 2026-03-04
**Status:** Approved

## Goal

Redesign the submissions system to support rich project pages with MDX content, independent detail pages at `/projects/{hackathon}/{team}`, and a tabbed hackathon detail page with Details / Submissions / Leaderboard tabs.

## Architecture

Content Collection approach: add a `submissions` collection to `content.config.ts` using glob loader over `../hackathons/**/submissions/*/project.yml`. Each submission directory contains `project.yml` (metadata) + optional `README.mdx` (rich content with custom components). The hackathon detail page gets a 3-tab layout (Details / Submissions / Leaderboard) with the sidebar (timeline, events, judges) always visible.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Content format | Separate README.mdx alongside project.yml | Clean separation of metadata vs presentation |
| URL pattern | `/projects/{hackathon-slug}/{team}` | Short, independent namespace, future-extensible |
| Tab layout | 3 tabs + persistent sidebar | Sidebar context always relevant; leaderboard replaces separate /results page |
| MD features | MDX with custom components | Supports VideoEmbed, DemoPreview, ImageGallery |
| Tab library | @radix-ui/react-tabs | Consistent with existing shadcn/ui accordion pattern |

## Data Architecture

### Submission Directory Structure

```
hackathons/{slug}/submissions/{team-slug}/
├── project.yml          # Metadata: team, track, deliverables, tech_stack
└── README.mdx           # Rich content: description, screenshots, architecture
```

### Content Collection

```typescript
// content.config.ts
const submissions = defineCollection({
  loader: glob({ pattern: '**/submissions/*/project.yml', base: '../hackathons' }),
  schema: submissionSchema,
});
```

Collection ID format: `{hackathon-slug}/submissions/{team-slug}/project`
Parse hackathon slug and team slug from ID path segments.

### MDX Custom Components

- `<VideoEmbed url="..." />` — YouTube/Bilibili auto-detect player
- `<DemoPreview url="..." height={400} />` — sandboxed iframe
- `<ImageGallery images={["url1", "url2"]} />` — responsive lightbox gallery

## Page Design

### Hackathon Detail Page (Tabbed)

```
┌─────────────────────────────────┬──────────────┐
│  Hero (title, stage, actions)   │  Timeline    │
├─────────────────────────────────┤  Events      │
│  [详情] [提案] [排行榜]  ← Tabs │  Judges      │
├─────────────────────────────────┤              │
│  Tab Content (switches)         │  (always     │
│                                 │   visible)   │
└─────────────────────────────────┴──────────────┘
```

**Tab 1 — 详情 (Details):**
Current page content: description, tracks, eligibility, legal, FAQ, forms (register, NDA, team, appeal).

**Tab 2 — 提案 (Submissions):**
- Track filter pills at top (All / AI Application / Enterprise Challenge / etc.)
- Grid of submission cards (2 columns on desktop)
- Each card clickable → `/projects/{hackathon}/{team}`
- Card shows: name, tagline, track badge, team avatars, tech stack pills

**Tab 3 — 排行榜 (Leaderboard):**
- Replaces current `/results/{slug}` page
- Per-track sub-tabs
- Rankings table with scores and criteria breakdown
- Only shows data during announcement/award/ended stages
- Shows "评审结果尚未公布" during earlier stages

Tab state persisted via URL hash (`#details`, `#submissions`, `#leaderboard`).

### Submission Detail Page (`/projects/[hackathon]/[team]`)

```
┌─────────────────────────────────────────┐
│  ← Back to hackathon                    │
│  Project Name           [Track Badge]   │
│  Tagline                                │
├──────────────────────┬──────────────────┤
│  README.mdx content  │  Sidebar:        │
│  (rendered MDX with   │  - Team members  │
│   custom components)  │    (avatar+link) │
│                       │  - Tech stack    │
│                       │  - Deliverables  │
│                       │    (repo, demo,  │
│                       │     video, docs) │
│                       │  - References    │
└──────────────────────┴──────────────────┘
```

Fallback: if no README.mdx exists, render `project.yml` description field as plain text.

## PRD/Spec Updates

1. **synnovator-prd.md** — Add README.mdx to submission directory structure, add `/projects/` route
2. **visitor.spec.md** — Update US-V-004.2 with MDX rendering and tab navigation
3. **design-system.md** — Add Tab component spec
4. **i18n** — Add keys: `tab.details`, `tab.submissions`, `tab.leaderboard`, submission detail labels

## Mock Data

Update 4 existing submissions (team-ai-voyager, team-onebot, team-global-bridge, team-smart-cs) with README.mdx files containing project overviews, architecture diagrams (placeholder images), key features, and usage examples.
