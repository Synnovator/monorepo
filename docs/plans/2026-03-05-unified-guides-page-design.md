# Unified Guides Page Design

**Date:** 2026-03-05
**Status:** Approved

## Problem

The NavBar links "指南" to `/guides/hacker` only. The organizer and judge guides exist but are unreachable without typing the URL directly. Users need a single entry point to discover all three role guides.

## Decision

**Approach A: Pure Static Astro Pages** — No JS, no client-side framework, just Astro components and `<a>` links.

## Design

### 1. Index Page (`/guides`)

New `site/src/pages/guides/index.astro`:

- Hero area with title + subtitle (from i18n)
- 3 feature cards in responsive grid (`grid-cols-1 md:grid-cols-3`)
- Each card: role emoji + title + subtitle + 2-3 bullet points, entire card clickable
  - 参赛者 🚀 — profile, registration, team, submission
  - 组织者 🏗️ — creating hackathon, config, managing submissions
  - 评委 ⚖️ — profile, scoring, conflict of interest
- Card styling: `bg-secondary-bg`, `border-secondary-bg`, hover `border-lime-primary`
- Links to `/guides/hacker`, `/guides/organizer`, `/guides/judge`

### 2. GuideTabBar Component

New `site/src/components/GuideTabBar.astro`:

- Placed at top of each guide subpage, between hero and step content
- Props: `activeRole: 'hacker' | 'organizer' | 'judge'`
- 3 horizontal `<a>` link tabs
- Active tab: `border-b-2 border-lime-primary text-lime-primary`
- Inactive tabs: `text-muted hover:text-white transition-colors`
- Layout: `flex gap-6`, `border-b border-secondary-bg`, `max-w-3xl mx-auto`
- Tab text from i18n keys

### 3. NavBar Update

Change "指南" href from `/guides/hacker` to `/guides`.

### 4. Guide Subpage Updates

Each guide page (`hacker.astro`, `organizer.astro`, `judge.astro`) adds `<GuideTabBar activeRole="..." />` above step content. No other content changes.

### 5. i18n Updates

Add index page title/subtitle keys to `zh.yml` and `en.yml` if missing.

## Files Changed

| File | Action |
|------|--------|
| `site/src/pages/guides/index.astro` | New |
| `site/src/components/GuideTabBar.astro` | New |
| `site/src/pages/guides/hacker.astro` | Edit — add GuideTabBar |
| `site/src/pages/guides/organizer.astro` | Edit — add GuideTabBar |
| `site/src/pages/guides/judge.astro` | Edit — add GuideTabBar |
| `site/src/components/NavBar.astro` | Edit — change href |
| `site/src/i18n/zh.yml` | Edit — add keys |
| `site/src/i18n/en.yml` | Edit — add keys |

## Constraints

- Zero client-side JS
- Neon Forge design system compliance
- Existing guide content unchanged
- Existing URLs remain valid
