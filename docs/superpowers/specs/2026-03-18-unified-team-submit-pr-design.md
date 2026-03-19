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

在 `/api/submit-pr/route.ts` 中修改以下常量/映射：

**`VALID_TYPES`** 新增 3 个类型：
```ts
const VALID_TYPES = ['hackathon', 'proposal', 'profile', 'team', 'team-join', 'team-leave'] as const;
```

**`FILENAME_PATTERNS`** 新增：
```ts
/^teams\/[a-z0-9-]+\/team\.yml$/
```

**`BRANCH_PREFIX`** 新增：
```ts
team: 'data/create-team',
'team-join': 'data/team-join',
'team-leave': 'data/team-leave',
```

**`REQUIRED_METADATA`** 新增（均无额外 metadata）：
```ts
team: [],
'team-join': [],
'team-leave': [],
```

**PR Title 模板**（扩展现有条件分支）：

| Type | PR Title |
|------|----------|
| `team` | `[创建团队] {slug} by @{login}` |
| `team-join` | `[加入团队] @{login} → {slug}` |
| `team-leave` | `[退出团队] @{login} ← {slug}` |

**PR Body 模板**：
```
操作者 / Operator: @{login}
团队 / Team: {slug}

文件 / Files:
- `teams/{slug}/team.yml`
```

**Commit Message**：

| Type | Commit Message |
|------|---------------|
| `team` | `data(teams): create team {slug}` |
| `team-join` | `data(teams): {login} join {slug}` |
| `team-leave` | `data(teams): {login} leave {slug}` |

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

每个组件需要 `submitting` 状态和错误处理（inline error message，参照 CreateProposalForm 的 `{error && <p>...}` 模式）。CreateTeamForm 已有 submitting 状态，JoinTeamButton、LeaveTeamButton、TeamActions 需添加。

**YAML 操作保持客户端**：`team-join` 和 `team-leave` 的 YAML 字符串操作（成员插入/移除）保留在前端组件中，组件构造好完整的 `team.yml` 内容后通过 API 提交。注意：组件接收的 `teamYamlContent` prop 可能存在数据时效性问题（用户打开页面后、提交前有人修改了 team.yml），但这与现有 `buildPRUrl()` 方案的时效性问题相同，不在本次范围内解决——GitHub PR 的 merge conflict 机制提供了最终一致性保障。

### ~~3. Profile 自动创建~~ (已移除)

> **移除原因**：UI 层已保证正确性——Profile 不存在时显示"创建"按钮，存在时显示"编辑"按钮。创建 Profile 按钮出现即意味着文件不存在，无需服务端二次检查。#70 的根因是团队操作走 `buildPRUrl()` 失败导致用户卡住，修复团队操作（任务 1-2）后用户可正常创建 Profile。

### 3. 废弃代码清理

- 移除 `lib/github-url.ts` 中的 `buildPRUrl()` 和 `PRUrlParams`
- 保留 `buildIssueUrl()`、`openGitHubUrl()` 及常量（RegisterForm、AppealForm、ScoreCard 仍在使用）
- 移除各组件中的 `buildPRUrl` import
- 清理前通过全局搜索确认无其他 `buildPRUrl` 消费者

## Files Changed

| 文件 | 改动 |
|------|------|
| `apps/web/app/api/submit-pr/route.ts` | 扩展 VALID_TYPES / BRANCH_PREFIX / REQUIRED_METADATA / FILENAME_PATTERNS + PR title/body |
| `apps/web/components/forms/CreateTeamForm.tsx` | 重写提交逻辑 |
| `apps/web/components/JoinTeamButton.tsx` | 重写提交逻辑 + 添加 submitting/error 状态 |
| `apps/web/components/LeaveTeamButton.tsx` | 重写提交逻辑 + 添加 submitting/error 状态 |
| `apps/web/components/TeamActions.tsx` | 重写提交逻辑（join + leave）+ 添加 submitting/error 状态 |
| `apps/web/lib/github-url.ts` | 移除 buildPRUrl + PRUrlParams |

## Verification

### 静态检查
- [ ] `pnpm --filter @synnovator/shared test` 通过
- [ ] `pnpm --filter @synnovator/web build` 成功（OpenNext + Cloudflare 构建）
- [ ] `buildPRUrl()` 在代码中无引用（全局搜索确认）

### Wrangler 本地模拟部署
- [ ] `pnpm --filter @synnovator/web run deploy --dry-run` 或 `wrangler dev` 启动本地 Worker 环境
- [ ] 在 Worker 环境中验证 `/api/submit-pr` route 可正常加载（无 `node:fs` 等 Node.js API 运行时错误）

### 功能验证（在 Wrangler 本地 Worker 环境中）
- [ ] 普通用户创建团队 → PR 创建成功
- [ ] 普通用户加入团队 → PR 创建成功
- [ ] 普通用户退出团队 → PR 创建成功
- [ ] 所有组件有 submitting 状态和 inline 错误提示

## Decisions

| 决策 | 选择 | 理由 |
|------|------|------|
| team-join/leave 文件操作 | Git Tree API（与其他 type 相同） | `commitMultipleFiles()` 已支持，无需区分新建/修改 |
| YAML 操作位置 | 客户端（保持现状） | 服务端 YAML 解析超出本次范围；PR merge conflict 提供一致性保障 |
| Profile 自动创建 | 不需要 | UI 层已保证：创建按钮仅在 Profile 不存在时显示；#70 根因是团队操作失败 |
| 错误展示 | Inline error message | 与 CreateProposalForm 一致 |
