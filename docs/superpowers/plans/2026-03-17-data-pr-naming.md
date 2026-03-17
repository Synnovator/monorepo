# Data PR Naming Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace vague data PR titles/branches/bodies with human-readable, bilingual, context-rich formats across Web API, frontend forms, GitHub Actions, and Admin Skill.

**Architecture:** The API route (`/api/submit-pr`) is the central hub — it receives a new `metadata` field from all frontend callers, then generates the improved title/branch/body. Frontend forms pass metadata alongside existing payloads. GitHub Actions workflows extract hackathon info from YAML files. Admin Skill SKILL.md gets updated templates.

**Tech Stack:** Next.js API Routes, React forms, GitHub Actions YAML, Claude Skill Markdown

**Spec:** `docs/superpowers/specs/2026-03-17-data-pr-naming-design.md`

---

## Chunk 1: API Route + Frontend Forms

### Task 1: Update `/api/submit-pr` route

**Files:**
- Modify: `apps/web/app/api/submit-pr/route.ts`

- [ ] **Step 1: Add `SubmitMetadata` interface and validation**

After the `FileEntry` interface (line 37), add:

```typescript
interface SubmitMetadata {
  hackathonSlug?: string;
  hackathonName?: string;
  hackathonNameZh?: string;
  trackName?: string;
  trackNameZh?: string;
  projectName?: string;
  projectNameZh?: string;
}

const REQUIRED_METADATA: Record<SubmitType, (keyof SubmitMetadata)[]> = {
  proposal: ['hackathonSlug', 'hackathonName', 'hackathonNameZh', 'trackName', 'projectName'],
  hackathon: ['hackathonName', 'hackathonNameZh'],
  profile: [],
};
```

- [ ] **Step 2: Update request body parsing to require `metadata`**

In the body type (line 124), add `metadata?: SubmitMetadata;`.

After slug validation (line 146), add metadata validation:

```typescript
const metadata: SubmitMetadata = body.metadata ?? {};
const requiredFields = REQUIRED_METADATA[submitType];
const missingMeta = requiredFields.filter(f => !metadata[f]?.trim());
if (missingMeta.length > 0) {
  return NextResponse.json(
    { error: `missing metadata: ${missingMeta.join(', ')}` },
    { status: 400 },
  );
}
```

- [ ] **Step 3: Replace branch name construction**

Replace the branch name logic (line 214):

```typescript
// Build branch name with context
let branchName: string;
if (submitType === 'proposal') {
  branchName = `data/submit-${metadata.hackathonSlug}-${slug}`;
} else {
  branchName = `${BRANCH_PREFIX[submitType]}-${slug}`;
}
```

- [ ] **Step 4: Replace commit message and PR title construction**

Replace commitMessage (lines 238-243):

```typescript
const prTitle =
  submitType === 'proposal'
    ? `[提交] ${metadata.projectName} → ${metadata.hackathonNameZh} · ${metadata.trackNameZh || metadata.trackName}赛道`
    : submitType === 'hackathon'
      ? `[创建比赛] ${metadata.hackathonNameZh} / ${metadata.hackathonName}`
      : `[创建档案] @${session.login}`;
```

Use `prTitle` as both commitMessage and PR title.

- [ ] **Step 5: Replace PR body construction**

Replace the body array (lines 264-271):

```typescript
const filePaths = files.map((f) => f.path);
const filesList = filePaths.map((p) => `- \`${p}\``).join('\n');

