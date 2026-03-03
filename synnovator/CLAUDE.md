# CLAUDE.md — synnovator（CLI + 后端）

Synnovator 核心系统。License: Apache 2.0。

## 技术栈

| 技术 | 用途 |
|------|------|
| TypeScript | 语言 |
| pnpm | 包管理（**禁止 npm/npx**） |

## 目录结构

```
synnovator/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts          # 入口
```

## 开发指南

```bash
pnpm install          # 安装依赖
pnpm run build        # 编译
pnpm run dev          # 监听模式编译
```

## Commit 规范

```
feat(synnovator): add CLI entry point
fix(synnovator): handle edge case
```
