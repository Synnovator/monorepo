# CLAUDE.md — apps/web

## 概述

Synnovator 官网，基于 Next.js 15 App Router，通过 OpenNext 适配部署到 Cloudflare Workers。

## 目录结构

```
app/
  (public)/           # 公开页面（首页、活动详情、Hacker Profile 等）
  (admin)/admin/      # 管理后台（需登录 + 权限）
  api/                # API Routes（auth、submit-pr、admin review）
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

## API Routes

| Route | 用途 |
|-------|------|
| `/api/auth/login` | GitHub OAuth 登录跳转 |
| `/api/auth/callback` | OAuth 回调处理 |
| `/api/auth/me` | 当前用户信息 |
| `/api/submit-pr` | 表单提交 → 通过 GitHub App 创建 PR |
| `/api/check-profile` | 检查用户是否已创建 Profile |
| `/api/admin/review` | 管理员审批操作 |

## 开发

```bash
pnpm dev              # 启动 Turbopack 开发服务器（自动运行 prebuild 生成静态数据）
pnpm build            # 构建生产版本（OpenNext + Cloudflare）
```

### 本地 Secrets 配置

复制 `.dev.vars.example` → `.dev.vars`，填入敏感值：

```bash
cp .dev.vars.example .dev.vars
# 编辑 .dev.vars 填入 GITHUB_APP_PRIVATE_KEY、AUTH_SECRET、GITHUB_CLIENT_SECRET
```

> `.dev.vars` 已 gitignore。Wrangler 开发服务器会自动读取此文件注入 Worker 环境变量。

## 部署

推送到 `main` 分支后，GitHub Actions（`.github/workflows/deploy.yml`）自动构建并通过 `wrangler deploy` 部署到 Cloudflare Workers。

- **触发条件**：仅 `push` 到 `main`（`data/*` 等分支不会触发部署）
- **构建命令**：`pnpm run deploy`（= `opennextjs-cloudflare build && wrangler deploy`）
- **所需 Secrets**：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`（GitHub repo Secrets）
- **Worker 配置**：`wrangler.jsonc`（Worker 名 `synnovator`，运行时变量和 Secrets 在 Cloudflare dashboard 配置）

## 注意事项

- `prebuild` 脚本（`scripts/generate-static-data.mjs`）在 `dev` 和 `build` 前自动运行，将 YAML 数据转为 JSON
- 使用 `pnpm run deploy` 而非 `pnpm deploy`（后者是 pnpm 内置命令）
- 无测试框架（测试在 `@synnovator/shared` 包中，使用 Vitest）
- **禁止在运行时使用 `node:fs` 读取 YAML/数据文件**。Cloudflare Workers 没有 `fs` 模块，运行时调用会导致 HTTP 500。所有 YAML 数据（hackathons、profiles、themes 等）必须通过 `scripts/generate-static-data.mjs` 在构建时预生成为 JSON，然后通过 `app/_generated/data.ts` 导入使用。如需新增数据源，扩展 generate 脚本，不要在 API Route 或 Server Component 中 `import fs`
- **`AUTH_SECRET` 必须通过环境变量配置**，不要使用 hardcoded fallback。本地开发在 `.dev.vars` 中配置，Cloudflare Workers 通过 `wrangler secret put` 配置。所有路由统一使用 `process.env.AUTH_SECRET!`
