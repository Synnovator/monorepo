# 设计文档：Astro → Next.js 迁移

> **日期**: 2026-03-05
> **状态**: Draft
> **范围**: site/ 迁移到 Next.js App Router，新增 admin 模块，Turborepo monorepo 重构

---

## 1. 迁移动机

### 1.1 核心驱动力

当前平台的数据提交依赖 GitHub PR 工作流（表单 → 预填 Issue/PR → Actions 校验 → Reviewer 合并）。需要转型为**自建 API + 审核界面**，将 GitHub PR review 替换为平台内的管理后台，同时保留 Git 作为数据存储和审计日志。

### 1.2 Astro 在当前项目中的价值评估

| Astro 能力 | 使用情况 | 迁移后影响 |
|------------|---------|-----------|
| 静态生成（SSG） | **未使用** — 全部 19 个页面均 `prerender = false` | 无影响 |
| Content Collections + Zod | **在用** — 5 个集合 | 数据层转向 API 后优势消失 |
| Islands Architecture | **部分** — React 组件用 `client:load` | Server Components 天然替代 |
| .astro 模板语法 | **11 个组件** | 迁移为 JSX，工作量小 |
| Cloudflare adapter | **在用** — `@astrojs/cloudflare` | 替换为 `@opennextjs/cloudflare` |

组件比例：React (.tsx) 26 个（70%）vs Astro (.astro) 11 个（30%）。Astro 的独特价值已在消退。

---

## 2. 架构设计

### 2.1 Monorepo 结构

