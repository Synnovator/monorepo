# Docs Alignment Tier 1 — Fix Factual Errors

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix factual errors in 6 design docs so they accurately reflect the current site implementation.

**Architecture:** Docs-only changes. No code modifications. Each task targets one file with specific line edits.

**Tech Stack:** Markdown editing only.

**Reference:** See `docs/plans/2026-03-05-docs-alignment-design.md` for full gap analysis.

---

### Task 1: Fix architecture-design.md — Output Mode Contradiction

**Files:**
- Modify: `docs/plans/2026-03-03-architecture-design.md:284-286`
- Modify: `docs/plans/2026-03-03-architecture-design.md:120-129`

**Context:** Lines 12, 58, 127 correctly describe Hybrid mode. But line 284-286 has a contradictory technical decision table entry saying P0 uses `output: 'static'`. The site is now fully on Hybrid mode with Cloudflare adapter.

**Step 1: Fix the technical decision table (line 284)**

Change:
```markdown
| 部署模式 | `output: 'static'`（本批保持） | 降低复杂度，Hybrid 切换下一批 |
```

To:
```markdown
| 部署模式 | `output: 'hybrid'` + Cloudflare adapter | Astro Hybrid 模式，默认静态预渲染 + 按需动态路由（/api/*） |
```

**Step 2: Update Astro config example (lines 120-129)**

Add missing integrations to the code example. Change:
```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'hybrid',           // 默认静态，按需动态
  adapter: cloudflare(),
  integrations: [tailwind()],
```

To:
```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import yaml from '@modyfi/vite-plugin-yaml';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  output: 'hybrid',           // 默认静态，按需动态
  adapter: cloudflare({ platformProxy: { enabled: true } }),
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss(), yaml(), svgr()],
  },
```

**Step 3: Update Content Collections path reference (line 165)**

Change:
```typescript
// site/src/content/config.ts
```

To:
```typescript
// site/src/content.config.ts  (Astro 5 convention)
```

**Step 4: Commit**

```bash
git add docs/plans/2026-03-03-architecture-design.md
git commit -m "docs: fix architecture-design output mode contradiction and update config example"
```

---

### Task 2: Fix p0-site-core-design.md — Rendering & P0/P1 Boundary

**Files:**
- Modify: `docs/plans/2026-03-03-p0-site-core-design.md:23-33`
- Modify: `docs/plans/2026-03-03-p0-site-core-design.md:206-208`
- Modify: `docs/plans/2026-03-03-p0-site-core-design.md:284-286`

**Context:** This doc was written when P0 was planned as static-only. The site has since adopted Hybrid mode and Pages Functions in P0.

**Step 1: Update "not in scope" section (lines 23-29)**

Change:
```markdown
### 1.2 不在本批范围

- Cloudflare Pages Hybrid 切换（保持 `output: 'static'`）
- Pages Functions（/api/*）
- GitHub Actions 深度校验增强
- GitHub OAuth 认证流程
- R2 文件上传
```

To:
```markdown
### 1.2 不在本批范围

> **注意**：以下功能已在后续迭代中提前实现并合入 P0，此列表仅保留历史记录。
> 实际 P0 已包含：Hybrid 模式、Pages Functions（OAuth、presign）、GitHub OAuth。

- ~~Cloudflare Pages Hybrid 切换~~ ✅ 已实现
- ~~Pages Functions（/api/*）~~ ✅ 已实现（/api/auth/*, /api/presign, /api/check-profile）
- GitHub Actions 深度校验增强
- ~~GitHub OAuth 认证流程~~ ✅ 已实现
- R2 文件上传（presigned URL 已实现，直接上传待做）
```

**Step 2: Update deployment target (lines 31-33)**

Change:
```markdown
### 1.3 部署目标

保持 GitHub Pages (static) 部署，后续批次切换到 Cloudflare Pages。
```

To:
```markdown
### 1.3 部署目标

~~保持 GitHub Pages (static) 部署，后续批次切换到 Cloudflare Pages。~~

**当前状态**：已切换到 Cloudflare Pages (Hybrid mode)，使用 `wrangler deploy` 部署生产环境，`wrangler versions upload` 部署预览。
```

**Step 3: Update search index section (lines 206-208)**

Change:
```markdown
### 5.3 搜索索引

构建时从 hackathons collection 提取 `{slug, name, name_zh, type, tagline, stage}` 生成 `public/search-index.json`，供客户端过滤。
```

To:
```markdown
### 5.3 搜索过滤

~~构建时从 hackathons collection 提取 `{slug, name, name_zh, type, tagline, stage}` 生成 `public/search-index.json`，供客户端过滤。~~

**当前实现**：首页（`index.astro`）在服务端通过 `getCollection('hackathons')` 加载全量数据，渲染为 HTML 后由浏览器端 JavaScript 进行搜索过滤，未生成独立的 `search-index.json` 文件。
```

**Step 4: Update technical decision table (line 284-286)**

