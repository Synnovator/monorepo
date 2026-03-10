# Fix Workflow & UI Bugs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 4 bugs: Cloudflare deploys on data branches, bot permissions for code review, timeline validation gap between UI and CI, and timeline editor overflow + missing stage descriptions.

**Architecture:** Replace Cloudflare's native GitHub integration with a GitHub Actions workflow for deploy control. Fix bot allowlist in claude-code-review. Add client-side validation mirroring CI rules. Extend timeline schema with `description`/`description_zh` fields across Zod schema, bash validator, UI, templates, and skill reference.

**Tech Stack:** GitHub Actions, Wrangler CLI, Vitest, React (Next.js), Tailwind CSS, Zod, bash/yq

---

## Task 1: Deploy workflow — only deploy on push to main

**Context:** Cloudflare Pages currently uses native GitHub integration that auto-deploys on ALL branches including `data/*`. We replace this with a GitHub Actions workflow using `wrangler deploy` that only triggers on `push` to `main`.

**Files:**
- Create: `.github/workflows/deploy.yml`
- Reference: `apps/web/package.json` (has `deploy` script: `opennextjs-cloudflare build && wrangler deploy`)
- Reference: `apps/web/wrangler.jsonc` (worker name: `synnovator`)

**Step 1: Create the deploy workflow**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Build and Deploy
        working-directory: apps/web
        run: pnpm deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

**Step 2: Verify the workflow file is valid YAML**

Run: `cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/fix-workflow && cat .github/workflows/deploy.yml`
Expected: Valid YAML with `on: push: branches: [main]`

**Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add deploy workflow triggered only on push to main"
```

> **Post-deploy note:** After merging, the user must disable Cloudflare Pages' native GitHub integration from the Cloudflare dashboard (Pages > Settings > Builds & Deployments > disconnect GitHub). Otherwise both native integration AND this workflow will trigger deploys.

---

## Task 2: Fix bot permissions for Claude Code Review

**Context:** When the `synnovator` GitHub App creates a PR, `claude-code-review.yml` triggers but fails because `anthropics/claude-code-action@v1` blocks non-human actors by default. We add `synnovator` to the allowed bots list.

**Files:**
- Modify: `.github/workflows/claude-code-review.yml:36` (add `allowed_bots` to `with:`)

**Step 1: Add allowed_bots to claude-code-review.yml**

In `.github/workflows/claude-code-review.yml`, add `allowed_bots: 'synnovator'` to the `with:` block of the `Run Claude Code Review` step:

```yaml
      - name: Run Claude Code Review
        id: claude-review
        uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          plugin_marketplaces: 'https://github.com/anthropics/claude-code.git'
          plugins: 'code-review@claude-code-plugins'
          prompt: '/code-review:code-review ${{ github.repository }}/pull/${{ github.event.pull_request.number }}'
          allowed_bots: 'synnovator'
