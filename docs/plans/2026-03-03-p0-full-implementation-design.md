# P0 完整实施设计文档

> **版本**: 1.0
> **日期**: 2026-03-03
> **关联 PRD**: V3.2 §11 P0 Roadmap
> **前置**: `docs/plans/2026-03-03-p0-site-core-design.md` (已完成)
> **状态**: Approved

---

## 1. 范围与目标

基于已完成的 P0 首批（站点核心页面），本设计覆盖 PRD §11 P0 Roadmap 的**全部剩余项目**。

### 1.1 已完成（P0 首批）

- hackathon.yml / project.yml / profile Schema V2 数据
- Neon Forge 设计系统 CSS tokens + 字体
- Astro Content Collections 数据加载
- 首页、活动详情、Profile、404 页面
- 10 个 UI 组件（NavBar, Footer, HackathonCard, Timeline, TrackSection, JudgeCard, FAQAccordion, EventCalendar, GitHubRedirect, SkillBadge）
- i18n 双语基础
- 4 个 Issue Templates (register, judge-score, appeal, team-formation)
- 4 个 Actions workflows (deploy, validate-hackathon, validate-profile, validate-submission)
- 示范活动数据 (enterprise-fintech-risk-2025)

### 1.2 本批交付物

| 类别 | 交付物 |
|------|--------|
| **基础设施** | CF Pages Hybrid mode、Pages Functions (auth + presign)、wrangler 配置 |
| **自动化** | 3 个新 Actions (validate-score, upload-assets, status-update)、NDA Issue Template、CODEOWNERS |
| **前端增强** | ScoreCard、OAuthButton、DatasetDownload、ProjectShowcase、3 个 Guide 页面、客户端搜索 |
| **管理工具** | synnovator-admin Skill、scripts/ CLI 工具、Template Repo 模板内容 |

### 1.3 基础设施状态

| 资源 | 状态 | 凭证位置 |
|------|------|---------|
| Cloudflare Pages | 已连接 GitHub，自动部署 | — |
| Cloudflare R2 | Bucket 已创建 | GitHub Secrets: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT` |
| GitHub OAuth App | 已注册 | 需配置到 CF Pages 环境变量 |

---

## 2. 实施批次

### 2.1 依赖关系

```
Batch 1 (基础设施) ← 无依赖
Batch 2 (自动化)   ← 依赖 Batch 1 的 R2 配置（upload-assets 需要 R2 凭证）
Batch 3 (前端增强) ← 依赖 Batch 1 的 OAuth + presign API
Batch 4 (管理收尾) ← 依赖 Batch 2 + 3 的完成
```

---

## 3. Batch 1: 基础设施层

### 3.1 CF Pages Hybrid 迁移

**变更文件**:
- `site/astro.config.mjs` — 切换 output mode + 添加 adapter
- `site/package.json` — 新增 `@astrojs/cloudflare` 依赖
- `site/wrangler.toml` — 本地开发配置

**astro.config.mjs 变更**:

```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import yaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  site: 'https://synnovator.pages.dev',  // CF Pages 域名
  output: 'hybrid',
  adapter: cloudflare({
    platformProxy: { enabled: true },  // 本地开发使用 wrangler proxy
  }),
  vite: {
    plugins: [tailwindcss(), yaml()],
  },
});
```

**wrangler.toml**:

```toml
name = "synnovator"
compatibility_date = "2024-09-23"

[vars]
SITE_URL = "https://synnovator.pages.dev"