```
monorepo/
├── apps/
│   └── web/                          # 单一 Next.js App Router 应用
│       ├── app/
│       │   ├── layout.tsx            # Root layout（字体、主题、Providers）
│       │   ├── (public)/             # 前台路由组
│       │   │   ├── page.tsx              # / 首页（活动列表）
│       │   │   ├── hackathons/[slug]/    # 活动详情（tabs）
│       │   │   ├── hackers/[id]/         # Hacker Profile
│       │   │   ├── projects/[hackathon]/[team]/
│       │   │   ├── results/[slug]/
│       │   │   ├── proposals/
│       │   │   ├── guides/               # hacker / judge / organizer
│       │   │   ├── create-hackathon/
│       │   │   ├── create-profile/
│       │   │   └── create-proposal/
│       │   ├── (admin)/              # 管理后台路由组
│       │   │   └── admin/
│       │   │       ├── layout.tsx        # Admin shell（侧边栏、面包屑）
│       │   │       ├── page.tsx          # Dashboard 概览
│       │   │       ├── hackathons/       # 活动管理
│       │   │       ├── profiles/         # Profile 审核
│       │   │       ├── submissions/      # 提交审核
│       │   │       └── settings/         # 平台设置
│       │   ├── api/
│       │   │   ├── auth/[...nextauth]/   # NextAuth.js GitHub Provider
│       │   │   └── presign/              # R2 presigned URL
│       │   └── not-found.tsx
│       ├── middleware.ts             # Auth + /admin/* 权限守卫
│       ├── next.config.ts
│       ├── wrangler.toml
│       └── package.json
│
├── packages/
│   ├── ui/                           # shadcn/ui + Neon Forge 设计系统
│   │   ├── src/components/           # Button, Input, Tabs, etc.
│   │   ├── src/styles/global.css     # @theme tokens
│   │   └── package.json
│   └── shared/                       # 跨应用共享逻辑
│       ├── src/
│       │   ├── schemas/              # Zod schemas
│       │   ├── data/
│       │   │   ├── readers/          # 从 YAML 文件读取
│       │   │   └── writers/          # 通过 GitHub API 写入
│       │   ├── types/                # TypeScript 类型导出
│       │   ├── i18n/                 # zh.yml, en.yml + t()
│       │   └── auth/                 # GitHub 权限检查
│       └── package.json
│
├── hackathons/                       # YAML 数据（保留原位）
├── profiles/                         # YAML 数据（保留原位）
├── scripts/                          # 管理脚本（保留）
├── docs/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### 2.2 关键设计决策

**单一应用 + Route Groups**：admin 不独立部署，作为 `(admin)` 路由组嵌入 web 应用。通过 `middleware.ts` 对 `/admin/*` 进行权限守卫。未来如需拆分，只需移动目录。

**权限模型**：通过 GitHub API 检查用户对 `Synnovator/monorepo` 的仓库角色（admin/maintain），非授权用户返回 403。

**部署平台**：继续使用 Cloudflare Pages + Workers。通过 `@opennextjs/cloudflare` 适配 Next.js。接受适配风险，Stage 1 完成后做 smoke test 验证。

**Monorepo 工具**：Turborepo + pnpm workspace。

### 2.3 数据流设计

数据保留在 Git repo 中。读取走文件系统，写入走 GitHub API。

```
读取路径（Server Components）:
  Server Component → packages/shared/data/readers → 读 YAML 文件 → Zod 校验 → 返回数据

写入路径（Server Actions）:
  用户表单 → Server Action → packages/shared/data/writers → GitHub API 创建 PR
    → Actions 校验（现有 CI 不变）
    → Admin 在 /admin 审核 → GitHub API 合并/关闭 PR
    → 合并触发 rebuild → 新数据上线

Admin 审核数据源:
  /admin 页面 → GitHub API 查询 open PRs (label: pending-review) → 展示列表 + diff
```

### 2.4 数据访问层

```typescript
// packages/shared/src/data/readers/hackathons.ts
export async function listHackathons(): Promise<Hackathon[]>
export async function getHackathon(slug: string): Promise<Hackathon | null>

// packages/shared/src/data/writers/github-client.ts
export async function createPR(opts: {
  branch: string
  files: { path: string; content: string }[]
  title: string
  body: string
  labels?: string[]
}): Promise<{ number: number; url: string }>

export async function mergePR(prNumber: number): Promise<void>
export async function closePR(prNumber: number, comment?: string): Promise<void>

// packages/shared/src/data/writers/hackathons.ts
export async function submitHackathon(data: HackathonInput, submitter: string): Promise<void>
// 内部调用 createPR，生成 YAML 内容写入对应路径

// packages/shared/src/data/readers/pending.ts
export async function listPendingReviews(type?: 'hackathon' | 'profile' | 'submission'): Promise<PendingReview[]>
// 通过 GitHub API 查询 open PRs
```

Phase 2 演进：将 `readers/` 和 `writers/` 的实现从 YAML + GitHub API 切换为 D1 查询，接口不变。

### 2.5 认证与权限

```typescript
// middleware.ts 伪代码
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const session = await getSession()
    if (!session) redirect('/api/auth/signin')

    const permission = await checkRepoPermission(session.user.login, 'Synnovator/monorepo')
    if (!['admin', 'maintain'].includes(permission)) return new Response('Forbidden', { status: 403 })
  }
}
```

### 2.6 Server Actions vs Route Handlers

| 场景 | 方案 | 原因 |
|------|------|------|
| 前台表单提交（创建 profile、报名） | Server Actions | 表单直接调用，无需手写 fetch |
| Admin CRUD 操作 | Server Actions | 配合 `revalidatePath()` 自动刷新 |
| 外部调用 / presign / webhook | Route Handlers | 需要标准 HTTP 端点 |
| 数据读取（列表、详情） | Server Components 直接调用 data 层 | 不需要 API 中间层 |

### 2.7 审核工作流状态机

```
pending_review → approved    (admin 批准，GitHub API 合并 PR)
               → rejected    (admin 拒绝，GitHub API 关闭 PR + comment)
               → revision    (admin 要求修改，GitHub API comment)
revision       → pending_review  (提交者更新 PR)
```

---

## 3. 迁移映射

### 3.1 框架概念映射

| Astro 概念 | Next.js 对应 |
|------------|-------------|
| `prerender = false` (SSR) | Server Components（默认） |
| Content Collections + Zod | `packages/shared` data 层 + Zod schemas |
| `.astro` 组件 | `.tsx` Server Components |
| React islands (`client:load`) | `'use client'` Client Components |
| `Astro.locals.runtime.env` | `process.env` 或 `getRequestContext()` (OpenNext) |
| API routes (`/api/*.ts`) | Route Handlers (`app/api/*/route.ts`) |
| 无 middleware | `middleware.ts`（auth、i18n、权限） |

### 3.2 `'use client'` 边界

| 组件类型 | 渲染模式 | 示例 |
|----------|---------|------|
| 展示卡片、布局 | Server Component | HackathonCard, NavBar, Footer, Timeline |
| 表单 | `'use client'` | ProfileCreateForm, RegisterForm 等 |
| 交互组件 | `'use client'` | HackathonTabs, FAQAccordion, ScoreCard |
| shadcn/ui 基础组件 | `'use client'` | Button, Input, Tabs, Accordion |
| 页面级组件 | Server Component | 所有 page.tsx |

### 3.3 .astro → .tsx 迁移模式

```astro
<!-- 迁移前: HackathonCard.astro -->
---
const { hackathon } = Astro.props
---
<div class="rounded-lg bg-dark-bg p-6">
  <h3 class="text-lime-primary">{hackathon.name}</h3>
