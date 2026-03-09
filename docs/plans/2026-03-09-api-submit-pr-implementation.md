# API-Based PR Submission — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace GitHub URL redirect with server-side API that creates branch + commit + PR via GitHub App installation token, enforcing `data/*` branch naming.

**Architecture:** New `/api/submit-pr` Route Handler uses `@octokit/auth-app` to obtain installation tokens, then calls GitHub API to create branch → commit file → open PR. Three form components switch from `buildPRUrl()` + redirect to `fetch('/api/submit-pr')` + redirect to PR page.

**Tech Stack:** Next.js Route Handlers, `@octokit/auth-app`, `@octokit/rest`, Cloudflare Workers (via OpenNext)

---

### Task 1: Install dependencies

**Step 1: Add @octokit packages**

```bash
pnpm --filter @synnovator/web add @octokit/auth-app @octokit/rest
```

**Step 2: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): add @octokit/auth-app and @octokit/rest"
```

---

### Task 2: Create github-app.ts utility

**Files:**
- Create: `apps/web/lib/github-app.ts`

**Step 1: Create the utility**

```typescript
import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';

interface GitHubAppEnv {
  GITHUB_APP_ID: string;
  GITHUB_APP_PRIVATE_KEY: string;
  GITHUB_APP_INSTALLATION_ID: string;
}

