# Form Validation UX — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add per-step required-field validation to all 3 wizard forms so "Next" is blocked when required fields are empty, step indicators reflect validity, and users get clear feedback.

**Architecture:** Add an `isStepValid(step)` guard function to each form component. The function checks required fields for the given step. "Next" and step ✓ indicators use it. No new dependencies, no test infrastructure (none exists in `apps/web`).

**Tech Stack:** React (useState/useMemo), TypeScript, i18n JSON

---

### Task 1: Add i18n validation keys

**Files:**
- Modify: `packages/shared/src/i18n/en.json:295-350` (create_hackathon section)
- Modify: `packages/shared/src/i18n/zh.json:293-350` (create_hackathon section)

**Step 1: Add validation keys to en.json**

Add these keys inside the `"form"` object, at the end of the `"create_hackathon"` section (after `"tagline_placeholder_zh"`):

```json
"required": "Required",
"complete_required": "Please complete required fields before proceeding",
"type_required": "Please select a hackathon type",
"name_required": "Please enter a name",
"organizer_required": "At least one organizer name is required",
"track_required": "At least one track name is required"
```

Add to `"create_proposal"` section (after `"submit_pr"`):

```json
"required": "Required",
"hackathon_required": "Please select a hackathon",
"name_required": "Please enter a project name",
"tagline_required": "Please enter a tagline",
"track_required": "Please select a track",
"tech_required": "At least one tech stack item is required",
"member_required": "At least one team member with GitHub username is required",
"repo_required": "Repository URL is required"
```

Add to `"profile"` section (after `"name_placeholder"`):

```json
"required": "Required",
"name_required": "Please enter a display name"
```

**Step 2: Add corresponding keys to zh.json**

Add to `"create_hackathon"` section:

```json
"required": "必填",
"complete_required": "请完成必填项后继续",
"type_required": "请选择 Hackathon 类型",
"name_required": "请输入名称",
"organizer_required": "至少需要一位组织者名称",
"track_required": "至少需要一个赛道名称"
```

Add to `"create_proposal"` section:

```json
"required": "必填",
"hackathon_required": "请选择活动",
"name_required": "请输入项目名称",
"tagline_required": "请输入一句话描述",
"track_required": "请选择赛道",
"tech_required": "至少添加一项技术栈",
"member_required": "至少需要一位成员填写 GitHub 用户名",
"repo_required": "请填写代码仓库 URL"
```

Add to `"profile"` section:

```json
"required": "必填",
"name_required": "请输入显示名称"
```

**Step 3: Commit**

```bash
git add packages/shared/src/i18n/en.json packages/shared/src/i18n/zh.json
git commit -m "feat(shared): add i18n keys for form step validation messages"
```

---

### Task 2: Fix CreateHackathonForm — add isStepValid and wire up

**Files:**
- Modify: `apps/web/components/forms/CreateHackathonForm.tsx`

**Step 1: Add `isStepValid` function**

Insert after the `toggleLang` function (line 148) and before the `// Build YAML` comment (line 150):

```tsx
// Step validation — returns true if all required fields for the step are filled
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

**Step 2: Update step indicator to reflect validity**

In the step indicator JSX (around line 246-251), change the circle content from:

```tsx
{idx < step ? '\u2713' : idx + 1}
```

to:

```tsx
{idx < step ? (isStepValid(idx) ? '\u2713' : '!') : idx + 1}
```

And change the circle background class. Replace:

```tsx
: idx < step ? 'bg-lime-primary/30 text-lime-primary' : 'bg-secondary-bg text-muted'
```

with:

```tsx
: idx < step ? (isStepValid(idx) ? 'bg-lime-primary/30 text-lime-primary' : 'bg-warning/30 text-warning') : 'bg-secondary-bg text-muted'
```

**Step 3: Disable "Next" button when step is invalid**

At line 613, the Next button currently has no `disabled` prop. Add it:

```tsx
<button type="button" onClick={() => setStep(s => s + 1)}
  disabled={!isStepValid(step)}
  className="px-6 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
  {t(lang, 'form.create_hackathon.next')}
