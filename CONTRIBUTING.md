# Contributing to Synnovator

## Commit 规范

格式：`type(scope): description`

### Type

| type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档变更 |
| `refactor` | 重构（不改变行为） |
| `test` | 测试相关 |
| `chore` | 构建、依赖、配置等杂项 |
| `ci` | CI/CD 变更 |

### Scope

使用模块名：`web`, `ui`, `shared`, `docs`

| scope | 对应目录 |
|-------|----------|
| `web` | `apps/web/` — Next.js 官网 |
| `ui` | `packages/ui/` — 共享 UI 组件库 |
| `shared` | `packages/shared/` — 共享逻辑 |
| `docs` | `docs/` — 文档 |

### 示例

```
feat(web): add hackathon listing page
fix(web): fix responsive layout
feat(ui): add Button component
feat(shared): add hackathon schema
docs(docs): add architecture spec
ci: add deploy workflow
```

## 目录结构

```
monorepo/
  apps/
    web/              # Next.js 15 App Router 官网
  packages/
    ui/               # 共享 UI 组件库（@synnovator/ui）
    shared/           # 共享逻辑：Schema、数据读取、i18n、Auth（@synnovator/shared）
  hackathons/         # 活动数据（YAML）
  profiles/           # 用户 Profile（YAML）
  scripts/            # 底层脚本
  docs/               # 设计文档
```

## 开发命令

从仓库根目录运行：

```bash
pnpm install          # 安装所有依赖
pnpm dev              # 启动开发服务器（Turbopack）
pnpm build            # 构建所有 packages + app
pnpm lint             # 全量 lint
```

## 分支策略

### 代码开发分支

```
feat/xxx ──→ main → [自动部署]
fix/xxx  ──→ main
docs/xxx ──→ main
```

| 前缀 | 用途 | 示例 |
|------|------|------|
| `feat/*` | 新功能开发 | `feat/add-voting-ui` |
| `fix/*` | Bug 修复 | `fix/i18n-fallback` |
| `docs/*` | 文档变更 | `docs/update-prd` |
| `refactor/*` | 重构 | `refactor/extract-utils` |
| `chore/*` | 配置/依赖 | `chore/bump-deps` |
| `ci/*` | CI/CD 变更 | `ci/add-lint-check` |

### 数据操作分支

平台数据变更（YAML）使用 `data/` 前缀，与代码分支区分：

| 前缀 | 用途 | 示例 |
|------|------|------|
| `data/hackathon-*` | 创建/编辑活动 | `data/hackathon-ai-challenge-2026` |
| `data/profile-*` | 创建/编辑 Profile | `data/profile-alice` |
| `data/submission-*` | 提交项目 | `data/submission-ai-challenge-team-alpha` |
| `data/simulate-*` | 模拟数据 | `data/simulate-fintech-2025` |
| `data/sync-*` | Actions 自动同步 | `data/sync-registrations-2026-03-08` |

## Pull Request

1. 从 `main` 创建功能/数据分支
2. 开发完成后提交 PR 到 `main`
3. PR 标题遵循 Commit 规范格式
4. 合并后自动部署

## 数据贡献

- **创建活动**：运行 `scripts/create-hackathon.sh <slug>`，编辑 YAML，提交 PR
- **注册 Profile**：运行 `scripts/create-profile.sh <username>`，编辑 YAML，提交 PR
- **提交项目**：运行 `scripts/submit-project.sh <hackathon> <team>`，编辑 YAML，提交 PR

## 工具约束

### JavaScript: 使用 pnpm（禁止 npm/npx）

| 禁止 | 使用 |
|------|------|
| `npm install` | `pnpm install` |
| `npm install foo` | `pnpm add foo` |
| `npm run dev` | `pnpm run dev` |
| `npm init` | `pnpm create` |
| `npm ci` | `pnpm install --frozen-lockfile` |
| `npx foo` | `pnpm dlx foo`（一次性）或 `pnpm exec foo`（本地） |
