# CLAUDE.md — Synnovator Monorepo

## 项目概述

Synnovator 是 Git 原生的 Hackathon 平台。本仓库是"产品即 repo"模式：`hackathons/` 和 `profiles/` 存放用户通过 PR/Issue 提交的数据，`site/` 读取数据生成静态页面。

## 目录导航

| 目录 | 说明 | 指南 |
|------|------|------|
| [`site/`](site/CLAUDE.md) | 官网（Astro SSG） | [site/CLAUDE.md](site/CLAUDE.md) |
| [`hackathons/`](hackathons/) | 活动数据（YAML） | — |
| [`profiles/`](profiles/) | 用户 Profile（YAML） | [profiles/_schema.yml](profiles/_schema.yml) |
| [`scripts/`](scripts/) | CLI 辅助脚本 | — |
| [`docs/`](docs/CLAUDE.md) | 设计文档 | [docs/CLAUDE.md](docs/CLAUDE.md) |

## 关键文档

- **docs/specs/synnovator-prd.md** — PRD 权威源（数据 Schema、架构设计）
- **CONTRIBUTING.md** — 开发规范（Commit 格式、PR 流程）
- **docs/plans/** — 实施计划

## 核心规则

1. **JavaScript 用 `pnpm`，禁止 `npm`/`npx`**（PreToolUse hook 强制执行）
2. **数据变更通过 PR 提交**，Actions 自动校验
3. **站点从数据目录读取 YAML 生成页面**，推送到 main 后自动部署

## 数据流

```
用户 PR → hackathons/*.yml / profiles/*.yml → Actions 校验 → Merge → site/ 构建 → GitHub Pages
用户 Issue → 报名/评分/申诉/组队 → Actions 自动处理 → Label 路由
```

## 开发流程

```
feat/xxx → dev → main → [自动部署]
```

- Commit 格式：`type(scope): description`，scope 使用 `site`, `docs`
- 详见 CONTRIBUTING.md

## Claude Code 配置

- `.claude/hooks/` — PreToolUse hook（工具约束强制执行）
- `.claude/settings.local.json` — 本地会话配置（已 gitignore）