</button>
```

**Step 4: Add validation hint below Next button when invalid**

Wrap the navigation div (lines 604-623) to add a hint message. After the closing `</div>` of the navigation (line 623), but still inside the fieldset, add nothing new — instead, add a hint **above** the nav div (before line 604):

```tsx
{/* Validation hint */}
{!isStepValid(step) && step < TOTAL_STEPS - 1 && (
  <p className="text-xs text-warning">
    {t(lang, 'form.create_hackathon.complete_required')}
  </p>
)}
```

**Step 5: Update submit button to revalidate all steps**

At line 618, change:

```tsx
disabled={!isLoggedIn || (!slug && !name)}
```

to:

```tsx
disabled={!isLoggedIn || !isStepValid(0) || !isStepValid(1) || !isStepValid(2) || !isStepValid(4)}
```

**Step 6: Commit**

```bash
git add apps/web/components/forms/CreateHackathonForm.tsx
git commit -m "fix(web): add step validation to CreateHackathonForm wizard"
```

---

### Task 3: Fix CreateProposalForm — add isStepValid and wire up

**Files:**
- Modify: `apps/web/components/forms/CreateProposalForm.tsx`

**Step 1: Add `isStepValid` function**

Insert after the `updateMember` function (line 96) and before the `teamSlug` useMemo (line 98):

```tsx
function isStepValid(s: number): boolean {
  switch (s) {
    case 0: return selectedHackathon !== '';
    case 1: return name.trim() !== '' && tagline.trim() !== '' && track !== '' && techStack.length > 0;
    case 2: return members.some(m => m.github.trim() !== '');
    case 3: return repo.trim() !== '';
    case 4: return true; // preview
    default: return true;
  }
}
```

**Step 2: Update step indicator**

Same pattern as Task 2 Step 2. In the step indicator (around line 157-161), change:

```tsx
{idx < step ? '\u2713' : idx + 1}
```

to:

```tsx
{idx < step ? (isStepValid(idx) ? '\u2713' : '!') : idx + 1}
```

And change background class from:

```tsx
: idx < step ? 'bg-lime-primary/30 text-lime-primary' : 'bg-secondary-bg text-muted'
```

to:

```tsx
: idx < step ? (isStepValid(idx) ? 'bg-lime-primary/30 text-lime-primary' : 'bg-warning/30 text-warning') : 'bg-secondary-bg text-muted'
```

**Step 3: Update "Next" button disabled condition**

At line 364-365, change:

```tsx
disabled={step === 0 && !selectedHackathon}
```

to:

```tsx
disabled={!isStepValid(step)}
```

**Step 4: Add validation hint**

Before the navigation div (before line 355), add:

```tsx
{!isStepValid(step) && step < TOTAL_STEPS - 1 && (
  <p className="text-xs text-warning">
    {t(lang, 'form.create_proposal.complete_required')}
  </p>
)}
```

Wait — there's no `complete_required` key for create_proposal. Add it to Task 1's i18n additions. Actually, reuse same pattern: add `"complete_required"` to create_proposal section too.

Update Task 1 Step 1 — add to `"create_proposal"`:
```json
"complete_required": "Please complete required fields before proceeding"
```

Update Task 1 Step 2 — add to `"create_proposal"`:
```json
"complete_required": "请完成必填项后继续"
```

**Step 5: Simplify submit button**

At line 371, change:

```tsx
disabled={!isLoggedIn || !name || !tagline || !track || !repo || !selectedHackathon || techStack.length === 0 || !members[0]?.github?.trim()}
```

to:

```tsx
disabled={!isLoggedIn || !isStepValid(0) || !isStepValid(1) || !isStepValid(2) || !isStepValid(3)}
```

**Step 6: Commit**

```bash
git add apps/web/components/forms/CreateProposalForm.tsx
git commit -m "fix(web): add step validation to CreateProposalForm wizard"
```

---

### Task 4: Fix ProfileCreateForm — add isStepValid and wire up

**Files:**
- Modify: `apps/web/components/forms/ProfileCreateForm.tsx`

**Step 1: Add `isStepValid` function**

Insert after the `updateSkill` function (line 82) and before the `// Generate YAML` comment (line 84):

