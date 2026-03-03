# Synnovator Monorepo 初始化设计

日期：2026-03-03

## 概述

初始化 Synnovator monorepo，参考 ezagent42/monorepo 结构但大幅精简。3 个子项目，TypeScript 技术栈，git subtree + CI 同步模式。

## 结构

```
monorepo/
├── docs/                    → 设计文档 (subtree, CC0-1.0)
│   ├── CLAUDE.md
│   ├── README.md
│   ├── specs/               → 系统规格文档
│   └── plans/               → 实施计划
│
├── page/                    → 官网 (subtree, Apache 2.0)
│   ├── CLAUDE.md
│   ├── package.json         → Astro + Tailwind
│   ├── astro.config.mjs
│   ├── tsconfig.json
│   └── src/
│       ├── pages/
│       ├── layouts/
│       ├── components/
│       └── styles/
│
├── synnovator/              → CLI + 后端 (subtree, Apache 2.0)
│   ├── CLAUDE.md
│   ├── package.json         → TypeScript
│   ├── tsconfig.json
│   └── src/
│
├── .claude/                 → Claude Code 配置
│   ├── settings.json
│   └── hooks/
│       └── enforce-tools.sh → pnpm 工具约束
│
├── .github/workflows/
│   └── sync-subtrees.yml    → CI 自动同步
│
├── .gitignore
├── CLAUDE.md                → 项目总览
├── CONTRIBUTING.md          → 开发规范
├── MONOREPO.md              → Monorepo 管理指南
└── README.md
```

## 技术决策

| 维度 | 选择 | 理由 |
|------|------|------|
| Repo 模式 | git subtree + CI 同步 | 与 ezagent42 一致，成熟方案 |
| synnovator/ 技术栈 | TypeScript | 用户选择 |
| page/ 技术栈 | Astro + Tailwind | SSG 最优解，GitHub Pages 部署 |
| 包管理器 | pnpm | 统一工具，hook 强制执行 |
| 文档结构 | specs/ + plans/ | 精简，去掉 tldr/eep/socialware 等 |

## 相比 ezagent42 的精简

- 3 个子项目（vs. 5 个）
- 无 Rust/Python 相关配置
- 文档只保留 specs/ 和 plans/
- 官网暂不做 i18n
- Claude 配置只保留 hooks
