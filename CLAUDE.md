# CLAUDE.md — Synnovator Monorepo

## 项目概述

Synnovator monorepo 是唯一的开发入口，使用 git subtree 管理 3 个子项目。

## 子项目导航

| 目录 | 说明 | 技术栈 | 指南 |
|------|------|--------|------|
| [`docs/`](docs/CLAUDE.md) | 设计文档 | Markdown | [docs/CLAUDE.md](docs/CLAUDE.md) |
| [`page/`](page/CLAUDE.md) | 官网 | Astro, Tailwind | [page/CLAUDE.md](page/CLAUDE.md) |
| [`synnovator/`](synnovator/CLAUDE.md) | CLI + 后端 | TypeScript | [synnovator/CLAUDE.md](synnovator/CLAUDE.md) |

## 关键文档

- **MONOREPO.md** — Monorepo 管理指南（subtree 操作、CI 同步、分支策略）
- **CONTRIBUTING.md** — 开发规范（Commit 格式、PR 流程）
- **docs/plans/** — 实施计划
- **docs/specs/** — 系统规格文档

## 核心规则

1. **所有开发只在 monorepo 进行**，子仓库是只读发布镜像
2. **subtree add/pull 必须用 `--squash`**，subtree push 不加 `--squash`
3. **推送到 main 后 CI 自动同步子仓库**
4. **JavaScript 用 `pnpm`，禁止 `npm`/`npx`**（PreToolUse hook 强制执行）

## 开发流程

```
feat/xxx → dev → main → [CI 自动同步到子仓库]
```

- Commit 格式：`type(scope): description`，scope 使用子项目名
- 详见 CONTRIBUTING.md

## Claude Code 配置

- `.claude/hooks/` — PreToolUse hook（工具约束强制执行）
- `.claude/settings.local.json` — 本地会话配置（已 gitignore）
