# Tier 3: Schema & CSS Token Alignment — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align Zod schemas with PRD, fix hackathon YAML templates, and implement missing CSS design tokens.

**Architecture:** Three independent streams — (1) Zod schema + PRD doc changes, (2) hackathon YAML data migration, (3) CSS token implementation. Stream 1 and 2 must be validated together since schema changes affect data parsing. Stream 3 is independent.

**Tech Stack:** Astro Content Collections (Zod), YAML data files, Tailwind CSS v4 `@theme` block.

**Design Decisions (confirmed):**
- `weight`: decimal 0-1, sum=1.0
- `judge.expertise`: unified to `z.array(z.string())`
- `sponsors`: `role` replaces `tier`

---

## Task 1: Update Zod Schema — Hackathon Collection Enums

**Files:**
- Modify: `site/src/content.config.ts:54-62` (judgeSchema)
- Modify: `site/src/content.config.ts:117-122` (sponsors)
- Modify: `site/src/content.config.ts:128-143` (eligibility)
- Modify: `site/src/content.config.ts:144-154` (legal)
- Modify: `site/src/content.config.ts:169-177` (settings)

**Step 1: Update sponsors — replace `tier` with `role`**

In sponsors schema (line 117-122), change `tier` to `role`:

```ts
sponsors: z.array(z.object({
  name: z.string().optional(),
  name_zh: z.string().optional(),
  logo: z.string().optional(),
  role: z.string().optional(),
  website: z.string().optional(),
})).optional(),
```

**Step 2: Update judge.expertise to array**

In judgeSchema (line 54-62):

```ts
const judgeSchema = z.object({
  github: z.string(),
  name: z.string(),
  name_zh: z.string().optional(),
  title: z.string().optional(),
  affiliation: z.string().optional(),
  expertise: z.array(z.string()).optional(),
  conflict_declaration: z.string().optional(),
});
```

**Step 3: Add enum validations**

Replace plain `z.string()` with `z.enum()` or `z.string()` (keeping flexible where data varies):

In eligibility (line 128-143):
```ts
open_to: z.enum(['all', 'students', 'professionals', 'invited']).optional(),
```

In legal (line 144-154):
```ts
license: z.enum(['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'proprietary']).optional(),
ip_ownership: z.enum(['participant', 'organizer', 'shared']).optional(),
```

In dataset (line 83-92):
```ts
access_control: z.enum(['public', 'nda-required']).optional(),
```

In trackSchema judging (line 43-47):
```ts
mode: z.enum(['expert_only', 'expert_plus_vote', 'weighted', 'peer']),
```

In settings (line 169-177):
```ts
multi_track_rule: z.enum(['independent', 'shared']).optional(),
public_vote: z.enum(['none', 'reactions']).optional(),
```

**Step 4: Add weight validation**

In criterionSchema (line 20-28):
```ts
weight: z.number().min(0).max(1),
```

In trackSchema judging (line 45):
```ts
vote_weight: z.number().min(0).max(1).optional(),
```

In results schema (line 309):
```ts
weight: z.number().min(0).max(1),
```

**Step 5: Commit**

```bash
git add site/src/content.config.ts
git commit -m "feat(site): add enum validations, fix weight/expertise/sponsor types in Zod schema"
```

---

## Task 2: Update Zod Schema — Submission Collection Missing Fields

**Files:**
- Modify: `site/src/content.config.ts:252-284` (submission schemas)

**Step 1: Add missing fields to submissionDeliverablesSchema**

Replace the current schema (lines 259-267):

```ts
const submissionDeliverablesSchema = z.object({
  repo: z.string().optional(),
  demo: z.string().optional(),
  video: z.string().optional(),
  document: z.object({
    local_path: z.string().optional(),
    r2_url: z.string().optional(),
  }).optional(),
  slides: z.string().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    local_path: z.string().optional(),
    r2_url: z.string().optional(),
  })).optional(),
});
```

**Step 2: Add mentors and references to submissionSchema**

Replace submissionSchema (lines 269-284):