```tsx
function isStepValid(s: number): boolean {
  switch (s) {
    case 0: return name.trim() !== '';
    case 1: return true; // identity is optional
    case 2: return true; // skills are optional
    case 3: return true; // more is optional
    case 4: return true; // preview
    default: return true;
  }
}
```

**Step 2: Update step indicator**

Same pattern. In the step indicator (around line 155-164), change:

```tsx
{idx < step ? '\u2713' : idx + 1}
```

to:

```tsx
{idx < step ? (isStepValid(idx) ? '\u2713' : '!') : idx + 1}
```

And change background class from:

```tsx
: idx < step
  ? 'bg-lime-primary/30 text-lime-primary'
  : 'bg-secondary-bg text-muted'
```

to:

```tsx
: idx < step
  ? (isStepValid(idx) ? 'bg-lime-primary/30 text-lime-primary' : 'bg-warning/30 text-warning')
  : 'bg-secondary-bg text-muted'
```

**Step 3: Update "Next" button**

At line 493-496, the Next button has no disabled prop. Add it:

```tsx
<button
  type="button"
  onClick={() => setStep(s => s + 1)}
  disabled={!isStepValid(step)}
  className="px-6 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
```

**Step 4: Add validation hint**

Before the navigation div (before line 479), add:

```tsx
{!isStepValid(step) && step < TOTAL_STEPS - 1 && (
  <p className="text-xs text-warning">
    {t(lang, 'form.profile.complete_required')}
  </p>
)}
```

And add the i18n keys — update Task 1:

en.json `"profile"` section: add `"complete_required": "Please complete required fields before proceeding"`
zh.json `"profile"` section: add `"complete_required": "请完成必填项后继续"`

**Step 5: Update submit button**

At line 504, change:

```tsx
disabled={!isLoggedIn}
```

to:

```tsx
disabled={!isLoggedIn || !isStepValid(0)}
```

**Step 6: Add `*` to display name label**

The display name label at line 241 currently says `"Display Name (English)"`. Update the i18n key.

In en.json, change:
```json
"display_name_en": "Display Name (English)"
```
to:
```json
"display_name_en": "Display Name (English) *"
```

In zh.json, change:
```json
"display_name_en": "显示名称 (英文)"
```
to:
```json
"display_name_en": "显示名称 (英文) *"
```

**Step 7: Commit**

```bash
git add apps/web/components/forms/ProfileCreateForm.tsx
git commit -m "fix(web): add step validation to ProfileCreateForm wizard"
```

---

### Task 5: Build verification

**Step 1: Run build**

```bash
cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/fix-wrong-pr
pnpm build
```

Expected: Build succeeds with no TypeScript errors.

**Step 2: Manual smoke test checklist**

Run `pnpm dev` and verify in browser:

- [ ] `/create-hackathon`: Can't click Next without selecting type
- [ ] `/create-hackathon`: Step 0 shows `!` if you somehow get past it without selecting type
- [ ] `/create-hackathon`: Step 1 blocks Next without name
- [ ] `/create-hackathon`: Submit button disabled if type or name missing
- [ ] `/create-proposal`: Can't click Next without selecting hackathon
- [ ] `/create-proposal`: Step 1 blocks without name+tagline+track+techStack
- [ ] `/create-profile`: Can't click Next without display name
- [ ] All forms: validation hint text appears when step is invalid
- [ ] All forms: step indicators show `!` for invalid visited steps
