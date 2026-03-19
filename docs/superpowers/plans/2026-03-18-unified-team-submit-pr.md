# Unified Team Submit-PR Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all team operations from broken `buildPRUrl()` (client-side GitHub web editor) to working `/api/submit-pr` (server-side GitHub App).

**Architecture:** Extend the existing `/api/submit-pr` API route with 3 new submission types (`team`, `team-join`, `team-leave`). Rewrite 4 frontend components to call the API instead of constructing GitHub URLs. Remove deprecated `buildPRUrl` code.

**Tech Stack:** Next.js API Routes, GitHub REST API (Octokit), React client components, YAML string construction (client-side)

**Spec:** `docs/superpowers/specs/2026-03-18-unified-team-submit-pr-design.md`

---

## Chunk 1: API Route Extension

### Task 1: Add team types to route constants

**Files:**
- Modify: `apps/web/app/api/submit-pr/route.ts:8-53`

- [ ] **Step 1: Extend `VALID_TYPES` with 3 new team types**

In `apps/web/app/api/submit-pr/route.ts`, replace line 8:

```ts
// Before:
const VALID_TYPES = ['hackathon', 'proposal', 'profile'] as const;

// After:
const VALID_TYPES = ['hackathon', 'proposal', 'profile', 'team', 'team-join', 'team-leave'] as const;
```

- [ ] **Step 2: Add teams pattern to `FILENAME_PATTERNS`**

After line 24 (the last assets pattern), add:

```ts
  // Teams
  /^teams\/[a-z0-9-]+\/team\.yml$/,
```

- [ ] **Step 3: Extend `BRANCH_PREFIX`**

Replace lines 27-31:

```ts
const BRANCH_PREFIX: Record<SubmitType, string> = {
  hackathon: 'data/create-hackathon',
  proposal: 'data/submit',
  profile: 'data/create-profile',
  team: 'data/create-team',
  'team-join': 'data/team-join',
  'team-leave': 'data/team-leave',
};
```

- [ ] **Step 4: Extend `REQUIRED_METADATA`**

Replace lines 49-53:

```ts
const REQUIRED_METADATA: Record<SubmitType, (keyof SubmitMetadata)[]> = {
  proposal: ['hackathonSlug', 'hackathonName', 'hackathonNameZh', 'trackName', 'projectName'],
  hackathon: ['hackathonName', 'hackathonNameZh'],
  profile: [],
  team: [],
  'team-join': [],
  'team-leave': [],
};
```

- [ ] **Step 5: Verify build compiles**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds (type system validates all Record keys match VALID_TYPES)

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/api/submit-pr/route.ts
git commit -m "fix(submit-pr): add team/team-join/team-leave types to route constants"
```

### Task 2: Add PR title, body, and commit message for team types

**Files:**
- Modify: `apps/web/app/api/submit-pr/route.ts:267-324`

- [ ] **Step 1: Extend PR title generation**

Replace lines 268-273 (the `prTitle` assignment):

```ts
    const isTeamType = submitType === 'team' || submitType === 'team-join' || submitType === 'team-leave';
    const prTitle =
      submitType === 'proposal'
        ? `[提交] ${metadata.projectName} → ${metadata.hackathonNameZh} · ${metadata.trackNameZh || metadata.trackName}赛道`
        : submitType === 'hackathon'
          ? `[创建比赛] ${metadata.hackathonNameZh} / ${metadata.hackathonName}`
          : submitType === 'team'
            ? `[创建团队] ${slug} by @${session.login}`
            : submitType === 'team-join'
              ? `[加入团队] @${session.login} → ${slug}`
              : submitType === 'team-leave'
                ? `[退出团队] @${session.login} ← ${slug}`
                : `[创建档案] @${session.login}`;
```

- [ ] **Step 2: Extend PR body generation**

After the existing `} else {` block for profile (line 305), replace it with team-aware branching. Replace lines 305-315:

```ts
    } else if (isTeamType) {
      prBody = [
        `操作者 / Operator: @${session.login}`,
        `团队 / Team: ${slug}`,
        '',
        `文件 / Files:`,
        filesList,
        '',
        '---',
        '> Auto-created via [Synnovator Platform](https://home.synnovator.space)',
      ].join('\n');
    } else {
      prBody = [
        `提交者 / Submitted by: @${session.login}`,
        '',
        `文件 / Files:`,
        filesList,
        '',
        '---',
        '> Auto-created via [Synnovator Platform](https://home.synnovator.space)',
      ].join('\n');
    }