```ts
const submissionSchema = z.object({
  synnovator_submission: z.string(),
  project: z.object({
    name: z.string(),
    name_zh: z.string().optional(),
    tagline: z.string().optional(),
    tagline_zh: z.string().optional(),
    track: z.string(),
    team: z.array(submissionTeamMemberSchema),
    mentors: z.array(z.object({
      github: z.string(),
      name: z.string().optional(),
      affiliation: z.string().optional(),
    })).optional(),
    deliverables: submissionDeliverablesSchema.optional(),
    tech_stack: z.array(z.string()).optional(),
    description: z.string().optional(),
    description_zh: z.string().optional(),
    likes: z.number().optional(),
    references: z.array(z.object({
      name: z.string(),
      url: z.string(),
      usage: z.string().optional(),
    })).optional(),
  }),
});
```

**Step 3: Commit**

```bash
git add site/src/content.config.ts
git commit -m "feat(site): add mentors, references, slides, attachments to submission schema"
```

---

## Task 3: Migrate Hackathon YAML Data

**Files:**
- Modify: `hackathons/enterprise-fintech-risk-2025/hackathon.yml`
- Modify: `hackathons/dishuihu-ai-opc-global-challenge-2026/hackathon.yml`
- Modify: `hackathons/test-hackathon-2026/hackathon.yml`

**Step 1: enterprise-fintech-risk-2025 — convert weight integers to decimals**

All `weight:` values in tracks must be converted from integer (sum=100) to decimal (sum=1.0):

Model Optimization track:
- `weight: 35` -> `weight: 0.35`
- `weight: 25` -> `weight: 0.25`
- `weight: 25` -> `weight: 0.25`
- `weight: 15` -> `weight: 0.15`

Explainability track:
- `weight: 40` -> `weight: 0.40`
- `weight: 30` -> `weight: 0.30`
- `weight: 20` -> `weight: 0.20`
- `weight: 10` -> `weight: 0.10`

**Step 2: enterprise-fintech-risk-2025 — convert judge expertise strings to arrays**

Each judge's `expertise:` string becomes a single-element array:
- `expertise: "信贷风控，18年"` -> `expertise: ["信贷风控", "18年经验"]`
- `expertise: "机器学习，7年"` -> `expertise: ["机器学习", "7年经验"]`
- `expertise: "风控算法，14年"` -> `expertise: ["风控算法", "14年经验"]`
- `expertise: "算法合规，8年"` -> `expertise: ["算法合规", "8年经验"]`
- `expertise: "风控产品，5年"` -> `expertise: ["风控产品", "5年经验"]`

**Step 3: dishuihu — already uses `role` in sponsors and decimal weights (no changes needed)**

Verify: sponsors already use `role` field, weights are already decimal, no judge expertise to convert (no judges listed).

**Step 4: test-hackathon-2026 — already uses decimal weights, no judges (no changes needed)**

Verify: weights are already 0.3, 0.1.

**Step 5: Build to validate**

```bash
cd site && pnpm run build
```

Expected: Build succeeds with no schema validation errors.

**Step 6: Commit**

```bash
git add hackathons/
git commit -m "fix: migrate hackathon YAML data to match updated schema (decimal weights, array expertise)"
```

---

## Task 4: Update PRD Document

**Files:**
- Modify: `docs/specs/synnovator-prd.md`

**Step 1: Convert weight examples to decimal**

In PRD section 6.1 (lines 379-399), change all weight values:
- `weight: 30` -> `weight: 0.30`
- `weight: 30` -> `weight: 0.30`
- `weight: 20` -> `weight: 0.20`
- `weight: 20` -> `weight: 0.20`

In the enterprise track example (lines 437-451):
- `weight: 35` -> `weight: 0.35`
- `weight: 25` -> `weight: 0.25`
- `weight: 25` -> `weight: 0.25`
- `weight: 15` -> `weight: 0.15`

**Step 2: Update sponsors schema — `tier` to `role`**

In PRD section 6.1 (lines 227-231), change:
```yaml
  sponsors:
    - name: "BYD Energy Storage"
      name_zh: "比亚迪储能事业部"
      logo: "./assets/byd-logo.png"
      role: "platinum-sponsor"     # e.g. platinum-sponsor | gold-sponsor | enterprise-challenge-partner
```

**Step 3: Update judge expertise to show array is also valid**

In PRD section 6.1 (line 474), add comment:
```yaml
      expertise: "AI for Science"  # string (legacy) or array: ["AI for Science", "NLP"]
```

Note: PRD shows the single-string format as example but the Zod schema accepts arrays. Since this is a schema reference doc, add a comment clarifying both formats.

