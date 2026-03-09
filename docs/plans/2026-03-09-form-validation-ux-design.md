# Form Validation UX Design

**Date:** 2026-03-09
**Status:** Approved

## Problem

All multi-step wizard forms (CreateHackathon, CreateProposal, ProfileCreate) have misleading step indicators and missing validation feedback:

1. Step indicators show ✅ based on "visited" not "valid"
2. "Next" button never blocks — users can skip required fields
3. Submit button disabled with zero explanation of what's missing
4. Inconsistent validation strictness across forms

**Reproduction:** On `/create-hackathon`, select type → click Next through all steps without filling data → all steps show ✅ → submit button disabled → no feedback.

## Solution

**Approach:** `isStepValid()` guard function per form — minimal change, no new dependencies.

### Behavior Changes

1. **"Next" button disabled** when `isStepValid(step)` returns false
2. **Step indicators** show ✓ only when `idx < step && isStepValid(idx)`
3. **Required field labels** get a red `*` marker
4. **Submit button** revalidates all steps; if invalid, indicates which step to revisit

### Required Fields Per Step

#### CreateHackathonForm

| Step | Label | Required Fields |
|------|-------|----------------|
| 0 | Type | `hackathonType` |
| 1 | Basic Info | `name` |
| 2 | Organizers | At least 1 organizer with `name` |
| 3 | Timeline | None (all optional) |
| 4 | Tracks | At least 1 track with `name` |
| 5 | Legal | None (has defaults) |
| 6 | Settings | None (has defaults) |
| 7 | Preview | N/A |

#### CreateProposalForm

| Step | Label | Required Fields |
|------|-------|----------------|
| 0 | Select Hackathon | `selectedHackathon` |
| 1 | Project Info | `name`, `tagline`, `track`, `repo` |
| 2 | Team | At least 1 member with `github` |
| 3 | Deliverables | At least 1 `techStack` item |
| 4 | Preview | N/A |

#### ProfileCreateForm

| Step | Label | Required Fields |
|------|-------|----------------|
| 0 | Basic Info | `name`, `github` |
| 1 | Identity | None (all optional) |
| 2 | Skills | None (all optional) |
| 3 | More | None (all optional) |
| 4 | Preview | N/A |

### Out of Scope

- ScoreCard (single page, no wizard)
- Issue-based forms (RegisterForm, AppealForm, TeamFormationForm, NDASignForm)
- Zod schema changes
- New dependencies
