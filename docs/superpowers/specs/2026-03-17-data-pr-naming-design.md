# Data PR Naming Design

> Date: 2026-03-17
> Status: Draft
> Scope: PR title, branch name, PR body for all data-type PRs

## Problem

Data PRs (hackathon creation, project submission, profile creation, registration/NDA sync) have vague titles like `feat(submissions): submit team-project`. Admins reviewing these PRs cannot quickly identify which hackathon, track, team, or project is involved without opening the PR and reading the file diffs.

Data PRs are reviewed by operations/admin staff, not developers. They need a different naming convention from dev PRs — human-readable, bilingual, and context-rich.

## Design Decisions

1. **Data PRs do not follow conventional commit format** — they use a `[操作类型]` prefix with human-readable names. This applies to both PR titles and commit messages. Dev PRs continue to use conventional commit format.
2. **Bilingual (zh-first, en-second)** — `name_zh / name` format throughout title and body
3. **No fallback** — `metadata` is required on the API; missing metadata returns 400. All frontend forms and the API are deployed atomically — there is no rollout period where old clients call the new API.
4. **Branch names use flat concatenation** — hyphens only, no nested `/` separators beyond the `data/` prefix
5. **Unified branch naming across entry points** — the same data operation uses the same branch pattern regardless of whether it's initiated via Web API, Admin Skill, or GitHub Actions

## PR Title Format

### Web API (`/api/submit-pr`)

| Type | Title Format | Example |
|------|-------------|---------|
| proposal | `[提交] {projectName} → {hackathonNameZh} · {trackNameZh}赛道` | `[提交] AgentFlow → 滴水湖 AI OPC 全球挑战赛 2026 · AI 智能体赛道` |
| hackathon | `[创建比赛] {hackathonNameZh} / {hackathonName}` | `[创建比赛] 滴水湖 AI OPC 全球挑战赛 2026 / Dishuihu AI OPC Global Challenge 2026` |
| profile | `[创建档案] @{login}` | `[创建档案] @alice` |

### GitHub Actions (`sync-issue-data.yml`)

| Job | Title Format | Example |
|-----|-------------|---------|
| sync-registrations | `[同步注册] {N} 个注册 · {hackathonNameZh} / {hackathonName}` | `[同步注册] 3 个注册 · 滴水湖 AI OPC 全球挑战赛 2026 / Dishuihu AI OPC Global Challenge 2026` |
| sync-nda | `[同步NDA] {N} 份签署 · {hackathonNameZh} / {hackathonName}` | `[同步NDA] 2 份签署 · 滴水湖 AI OPC 全球挑战赛 2026 / Dishuihu AI OPC Global Challenge 2026` |

### Admin Skill (`synnovator-admin`)

| Operation | Title Format | Example |
|-----------|-------------|---------|
| create-hackathon | `[创建比赛] {nameZh} / {name}` | `[创建比赛] 社区黑客松 / Community Hackathon` |
| close-hackathon | `[关闭比赛] {nameZh} / {name}` | `[关闭比赛] 社区黑客松 / Community Hackathon` |
| submit-project | `[提交] {projectName} → {hackathonNameZh} · {trackNameZh}赛道` | `[提交] AgentFlow → 社区黑客松 · AI Agent赛道` |
| create-profile | `[创建档案] @{username}` | `[创建档案] @alice` |

Note: `close-hackathon` is admin-only (via Skill), not available through the Web API.

## Branch Name Format

### Web API

| Type | Branch Format | Example |
|------|--------------|---------|
| proposal | `data/submit-{hackathonSlug}-{teamSlug}` | `data/submit-dishuihu-ai-opc-team-agentflow` |
| hackathon | `data/create-hackathon-{slug}` | `data/create-hackathon-dishuihu-ai-opc-global-challenge-2026` (unchanged) |
| profile | `data/create-profile-{login}` | `data/create-profile-alice` (unchanged) |

Collision handling (branch already exists): append Unix timestamp suffix, e.g. `data/submit-dishuihu-ai-opc-team-agentflow-1773645596`.

### GitHub Actions

| Job | Branch Format | Example |
|-----|--------------|---------|
| sync-registrations | `data/sync-registrations-{hackathonSlug}-{DATE}` | `data/sync-registrations-dishuihu-ai-opc-2026-03-17` |
| sync-nda | `data/sync-nda-{hackathonSlug}-{DATE}` | `data/sync-nda-dishuihu-ai-opc-2026-03-17` |

When multiple hackathons are synced in one run, use the first hackathon slug. If registrations span multiple hackathons, use `multi` as the slug, and the title becomes `[同步注册] {N} 个注册 · 多个比赛 / Multiple hackathons`.

#### Implementation: extracting hackathon info in sync workflows

The sync scripts (`actions/github-script` steps) must be modified to:
1. Collect unique hackathon slugs from processed issues (extracted from `hackathon:{slug}` labels)
2. For each unique slug, read `hackathons/{slug}/hackathon.yml` to get `name` and `name_zh`
3. Output via `core.setOutput()`: `hackathon_slugs`, `hackathon_names`, `hackathon_names_zh`, `count`, `users`
4. The shell step uses these outputs to construct the PR title, branch name, and body

