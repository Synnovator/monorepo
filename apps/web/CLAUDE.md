# CLAUDE.md — apps/web

## 概述

Synnovator 官网，基于 Next.js 15 App Router，通过 OpenNext 适配部署到 Cloudflare Pages。

## 目录结构

```
app/
  (public)/           # 公开页面（首页、活动详情、Hacker Profile 等）
  (admin)/admin/      # 管理后台（需登录 + 权限）
  api/                # API Routes（auth、presign、admin review）
  layout.tsx          # Root Layout
  globals.css         # 全局样式
components/           # 页面级 React 组件
hooks/                # 自定义 React Hooks
```

## 关键模式

- **i18n**：通过 URL searchParams（`?lang=en`）切换语言，翻译由 `@synnovator/shared` 提供
- **Auth**：GitHub OAuth，session 管理由 `@synnovator/shared` 提供，API Routes 处理登录回调
- **Server / Client 组件分离**：页面默认 Server Component，交互部分提取为 `"use client"` 组件
- **数据读取**：Server Component 通过 `@synnovator/shared` 读取 `hackathons/`、`profiles/` 的 YAML 数据

## 依赖

| 包 | 用途 |
|----|------|
| `@synnovator/ui` | 共享 UI 组件（Button、Card、Badge 等） |
| `@synnovator/shared` | Schema（Zod）、数据读取、i18n 翻译、Auth session |

## 开发

```bash
pnpm dev              # 启动 Turbopack 开发服务器
pnpm build            # 构建生产版本（OpenNext + Cloudflare）
```

## 部署

推送到 `main` 分支后，通过 OpenNext 适配器构建并自动部署到 Cloudflare Pages。
