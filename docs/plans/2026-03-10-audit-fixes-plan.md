# Audit Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 25 UI quality issues identified by `/audit`, using the corresponding skill for each batch.

**Architecture:** 4 sequential batches, each executed by invoking a skill (`/harden` → `/normalize` → `/adapt` → `/optimize`). Each batch produces one commit. Final validation via build + test + PR.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS v4.1, shadcn/ui, packages/ui design tokens

**Design Doc:** `docs/plans/2026-03-10-audit-fixes-design.md`

---

### Task 1: Harden Accessibility (16 issues)

**Skill:** `/harden`

**Files to modify:**
- `apps/web/components/HackathonTabs.tsx` — C1: tab ARIA
- `apps/web/components/LoginForm.tsx` — C1: tab ARIA
- `apps/web/components/NavBar.tsx` — C2: dropdown → shadcn DropdownMenu
- `apps/web/components/OAuthButton.tsx` — C2: dropdown → shadcn DropdownMenu, H8: avatar alt
- `apps/web/app/(public)/hackathons/[slug]/page.tsx` — C3: tabpanel ARIA + hidden class
- `apps/web/components/forms/RegisterForm.tsx` — H1/H3/H4: form labels, errors, required
- `apps/web/components/forms/ProfileCreateForm.tsx` — H1/H3/H4
- `apps/web/components/forms/CreateHackathonForm.tsx` — H1/H4, H6: step indicator
- `apps/web/components/forms/CreateProposalForm.tsx` — H1/H4, H6: step indicator
- `apps/web/components/forms/TeamFormationForm.tsx` — H1/H4
- `apps/web/components/forms/NDASignForm.tsx` — H1/H4
- `apps/web/components/forms/AppealForm.tsx` — H1/H4
- `apps/web/components/forms/TimelineEditor.tsx` — H1/H4
- `apps/web/components/HackathonFilter.tsx` — H2: search aria-label, H5: aria-pressed
- `apps/web/components/ProposalsViewToggle.tsx` — H5: aria-pressed
- `apps/web/components/ScoreCard.tsx` — H7: range slider aria-label
- `apps/web/app/layout.tsx` or `apps/web/app/(public)/layout.tsx` — L1: skip-to-main link
- `apps/web/components/EventCalendar.tsx` — L2: semantic list
- `apps/web/components/Timeline.tsx` — L2: semantic list
- `apps/web/components/TeamsTab.tsx` — L4: icon aria-hidden
- Multiple components with SVG icons — L3: aria-hidden

**Step 1: Invoke `/harden` skill**

Invoke the `/harden` skill targeting the `apps/web/` codebase. Provide it the full list of 16 issues from the design doc (C1-C3, H1-H8, L1-L4) as context. The skill will analyze and apply fixes.

**Step 2: Verify build**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add apps/web/
git commit -m "fix(web): harden accessibility — ARIA, forms, keyboard

- Add role/aria-selected/aria-controls to custom tab implementations
- Replace hand-rolled dropdowns with shadcn/ui DropdownMenu
- Add htmlFor/id associations to all form label+input pairs
- Add aria-required, aria-invalid, aria-describedby for form validation
- Add aria-pressed to filter/toggle buttons
- Add aria-label to search input and range sliders
- Add skip-to-main-content link
- Use semantic ul/li for EventCalendar and Timeline
- Mark decorative SVGs with aria-hidden

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Normalize Design Tokens (3 issues)

**Skill:** `/normalize`

**Files to modify:**
- `packages/ui/src/styles/global.css` — M1: `--color-muted` contrast fix
- `docs/specs/design-system.md` — M1: sync muted color value
- `apps/web/components/LoginForm.tsx` — M5: GitHub button hard-coded colors → tokens
- `apps/web/components/forms/TimelineEditor.tsx` — L5: `text-[10px]` → `text-xs`

**Step 1: Invoke `/normalize` skill**

Invoke the `/normalize` skill targeting the design token issues. Provide it the 3 issues (M1, M5, L5) and the design system reference at `docs/specs/design-system.md`.

**Step 2: Verify contrast**

Manually check: new `--color-muted` value on `#222222` background ≥ 4.5:1 contrast ratio.

**Step 3: Verify build**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add packages/ui/src/styles/global.css docs/specs/design-system.md apps/web/components/LoginForm.tsx apps/web/components/forms/TimelineEditor.tsx
git commit -m "fix(web): normalize design tokens — contrast, colors

- Raise --color-muted for WCAG AA 4.5:1 contrast on dark-bg
- Replace hard-coded GitHub button hex with design tokens
- Replace text-[10px] with text-xs in TimelineEditor

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Adapt Responsive Design (4 issues)

**Skill:** `/adapt`

**Files to modify:**
- `apps/web/components/NavBar.tsx` — M2: mobile hamburger menu
- `apps/web/components/HackathonFilter.tsx` — M4: touch target min-h-11
- `apps/web/components/ProposalsViewToggle.tsx` — M4: touch target min-h-11
- `apps/web/app/(public)/page.tsx` — L6: fluid heading scale
- `apps/web/app/(public)/hackathons/[slug]/page.tsx` — L6: fluid heading scale
- `apps/web/app/(public)/hackers/[id]/page.tsx` — L6: fluid heading scale
- `apps/web/components/forms/CreateProposalForm.tsx` — L8: mobile step indicators
- `apps/web/components/forms/CreateHackathonForm.tsx` — L8: mobile step indicators

**Step 1: Invoke `/adapt` skill**

Invoke the `/adapt` skill targeting the 4 responsive issues (M2, M4, L6, L8). Provide it the design system breakpoints and the mobile-first approach.

**Step 2: Verify build**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add apps/web/
git commit -m "fix(web): adapt responsive — mobile nav, touch targets

- Add hamburger menu for mobile navigation
- Ensure 44px minimum touch targets on filter/toggle buttons
- Add progressive heading scale (text-2xl → text-5xl)
- Simplify step indicators on small screens

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Optimize Performance (3 issues)

**Skill:** `/optimize`

**Files to modify:**
- `apps/web/components/forms/CreateHackathonForm.tsx` — M3: React.memo + useCallback
- `apps/web/app/layout.tsx` — M6: font preload + conditional Noto Sans SC
- `apps/web/components/Footer.tsx` — L7: Image loading="lazy"

**Step 1: Invoke `/optimize` skill**

Invoke the `/optimize` skill targeting the 3 performance issues (M3, M6, L7).

**Step 2: Verify build**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds.

**Step 3: Verify tests**

Run: `pnpm --filter @synnovator/shared test`
Expected: All tests pass.

**Step 4: Commit**

```bash
git add apps/web/
git commit -m "perf(web): optimize — memoization, font loading

- Split CreateHackathonForm into memoized sub-components
- Preload critical fonts (Space Grotesk, Inter)
- Conditionally load Noto Sans SC for zh locale
- Add loading=lazy to Footer logo

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Final Validation & PR

**Skill:** `/superpowers:verification-before-completion`

**Step 1: Full build**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds with zero errors.

**Step 2: Full test**

Run: `pnpm --filter @synnovator/shared test`
Expected: All tests pass.

**Step 3: Push and create PR**

```bash
git push -u origin worktree-audit-ui
gh pr create --base main --title "fix(web): UI quality audit fixes" --body "..."
```