If `hackathon.yml` doesn't exist for a slug, fall back to using the slug itself as the display name.

### Admin Skill

Uses the same branch patterns as Web API for consistency:

| Operation | Branch Format | Example |
|-----------|--------------|---------|
| create-hackathon | `data/create-hackathon-{slug}` | `data/create-hackathon-community-hackathon` |
| submit-project | `data/submit-{hackathonSlug}-{teamSlug}` | `data/submit-dishuihu-ai-opc-team-agentflow` |
| create-profile | `data/create-profile-{username}` | `data/create-profile-alice` |

## PR Body Format

### Proposal Submission

```markdown
提交者 / Submitted by: @Jerryxiaohei
比赛 / Hackathon: 滴水湖 AI OPC 全球挑战赛 2026 / Dishuihu AI OPC Global Challenge 2026
赛道 / Track: AI 智能体 / AI Agent
项目 / Project: 智能体工作流 / AgentFlow
队伍 / Team: team-agentflow

文件 / Files:
- `hackathons/dishuihu-ai-opc-global-challenge-2026/submissions/team-agentflow/project.yml`
- `hackathons/dishuihu-ai-opc-global-challenge-2026/submissions/team-agentflow/README.mdx`
- `hackathons/dishuihu-ai-opc-global-challenge-2026/submissions/team-agentflow/README.zh.mdx`

---
> Auto-created via [Synnovator Platform](https://home.synnovator.space)
```

### Hackathon Creation

```markdown
提交者 / Submitted by: @admin
比赛 / Hackathon: 滴水湖 AI OPC 全球挑战赛 2026 / Dishuihu AI OPC Global Challenge 2026
类型 / Type: community

文件 / Files:
- `hackathons/dishuihu-ai-opc-global-challenge-2026/hackathon.yml`
- `hackathons/dishuihu-ai-opc-global-challenge-2026/description.mdx`
- `hackathons/dishuihu-ai-opc-global-challenge-2026/description.zh.mdx`

---
> Auto-created via [Synnovator Platform](https://home.synnovator.space)
```

### Profile Creation

```markdown
提交者 / Submitted by: @alice

文件 / Files:
- `profiles/alice.yml`

---
> Auto-created via [Synnovator Platform](https://home.synnovator.space)
```

### Sync Registrations

```markdown
同步来源 / Source: GitHub Issues with `registered` label
比赛 / Hackathon: 滴水湖 AI OPC 全球挑战赛 2026 / Dishuihu AI OPC Global Challenge 2026
同步数量 / Count: 3

涉及用户 / Users:
- @alice
- @bob
- @charlie

---
> Auto-created by GitHub Actions
```

## API Interface Change

### `/api/submit-pr` Request Body

```typescript
interface SubmitPRBody {
  type: 'hackathon' | 'proposal' | 'profile';
  slug: string;
  files: FileEntry[];
  metadata: SubmitMetadata; // REQUIRED, no fallback
}

interface SubmitMetadata {
  // Always present
  hackathonSlug?: string;      // for proposal/hackathon types

  // Human-readable names (bilingual)
  hackathonName?: string;      // "Dishuihu AI OPC Global Challenge 2026"
  hackathonNameZh?: string;    // "滴水湖 AI OPC 全球挑战赛 2026"
  trackName?: string;          // "AI Agent"
  trackNameZh?: string;        // "AI 智能体"
  projectName?: string;        // "AgentFlow"
  projectNameZh?: string;      // "智能体工作流"
}
```

Validation rules:
- `type === 'proposal'` requires: `hackathonSlug`, `hackathonName`, `hackathonNameZh`, `trackName`, `projectName`
- `type === 'hackathon'` requires: `hackathonName`, `hackathonNameZh`
- `type === 'profile'` requires: no metadata fields (login comes from session)

Note: `*Zh` fields use the English name as fallback when the Chinese name is not provided by the user. The frontend is responsible for ensuring these fields are populated.

Missing required metadata fields → HTTP 400.

## Files to Modify

| File | Change |
|------|--------|
| `apps/web/app/api/submit-pr/route.ts` | Accept metadata, generate new title/branch/body format |
| `apps/web/components/forms/CreateProposalForm.tsx` | Pass metadata in fetch body |
| `apps/web/components/forms/CreateHackathonForm.tsx` | Pass metadata in fetch body |
| `apps/web/components/forms/ProfileCreateForm.tsx` | Pass metadata in fetch body |
| `apps/web/app/(auth)/edit/proposal/.../ProposalEditorClient.tsx` | Pass metadata in fetch body |
| `apps/web/app/(auth)/edit/hackathon/.../HackathonEditorClient.tsx` | Pass metadata in fetch body |
| `apps/web/app/(auth)/edit/profile/.../ProfileEditorClient.tsx` | Pass metadata in fetch body |
| `.github/workflows/sync-issue-data.yml` | Collect hackathon info, rewrite title/branch/body |
| `.claude/skills/synnovator-admin/SKILL.md` | Update PR title templates |
| `CONTRIBUTING.md` | Update branch naming docs |