```

- [ ] **Step 3: Use dedicated commit messages for team types**

Replace line 323 (the `commitMessage: prTitle` in `commitMultipleFiles` call):

```ts
    const commitMessage = submitType === 'team'
      ? `data(teams): create team ${slug}`
      : submitType === 'team-join'
        ? `data(teams): ${session.login} join ${slug}`
        : submitType === 'team-leave'
          ? `data(teams): ${session.login} leave ${slug}`
          : prTitle;
```

Then update the `commitMultipleFiles` call to use `commitMessage` instead of `prTitle`:

```ts
    await commitMultipleFiles(octokit, {
      owner: OWNER,
      repo: REPO,
      branchName,
      files,
      commitMessage,
    });
```

- [ ] **Step 4: Verify build compiles**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/submit-pr/route.ts
git commit -m "fix(submit-pr): add PR title/body/commit templates for team types"
```

---

## Chunk 2: Frontend Component Migration

### Task 3: Migrate CreateTeamForm

**Files:**
- Modify: `apps/web/components/forms/CreateTeamForm.tsx`

- [ ] **Step 1: Replace import**

Replace line 5:

```ts
// Before:
import { buildPRUrl, openGitHubUrl } from '@/lib/github-url';

// After: (remove this import entirely — no longer needed)
```

- [ ] **Step 2: Add error state**

After line 31 (`const [submitting, setSubmitting] = useState(false);`), add:

```ts
  const [error, setError] = useState<string | null>(null);
```

- [ ] **Step 3: Rewrite `handleSubmit` to async fetch**

Replace the `handleSubmit` function (lines 42-80):

```tsx
  async function handleSubmit() {
    if (!user || !canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];

      let yamlContent = `synnovator_team: "1.0"\n`;
      yamlContent += `name: "${teamName}"\n`;
      if (teamNameZh) yamlContent += `name_zh: "${teamNameZh}"\n`;
      if (description) yamlContent += `description: "${description}"\n`;
      if (descriptionZh) yamlContent += `description_zh: "${descriptionZh}"\n`;
      if (githubUrl) yamlContent += `github_url: "${githubUrl}"\n`;
      yamlContent += `status: recruiting\n`;
      yamlContent += `leader: "${user.login}"\n`;
      yamlContent += `members: []\n`;
      if (lookingForRoles.length > 0 || lookingForDesc) {
        yamlContent += `looking_for:\n`;
        if (lookingForRoles.length > 0) {
          yamlContent += `  roles:\n`;
          for (const role of lookingForRoles) {
            yamlContent += `    - ${role}\n`;
          }
        }
        if (lookingForDesc) {
          yamlContent += `  description: "${lookingForDesc}"\n`;
        }
      }
      yamlContent += `created_at: "${today}"\n`;

      const res = await fetch('/api/submit-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'team',
          slug: teamSlug,
          files: [{ path: `teams/${teamSlug}/team.yml`, content: yamlContent }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
      window.open(data.pr_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  }
```

- [ ] **Step 4: Add error display in JSX**

Before the closing `</fieldset>` (line 203), after the submit button, add:

```tsx
        {error && (
          <p className="text-destructive text-sm mt-2">{error}</p>
        )}
```

- [ ] **Step 5: Verify build compiles**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/forms/CreateTeamForm.tsx
git commit -m "fix(teams): migrate CreateTeamForm from buildPRUrl to /api/submit-pr"
```

### Task 4: Migrate JoinTeamButton

**Files:**
- Modify: `apps/web/components/JoinTeamButton.tsx`

- [ ] **Step 1: Rewrite entire component**

Replace the full file content:

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface JoinTeamButtonProps {
  teamSlug: string;
  teamYamlContent: string;
  lang: Lang;
}

export function JoinTeamButton({ teamSlug, teamYamlContent, lang }: JoinTeamButtonProps) {
  const { user, isLoggedIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    if (!user || !isLoggedIn || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const memberEntry = `  - github: "${user.login}"\n    role: developer\n    joined_at: "${today}"\n`;
      const updatedContent = teamYamlContent.replace(
        /^(members:.*$)/m,
        `$1\n${memberEntry}`
      );

      const res = await fetch('/api/submit-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'team-join',
          slug: teamSlug,
          files: [{ path: `teams/${teamSlug}/team.yml`, content: updatedContent }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
      window.open(data.pr_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join team');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isLoggedIn) return null;

  return (
    <div>
      <button
        onClick={handleJoin}
        disabled={submitting}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? t(lang, 'form.common.submitting') : t(lang, 'team.join')}
      </button>
      {error && <p className="text-destructive text-sm mt-2">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/JoinTeamButton.tsx
git commit -m "fix(teams): migrate JoinTeamButton from buildPRUrl to /api/submit-pr"
```