Change:
```markdown
| 部署模式 | `output: 'static'`（本批保持） | 降低复杂度，Hybrid 切换下一批 |
```

To:
```markdown
| 部署模式 | `output: 'hybrid'` + Cloudflare Pages | 已切换，支持 SSR + Pages Functions |
```

**Step 5: Commit**

```bash
git add docs/plans/2026-03-03-p0-site-core-design.md
git commit -m "docs: update p0-site-core-design to reflect hybrid mode and P0/P1 boundary shift"
```

---

### Task 3: Fix platform.spec.md — i18n Mechanism

**Files:**
- Modify: `docs/acceptance/platform.spec.md:53-73`

**Context:** The i18n acceptance spec mentions "URL prefix" as a possible approach. Actual implementation uses `?lang=en` query parameter.

**Step 1: Update SC-P-002.1 language switching (around line 56-58)**

Find the language switching scenario and update to clarify the actual mechanism. Change any mention of "URL prefix" to "query parameter `?lang=en`".

If line 58 reads:
```markdown
语言选择持久化（localStorage or URL prefix）
```

Change to:
```markdown
语言选择通过 URL 查询参数切换（`?lang=en`），默认中文，无需持久化
```

**Step 2: Verify SC-P-002.3 fallback is accurate**

Lines 68-72 describe fallback to Chinese — this matches implementation. No change needed if it says:
```
显示中文内容作为 fallback（不留空、不报错）
```

**Step 3: Commit**

```bash
git add docs/acceptance/platform.spec.md
git commit -m "docs: fix platform spec i18n mechanism from URL prefix to query param"
```

---

### Task 4: Fix infra-setup.md — Env Vars & Deploy

**Files:**
- Modify: `docs/guides/infra-setup.md:30-33`
- Modify: `docs/guides/infra-setup.md:106-114`

**Context:** Guide is missing some env vars that are in the actual wrangler.toml, and deploy command description needs updating.

**Step 1: Update deploy command (around line 30)**

Find the deploy command reference. If it says:
```
Deploy command: `cd site && pnpm run deploy`
```

Update to include both commands:
```markdown
Deploy commands:
- 生产部署: `cd site && pnpm run deploy`（执行 `wrangler deploy`）
- 预览部署: `cd site && pnpm run deploy:preview`（执行 `wrangler versions upload`，用于非 main 分支）
```

**Step 2: Add missing env vars to wrangler.toml vars section (around line 106-114)**

Find the `[vars]` section. Add the missing variables:
```toml
[vars]
SITE_URL = "https://home.synnovator.space"
GITHUB_CLIENT_ID = "Iv23li..."
GITHUB_OWNER = "Synnovator"        # 新增：GitHub 组织名
GITHUB_REPO = "monorepo"           # 新增：仓库名
```

**Step 3: Verify compatibility_flags is documented**

Check line 260-262 area. If `compatibility_flags = ["nodejs_compat"]` is already documented, no change needed. If not, add it to the wrangler.toml section:
```toml
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]   # 必须：支持 Node.js API
```

**Step 4: Commit**

```bash
git add docs/guides/infra-setup.md
git commit -m "docs: update infra-setup with missing env vars and deploy commands"
```

---

### Task 5: Fix design-system.md — Status Labels & shadcn/ui Section

**Files:**
- Modify: `docs/specs/design-system.md:82-91` (spacing tokens)
- Modify: `docs/specs/design-system.md:105-140` (layout tokens)
- Modify: `docs/specs/design-system.md` (add new section after border radius, before page layout)

**Context:** Spacing and layout tokens are well-specified in the doc but NOT implemented in CSS. Doc should clearly mark this. Also missing is documentation of the shadcn/ui semantic mapping layer that exists in `global.css`.

**Step 1: Add status labels to spacing tokens section (lines 82-91)**

Add a status note before the spacing table:
```markdown
## 间距系统

> **实现状态**: 以下 token 已规范但尚未在 `site/src/styles/global.css` 中定义为 CSS 变量。
> 当前站点直接使用 Tailwind 的间距工具类（`p-2`, `gap-4` 等），未通过自定义 CSS 变量引用。
> Tier 3 计划将补充实现。
```

**Step 2: Add status labels to layout tokens section (lines 105-140)**

Add a status note before the layout section:
```markdown
## 页面布局

> **实现状态**: 以下布局尺寸已规范但尚未在 CSS 中定义为变量。
> 当前站点使用 Tailwind 响应式工具类实现布局，未严格遵循 1440px 固定视口设计。
> Tier 3 计划将评估是否需要实现为 CSS 变量。
```

**Step 3: Add shadcn/ui mapping section**