# R2 binding (用于 Pages Functions 直接访问)
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "synnovator-assets"
```

**关键决策**:
- 所有现有页面保持 `prerender: true`（Astro hybrid 默认），构建为静态 HTML
- 仅 `src/pages/api/**` 路由设 `export const prerender = false`，作为 Pages Functions 运行
- 本地开发使用 `wrangler pages dev` 模拟 CF 环境

### 3.2 GitHub OAuth Flow

**文件**:
- `site/src/pages/api/auth/login.ts`
- `site/src/pages/api/auth/callback.ts`
- `site/src/pages/api/auth/me.ts`
- `site/src/pages/api/auth/logout.ts`
- `site/src/lib/auth.ts` — 共享加密/解密工具

**流程**:

```
用户点击「登录」
  → GET /api/auth/login
  → 302 → https://github.com/login/oauth/authorize?client_id=...&redirect_uri=.../callback&scope=read:user
  → 用户授权
  → GitHub 302 → /api/auth/callback?code=...
  → callback 用 code 换 access_token (POST github.com/login/oauth/access_token)
  → callback 加密 {login, access_token, avatar_url} → HttpOnly cookie "session"
  → 302 → 原页面 (从 state 参数或 Referer)
```

**Cookie 安全**:
- AES-GCM 加密（`crypto.subtle`，CF Workers 原生支持）
- `AUTH_SECRET` 环境变量作为密钥
- HttpOnly + Secure + SameSite=Lax
- Max-Age: 7 天

**CF Pages 环境变量** (需手动配置):

| 变量 | 说明 |
|------|------|
| `GITHUB_CLIENT_ID` | OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | OAuth App Client Secret |
| `AUTH_SECRET` | Cookie 加密密钥 (32 字节随机字符串) |
| `R2_ACCESS_KEY_ID` | R2 S3 兼容 API Key |
| `R2_SECRET_ACCESS_KEY` | R2 S3 兼容 API Secret |
| `R2_ENDPOINT` | R2 S3 兼容 API Endpoint |
| `R2_BUCKET_NAME` | R2 Bucket 名称 |

### 3.3 R2 Presigned URL API

**文件**: `site/src/pages/api/presign.ts`

```
POST /api/presign
  Headers: Cookie (session)
  Body: { key: "hackathons/slug/submissions/team/report.pdf" }

  → 验证 session cookie → 获取用户身份
  → (P0: 仅验证登录; P1: 增加 NDA label 检查)
  → @aws-sdk/s3-request-presigner 生成 GET presigned URL
  → TTL: 4 小时
  → 返回 { url, expires_at }
```

使用 `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`（轻量，CF Workers 兼容）。

### 3.4 部署切换

- **删除** `.github/workflows/deploy.yml`（旧的 GitHub Pages 部署）
- CF Pages 直连 GitHub 已配置自动部署
- GitHub Actions 仅负责校验、R2 上传等非部署任务

---

## 4. Batch 2: 自动化层

### 4.1 validate-score.yml

**触发**: Issues (opened, edited) + label `judge-score`

**校验逻辑**:
1. 从 Issue body 提取 YAML 评分块（`scores:` 开始的部分）
2. 解析 hackathon slug、track slug、team name（从 Issue title `[Score] team — slug / track`）
3. 验证 hackathon 存在（读取 `hackathons/{slug}/hackathon.yml`）
4. 验证 track 在 hackathon 的 tracks 列表中
5. 验证每个 criterion 的 score 在 `score_range` 范围内
6. 验证 Issue 作者在 hackathon.yml 的 judges 列表中（GitHub username 匹配）
7. 通过 → 添加 label `score-validated` + Comment 确认
8. 失败 → Comment 详细错误信息

### 4.2 upload-assets.yml

**触发**: pull_request (opened, synchronize) + paths `hackathons/**/submissions/**`

**逻辑**:
1. 检测 PR 中的非 YAML 文件（pdf, png, jpg, tar.gz 等）
2. 对每个文件：上传到 R2 (`hackathons/{slug}/submissions/{team}/{filename}`)
3. 更新 `project.yml` 中对应的 `r2_url` 字段
4. Commit 变更回 PR 分支

**凭证**: GitHub Secrets (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET_NAME`)

### 4.3 status-update.yml

**触发**: schedule cron `0 0 * * *`（每日 UTC 00:00）+ workflow_dispatch

**逻辑**:
1. 遍历 `hackathons/*/hackathon.yml`
2. 对每个活动，根据当前时间确定所处阶段（draft → registration → development → submission → judging → announcement → award）
3. 如果阶段变化：
   - 为活动相关 Issues 更新 label（`stage:{new_stage}`）
   - 在活动 Discussion 中 Comment 通知

### 4.4 NDA Issue Template

```yaml
# .github/ISSUE_TEMPLATE/nda-sign.yml
name: "NDA Signing Confirmation"
description: "Confirm NDA signing for a hackathon with NDA requirements"
title: "[NDA] {username} — {hackathon-slug}"
labels: ["nda-sign"]
body:
  - type: input
    id: hackathon
    attributes:
      label: "Hackathon Slug"
      placeholder: "e.g., enterprise-fintech-risk-2025"
    validations:
      required: true
  - type: checkboxes
    id: confirmation
    attributes:
      label: "NDA Confirmation"
      options:
        - label: "I have read and agree to the NDA terms"
          required: true
        - label: "I understand the confidentiality requirements"
          required: true