</div>
```

```tsx
// 迁移后: HackathonCard.tsx (Server Component)
export function HackathonCard({ hackathon }: { hackathon: Hackathon }) {
  return (
    <div className="rounded-lg bg-dark-bg p-6">
      <h3 className="text-lime-primary">{hackathon.name}</h3>
    </div>
  )
}
```

变更点：`class` → `className`，frontmatter → 函数参数。

---

## 4. 迁移阶段

### Stage 0: Monorepo 脚手架

- 初始化 Turborepo + pnpm workspace
- 创建 `apps/web/`（Next.js + `@opennextjs/cloudflare`）
- 创建 `packages/ui/` 和 `packages/shared/` 骨架
- 配置 `turbo.json`（build、dev、lint pipeline）
- 配置 `wrangler.toml`（沿用现有配置 + OpenNext 适配）

### Stage 1: packages 层搭建

**packages/ui/**:
- 迁入 13 个 shadcn/ui 组件（原 `site/src/components/ui/`）
- 迁入 `global.css` 设计 tokens
- **修复 #2**: 添加 `--color-white: #FFFFFF` token，替换 global.css 中的 `white` 字面值

**packages/shared/schemas/**:
- 从 `site/src/content.config.ts` 提取 Zod schemas
- **修复 #1**: 统一 weight 字段为 decimal 0-1 格式，添加 `.min(0).max(1)` 约束
- **修复 #4**: 补全 profile schema 中 `judge_profile`、`nda_signed`、`registrations` 字段文档
- **修复 #5**: 明确所有 role 枚举值（organizer.role、submission team member.role、registration.role）

**packages/shared/data/**:
- 实现 `readers/`（YAML 文件读取 + Zod 校验）
- 实现 `writers/`（GitHub API 封装：createPR、mergePR、closePR）
- 实现 `readers/pending.ts`（GitHub API 查询 open PRs）

**packages/shared/i18n/**:
- 迁入 `zh.yml`、`en.yml` 和 `t()` 函数

**packages/shared/auth/**:
- GitHub 权限检查工具函数（checkRepoPermission）

**Smoke test**:
- 部署最小 Next.js 应用到 Cloudflare Pages
- 验证 OpenNext 适配：Server Components、Route Handlers、Server Actions、middleware
- 如有严重问题，启动回退方案（见 §6）

### Stage 2: 前台页面迁移

按批次迁移，每批独立验证：

| 批次 | 页面 | 复杂度 | 验证点 |
|------|------|--------|--------|
| 1 | `/` 首页, `layout`, `not-found` | 低 | 构建部署通路、设计系统渲染 |
| 2 | `/hackathons/[slug]`, `/hackers/[id]`, `/projects/[h]/[t]`, `/results/[slug]` | 中 | 动态路由、数据读取、i18n |
| 3 | `/create-*` (3个表单页), `/proposals` | 中 | Server Actions + GitHub API 写入 |
| 4 | `/guides/*` (4个), `/api/auth/*`, `/api/presign` | 低-中 | 静态内容、认证流迁移 |

### Stage 3: Admin 模块

```
app/(admin)/admin/
├── layout.tsx         → Admin shell（侧边栏、面包屑、权限守卫）
├── page.tsx           → Dashboard（待审核计数、最近操作）
├── hackathons/        → PR 列表 + diff 预览 + 批准/拒绝/要求修改
├── profiles/          → 同上
└── submissions/       → 同上
```

### Stage 4: 清理、文档修复与切换

**代码清理**:
- 删除 `site/` 目录
- 更新 Cloudflare Pages 构建配置指向 `apps/web/`
- 更新 CI workflows

**数据修复**:
- **修复 #1**: 将 `hackathons/enterprise-fintech-risk-2025/hackathon.yml` 的 weight 从整数迁移为 decimal 0-1 格式，与 `dishuihu` 活动保持一致

**文档修复**:
- **修复 #1**: 更新 `docs/specs/synnovator-prd.md` 中所有 weight 示例为 decimal 0-1
- **修复 #3**: 更新 `docs/plans/2026-03-03-architecture-design.md` 组件列表（.astro → .tsx），修正路由路径 `projects/[hackathon]/[team]`
- **修复 #4**: 更新 `docs/specs/synnovator-prd.md` §6.2 Profile schema，补全 `judge_profile`、`nda_signed`、`registrations` 字段
- **修复 #5**: 更新 `docs/specs/synnovator-prd.md` 补全各实体的 role 枚举值
- **修复 #6**: 更新 `docs/README.md` plans 列表，确保完整
- 更新 `CLAUDE.md`（根目录 + site → web）
- 更新 `CONTRIBUTING.md`（开发流程、目录结构）

---

## 5. 文档/代码修复清单

迁移过程中需一并修复的问题（来源：PR #23 #24 审查）：

| # | 严重度 | 问题 | 修复时机 | 修复方式 |
|---|--------|------|---------|---------|
| 1 | Critical | weight 字段格式不一致（PRD 整数 vs 代码 decimal） | Stage 1 (schemas) + Stage 4 (数据+文档) | Zod 添加 `.min(0).max(1)`；统一所有 YAML 为 decimal；更新 PRD 示例 |
| 2 | Minor | `--color-white` CSS token 缺失 | Stage 1 (packages/ui) | global.css @theme 添加 token，替换字面值 |
| 3 | Minor | architecture-design.md 组件列表过时 | Stage 4 (文档) | 更新为 React 组件，修正路由路径 |
| 4 | Minor | PRD Profile schema 不完整 | Stage 4 (文档) | 补全 judge_profile、nda_signed、registrations |
| 5 | Minor | role 枚举文档缺失 | Stage 4 (文档) | 各实体 role 枚举值明确列出 |
| 6 | Minor | docs/README.md plans 列表不全 | Stage 4 (文档) | 更新完整文件列表 |

---

## 6. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| `@opennextjs/cloudflare` 不稳定 | 构建/运行时异常 | Stage 1 smoke test；回退方案见下 |
| Image Optimization 不可用 | `<Image>` 组件受限 | 使用 `<img>` + Cloudflare Images CDN，或 `unoptimized` 配置 |
| Node.js API 兼容性 | middleware/route 报错 | `compatibility_flags = ["nodejs_compat"]`，逐个验证 |
| GitHub API 限流 | 高并发时 rate limit | 使用 GitHub App（5000→15000 req/h） |
| 构建时 YAML 路径 | monorepo 结构变化后路径错误 | `packages/shared` 用相对 monorepo root 路径，turbo.json 配置 `inputs` |
| 迁移期间服务中断 | downtime | Cloudflare Pages preview deployment，验证后切换生产 |

### 回退方案

如果 Stage 1 smoke test 暴露严重 OpenNext 适配问题：
- 前台暂留 Astro，仅把 `packages/shared` 作为数据层供 Astro 消费
- Admin 模块使用 React SPA（Vite + React Router）部署到 Cloudflare Pages static assets
- 不需要回退整个方案，只调整前端框架选择

---

## 7. Cloudflare 配置变更

Phase 1 无需新增 Cloudflare 资源。仅需：
- 更新现有 Pages 项目的构建命令指向 `apps/web/`
- `wrangler.toml` 沿用现有 vars + R2 binding + `nodejs_compat` flag
- OAuth 回调地址不变（同一域名）

Phase 2（未来）按需新增：D1 数据库、KV namespace。

---

## 8. 技术栈总结

| 层 | 当前 | 迁移后 |
|----|------|--------|
| 框架 | Astro 5.5 (Hybrid) | Next.js (App Router) |
| 渲染 | 全量 SSR | Server Components + Client Components |
| UI 库 | shadcn/ui + React islands | shadcn/ui (原生 React) |
| 样式 | Tailwind v4 + @theme | Tailwind v4 + @theme（不变） |
| 数据读取 | Content Collections (YAML) | shared/data/readers (YAML + Zod) |
| 数据写入 | GitHub 网页 PR | Server Actions → GitHub API → PR |
| 认证 | 手写 OAuth endpoints | NextAuth.js GitHub Provider |
| 权限 | 无 | middleware.ts + GitHub 仓库角色检查 |
| 部署 | Cloudflare Pages (@astrojs/cloudflare) | Cloudflare Pages (@opennextjs/cloudflare) |
| Monorepo | 单项目 | Turborepo + pnpm workspace |
| Admin | 无（GitHub 网页） | /admin/* 路由组 + 审核界面 |