After the border radius section (around line 102), add a new section:
```markdown
## shadcn/ui 语义映射层

站点使用 shadcn/ui 组件库，通过 CSS 变量将 Neon Forge token 映射到 shadcn/ui 的语义化接口。
以下映射定义在 `site/src/styles/global.css` 的 `:root` 中：

| shadcn 变量 | 映射到 Neon Forge Token | 用途 |
|------------|----------------------|------|
| `--background` | `var(--color-surface)` | 页面背景 |
| `--foreground` | `var(--color-light-gray)` | 默认文字 |
| `--card` | `var(--color-dark-bg)` | 卡片背景 |
| `--primary` | `var(--color-lime-primary)` | 主操作色 |
| `--secondary` | `var(--color-secondary-bg)` | 次要背景 |
| `--muted` | `var(--color-secondary-bg)` | 弱化背景 |
| `--accent` | `var(--color-secondary-bg)` | 强调背景 |
| `--destructive` | `var(--color-error)` | 危险操作 |
| `--border` | `var(--color-secondary-bg)` | 边框 |
| `--ring` | `var(--color-lime-primary)` | 焦点环 |

**字体 CSS 变量**（同样在 `:root` 定义）：

| 变量 | 值 | 用途 |
|------|-----|------|
| `--font-heading` | `'Space Grotesk', sans-serif` | 标题 |
| `--font-body` | `'Inter', sans-serif` | 正文 |
| `--font-code` | `'Poppins', sans-serif` | 代码/数字 |
| `--font-zh` | `'Noto Sans SC', sans-serif` | 中文 |
```

**Step 4: Commit**

```bash
git add docs/specs/design-system.md
git commit -m "docs: add implementation status labels and shadcn/ui mapping to design system"
```

---

### Task 6: Update docs/README.md — Plans Directory Listing

**Files:**
- Modify: `docs/README.md:23-30`

**Context:** README only lists 4 plan files but the directory now has 26. Need to update the plans/ table.

**Step 1: List actual plan files**

Run:
```bash
ls -1 docs/plans/*.md | sort
```

**Step 2: Replace the plans/ table (lines 23-30)**

Replace the 4-entry table with the full list, grouped by date and type:

```markdown
### plans/ — 实施计划

| 文件 | 说明 |
|------|------|
| **2026-03-03 基础架构** | |
| `2026-03-03-architecture-design.md` | 系统架构设计 |
| `2026-03-03-monorepo-init-design.md` | Monorepo 初始化设计 |
| `2026-03-03-monorepo-init.md` | Monorepo 初始化实施 |
| `2026-03-03-acceptance-specs-design.md` | 验收规范设计 |
| **2026-03-03 P0/P1 实施** | |
| `2026-03-03-p0-full-implementation-design.md` | P0 完整实施设计 |
| `2026-03-03-p0-full-implementation.md` | P0 完整实施计划 |
| `2026-03-03-p0-site-core-design.md` | P0 站点核心设计 |
| `2026-03-03-p0-site-core-implementation.md` | P0 站点核心实施 |
| `2026-03-03-p1-core-workflows-design.md` | P1 核心工作流设计 |
| `2026-03-03-p1-core-workflows-implementation.md` | P1 核心工作流实施 |
| `2026-03-03-synnovator-admin-skill-design.md` | 管理 Skill 设计 |
| **2026-03-04 功能增强** | |
| `2026-03-04-icon-integration-design.md` | 图标集成设计 |
| `2026-03-04-icon-integration-implementation.md` | 图标集成实施 |
| `2026-03-04-messagechannel-fix-design.md` | MessageChannel 修复设计 |
| `2026-03-04-smart-forms-design.md` | 智能表单设计 |
| `2026-03-04-smart-forms-implementation.md` | 智能表单实施 |
| `2026-03-04-submissions-redesign-design.md` | 提交页重设计 |
| `2026-03-04-submissions-redesign-plan.md` | 提交页重设计实施 |
| **2026-03-05 维护与新功能** | |
| `2026-03-05-docs-alignment-design.md` | 文档对齐方案 |
| `2026-03-05-docs-alignment-tier1.md` | 文档对齐 Tier 1 实施（本文件） |
| `2026-03-05-fix-hackathon-500-errors.md` | Hackathon 500 错误修复 |
| `2026-03-05-proposals-page-design.md` | Proposals 页面设计 |
| `2026-03-05-proposals-page-plan.md` | Proposals 页面实施 |
| `2026-03-05-simulate-subcommand-design.md` | 模拟子命令设计 |
| `2026-03-05-simulate-subcommand-impl.md` | 模拟子命令实施 |
| `2026-03-05-unified-guides-page-design.md` | 统一指南页设计 |
| `2026-03-05-unified-guides-page-plan.md` | 统一指南页实施 |
```

**Step 3: Commit**

```bash
git add docs/README.md
git commit -m "docs: update README plans/ listing from 4 to 26 entries"
```

---

### Task 7: Final Verification

**Step 1: Verify all 6 files were modified**

Run:
```bash
git log --oneline -6
```

Expected: 6 commits, one per task.

**Step 2: Build site to ensure no breakage**

Run:
```bash
cd site && pnpm build
```

Expected: Build succeeds (docs changes should not affect site build).

**Step 3: Check for broken internal links**

Run:
```bash
grep -r "content/config.ts" docs/
```

Expected: No results (all references should now be `content.config.ts`).
