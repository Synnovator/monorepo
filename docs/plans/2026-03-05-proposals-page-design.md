# Proposals Page Design

**Date**: 2026-03-05
**Status**: Approved
**Approach**: A (Pure Static Build + Client-side View Toggle)

## Overview

Add a global "Proposals" (提案) listing page that aggregates all project submissions across all hackathons. Add a "提案" navigation item to the header.

## Changes

### 1. Header Navigation

Modify `NavBar.astro` center navigation to include four items:
- 活动 → `/`
- **提案** → `/proposals` (new)
- 指南 → `/guides/hacker`
- 创建活动 → `/create-hackathon` (unchanged)

### 2. New Page: `/proposals`

**File**: `site/src/pages/proposals.astro`

**Data Loading** (build time):
- `getCollection('submissions')` — all project submissions
- `getCollection('hackathons')` — for activity names and metadata
- Join submissions to their parent hackathon via slug

**Schema Change**: Add optional `likes: number` field to project.yml schema (default: 0). Used for static sort ordering; will be replaced by D1-backed real-time likes in a future iteration.

### 3. Page Layout

```
NavBar
─────────────────────────────────
Page Title: 提案
Subtitle: 浏览所有活动的参赛提案

[按热门排序] [按活动分组]   ← toggle buttons

── Hot View (default, sorted by likes desc) ──
[ProjectCard] [ProjectCard] [ProjectCard]
[ProjectCard] [ProjectCard] ...

── OR: Grouped by Activity View ──
## 滴水湖 AI OPC 全球挑战赛 2026
[ProjectCard] [ProjectCard] [ProjectCard]

## 另一个活动
[ProjectCard] [ProjectCard]
─────────────────────────────────
```

### 4. Sorting Toggle

- Two buttons styled with existing `.filter-tab` pattern (lime-primary active state)
- Client-side JavaScript toggles between views (same pattern as homepage status filters)
- Default view: Hot (by likes descending)
- Grouped view: sections per hackathon, each with activity name as heading

### 5. Component Reuse

- Reuse existing `ProjectCard.astro` component
- Add likes count badge to ProjectCard (small heart icon + number)
- Responsive grid: 1 col mobile → 2 col tablet → 3 col desktop

### 6. i18n

Add translation keys to `zh.yml` and `en.yml`:
- `proposals.title` — 提案 / Proposals
- `proposals.subtitle` — 浏览所有活动的参赛提案 / Browse all hackathon proposals
- `proposals.sort_hot` — 按热门排序 / Sort by Hot
- `proposals.sort_activity` — 按活动分组 / Group by Activity
- `proposals.nav` — 提案 / Proposals

## Future Iterations

- Replace static `likes` field with Cloudflare D1-backed real-time likes
- Add `/api/proposals/like` endpoint for authenticated like/unlike
- Add search/filter functionality (by track, tech stack, etc.)

## Files to Modify

| File | Change |
|------|--------|
| `site/src/components/NavBar.astro` | Add "提案" nav item |
| `site/src/pages/proposals.astro` | New page |
| `site/src/content.config.ts` | Add `likes` field to submissions schema |
| `site/src/components/ProjectCard.astro` | Add optional likes badge |
| `site/src/i18n/zh.yml` | Add translation keys |
| `site/src/i18n/en.yml` | Add translation keys |
| `hackathons/*/submissions/*/project.yml` | Add `likes` field (optional) |
