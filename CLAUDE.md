# CLAUDE.md — Synnovator Monorepo

## 项目概述

Synnovator 是 Git 原生的 Hackathon 平台。本仓库是"产品即 repo"模式：`hackathons/` 和 `profiles/` 存放用户通过 PR/Issue 提交的数据，`apps/web/` 读取数据生成页面。仓库同时也是管理后端——管理员通过 Claude Code Skill 执行管理操作，GitHub RBAC 控制权限。

## 目录导航

| 目录 | 说明 | 指南 |
|------|------|------|
| [`apps/web/`](apps/web/CLAUDE.md) | 官网（Next.js App Router + OpenNext Cloudflare） | [apps/web/CLAUDE.md](apps/web/CLAUDE.md) |
| [`packages/ui/`](packages/ui/) | 共享 UI 组件库 | — |
| [`packages/shared/`](packages/shared/) | 共享逻辑（Schema、数据读取、i18n、Auth） | — |
| [`hackathons/`](hackathons/) | 活动数据（YAML） | — |
| [`profiles/`](profiles/) | 用户 Profile（YAML） | [profiles/_schema.yml](profiles/_schema.yml) |
| [`scripts/`](scripts/) | 底层脚本（由 Skill 调用，管理员无需直接使用） | — |
| [`docs/`](docs/CLAUDE.md) | 设计文档 | [docs/CLAUDE.md](docs/CLAUDE.md) |
| [`.claude/skills/`](.claude/) | Claude Code Skills（管理操作入口） | — |

## 关键文档

- **docs/specs/synnovator-prd.md** — PRD 权威源（数据 Schema、架构设计）
- **docs/specs/design-system.md** — Neon Forge 设计系统（色彩、字体、间距、布局）
- **docs/acceptance/** — 验收规范（Given-When-Then BDD，按角色组织）
- **docs/plans/** — 实施计划和架构设计
- **CONTRIBUTING.md** — 开发规范（Commit 格式、PR 流程）

## 核心规则

1. **JavaScript 用 `pnpm`，禁止 `npm`/`npx`**（PreToolUse hook 强制执行）
2. **数据变更通过 PR 提交**，Actions 自动校验
3. **`apps/web/` 从数据目录读取 YAML 生成页面**，推送到 main 后通过 GitHub Actions（`.github/workflows/deploy.yml`）自动部署到 Cloudflare Workers
4. **管理操作通过 Skill 执行**，Skill 调用 `scripts/` 底层脚本，管理员无需直接操作脚本

## 管理模型

本仓库即管理后端。管理员通过 Claude Code Skill 管理平台，无需独立的 Admin Panel。

```
管理员 clone 仓库 → /synnovator-admin → Skill 编辑 YAML / 调用 scripts/ → git commit → PR → Actions 校验 → 合并
```

**Skill 与 scripts 的关系**：
- `scripts/` 包含底层脚本（`create-hackathon.sh`, `create-profile.sh`, `submit-project.sh`）
- Skill 是用户界面层，封装 scripts/ 调用 + YAML 编辑 + Schema 校验 + PR 创建
- 管理员只与 Skill 交互，不需要直接执行 scripts/ 或手动编辑 YAML

**权限控制**：GitHub RBAC（Admin / Write+CODEOWNERS / Triage / Read），详见 PRD §7.4。

## 数据流

```
用户 PR → hackathons/*.yml / profiles/*.yml → Actions 校验 → Merge → deploy.yml 构建 → Cloudflare Workers
用户 Issue → 注册/NDA/评分/申诉/组队 → Actions 校验 → Label → sync-issue-data → PR → Merge
管理员 Skill → scripts/ + YAML 编辑 → PR → Actions 校验 → Merge
```

## 开发流程

```
feat/xxx ──→ main → [自动部署]
data/xxx ──→ main → [自动部署]  (平台数据变更)
```

- Commit 格式：`type(scope): description`，scope 使用 `web`, `ui`, `shared`, `docs`
- 代码分支：`feat/*`, `fix/*`, `docs/*`；数据分支：`data/*`
- 详见 CONTRIBUTING.md

## Claude Code 配置

- `.claude/skills/` — 管理 Skills（`synnovator-admin` 等，管理操作入口）
- `.claude/hooks/` — PreToolUse hook（工具约束强制执行）
- `.claude/settings.local.json` — 本地会话配置（已 gitignore）