```

### 4.5 CODEOWNERS

```
# .github/CODEOWNERS
/hackathons/*/                 @Synnovator/maintainers
/profiles/                     @Synnovator/maintainers
/site/                         @Synnovator/developers
/.github/                      @Synnovator/admins
```

---

## 5. Batch 3: 前端功能层

### 5.1 ScoreCard 交互组件

**文件**: `site/src/components/ScoreCard.astro`

**设计**:
- Astro 组件 + `<script>` 客户端 JS（不引入 React/Vue）
- Props: `hackathonSlug`, `trackSlug`, `criteria[]`, `lang`
- 每个 criterion 渲染：名称 + 权重显示 + range slider (score_range[0]~score_range[1]) + 数字输入 + 评语 textarea
- 底部：加权总分实时计算 + 整体评语 + "提交评分" 按钮
- 按钮点击 → 生成 YAML 格式内容 → 构造 Issue URL (GitHubRedirect 逻辑) → 新窗口打开

### 5.2 OAuthButton + NavBar 集成

**文件**:
- `site/src/components/OAuthButton.astro` — 登录/用户头像按钮
- 更新 `site/src/components/NavBar.astro` — 集成 OAuthButton

**设计**:
- 页面加载后，客户端 JS fetch `/api/auth/me`
- 已登录 → 显示头像 + GitHub username + 下拉（Profile/Logout）
- 未登录 → 显示 "Sign in with GitHub" 按钮 → 链接到 `/api/auth/login`

### 5.3 DatasetDownload 组件

**文件**: `site/src/components/DatasetDownload.astro`

**设计**:
- Props: `datasets[]`, `hackathonSlug`, `lang`
- 展示数据集列表（名称、版本、大小、格式、描述）
- 对每个数据集的下载按钮：
  - 客户端检查登录状态
  - 已登录 → POST `/api/presign` → 获取 URL → 跳转下载
  - 未登录 → 提示 "请先登录"
- NDA 场景：显示 NDA 状态提示（P1 增强实际检查逻辑）

### 5.4 ProjectShowcase

**变更文件**: `site/src/pages/hackathons/[...slug].astro` 增加 submissions section

**设计**:
- 在活动详情页 tracks 区域下方，增加"提交作品"展示
- 新组件 `ProjectCard.astro`：团队名、项目名、tagline、技术栈标签、链接
- 如果有获奖信息（通过 track rewards 对应），显示奖项徽章
- 底部 "去投票" 按钮链接到项目 PR（GitHub Reactions）

**数据加载**: 构建时从 `hackathons/{slug}/submissions/*/project.yml` 读取。

### 5.5 Guide 页面

**文件**:
- `site/src/pages/guides/organizer.astro`
- `site/src/pages/guides/hacker.astro`
- `site/src/pages/guides/judge.astro`

**内容**:
- organizer: 创建活动流程、Template Repo 使用、hackathon.yml 配置、PR 提交
- hacker: Profile 注册、活动浏览、报名流程、项目提交、NDA
- judge: 评分卡使用、评审维度理解、利益冲突声明

页面使用 Neon Forge 设计系统的 step-by-step 布局，中英双语。

### 5.6 客户端搜索

**变更文件**: `site/src/pages/index.astro`

**设计**:
- 构建时生成 `public/search-index.json`（slug, name, name_zh, type, tagline, stage）
- 首页增加搜索输入框 + 类型筛选标签 (community/enterprise/youth-league) + 状态筛选 (active/upcoming/ended)
- 客户端 JS 过滤并重新渲染卡片
- `/api/search` 暂不实现（P0 用客户端过滤替代，PRD 已标注）

### 5.7 Reactions 投票展示

在 ProjectShowcase 的 ProjectCard 中：
- 显示 "Vote on GitHub" 按钮链接到 PR
- 如有缓存的 Reactions 计数则显示数字（P0 简化：直接链接到 PR）

---

## 6. Batch 4: 管理 + 收尾

### 6.1 synnovator-admin Skill

**文件**: `.claude/skills/synnovator-admin/SKILL.md`

**命令**:

| 命令 | 说明 | 底层操作 |
|------|------|---------|
| `/synnovator-admin create-hackathon` | 交互式创建活动 | 生成 hackathon.yml → git commit → PR |
| `/synnovator-admin update-timeline` | 更新活动时间线 | 编辑 hackathon.yml → git commit → PR |
| `/synnovator-admin approve-nda` | 批准 NDA 签署 | 添加 label `nda-approved` |
| `/synnovator-admin export-scores` | 导出评分 | 读取 score Issues → 生成 CSV |
| `/synnovator-admin audit` | 审计查询 | `git log` 指定 hackathon 目录 |

每个命令通过交互式问答收集参数，调用 `scripts/` 底层脚本。

### 6.2 scripts/ CLI 工具

**文件**:
- `scripts/create-hackathon.sh` — 生成 hackathon.yml 骨架 + 目录结构
- `scripts/create-profile.sh` — 生成 profile.yml 骨架
- `scripts/submit-project.sh` — 生成 project.yml + 提交物目录

每个脚本接受参数，输出有效的 Schema V2 YAML。

### 6.3 Template Repo 模板内容

**文件**: `docs/templates/`
- `community/hackathon.yml` — 社区模板（Apache-2.0, Reactions 投票, 开放参赛）
- `enterprise/hackathon.yml` — 企业模板（IP 转让, NDA, 企业评委）
- `youth-league/hackathon.yml` — 高校模板（学生资格, 指导教师）

实际创建 GitHub Template Repo 为手动操作步骤（需 org admin 权限），文档化在 organizer-guide 中。

### 6.4 端到端验证

- CF Pages 构建 + 部署验证
- OAuth 登录 → /api/auth/* 全流程
- R2 presign 下载链路
- Score Issue → validate-score Action
- PR 提交 → upload-assets Action
- 所有页面渲染 + i18n 切换

---

## 7. 技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 部署模式 | Hybrid (CF Pages) | 保持静态页面性能 + 最小动态路由 |
| OAuth 方案 | GitHub OAuth App (redirect flow) | PRD §13 Q7 推荐用户级操作 |
| Session 存储 | AES-GCM 加密 cookie | 无需数据库，CF Workers 原生支持 |
| R2 访问 | S3 兼容 presigned URL | 标准协议，轻量 SDK |
| ScoreCard | Vanilla JS (非 React) | 避免引入前端框架，Astro 组件 + script 足够 |
| 搜索 | 客户端过滤 + JSON 索引 | PRD 标注 P0 可用客户端替代 |
| AI review/match | P0 不实现 | PRD P1 项目，P0 仅建 Actions 骨架 |
| Template Repos | 准备模板内容 | 实际 repo 创建需 org admin 手动操作 |

---

## 8. 验收覆盖

本批完成后，P0 Roadmap 全部项目 100% 覆盖：

| PRD P0 项目 | 覆盖状态 |
|------------|---------|
| hackathon.yml Schema V2 | 首批完成 |
| project.yml Schema V2 | 首批完成 |
| Profile Schema V2 | 首批完成 |
| 3 Template Repos | Batch 4 (模板内容，手动创建 repo) |
| GitHubRedirect | 首批完成 |
| ScoreCard | Batch 3 |
| Issue Templates | Batch 2 (补 NDA) |
| GitHub Actions | Batch 2 (3 新 workflow) |
| Astro Hybrid 主站 | Batch 1 (迁移) + Batch 3 (增强) |
| CF Pages 部署 | Batch 1 |
| CF R2 文件存储 | Batch 1 (/api/presign) |
| Pages Functions | Batch 1 (auth + presign) |
| GitHub Reactions 投票 | Batch 3 (链接到 PR) |
| i18n 双语 | 首批完成 |
| Self-document 指南 | Batch 3 (3 Guide 页面) |
| CLI 工具 | Batch 4 |
| synnovator-admin Skill | Batch 4 |
| GitHub RBAC | Batch 2 (CODEOWNERS) |
| 首个示范活动 | 首批完成 |
