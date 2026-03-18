# 统一团队操作提交方式 + Profile 自动创建

> Date: 2026-03-18
> Issues: #59, #61, #70
> Related: #60（提交成功反馈，本次不处理但架构兼容）

## Problem

平台有两套内容提交机制。`/api/submit-pr` 通过 GitHub App 认证在服务端创建 PR，用户无需 GitHub Write 权限；`buildPRUrl()` 构造 GitHub `/new/main` URL 跳转到网页编辑器。所有团队操作（创建、加入、退出）使用 `buildPRUrl()`，存在双重故障：

1. **权限问题**：`/new/main` 要求 Write 权限，普通用户只有 Read 权限
2. **操作类型错误**：加入/退出修改已有 `team.yml`，但 `/new/` 只能创建新文件

此外（#70），用户在创建 Profile 前执行其他操作时，系统不会自动创建 Profile，导致 `/hackers/{username}` 页面不可访问。

## Design

### 1. API Route 扩展

在 `/api/submit-pr/route.ts` 中新增 3 个提交类型：

| Type | Branch Prefix | Commit Message | 文件操作 |
|------|--------------|----------------|----------|
| `team` | `data/create-team` | `data(teams): create team {slug}` | 创建新 `teams/{slug}/team.yml` |
| `team-join` | `data/team-join` | `data(teams): {username} join {slug}` | 修改已有 `team.yml` |
| `team-leave` | `data/team-leave` | `data(teams): {username} leave {slug}` | 修改已有 `team.yml` |

新增 `FILENAME_PATTERNS` 条目：`/^teams\/[a-z0-9-]+\/team\.yml$/`

`commitMultipleFiles()` 使用 Git Tree API 创建新 tree，对新建和修改文件均适用，无需额外处理。

### 2. 前端组件迁移

4 个组件从 `buildPRUrl()` + `openGitHubUrl()` 迁移到 `fetch('/api/submit-pr')`：

| 组件 | 文件 | Type |
|------|------|------|
| CreateTeamForm | `components/forms/CreateTeamForm.tsx` | `team` |
| JoinTeamButton | `components/JoinTeamButton.tsx` | `team-join` |
| LeaveTeamButton | `components/LeaveTeamButton.tsx` | `team-leave` |
| TeamActions | `components/TeamActions.tsx` | `team-join` / `team-leave` |

统一模式（参照 CreateProposalForm）：

```tsx
const res = await fetch('/api/submit-pr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type, slug, files }),
});
const data = await res.json();
if (!res.ok) throw new Error(data.error);
window.open(data.pr_url, '_blank', 'noopener,noreferrer');
```

每个组件需要 `submitting` 状态和错误处理。CreateTeamForm 已有，JoinTeamButton、LeaveTeamButton、TeamActions 需添加。

### 3. Profile 自动创建

在 `commitMultipleFiles()` 调用前增加检查：

1. 通过 GitHub API 检查 `profiles/{slug}.yml` 是否存在于 main 分支
2. 若不存在，追加到 files 数组：
   - `profiles/{slug}.yml` — 最小 Profile（github + created_at）
   - `profiles/{slug}/bio.mdx` — 空 bio 模板
   - `profiles/{slug}/bio.zh.mdx` — 空 bio 模板

`slug` = GitHub username。`FILENAME_PATTERNS` 已覆盖 `profiles/` 路径，无需修改。自动创建的文件包含在同一个 PR 中。

### 4. 废弃代码清理

- 移除 `lib/github-url.ts` 中的 `buildPRUrl()` 和 `PRUrlParams`
- 保留 `buildIssueUrl()`、`openGitHubUrl()` 及常量（RegisterForm 等仍在使用）
- 移除各组件中的 `buildPRUrl` import

## Files Changed

| 文件 | 改动 |
|------|------|
| `apps/web/app/api/submit-pr/route.ts` | 扩展 types + Profile 自动创建逻辑 |
| `apps/web/components/forms/CreateTeamForm.tsx` | 重写提交逻辑 |
| `apps/web/components/JoinTeamButton.tsx` | 重写提交逻辑 |
| `apps/web/components/LeaveTeamButton.tsx` | 重写提交逻辑 |
| `apps/web/components/TeamActions.tsx` | 重写提交逻辑（join + leave） |
| `apps/web/lib/github-url.ts` | 移除 buildPRUrl + PRUrlParams |

## Verification

- [ ] `pnpm --filter @synnovator/shared test` 通过
- [ ] `pnpm --filter @synnovator/web build` 成功
- [ ] 普通用户创建团队 → PR 创建成功
- [ ] 普通用户加入团队 → PR 创建成功
- [ ] 普通用户退出团队 → PR 创建成功
- [ ] 首次提交用户 → PR 含自动创建的 Profile
- [ ] 已有 Profile 用户 → 不重复创建
- [ ] `buildPRUrl()` 在代码中无引用
- [ ] 所有组件有 submitting 状态和错误提示

## Decisions

| 决策 | 选择 | 理由 |
|------|------|------|
| Profile 文件名 | `{slug}.yml`（slug = GitHub username） | 与 API route 现有 profile type 一致，检查和创建用同一路径 |
| team-join/leave 文件操作 | Git Tree API（与其他 type 相同） | `commitMultipleFiles()` 已支持，无需区分新建/修改 |
| Profile 自动创建时机 | 所有 submit-pr 调用前 | 统一入口，避免遗漏 |