let prBody: string;
if (submitType === 'proposal') {
  prBody = [
    `提交者 / Submitted by: @${session.login}`,
    `比赛 / Hackathon: ${metadata.hackathonNameZh} / ${metadata.hackathonName}`,
    `赛道 / Track: ${metadata.trackNameZh || metadata.trackName} / ${metadata.trackName}`,
    `项目 / Project: ${metadata.projectNameZh || metadata.projectName} / ${metadata.projectName}`,
    `队伍 / Team: ${slug}`,
    '',
    `文件 / Files:`,
    filesList,
    '',
    '---',
    '> Auto-created via [Synnovator Platform](https://home.synnovator.space)',
  ].join('\n');
} else if (submitType === 'hackathon') {
  prBody = [
    `提交者 / Submitted by: @${session.login}`,
    `比赛 / Hackathon: ${metadata.hackathonNameZh} / ${metadata.hackathonName}`,
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

Then update the `octokit.pulls.create` call to use `title: prTitle, body: prBody`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/api/submit-pr/route.ts
git commit -m "[改进] submit-pr API: 接收 metadata，生成人类可读的 PR title/branch/body"
```

### Task 2: Update `CreateProposalForm.tsx`

**Files:**
- Modify: `apps/web/components/forms/CreateProposalForm.tsx`

- [ ] **Step 1: Add metadata to fetch body**

In `handleSubmit()` (line 146-153), update the JSON body to include metadata:

```typescript
body: JSON.stringify({
  type: 'proposal',
  slug: teamSlug,
  files,
  metadata: {
    hackathonSlug: selectedHackathon,
    hackathonName: currentHackathon?.name,
    hackathonNameZh: currentHackathon?.name_zh || currentHackathon?.name,
    trackName: currentHackathon?.tracks.find(t => t.slug === track)?.name,
    trackNameZh: currentHackathon?.tracks.find(t => t.slug === track)?.name_zh
      || currentHackathon?.tracks.find(t => t.slug === track)?.name,
    projectName: name,
    projectNameZh: nameZh || name,
  },
}),
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/forms/CreateProposalForm.tsx
git commit -m "[改进] CreateProposalForm: 传递 metadata 到 submit-pr API"
```

### Task 3: Update `CreateHackathonForm.tsx`

**Files:**
- Modify: `apps/web/components/forms/CreateHackathonForm.tsx`

- [ ] **Step 1: Add metadata to fetch body**

In `handleSubmit()` (line 509-517), update:

```typescript
body: JSON.stringify({
  type: 'hackathon',
  slug: finalSlug,
  files,
  metadata: {
    hackathonName: name,
    hackathonNameZh: nameZh || name,
  },
}),
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/forms/CreateHackathonForm.tsx
git commit -m "[改进] CreateHackathonForm: 传递 metadata 到 submit-pr API"
```

### Task 4: Update `ProfileCreateForm.tsx`

**Files:**
- Modify: `apps/web/components/forms/ProfileCreateForm.tsx`

- [ ] **Step 1: Add metadata to fetch body**

In `handleSubmit()` (line 175-183), update:

```typescript
body: JSON.stringify({
  type: 'profile',
  slug: user.login,
  files,
  metadata: {},
}),
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/forms/ProfileCreateForm.tsx
git commit -m "[改进] ProfileCreateForm: 传递 metadata 到 submit-pr API"
```

### Task 5: Update `ProposalEditorClient.tsx`

**Files:**
- Modify: `apps/web/app/(auth)/edit/proposal/[hackathon]/[team]/ProposalEditorClient.tsx`

- [ ] **Step 1: Add metadata to fetch body**

The editor has `hackathonSlug`, `teamSlug`, and `projectName` (BilingualContent) in its props. Update the fetch call (lines 138-146):

```typescript
body: JSON.stringify({
  type: 'proposal',
  slug: teamSlug,
  files,
  metadata: {
    hackathonSlug,
    hackathonName: projectName.en || projectName.zh || teamSlug,
    hackathonNameZh: projectName.zh || projectName.en || teamSlug,
    trackName: teamSlug,
    projectName: projectName.en || projectName.zh || teamSlug,
    projectNameZh: projectName.zh || projectName.en || teamSlug,
  },
}),
```

Note: This editor doesn't have hackathon name or track info in its props. We need to add them. Check the parent page component to see what data is available and pass it down.

- [ ] **Step 2: Check parent page for available data and add props**

Read the parent page to find what hackathon/track data is available. Add `hackathonName`, `hackathonNameZh`, `trackName`, `trackNameZh` to the `ProposalEditorClientProps` interface and pass from parent.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/(auth)/edit/proposal/
git commit -m "[改进] ProposalEditorClient: 传递 metadata 到 submit-pr API"
```

### Task 6: Update `HackathonEditorClient.tsx`

**Files:**
- Modify: `apps/web/app/(auth)/edit/hackathon/[slug]/HackathonEditorClient.tsx`

- [ ] **Step 1: Add metadata to both fetch calls**

The component has `slug` and `name` (BilingualContent) in props. Update both fetch calls (description save ~line 169, track save ~line 307):

```typescript
metadata: {
  hackathonName: name.en || name.zh || slug,
  hackathonNameZh: name.zh || name.en || slug,
},
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/(auth)/edit/hackathon/
git commit -m "[改进] HackathonEditorClient: 传递 metadata 到 submit-pr API"
```

### Task 7: Update `ProfileEditorClient.tsx`

**Files:**
- Modify: `apps/web/app/(auth)/edit/profile/[username]/ProfileEditorClient.tsx`

- [ ] **Step 1: Add metadata to fetch body**

Update the fetch call (~line 149-157):

```typescript
body: JSON.stringify({
  type: 'profile',
  slug: username,
  files,
  metadata: {},
}),
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/(auth)/edit/profile/
git commit -m "[改进] ProfileEditorClient: 传递 metadata 到 submit-pr API"
```

### Task 8: Build verification

- [ ] **Step 1: Run build to verify no type errors**

```bash
pnpm --filter @synnovator/web build
```

Expected: builds successfully.

- [ ] **Step 2: Commit any fixes if needed**

---

## Chunk 2: GitHub Actions + Docs

### Task 9: Update `sync-issue-data.yml`

**Files:**
- Modify: `.github/workflows/sync-issue-data.yml`

- [ ] **Step 1: Update sync-registrations script to output hackathon info**

In the `actions/github-script` step for sync-registrations, add logic to:
1. Collect unique hackathon slugs from `hackathon:*` labels on processed issues
2. Read `hackathons/{slug}/hackathon.yml` for each slug to get `name` and `name_zh`
3. Output: `hackathon_slug`, `hackathon_name`, `hackathon_name_zh`, `count`, `users`

- [ ] **Step 2: Update sync-registrations PR creation step**

Replace lines 141-150 with:

```yaml
DATE=$(date +%Y-%m-%d)
SLUG="${{ steps.sync.outputs.hackathon_slug }}"
NAME="${{ steps.sync.outputs.hackathon_name }}"
NAME_ZH="${{ steps.sync.outputs.hackathon_name_zh }}"
COUNT="${{ steps.sync.outputs.count }}"
USERS="${{ steps.sync.outputs.users }}"
BRANCH="data/sync-registrations-${SLUG}-${DATE}"
git checkout -b "${BRANCH}"
git add profiles/
git commit -m "[同步注册] ${COUNT} 个注册 · ${NAME_ZH} / ${NAME}"
git push origin "${BRANCH}"
gh pr create \
  --title "[同步注册] ${COUNT} 个注册 · ${NAME_ZH} / ${NAME}" \
  --body "$(cat <<EOF
同步来源 / Source: GitHub Issues with \`registered\` label
比赛 / Hackathon: ${NAME_ZH} / ${NAME}
同步数量 / Count: ${COUNT}

涉及用户 / Users:
${USERS}

---
> Auto-created by GitHub Actions
EOF
)" \
  --base main
```

- [ ] **Step 3: Apply same pattern to sync-nda job**

Same changes for the NDA sync job, replacing "注册" with "NDA", "registered" with "nda-approved".

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/sync-issue-data.yml
git commit -m "[改进] sync-issue-data: PR title/branch 包含比赛名和同步数量"
```

### Task 10: Update Admin Skill

**Files:**
- Modify: `.claude/skills/synnovator-admin/SKILL.md`

- [ ] **Step 1: Update branch naming section**

Replace lines 52-53:

```markdown
Branch naming: `data/create-hackathon-{slug}` for hackathon ops, `data/create-profile-{username}` for profiles,
`data/submit-{hackathonSlug}-{teamSlug}` for submissions.
```

- [ ] **Step 2: Update create-hackathon PR title**

Replace line 86:
```markdown
8. Offer: `gh pr create --title "[创建比赛] {name_zh} / {name}" --body "比赛 / Hackathon: {name_zh} / {name}\n类型 / Type: {type}"`
```

Update commit message on line 84:
```markdown
   git commit -m "[创建比赛] {name_zh} / {name}"
```

- [ ] **Step 3: Update close-hackathon commit**

Replace line 110 commit message:
```markdown
4. Branch → validate → commit with message `[关闭比赛] {name_zh} / {name}` → offer PR
```

- [ ] **Step 4: Update create-profile commit**

Replace line 118:
```markdown
5. Branch `data/create-profile-{username}` → commit `[创建档案] @{username}` → offer PR
```

- [ ] **Step 5: Update submit-project commit and branch**

Replace line 126:
```markdown
5. Branch `data/submit-{slug}-{team}` → commit `[提交] {project_name} → {hackathon_name_zh} · {track_name_zh}赛道` → offer PR
```

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/synnovator-admin/SKILL.md
git commit -m "[改进] synnovator-admin skill: 更新 PR title/branch 模板"
```

### Task 11: Update CONTRIBUTING.md

**Files:**
- Modify: `CONTRIBUTING.md`

- [ ] **Step 1: Update data branch naming table**

Replace lines 90-96:

```markdown
| 前缀 | 用途 | 示例 |
|------|------|------|
| `data/create-hackathon-*` | 创建活动 | `data/create-hackathon-ai-challenge-2026` |
| `data/create-profile-*` | 创建 Profile | `data/create-profile-alice` |
| `data/submit-*` | 提交项目 | `data/submit-ai-challenge-team-alpha` |
| `data/simulate-*` | 模拟数据 | `data/simulate-fintech-2025` |
| `data/sync-registrations-*` | 注册同步 | `data/sync-registrations-ai-challenge-2026-03-17` |
| `data/sync-nda-*` | NDA 同步 | `data/sync-nda-ai-challenge-2026-03-17` |
```

- [ ] **Step 2: Update PR title convention for data branches**

Replace line 103:

```markdown
3. 数据 PR 标题使用 `[操作类型]` 前缀（如 `[提交]`、`[创建比赛]`、`[创建档案]`），不遵循 Conventional Commit 格式
```

- [ ] **Step 3: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "[改进] CONTRIBUTING: 更新数据分支命名和 PR title 规范"
```