export function getInstallationOctokit(env: GitHubAppEnv): Octokit {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: env.GITHUB_APP_ID,
      privateKey: env.GITHUB_APP_PRIVATE_KEY,
      installationId: Number(env.GITHUB_APP_INSTALLATION_ID),
    },
  });
}
```

That's it — `@octokit/auth-app` handles JWT signing, installation token exchange, and token caching internally.

**Step 2: Commit**

```bash
git add apps/web/lib/github-app.ts
git commit -m "feat(web): add GitHub App installation token utility"
```

---

### Task 3: Create /api/submit-pr route

**Files:**
- Create: `apps/web/app/api/submit-pr/route.ts`

**Step 1: Create the route handler**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@synnovator/shared/auth';
import { getInstallationOctokit } from '@/lib/github-app';

const OWNER = process.env.GITHUB_OWNER || 'Synnovator';
const REPO = process.env.GITHUB_REPO || 'monorepo';

const VALID_TYPES = ['hackathon', 'proposal', 'profile'] as const;
type SubmitType = (typeof VALID_TYPES)[number];

const FILENAME_PATTERNS: RegExp[] = [
  /^hackathons\/[a-z0-9-]+\/hackathon\.yml$/,
  /^hackathons\/[a-z0-9-]+\/submissions\/[a-z0-9-]+\/project\.yml$/,
  /^profiles\/[a-z0-9][\w.-]*\.yml$/,
];

const BRANCH_PREFIX: Record<SubmitType, string> = {
  hackathon: 'data/create-hackathon',
  proposal: 'data/submit',
  profile: 'data/create-profile',
};

export async function POST(request: NextRequest) {
  // 1. Auth
  const session = await getSession(request, process.env.AUTH_SECRET!);
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 2. Parse + validate
  let body: { type: string; filename: string; content: string; slug: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const { type, filename, content, slug } = body;

  if (!VALID_TYPES.includes(type as SubmitType)) {
    return NextResponse.json({ error: 'invalid type' }, { status: 400 });
  }
  if (!filename || !FILENAME_PATTERNS.some(p => p.test(filename))) {
    return NextResponse.json({ error: 'invalid filename' }, { status: 400 });
  }
  if (!content?.trim()) {
    return NextResponse.json({ error: 'empty content' }, { status: 400 });
  }
  if (!slug?.trim()) {
    return NextResponse.json({ error: 'missing slug' }, { status: 400 });
  }

  // 3. Octokit
  const octokit = getInstallationOctokit({
    GITHUB_APP_ID: process.env.GITHUB_APP_ID!,
    GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY!,
    GITHUB_APP_INSTALLATION_ID: process.env.GITHUB_APP_INSTALLATION_ID!,
  });

  const submitType = type as SubmitType;

  try {
    // 4a. Get main SHA
    const { data: ref } = await octokit.git.getRef({ owner: OWNER, repo: REPO, ref: 'heads/main' });
    const mainSha = ref.object.sha;

    // 4b. Create branch (retry with timestamp on conflict)
    let branchName = `${BRANCH_PREFIX[submitType]}-${slug}`;
    try {
      await octokit.git.createRef({
        owner: OWNER, repo: REPO,
        ref: `refs/heads/${branchName}`,
        sha: mainSha,
      });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 422) {
        branchName = `${branchName}-${Math.floor(Date.now() / 1000)}`;
        await octokit.git.createRef({
          owner: OWNER, repo: REPO,
          ref: `refs/heads/${branchName}`,
          sha: mainSha,
        });
      } else {
        throw err;
      }
    }

    // 4c. Commit file
    const commitMessage =
      submitType === 'hackathon' ? `feat(hackathons): create ${slug}` :
      submitType === 'proposal' ? `feat(submissions): submit ${slug}` :
      `feat(profiles): create profile for ${session.login}`;

    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER, repo: REPO,
      path: filename,
      message: commitMessage,
      content: Buffer.from(content).toString('base64'),
      branch: branchName,
    });

    // 4d. Create PR
    const { data: pr } = await octokit.pulls.create({
      owner: OWNER, repo: REPO,
      title: commitMessage,
      body: [
        `Submitted by @${session.login}`,
        '',
        `**File:** \`${filename}\``,
        '',
        '---',
        '> Auto-created via [Synnovator Platform](https://home.synnovator.space)',
      ].join('\n'),
      head: branchName,
      base: 'main',
    });

    return NextResponse.json({ pr_url: pr.html_url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create PR';
    console.error('submit-pr error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add apps/web/app/api/submit-pr/route.ts
git commit -m "feat(web): add /api/submit-pr route for GitHub App PR creation"
```

---

### Task 4: Add i18n keys

**Files:**
- Modify: `packages/shared/src/i18n/en.json`
- Modify: `packages/shared/src/i18n/zh.json`

**Step 1: Add common form submission keys to en.json**

In the `"form"` object, add a new `"common"` section (before `"profile"`):

```json
"common": {
  "submitting": "Submitting...",
  "submit_error": "Submission failed. Please try again.",
  "submit_success": "PR created successfully!"
}
```

**Step 2: Add same keys to zh.json**

```json
"common": {
  "submitting": "提交中...",
  "submit_error": "提交失败，请重试。",
  "submit_success": "PR 创建成功！"
}
```

**Step 3: Commit**

```bash
git add packages/shared/src/i18n/en.json packages/shared/src/i18n/zh.json
git commit -m "feat(shared): add common form submission i18n keys"
```

---

### Task 5: Update CreateHackathonForm

**Files:**
- Modify: `apps/web/components/forms/CreateHackathonForm.tsx`

**Step 1: Update imports**

Replace:
```typescript
import { buildPRUrl, openGitHubUrl } from '@/lib/github-url';
```
With:
```typescript
import { openGitHubUrl } from '@/lib/github-url';
```

**Step 2: Add submitting/error state**

After the existing `useState` declarations (around line 90), add:

```typescript
const [submitting, setSubmitting] = useState(false);
const [submitError, setSubmitError] = useState('');
```

**Step 3: Replace handleSubmit**

Replace the current `handleSubmit` function:

```typescript
function handleSubmit() {
  const finalSlug = slug || toSlug(name);
  const url = buildPRUrl({
    filename: `hackathons/${finalSlug}/hackathon.yml`,
    value: yamlContent,
    message: `feat(hackathons): create ${finalSlug}`,
  });
  openGitHubUrl(url);
}
```

With:

```typescript
async function handleSubmit() {
  const finalSlug = slug || toSlug(name);
  setSubmitting(true);
  setSubmitError('');
  try {
    const res = await fetch('/api/submit-pr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'hackathon',
        filename: `hackathons/${finalSlug}/hackathon.yml`,
        content: yamlContent,
        slug: finalSlug,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Unknown error');
    window.open(data.pr_url, '_blank', 'noopener,noreferrer');
  } catch (e) {
    setSubmitError(e instanceof Error ? e.message : 'Unknown error');
  } finally {
    setSubmitting(false);
  }
}
```

**Step 4: Update submit button**

Find the submit button and add `submitting` to disabled condition and change button text:

```tsx
<button type="button" onClick={handleSubmit}
  disabled={!isLoggedIn || !isStepValid(0) || !isStepValid(1) || !isStepValid(2) || !isStepValid(4) || submitting}
  className="px-6 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
  {submitting ? t(lang, 'form.common.submitting') : t(lang, 'form.create_hackathon.submit_pr')} {'\u2192'}
</button>
```

**Step 5: Add error message after submit button**

After the submit button's closing `</button>`, add:

```tsx
{submitError && (
  <p className="text-xs text-error mt-2">{submitError}</p>
)}
```

**Step 6: Commit**

```bash
git add apps/web/components/forms/CreateHackathonForm.tsx
git commit -m "feat(web): CreateHackathonForm uses /api/submit-pr instead of GitHub URL"
```

---

### Task 6: Update CreateProposalForm

**Files:**
- Modify: `apps/web/components/forms/CreateProposalForm.tsx`

Same pattern as Task 5. Key differences:

**Step 1: Update imports** — remove `buildPRUrl`, keep `openGitHubUrl` (not used but keep for consistency; actually remove if not used elsewhere in file).

Check file: `openGitHubUrl` is NOT used in CreateProposalForm besides `handleSubmit`, so remove it too:

```typescript
import { formatYaml } from './form-utils';
```

(Remove the entire `github-url` import line.)

**Step 2: Add state** — same `submitting` + `submitError` useState.

**Step 3: Replace handleSubmit:**

```typescript
async function handleSubmit() {
  setSubmitting(true);
  setSubmitError('');
  try {
    const res = await fetch('/api/submit-pr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'proposal',
        filename: `hackathons/${selectedHackathon}/submissions/${teamSlug}/project.yml`,
        content: yamlContent,
        slug: teamSlug,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Unknown error');
    window.open(data.pr_url, '_blank', 'noopener,noreferrer');
  } catch (e) {
    setSubmitError(e instanceof Error ? e.message : 'Unknown error');
  } finally {
    setSubmitting(false);
  }
}
```

**Step 4: Update submit button** — add `|| submitting` to disabled, change text to use `form.common.submitting`.

**Step 5: Add error message** — same pattern.

**Step 6: Commit**

```bash
git add apps/web/components/forms/CreateProposalForm.tsx
git commit -m "feat(web): CreateProposalForm uses /api/submit-pr instead of GitHub URL"
```

---

### Task 7: Update ProfileCreateForm

**Files:**
- Modify: `apps/web/components/forms/ProfileCreateForm.tsx`

Same pattern. Key differences:

**Step 1: Update imports** — remove `buildPRUrl, openGitHubUrl` import.

**Step 2: Add state** — same.

**Step 3: Replace handleSubmit:**

```typescript
async function handleSubmit() {
  if (!user) return;
  const uuid = generateUUID8();
  setSubmitting(true);
  setSubmitError('');
  try {
    const res = await fetch('/api/submit-pr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'profile',
        filename: `profiles/${user.login}-${uuid}.yml`,
        content: yamlContent,
        slug: user.login,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Unknown error');
    window.open(data.pr_url, '_blank', 'noopener,noreferrer');
  } catch (e) {
    setSubmitError(e instanceof Error ? e.message : 'Unknown error');
  } finally {
    setSubmitting(false);
  }
}
```

**Step 4-5: Update button + error message** — same pattern.

**Step 6: Commit**

```bash
git add apps/web/components/forms/ProfileCreateForm.tsx
git commit -m "feat(web): ProfileCreateForm uses /api/submit-pr instead of GitHub URL"
```

---

### Task 8: Update GitHubRedirect component

**Files:**
- Modify: `apps/web/components/GitHubRedirect.tsx`

`GitHubRedirect.tsx` uses `buildPRUrl` for `submit` and `create-profile` actions. These are quick-start links — change them to link to the actual form pages instead.

**Step 1: Replace file content**

```typescript
import { buildIssueUrl } from '@/lib/github-url';
import { ExternalLinkIcon } from './icons';

interface GitHubRedirectProps {
  action: 'register' | 'submit' | 'appeal' | 'create-profile' | 'edit-file';
  hackathonSlug?: string;
  label: string;
  className?: string;
}

export function GitHubRedirect({ action, hackathonSlug, label, className = '' }: GitHubRedirectProps) {
  let url = '#';
  let isExternal = true;

  switch (action) {
    case 'register':
      url = buildIssueUrl({
        template: 'register.yml',
        title: `[Register] --- — ${hackathonSlug}`,
        labels: ['registration', `hackathon:${hackathonSlug}`],
      });
      break;
    case 'submit':
      url = `/create-proposal${hackathonSlug ? `?hackathon=${hackathonSlug}` : ''}`;
      isExternal = false;
      break;
    case 'appeal':
      url = buildIssueUrl({
        template: 'appeal.yml',
        title: `[Appeal] --- — ${hackathonSlug}`,
        labels: ['appeal', `hackathon:${hackathonSlug}`],
      });
      break;
    case 'create-profile':
      url = '/create-profile';
      isExternal = false;
      break;
    case 'edit-file':
      url = '#';
      break;
  }

  if (isExternal) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${className}`}>
        {label}
        <ExternalLinkIcon size={12} />
      </a>
    );
  }

  return (
    <a href={url}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${className}`}>
      {label}
    </a>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/GitHubRedirect.tsx
git commit -m "refactor(web): GitHubRedirect links to form pages instead of GitHub URL"
```

---

### Task 9: Cleanup and config files

**Files:**
- Modify: `apps/web/lib/github-url.ts` (remove `buildPRUrl` + `PRUrlParams`)
- Create: `apps/web/.dev.vars.example`
- Modify: `.gitignore` (add `.dev.vars`)

**Step 1: Remove buildPRUrl from github-url.ts**

Remove `PRUrlParams` interface and `buildPRUrl` function. The file should become:

```typescript
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

**Step 2: Create .dev.vars.example**

```
# GitHub App credentials (for /api/submit-pr)
# Get these from: Settings → Developer settings → GitHub Apps → Synnovator
GITHUB_APP_ID=2996003
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_INSTALLATION_ID=<your-installation-id>

# Auth (existing)
AUTH_SECRET=<random-secret-for-session-encryption>
GITHUB_CLIENT_SECRET=<oauth-client-secret>
```

**Step 3: Add .dev.vars to .gitignore**

Add this line to the root `.gitignore` under the `# Node.js` section:

```
# Cloudflare dev secrets
.dev.vars
```

**Step 4: Commit**

```bash
git add apps/web/lib/github-url.ts apps/web/.dev.vars.example .gitignore
git commit -m "chore(web): remove buildPRUrl, add .dev.vars.example, update .gitignore"
```

---

### Task 10: Build verification

**Step 1: Run build**

```bash
pnpm build
```

Expected: Build succeeds with no TypeScript errors.

**Step 2: Verify no remaining buildPRUrl references in code**

```bash
grep -r "buildPRUrl" apps/web/components/ apps/web/lib/ apps/web/app/
```

Expected: No results (docs/ references are OK — they're historical).

**Step 3: Manual smoke test checklist**

Start dev server with `pnpm dev` and `.dev.vars` configured:

- [ ] `/create-hackathon`: Fill required fields → submit → API creates PR → redirected to PR page
- [ ] `/create-proposal`: Fill required fields → submit → API creates PR
- [ ] `/create-profile`: Fill name → submit → API creates PR
- [ ] Submit with empty session → 401 error shown
- [ ] Branch name follows `data/*` convention
- [ ] PR body contains `Submitted by @{username}`
- [ ] Loading state shown during submission
- [ ] Error message shown on failure