**Step 4: Update organizer role enum**

In PRD section 6.1 (line 222), update comment:
```yaml
      role: "host"                       # host | co-host | co-organizer
```

**Step 5: Update ip_ownership enum**

In PRD section 6.1 (line 273), change:
```yaml
    ip_ownership: "participant"
    # enum: participant | organizer | shared
```

(was `creator` — aligning with actual data and Zod enum)

**Step 6: Commit**

```bash
git add docs/specs/synnovator-prd.md
git commit -m "docs: update PRD schema examples to match Tier 3 decisions (decimal weight, role, participant)"
```

---

## Task 5: Implement CSS Spacing & Layout Tokens

**Files:**
- Modify: `site/src/styles/global.css`

**Step 1: Add spacing tokens to @theme block**

After the `/* === Font Families === */` section (line 42), add:

```css
  /* === Spacing Tokens === */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 36px;
```

**Step 2: Add layout dimension tokens to @theme block**

After spacing tokens, add:

```css
  /* === Layout Dimensions === */
  --layout-page-width: 1440px;
  --layout-search-height: 60px;
  --layout-nav-width: 168px;
  --layout-content-width: 856px;
  --layout-sidebar-width: 328px;
  --layout-sidebar-height: 720px;
  --layout-gap-nav-content: 20px;
  --layout-gap-search-content: 24px;
  --layout-gap-content-sidebar: 32px;
  --layout-gap-search-sidebar: 84px;
  --layout-sidebar-margin: 36px;
```

**Step 3: Add `--color-white` and replace hardcoded `white` in shadcn mappings**

Add to @theme color section (after line 29):
```css
  --color-white: #FFFFFF;
```

In `:root` shadcn mappings, replace hardcoded `white`:
- `--secondary-foreground: white;` -> `--secondary-foreground: var(--color-white);`
- `--accent-foreground: white;` -> `--accent-foreground: var(--color-white);`
- `--destructive-foreground: white;` -> `--destructive-foreground: var(--color-white);`

**Step 4: Build to validate CSS**

```bash
cd site && pnpm run build
```

Expected: Build succeeds, no CSS errors.

**Step 5: Commit**

```bash
git add site/src/styles/global.css
git commit -m "feat(site): implement spacing, layout, and color-white CSS tokens from design system"
```

---

## Task 6: Update Design System Doc — Remove "Not Implemented" Markers

**Files:**
- Modify: `docs/specs/design-system.md`

**Step 1: Update spacing section status**

Remove the implementation status note at lines 84-86. Replace with:
```
> **CSS 变量**: 已在 `site/src/styles/global.css` 的 `@theme` 块中实现。
```

Update token variable names from `$spacing-xs` to `--spacing-xs` format (lines 88-95) to match CSS custom property syntax.

**Step 2: Update layout section status**

Remove the implementation status note at lines 138-140. Replace with:
```
> **CSS 变量**: 布局尺寸已在 `site/src/styles/global.css` 的 `@theme` 块中定义为 CSS 变量。
> 当前站点使用 Tailwind 响应式工具类实现布局，CSS 变量作为参考值提供。
```

Update token variable names from `$layout-*` to `--layout-*` format.

**Step 3: Commit**

```bash
git add docs/specs/design-system.md
git commit -m "docs: update design-system.md — mark spacing/layout tokens as implemented"
```

---

## Task 7: Update Design Doc & Final Validation

**Files:**
- Modify: `docs/plans/2026-03-05-docs-alignment-design.md`

**Step 1: Full build validation**

```bash
cd site && pnpm run build
```

Expected: Clean build with zero schema validation errors.

**Step 2: Mark Tier 3 as completed in design doc**

Change section header from "进行中" to "已完成".

**Step 3: Final commit**

```bash
git add docs/
git commit -m "docs: mark Tier 3 as completed in alignment design doc"
```

---

## Execution Order & Dependencies

```
Task 1 (Zod enums) ──┐
Task 2 (Zod fields) ──┼── Task 3 (YAML migration) ── Task 4 (PRD) ── Task 7 (validation)
                      │
Task 5 (CSS tokens) ──┴── Task 6 (design-system.md) ─┘
```

- Tasks 1+2 must complete before Task 3 (schema must accept new data format)
- Task 5 is independent of Tasks 1-4
- Task 7 validates everything together