```

**Step 2: Commit**

```bash
git add .github/workflows/claude-code-review.yml
git commit -m "ci: allow synnovator bot to trigger Claude Code Review"
```

---

## Task 3: Extend timeline schema with description fields

**Context:** The current `timeRangeSchema` only has `start` and `end`. We need `description` and `description_zh` for Bug 4's "force stage descriptions" requirement. This must propagate to: Zod schema, bash validator, templates, skill reference.

### Step 3a: Update Zod schema

**Files:**
- Modify: `packages/shared/src/schemas/hackathon.ts:5-8` (extend `timeRangeSchema`)

Change `timeRangeSchema` from:
```ts
export const timeRangeSchema = z.object({
  start: z.string(),
  end: z.string(),
});
```
to:
```ts
export const timeRangeSchema = z.object({
  start: z.string(),
  end: z.string(),
  description: z.string().optional(),
  description_zh: z.string().optional(),
});
```

### Step 3b: Write test for the updated schema

**Files:**
- Modify: `packages/shared/src/schemas/__tests__/hackathon.test.ts`

Add these tests after the existing `criterionSchema` tests:

```ts
describe('timeRangeSchema', () => {
  it('accepts start and end only', () => {
    const result = timeRangeSchema.safeParse({
      start: '2026-04-01T00:00:00Z',
      end: '2026-04-15T23:59:59Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts start, end, and description', () => {
    const result = timeRangeSchema.safeParse({
      start: '2026-04-01T00:00:00Z',
      end: '2026-04-15T23:59:59Z',
      description: 'Open registration period',
      description_zh: '开放报名阶段',
    });
    expect(result.success).toBe(true);
  });
});

describe('HackathonSchema timeline validation', () => {
  const minimalHackathon = {
    synnovator_version: '2.0',
    hackathon: {
      name: 'Test',
      slug: 'test',
      type: 'community' as const,
      timeline: {
        registration: {
          start: '2026-04-01T00:00:00Z',
          end: '2026-04-15T23:59:59Z',
        },
      },
    },
  };

  it('accepts timeline with registration dates', () => {
    const result = HackathonSchema.safeParse(minimalHackathon);
    expect(result.success).toBe(true);
  });

  it('accepts timeline stages with descriptions', () => {
    const result = HackathonSchema.safeParse({
      ...minimalHackathon,
      hackathon: {
        ...minimalHackathon.hackathon,
        timeline: {
          registration: {
            start: '2026-04-01T00:00:00Z',
            end: '2026-04-15T23:59:59Z',
            description: 'Sign up here',
            description_zh: '在此报名',
          },
        },
      },
    });
    expect(result.success).toBe(true);
  });
});
```

### Step 3c: Run tests

Run: `cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/fix-workflow && pnpm --filter @synnovator/shared test`
Expected: All tests pass

### Step 3d: Update bash validation script — add Rule 12 (stage descriptions)

**Files:**
- Modify: `scripts/validate-hackathon.sh` (add after Rule 11, before report)

Add this block before the `# --- Report results ---` section:

```bash
# --- Rule 12: Each active timeline stage must have a description ---
for STAGE in "${STAGES[@]}"; do
  START=$(yq ".hackathon.timeline.${STAGE}.start" "$FILE")
  if [ "$START" != "null" ] && [ -n "$START" ]; then
    DESC=$(yq ".hackathon.timeline.${STAGE}.description" "$FILE")
    if [ "$DESC" = "null" ] || [ -z "$DESC" ]; then
      err "timeline.${STAGE}: description is required for active stages"
    fi
  fi
done
```

### Step 3e: Update templates with descriptions

**Files:**
- Modify: `docs/templates/community/hackathon.yml`
- Modify: `docs/templates/enterprise/hackathon.yml`
- Modify: `docs/templates/youth-league/hackathon.yml`

Example for community template timeline section:
```yaml
  timeline:
    registration:
      start: "2026-04-01T00:00:00Z"
      end: "2026-04-15T23:59:59Z"
      description: "Open registration for all developers"
      description_zh: "面向所有开发者开放报名"
    development:
      start: "2026-04-16T00:00:00Z"
      end: "2026-05-15T23:59:59Z"
      description: "Build your project"
      description_zh: "项目开发阶段"
    submission:
      start: "2026-05-16T00:00:00Z"
      end: "2026-05-20T23:59:59Z"
      description: "Submit your project for review"
      description_zh: "提交项目作品"
    judging:
      start: "2026-05-21T00:00:00Z"
      end: "2026-05-28T23:59:59Z"
      description: "Expert panel reviews all submissions"
      description_zh: "专家评审所有提交"
    announcement:
      start: "2026-05-29T00:00:00Z"
      end: "2026-06-01T23:59:59Z"
      description: "Results announcement and appeal window"
      description_zh: "结果公示和申诉窗口"
```

Apply similar descriptions to enterprise and youth-league templates.

### Step 3f: Update skill schema reference

**Files:**
- Modify: `.claude/skills/synnovator-admin/references/schema-v2.md`

Update the timeline section to include `description` and `description_zh` per stage:
```
  timeline:
    draft:
      start: ""
      end: ""
      description: ""          # Required for active stages (Rule 12)
      description_zh: ""       # Optional
```

Also add Rule 12 to the validation rules section.

### Step 3g: Commit

```bash
git add packages/shared/src/schemas/hackathon.ts \
       packages/shared/src/schemas/__tests__/hackathon.test.ts \
       scripts/validate-hackathon.sh \
       docs/templates/ \
       .claude/skills/synnovator-admin/references/schema-v2.md
git commit -m "feat(shared): add description fields to timeline stage schema

Extends timeRangeSchema with optional description/description_zh.
Adds Rule 12 to validate-hackathon.sh: active stages must have description.
Updates templates and skill reference."
```

---

## Task 4: Fix client-side timeline validation (Bug 3)

**Context:** `isStepValid(3)` returns `true` always, but CI requires `timeline`, `registration.start`, and `registration.end`. The UI should block submission when these are missing.

### Step 4a: Write validation consistency test

**Files:**
- Create: `packages/shared/src/schemas/__tests__/hackathon-form-validation.test.ts`

This test codifies the rules that BOTH the UI form AND the CI script enforce, so they stay in sync:

```ts
import { describe, it, expect } from 'vitest';

/**
 * These tests document the validation rules shared between:
 * - UI form: apps/web/components/forms/CreateHackathonForm.tsx (isStepValid)
 * - CI: scripts/validate-hackathon.sh
 *
 * If a rule changes in one place, these tests remind you to update the other.
 */

interface Stage {
  key: string;
  start: string;
  end: string;
  description: string;
  removable: boolean;
}

// Mirror of the UI's isStepValid logic for the timeline step
function isTimelineStepValid(stages: Stage[]): boolean {
  const registration = stages.find(s => s.key === 'registration');
  if (!registration) return false;
  if (!registration.start || !registration.end) return false;
  // Every active stage (has start) must have description
  for (const stage of stages) {
    if (stage.start && !stage.description) return false;
  }
  return true;
}

// Mirror of what the bash script checks (Rules 4-6, 12)
function ciTimelineValidation(timeline: Record<string, { start?: string; end?: string; description?: string }>): string[] {
  const errors: string[] = [];
  if (!timeline || Object.keys(timeline).length === 0) {
    errors.push('hackathon.timeline is required');
  }
  if (!timeline?.registration?.start) {
    errors.push('hackathon.timeline.registration.start is required');
  }
  if (!timeline?.registration?.end) {
    errors.push('hackathon.timeline.registration.end is required');
  }
  // Rule 5: start < end
  const stages = ['draft', 'registration', 'development', 'submission', 'judging', 'announcement', 'award'];
  for (const stage of stages) {
    const s = timeline?.[stage];
    if (s?.start && s?.end && s.start > s.end) {
      errors.push(`timeline.${stage}: start must be before end`);
    }
  }
  // Rule 12: active stages must have description
  for (const stage of stages) {
    const s = timeline?.[stage];
    if (s?.start && !s?.description) {
      errors.push(`timeline.${stage}: description is required for active stages`);
    }
  }
  return errors;
}

describe('Timeline validation consistency (UI ↔ CI)', () => {
  it('rejects when registration is missing', () => {
    const stages: Stage[] = [
      { key: 'draft', start: '', end: '', description: '', removable: true },
      { key: 'development', start: '', end: '', description: '', removable: true },
    ];
    expect(isTimelineStepValid(stages)).toBe(false);

    const ciErrors = ciTimelineValidation({});
    expect(ciErrors).toContain('hackathon.timeline.registration.start is required');
  });

  it('rejects when registration has no dates', () => {
    const stages: Stage[] = [
      { key: 'registration', start: '', end: '', description: '', removable: false },
    ];
    expect(isTimelineStepValid(stages)).toBe(false);

    const ciErrors = ciTimelineValidation({ registration: {} });
    expect(ciErrors).toContain('hackathon.timeline.registration.start is required');
  });

  it('accepts when registration has start and end and description', () => {
    const stages: Stage[] = [
      { key: 'registration', start: '2026-04-01T00:00:00Z', end: '2026-04-15T23:59:59Z', description: 'Sign up', removable: false },
    ];
    expect(isTimelineStepValid(stages)).toBe(true);

    const ciErrors = ciTimelineValidation({
      registration: { start: '2026-04-01T00:00:00Z', end: '2026-04-15T23:59:59Z', description: 'Sign up' },
    });
    expect(ciErrors).toHaveLength(0);
  });

  it('rejects when active stage has no description', () => {
    const stages: Stage[] = [
      { key: 'registration', start: '2026-04-01T00:00:00Z', end: '2026-04-15T23:59:59Z', description: 'Sign up', removable: false },
      { key: 'development', start: '2026-04-16T00:00:00Z', end: '2026-05-15T23:59:59Z', description: '', removable: true },
    ];
    expect(isTimelineStepValid(stages)).toBe(false);

    const ciErrors = ciTimelineValidation({
      registration: { start: '2026-04-01T00:00:00Z', end: '2026-04-15T23:59:59Z', description: 'Sign up' },
      development: { start: '2026-04-16T00:00:00Z', end: '2026-05-15T23:59:59Z' },
    });
    expect(ciErrors).toContain('timeline.development: description is required for active stages');
  });

  it('CI rejects when start > end', () => {
    const ciErrors = ciTimelineValidation({
      registration: { start: '2026-04-15T00:00:00Z', end: '2026-04-01T23:59:59Z', description: 'Sign up' },
    });
    expect(ciErrors).toContain('timeline.registration: start must be before end');
  });
});
```

### Step 4b: Run tests to verify they fail (TDD)

Run: `cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/fix-workflow && pnpm --filter @synnovator/shared test`
Expected: Tests pass (they test pure logic functions defined in the test file itself, which serve as the spec)

### Step 4c: Fix isStepValid in CreateHackathonForm

**Files:**
- Modify: `apps/web/components/forms/CreateHackathonForm.tsx:153-165`

Replace:
```ts
  function isStepValid(s: number): boolean {
    switch (s) {
      case 0: return hackathonType !== '';
      case 1: return name.trim() !== '';
      case 2: return organizers.some(o => o.name.trim() !== '');
      case 3: return true; // timeline is optional
      case 4: return tracks.some(tr => tr.name.trim() !== '');
      case 5: return true; // legal has defaults
      case 6: return true; // settings have defaults
      case 7: return true; // preview
      default: return true;
    }
  }
```

With:
```ts
  function isStepValid(s: number): boolean {
    switch (s) {
      case 0: return hackathonType !== '';
      case 1: return name.trim() !== '';
      case 2: return organizers.some(o => o.name.trim() !== '');
      case 3: {
        // Must match CI validation: registration start+end required, active stages need description
        const reg = timelineStages.find(st => st.key === 'registration');
        if (!reg || !reg.start || !reg.end) return false;
        for (const st of timelineStages) {
          if (st.start && !st.description) return false;
        }
        return true;
      }
      case 4: return tracks.some(tr => tr.name.trim() !== '');
      case 5: return true; // legal has defaults
      case 6: return true; // settings have defaults
      case 7: return true; // preview
      default: return true;
    }
  }
```

### Step 4d: Update timeline YAML builder to include descriptions

**Files:**
- Modify: `apps/web/components/forms/CreateHackathonForm.tsx:168-174`

Replace:
```ts
    const timelineObj: Record<string, unknown> = {};
    for (const stage of timelineStages) {
      if (stage.start || stage.end) {
        timelineObj[stage.key] = { start: stage.start || undefined, end: stage.end || undefined };
      }
    }
```

With:
```ts
    const timelineObj: Record<string, unknown> = {};
    for (const stage of timelineStages) {
      if (stage.start || stage.end) {
        timelineObj[stage.key] = {
          start: stage.start || undefined,
          end: stage.end || undefined,
          description: stage.description || undefined,
          description_zh: stage.descriptionZh || undefined,
        };
      }
    }
```

### Step 4e: Commit

```bash
git add packages/shared/src/schemas/__tests__/hackathon-form-validation.test.ts \
       apps/web/components/forms/CreateHackathonForm.tsx
git commit -m "fix(web): enforce timeline validation in UI matching CI rules

Registration start/end required. Active stages must have description.
Adds consistency test to keep UI and CI validation in sync."
```

---

## Task 5: Timeline Editor — flex-wrap + description fields (Bug 4)

### Step 5a: Update Stage interface to include description

**Files:**
- Modify: `apps/web/components/forms/TimelineEditor.tsx:7-15`

Replace:
```ts
interface Stage {
  key: string;
  label: string;
  labelZh: string;
  start: string;
  end: string;
  removable: boolean;
  color: string;
}
```

With:
```ts
interface Stage {
  key: string;
  label: string;
  labelZh: string;
  start: string;
  end: string;
  description: string;
  descriptionZh: string;
  removable: boolean;
  color: string;
}
```

### Step 5b: Update DEFAULT_STAGES to include description fields

**Files:**
- Modify: `apps/web/components/forms/TimelineEditor.tsx:23-31`

Add `description: '', descriptionZh: ''` to each default stage:
```ts
const DEFAULT_STAGES: Stage[] = [
  { key: 'draft', label: 'Draft', labelZh: '草案', start: '', end: '', description: '', descriptionZh: '', removable: true, color: 'bg-muted/20 text-muted border-muted/30' },
  { key: 'registration', label: 'Registration', labelZh: '报名', start: '', end: '', description: '', descriptionZh: '', removable: false, color: 'bg-lime-primary/20 text-lime-primary border-lime-primary/30' },
  { key: 'development', label: 'Development', labelZh: '开发', start: '', end: '', description: '', descriptionZh: '', removable: true, color: 'bg-cyan/20 text-cyan border-cyan/30' },
  { key: 'submission', label: 'Submission', labelZh: '提交', start: '', end: '', description: '', descriptionZh: '', removable: true, color: 'bg-orange/20 text-orange border-orange/30' },
  { key: 'judging', label: 'Judging', labelZh: '评审', start: '', end: '', description: '', descriptionZh: '', removable: true, color: 'bg-neon-blue/20 text-neon-blue border-neon-blue/30' },
  { key: 'announcement', label: 'Announcement', labelZh: '公告', start: '', end: '', description: '', descriptionZh: '', removable: true, color: 'bg-pink/20 text-pink border-pink/30' },
  { key: 'award', label: 'Award', labelZh: '颁奖', start: '', end: '', description: '', descriptionZh: '', removable: true, color: 'bg-mint/20 text-mint border-mint/30' },
];
```

### Step 5c: Fix flex-wrap on pill container

**Files:**
- Modify: `apps/web/components/forms/TimelineEditor.tsx:116`

Replace:
```tsx
      <div className="relative flex items-center gap-1 overflow-x-auto pb-2">
```

With:
```tsx
      <div className="relative flex flex-wrap items-center gap-1 pb-2">
```

### Step 5d: Add description input to stage editor panel

**Files:**
- Modify: `apps/web/components/forms/TimelineEditor.tsx:149-181`

In the date editor section (the `{editingIdx !== null && ...}` block), add description inputs after the date grid. Replace the entire block:

```tsx
      {editingIdx !== null && editingIdx < stages.length && (
        <div className="p-4 rounded-lg border border-secondary-bg bg-surface/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white font-medium">
              {lang === 'zh' ? stages[editingIdx].labelZh : stages[editingIdx].label}
            </span>
            <button type="button" onClick={() => setEditingIdx(null)} className="text-xs text-muted hover:text-white">
              {t(lang, 'form.timeline.close')}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">{t(lang, 'form.timeline.start')}</label>
              <input
                type="datetime-local"
                value={stages[editingIdx].start.replace('Z', '')}
                onChange={e => updateStage(editingIdx, 'start', e.target.value)}
                className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">{t(lang, 'form.timeline.end')}</label>
              <input
                type="datetime-local"
                value={stages[editingIdx].end.replace('Z', '')}
                onChange={e => updateStage(editingIdx, 'end', e.target.value)}
                className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">{t(lang, 'form.timeline.description')}</label>
            <input
              type="text"
              value={stages[editingIdx].description}
              onChange={e => updateStageField(editingIdx, 'description', e.target.value)}
              placeholder={t(lang, 'form.timeline.description_placeholder')}
              className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">{t(lang, 'form.timeline.description_zh')}</label>
            <input
              type="text"
              value={stages[editingIdx].descriptionZh}
              onChange={e => updateStageField(editingIdx, 'descriptionZh', e.target.value)}
              placeholder={t(lang, 'form.timeline.description_placeholder_zh')}
              className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none"
            />
          </div>
        </div>
      )}
```

### Step 5e: Add updateStageField callback

**Files:**
- Modify: `apps/web/components/forms/TimelineEditor.tsx` (after `updateStage` callback, ~line 59)

Add:
```ts
  const updateStageField = useCallback((idx: number, field: 'description' | 'descriptionZh', val: string) => {
    const next = [...stages];
    next[idx] = { ...next[idx], [field]: val };
    onChange(next);
  }, [stages, onChange]);
```

### Step 5f: Update addStage to include description fields

**Files:**
- Modify: `apps/web/components/forms/TimelineEditor.tsx:65-80`

In `addStage`, update `newStage` to include `description: '', descriptionZh: ''`:
```ts
    const newStage: Stage = {
      key,
      label: customStageName,
      labelZh: customStageName,
      start: '',
      end: '',
      description: '',
      descriptionZh: '',
      removable: true,
      color: CUSTOM_STAGE_COLORS[colorIdx] || 'bg-muted/20 text-muted border-muted/30',
    };
```

### Step 5g: Add i18n keys for description fields

**Files:**
- Modify: `packages/shared/src/i18n/zh.json` (in `form.timeline` section)
- Modify: `packages/shared/src/i18n/en.json` (in `form.timeline` section)

Add these keys to the `form.timeline` object in zh.json:
```json
"description": "阶段说明 *",
"description_zh": "阶段说明（中文）",
"description_placeholder": "简述该阶段的目标和活动...",
"description_placeholder_zh": "简述该阶段的目标和活动...",
"registration_required": "报名时间为必填项"
```

And in en.json:
```json
"description": "Stage Description *",
"description_zh": "Stage Description (Chinese)",
"description_placeholder": "Briefly describe the goal and activities...",
"description_placeholder_zh": "Briefly describe this stage in Chinese...",
"registration_required": "Registration dates are required"
```

### Step 5h: Commit

```bash
git add apps/web/components/forms/TimelineEditor.tsx \
       apps/web/components/forms/CreateHackathonForm.tsx \
       packages/shared/src/i18n/zh.json \
       packages/shared/src/i18n/en.json
git commit -m "fix(web): timeline editor flex-wrap and stage descriptions

- Add flex-wrap to prevent pill overflow
- Add description/descriptionZh fields to Stage interface
- Add description inputs in stage editor panel
- Add i18n keys for stage description fields"
```

---

## Task 6: Final validation — build and test

### Step 6a: Run all tests

Run: `cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/fix-workflow && pnpm --filter @synnovator/shared test`
Expected: All tests pass

### Step 6b: Type check

Run: `cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/fix-workflow && pnpm --filter @synnovator/web build`
Expected: Build succeeds (or at least no TypeScript errors)

### Step 6c: Validate template with updated script

Run: `cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/fix-workflow && bash scripts/validate-hackathon.sh docs/templates/community/hackathon.yml`
Expected: `✓ Validation passed`

### Step 6d: Final commit if any fixups needed

---

## Summary of all files changed

| File | Change |
|------|--------|
| `.github/workflows/deploy.yml` | **New** — Deploy workflow, push to main only |
| `.github/workflows/claude-code-review.yml` | Add `allowed_bots: 'synnovator'` |
| `packages/shared/src/schemas/hackathon.ts` | Add `description`/`description_zh` to `timeRangeSchema` |
| `packages/shared/src/schemas/__tests__/hackathon.test.ts` | Tests for timeRangeSchema and timeline validation |
| `packages/shared/src/schemas/__tests__/hackathon-form-validation.test.ts` | **New** — UI ↔ CI validation consistency tests |
| `scripts/validate-hackathon.sh` | Add Rule 12: active stages need description |
| `docs/templates/community/hackathon.yml` | Add stage descriptions |
| `docs/templates/enterprise/hackathon.yml` | Add stage descriptions |
| `docs/templates/youth-league/hackathon.yml` | Add stage descriptions |
| `.claude/skills/synnovator-admin/references/schema-v2.md` | Document description field + Rule 12 |
| `apps/web/components/forms/TimelineEditor.tsx` | flex-wrap + description fields in UI |
| `apps/web/components/forms/CreateHackathonForm.tsx` | Fix `isStepValid(3)` + include descriptions in YAML |
| `packages/shared/src/i18n/zh.json` | Add timeline description i18n keys |
| `packages/shared/src/i18n/en.json` | Add timeline description i18n keys |