### Task 5: Migrate LeaveTeamButton

**Files:**
- Modify: `apps/web/components/LeaveTeamButton.tsx`

- [ ] **Step 1: Rewrite entire component**

Replace the full file content:

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface LeaveTeamButtonProps {
  teamSlug: string;
  teamYamlContent: string;
  lang: Lang;
}

export function LeaveTeamButton({ teamSlug, teamYamlContent, lang }: LeaveTeamButtonProps) {
  const { user, isLoggedIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLeave() {
    if (!user || !isLoggedIn || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const lines = teamYamlContent.split('\n');
      const filtered: string[] = [];
      let skipMember = false;

      for (const line of lines) {
        if (line.match(/^\s+-\s+github:\s+"/) && line.includes(user.login)) {
          skipMember = true;
          continue;
        }
        if (skipMember && line.match(/^\s+\w+:/)) {
          if (line.match(/^\s+-\s+github:/)) {
            skipMember = false;
          } else {
            continue;
          }
        }
        if (skipMember && (line.match(/^\S/) || line.trim() === '')) {
          skipMember = false;
        }
        if (!skipMember) {
          filtered.push(line);
        }
      }

      const res = await fetch('/api/submit-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'team-leave',
          slug: teamSlug,
          files: [{ path: `teams/${teamSlug}/team.yml`, content: filtered.join('\n') }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
      window.open(data.pr_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave team');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isLoggedIn) return null;

  return (
    <div>
      <button
        onClick={handleLeave}
        disabled={submitting}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? t(lang, 'form.common.submitting') : t(lang, 'team.leave')}
      </button>
      {error && <p className="text-destructive text-sm mt-2">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/LeaveTeamButton.tsx
git commit -m "fix(teams): migrate LeaveTeamButton from buildPRUrl to /api/submit-pr"
```

### Task 6: Migrate TeamActions

**Files:**
- Modify: `apps/web/components/TeamActions.tsx`

- [ ] **Step 1: Rewrite entire component**

Replace the full file content:

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { PencilIcon } from '@/components/icons';

interface TeamActionsProps {
  teamSlug: string;
  leader: string;
  members: string[];
  status: string;
  teamYamlContent: string;
  lang: Lang;
}

export function TeamActions({
  teamSlug,
  leader,
  members,
  status,
  teamYamlContent,
  lang,
}: TeamActionsProps) {
  const { user, loading, isLoggedIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !isLoggedIn || !user) return null;

  const login = user.login;
  const isLeader = login === leader;
  const isMember = members.includes(login);

  async function handleJoin() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const memberEntry = `  - github: "${login}"\n    role: developer\n    joined_at: "${today}"\n`;
      const updatedContent = teamYamlContent.replace(
        /^(members:.*$)/m,
        `$1\n${memberEntry}`,
      );

      const res = await fetch('/api/submit-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'team-join',
          slug: teamSlug,
          files: [{ path: `teams/${teamSlug}/team.yml`, content: updatedContent }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
      window.open(data.pr_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join team');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLeave() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const lines = teamYamlContent.split('\n');
      const filtered: string[] = [];
      let skipMember = false;

      for (const line of lines) {
        if (line.match(/^\s+-\s+github:\s+"/) && line.includes(login)) {
          skipMember = true;
          continue;
        }
        if (skipMember && line.match(/^\s+\w+:/)) {
          if (line.match(/^\s+-\s+github:/)) {
            skipMember = false;
          } else {
            continue;
          }
        }
        if (skipMember && (line.match(/^\S/) || line.trim() === '')) {
          skipMember = false;
        }
        if (!skipMember) {
          filtered.push(line);
        }
      }

      const res = await fetch('/api/submit-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'team-leave',
          slug: teamSlug,
          files: [{ path: `teams/${teamSlug}/team.yml`, content: filtered.join('\n') }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
      window.open(data.pr_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave team');
    } finally {
      setSubmitting(false);
    }
  }

  // Leader: show edit button
  if (isLeader) {
    const editUrl = `https://github.com/Synnovator/monorepo/edit/main/teams/${teamSlug}/team.yml`;
    return (
      <a
        href={editUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
      >
        <PencilIcon size={14} />
        {t(lang, 'team.edit')}
      </a>
    );
  }

  // Member: show leave button
  if (isMember) {
    return (
      <div>
        <button
          onClick={handleLeave}
          disabled={submitting}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t(lang, 'form.common.submitting') : t(lang, 'team.leave')}
        </button>
        {error && <p className="text-destructive text-sm mt-2">{error}</p>}
      </div>
    );
  }

  // Non-member + team is recruiting: show join button
  if (status === 'recruiting') {
    return (
      <div>
        <button
          onClick={handleJoin}
          disabled={submitting}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t(lang, 'form.common.submitting') : t(lang, 'team.join')}
        </button>
        {error && <p className="text-destructive text-sm mt-2">{error}</p>}
      </div>
    );
  }

  return null;
}
```

- [ ] **Step 2: Verify build compiles**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/TeamActions.tsx
git commit -m "fix(teams): migrate TeamActions from buildPRUrl to /api/submit-pr"
```

---

## Chunk 3: Cleanup & Verification

### Task 7: Remove `buildPRUrl` from github-url.ts

**Files:**
- Modify: `apps/web/lib/github-url.ts:27-46`

- [ ] **Step 1: Confirm no remaining consumers**

Run: `grep -r "buildPRUrl" apps/web/`
Expected: No results (all 4 components migrated)

- [ ] **Step 2: Remove `buildPRUrl` and `PRUrlParams`**

Remove lines 27-46 from `apps/web/lib/github-url.ts` (the `PRUrlParams` interface and `buildPRUrl` function). Keep everything else: `IssueUrlParams`, `buildIssueUrl`, `openGitHubUrl`, and the constants.

The file should end up as:

```ts
const GITHUB_ORG = 'Synnovator';
const GITHUB_REPO = 'monorepo';
const BASE_URL = `https://github.com/${GITHUB_ORG}/${GITHUB_REPO}`;

export interface IssueUrlParams {
  template?: string;
  title: string;
  labels?: string[];
  body?: string;
  fields?: Record<string, string>;
}

export function buildIssueUrl(params: IssueUrlParams): string {
  const url = new URL(`${BASE_URL}/issues/new`);
  if (params.template) url.searchParams.set('template', params.template);
  url.searchParams.set('title', params.title);
  if (params.labels?.length) url.searchParams.set('labels', params.labels.join(','));
  if (params.body) url.searchParams.set('body', params.body);
  if (params.fields) {
    for (const [key, value] of Object.entries(params.fields)) {
      if (value) url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export function openGitHubUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export { GITHUB_ORG, GITHUB_REPO, BASE_URL };
```

- [ ] **Step 3: Verify build compiles**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds — no remaining references to removed exports

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/github-url.ts
git commit -m "refactor(github-url): remove deprecated buildPRUrl and PRUrlParams"
```

### Task 8: Full verification

- [ ] **Step 1: Run shared tests**

Run: `pnpm --filter @synnovator/shared test`
Expected: All tests pass

- [ ] **Step 2: Run production build**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds (OpenNext + Cloudflare)

- [ ] **Step 3: Global search for buildPRUrl**

Run: `grep -r "buildPRUrl" apps/ packages/`
Expected: No results

- [ ] **Step 4: Wrangler local Worker verification**

Run: `cd apps/web && pnpm wrangler dev`
Expected: Worker starts. Navigate to the app and verify `/api/submit-pr` route loads without `node:fs` runtime errors.

- [ ] **Step 5: Functional verification in Worker environment**

Test each scenario manually in the local Worker:
1. Create team → PR created with `[创建团队]` title
2. Join team → PR created with `[加入团队]` title
3. Leave team → PR created with `[退出团队]` title
4. All buttons show submitting state and error messages on failure

- [ ] **Step 6: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix(submit-pr): address issues found during verification"
```
