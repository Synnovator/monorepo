# Synnovator 架构设计文档

> **版本**: 1.0
> **日期**: 2026-03-03
> **关联 PRD**: V3.2
> **状态**: Draft

---

## 1. 架构概述

Synnovator 采用 **Git-native + 最小服务端** 架构。核心思想是将 GitHub Monorepo 同时作为数据存储、工作流引擎和管理后端，通过 Cloudflare Pages (Hybrid mode) 托管静态站点并提供最小动态能力。

### 1.1 设计原则

| 原则 | 描述 | 实践 |
|------|------|------|
| **Git as Database** | 仓库中的 YAML 文件即数据源 | hackathons/*.yml, profiles/*.yml, submissions/*/project.yml |
| **GitHub as Workflow Engine** | Issue/PR/Actions/Labels 构成工作流引擎 | 报名=Issue, 提交=PR, 校验=Actions, 状态=Labels |
| **Monorepo as Admin Backend** | 仓库本身即管理后端，GitHub RBAC 即权限系统 | clone + edit + PR = 管理操作 |
| **最小服务端** | 仅安全敏感操作需要服务端处理 | Pages Functions: /api/presign, /api/search, /api/vote |
| **Self-document** | 平台使用说明嵌入平台本身 | /guides/* 指南页 + 页面内嵌引导 |

### 1.2 系统边界

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Synnovator 系统边界                             │
│                                                                     │
│  ┌───────────────────────┐    ┌──────────────────────────────────┐  │
│  │   GitHub (控制平面)    │    │  Cloudflare (数据平面)            │  │
│  │                       │    │                                  │  │
│  │  • Monorepo (数据)    │    │  • Pages (站点托管)              │  │
│  │  • Issues (工作流)    │───▶│  • Functions (最小动态)          │  │
│  │  • Actions (自动化)   │    │  • R2 (文件存储)                 │  │
│  │  • RBAC (权限)        │    │  • D1 (P1 可选)                  │  │
│  │  • OAuth (认证)       │    │                                  │  │
│  └───────────────────────┘    └──────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────┐    ┌──────────────────────────────────┐  │
│  │ 管理员本地 (管理平面)  │    │  外部服务                        │  │
│  │                       │    │                                  │  │
│  │  • git clone/push     │    │  • Claude API (AI 评审/匹配)     │  │
│  │  • synnovator-admin   │    │                                  │  │
│  │    CLI Skill          │    │                                  │  │
│  └───────────────────────┘    └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. 技术选型

### 2.1 核心技术栈

| 层 | 技术 | 选型理由 |
|----|------|---------|
| 前端框架 | Astro (Hybrid mode) | 默认静态生成 + 按需动态路由，构建快，SEO 友好 |
| UI 库 | TailwindCSS + shadcn/ui | 原子化 CSS + 组件库，开发效率高 |
| 站点托管 | Cloudflare Pages | 全球 CDN，Hybrid 模式支持 Functions，免费额度充足 |
| 边缘函数 | Cloudflare Pages Functions | Astro `@astrojs/cloudflare` adapter 原生支持 |
| 文件存储 | Cloudflare R2 | S3 兼容 API，无出站流量费，与 Pages Functions 同区域低延迟 |
| 自动化 | GitHub Actions | PR/Issue 事件触发，公开仓库免费无限分钟 |
| 认证 | GitHub OAuth | 用户群体即 GitHub 用户，单点登录，最小权限 |
| AI 服务 | Claude API | 评审摘要、组队匹配、PDF 内容提取 |
| 数据库 | Cloudflare D1 (P1 可选) | SQL 数据库，搜索索引和评分缓存，非 P0 必需 |

### 2.2 P0 不引入 D1 的理由

| 功能 | 无 D1 方案 (P0) | 有 D1 方案 (P1) |
|------|----------------|----------------|
| 活动搜索/筛选 | 构建时生成 JSON 索引 → 客户端过滤 | Functions 查询 D1 → 服务端过滤 |
| 评分汇总 | Actions 计算 → 写入 YAML/JSON | Actions 计算 → 写入 D1 缓存 |
| 报名统计 | GitHub API 计数 Issues by Label | D1 缓存计数 |

P0 阶段活动数量有限（~3 个），数据规模小，客户端过滤完全满足性能要求。D1 在数据增长后引入，作为性能优化而非功能依赖。

---

## 3. 部署架构

### 3.1 站点构建与部署

```
代码推送 main 分支
    │
    ▼
Cloudflare Pages 检测 push 事件
    │
    ▼
构建流程：
    cd site && pnpm install && pnpm build
    │
    ├── Astro hybrid 模式构建
    │   ├── prerender: true (默认) → 静态 HTML 文件
    │   │   ├── /index.html
    │   │   ├── /hackathons/{slug}/index.html  (每个活动)
    │   │   ├── /hackers/{id}/index.html       (每个 Profile)
    │   │   ├── /guides/organizer/index.html
    │   │   ├── /guides/hacker/index.html
    │   │   └── /guides/judge/index.html
    │   │
    │   └── prerender: false (显式) → Pages Functions
    │       ├── /api/presign    → functions/api/presign.ts
    │       ├── /api/search     → functions/api/search.ts
    │       ├── /api/vote       → functions/api/vote.ts
    │       └── /api/auth/*     → functions/api/auth/[...path].ts
    │
    ▼
部署：
    ├── 静态文件 → Cloudflare CDN 全球 300+ 节点
    └── Functions → Cloudflare Workers 运行时

PR Preview：
    PR 提交 → 自动构建 → https://{hash}.{project}.pages.dev/
```

### 3.2 Astro 配置要点

```javascript
// site/astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'hybrid',           // 默认静态，按需动态
  adapter: cloudflare(),
  integrations: [tailwind()],
  site: 'https://home.synnovator.space',
});
```

### 3.3 Pages Functions 路由

| 路由 | 方法 | 职责 | 认证要求 |
|------|------|------|---------|
| `/api/presign` | POST | 验证身份 → 生成 R2 presigned URL | GitHub OAuth token |
| `/api/search` | GET | 查询预构建 JSON 索引（P0 可选，客户端过滤替代） | 无 |
| `/api/vote` | POST | 缓存 Reactions 计数（P0 可选） | GitHub OAuth token |
| `/api/auth/login` | GET | 发起 GitHub OAuth 授权流程 | 无 |
| `/api/auth/callback` | GET | 处理 OAuth 回调，设置 HttpOnly cookie | 无 |

### 3.4 环境变量与 Bindings

```
Cloudflare Pages Environment Variables:
├── R2_ACCESS_KEY_ID          # R2 S3 API 凭证
├── R2_SECRET_ACCESS_KEY      # R2 S3 API 密钥
├── R2_BUCKET_NAME            # R2 存储桶名称
├── GITHUB_APP_ID             # GitHub OAuth App ID
├── GITHUB_APP_SECRET         # GitHub OAuth App Secret
└── SITE_URL                  # 站点 URL（用于 OAuth callback）

GitHub Repo Secrets (Actions 用):
├── R2_ACCESS_KEY_ID          # R2 S3 API 凭证（Actions 上传用）
├── R2_SECRET_ACCESS_KEY      # R2 S3 API 密钥
├── R2_BUCKET_NAME            # R2 存储桶名称
├── R2_ENDPOINT               # R2 S3 endpoint
└── CLAUDE_CODE_OAUTH_TOKEN    # Claude OAuth Token（MVP: 个人订阅；后续迁移 ANTHROPIC_API_KEY）
```

---

## 4. 数据架构

### 4.1 数据存储分层

```
┌─────────────────────────────────────────────────────────┐
│                     数据存储分层                          │
│                                                         │
│  Layer 1: Git 仓库 (Source of Truth)                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │  hackathons/{slug}/hackathon.yml  ← 活动配置      │  │
│  │  hackathons/{slug}/submissions/   ← 项目提交      │  │
│  │  profiles/{id}.yml               ← 用户 Profile  │  │
│  │  site/src/                       ← 站点代码       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Layer 2: GitHub Platform (工作流状态)                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Issues          ← 报名/NDA/评分/申诉/组队状态     │  │
│  │  Labels          ← 阶段标记/分类标记              │  │
│  │  PR Reviews      ← 审核记录/评论                  │  │
│  │  Reactions        ← 大众投票                      │  │
│  │  Discussions     ← 社区讨论                       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Layer 3: Cloudflare R2 (二进制文件)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  PDF 技术文档  |  模型权重  |  NDA 文档           │  │
│  │  活动 Banner   |  附件图片                        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Layer 4: Cloudflare D1 (P1 可选 — 缓存/索引)           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  搜索索引  |  评分汇总缓存  |  file→r2_key 映射  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 4.2 数据流

#### 活动创建流程

```
组织者访问 /guides/organizer
    → 点击「创建活动」→ 选择活动类型
    → GitHubRedirect 生成预填 PR URL → 跳转 GitHub
    → 组织者编辑 hackathon.yml → 提交 PR
    → Actions validate-hackathon 校验 Schema
    → 校验通过 → Bot 添加 hackathon-valid Label
    → Maintainer 审核 → 合并到 main
    → CF Pages 自动构建 → 活动页面上线
```

#### 报名流程

```
参赛者访问 /hackathons/{slug}
    → 点击「报名」→ GitHubRedirect 生成预填 Issue URL → 跳转 GitHub
    → 提交 Issue [Register] username - slug
    → Actions 检查:
        1. Profile 存在？（profiles/{username}.yml）
        2. 资格约束？（eligibility 检查）
        3. NDA 要求？
    → 检查通过 → Bot 添加 registered Label
    → (NDA 场景) → 提示提交 NDA 签署 Issue → nda-approved Label
```

#### 项目提交流程

```
参赛者访问 /hackathons/{slug}（submission 阶段）
    → 点击「提交项目」→ GitHubRedirect 生成预填 PR URL → 跳转 GitHub
    → 提交 PR: submissions/{team}/project.yml + 附件
    → Actions validate-submission 校验:
        1. Schema 格式
        2. Track 在 hackathon.yml 中存在
        3. Required deliverables 齐全
    → Actions upload-assets:
        1. PDF/模型权重上传到 R2
        2. 自动填充 r2_url
        3. 移除二进制文件
    → (AI Review 启用时) ai-review workflow:
        1. Claude API 分析 project.yml
        2. Bot 评论评审摘要
    → Maintainer 审核 → 合并
```

#### 评分流程

```
评委访问 /hackathons/{slug}（judging 阶段）
    → 点击「开始评分」→ 页面显示 ScoreCard 组件
    → 逐维度打分 + 写评语
    → ScoreCard 生成 YAML 格式内容
    → GitHubRedirect 跳转 GitHub Issue
    → Actions validate-score 校验:
        1. YAML 格式正确
        2. 分值在范围内
        3. 所有维度已评分
        4. 评委身份在 judges[] 中
    → Bot 添加 score-valid Label
```

#### Presigned URL 安全流程

```
用户点击「获取数据集」
    → 前端检查登录状态
    → (未登录) 提示登录 → /api/auth/login → GitHub OAuth → /api/auth/callback
    → (已登录) 前端 POST /api/presign
        { hackathon_slug, dataset_name, oauth_token }
    → Functions 处理:
        1. 用 OAuth token 调 GitHub API 确认用户身份
        2. 查询 Issues: 用户在该 hackathon 是否有 nda-approved Label
        3. 通过 → 生成 R2 presigned URL (4h 有效)
        4. 未通过 → 返回 403
    → 用户下载数据集
```

---

## 5. 安全架构

### 5.1 认证模型

```
┌──────────────────────────────────────────────────┐
│                  认证分层                          │
│                                                  │
│  用户侧：GitHub OAuth App                        │
│  ├── 授权范围: read:user（最小权限）              │
│  ├── Token 存储: HttpOnly cookie（非 localStorage）│
│  ├── 用途: /api/presign 身份验证                 │
│  └── 降级: 未登录时公开页面正常访问               │
│                                                  │
│  自动化侧：GitHub App / PAT                      │
│  ├── Actions: GITHUB_TOKEN（内置，自动注入）      │
│  ├── Bot 操作: 评论/Label/close 等               │
│  └── 无需额外 Token 管理                         │
│                                                  │
│  管理侧：GitHub Repository Roles                 │
│  ├── Admin → Secrets/Settings/Collaborators      │
│  ├── Write+CODEOWNERS → PR Review + 合并         │
│  ├── Triage → Issue Labels/Assignment            │
│  └── Public → Issue/PR 提交（受 Actions 约束）    │
└──────────────────────────────────────────────────┘
```

### 5.2 凭证管理

| 凭证 | 用途 | 存储位置 | 访问者 |
|------|------|---------|-------|
| `R2_ACCESS_KEY_ID` | R2 S3 API 凭证 | CF Pages Env Vars + GitHub Secrets | Functions + Actions |
| `R2_SECRET_ACCESS_KEY` | R2 S3 API 密钥 | CF Pages Env Vars + GitHub Secrets | Functions + Actions |
| `R2_BUCKET_NAME` | R2 存储桶名称 | CF Pages Env Vars + GitHub Secrets | Functions + Actions |
| `R2_ENDPOINT` | R2 S3 endpoint | GitHub Secrets | Actions |
| `GITHUB_APP_ID` | OAuth App ID | CF Pages Env Vars | Functions |
| `GITHUB_APP_SECRET` | OAuth App Secret | CF Pages Env Vars | Functions |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude OAuth Token（MVP: 个人订阅） | GitHub Secrets | Actions (Claude Code Action) |

### 5.3 安全边界与风险

| 风险 | 缓解措施 |
|------|---------|
| Presigned URL 泄露 | 时效性（4h）+ 按需生成（不在公开 Comment 中） |
| OAuth token 窃取 | HttpOnly cookie + HTTPS only |
| Secrets 泄露 | GitHub 日志自动脱敏 + 不在公开输出中出现 |
| 刷票（Reactions） | MVP 不防御，P1 引入最低 Profile 要求 |
| 大文件 PR 滥用 | Actions 检查文件大小 + R2 上传后移除 |
| Issue 垃圾信息 | Label 路由 + Actions 自动校验 + 模板化 Issue |

---

## 6. 管理后端架构

### 6.1 Monorepo 即管理后端

传统 SaaS 平台需要独立的 Admin Panel 和管理 API。Synnovator 将 Monorepo 本身作为管理后端，管理操作即 Git 操作。

```
传统管理后端                    Synnovator 管理后端
─────────────                  ──────────────────
Admin Panel Web UI   ←→   synnovator-admin CLI Skill
数据库 CRUD          ←→   编辑 YAML → git commit → PR
用户权限表           ←→   GitHub Repository Roles
操作审计日志         ←→   git log + PR review history
审批工作流           ←→   PR Review + CODEOWNERS
配置回滚             ←→   git revert
```

### 6.2 GitHub RBAC 权限模型

```
┌─────────────────────────────────────────────────────────┐
│              GitHub RBAC → 平台权限映射                   │
│                                                         │
│  ┌─────────────┐                                        │
│  │ Repo Admin  │ → 超级管理员                            │
│  │             │   • 管理 Secrets/Actions/Collaborators  │
│  │             │   • 合并任意 PR                         │
│  │             │   • 配置 Branch Protection Rules        │
│  └──────┬──────┘                                        │
│         │                                               │
│  ┌──────▼──────┐                                        │
│  │ CODEOWNERS  │ → 活动管理员                            │
│  │ + Write     │   • 被自动 assign 为 PR Reviewer       │
│  │             │   • 合并对应 hackathons/{slug}/ 的 PR   │
│  │             │   • 管理对应活动的 Issues                │
│  └──────┬──────┘                                        │
│         │                                               │
│  ┌──────▼──────┐                                        │
│  │   Write     │ → Reviewer                             │
│  │             │   • 审核 PR、管理 Labels                │
│  │             │   • Comment 反馈                        │
│  └──────┬──────┘                                        │
│         │                                               │
│  ┌──────▼──────┐                                        │
│  │   Triage    │ → 协作者                               │
│  │             │   • 管理 Issue Labels/Assignees        │
│  │             │   • 不可合并 PR                         │
│  └──────┬──────┘                                        │
│         │                                               │
│  ┌──────▼──────┐                                        │
│  │ Read/Public │ → 普通用户                              │
│  │             │   • 提交 Issue/PR（受 Actions 约束）    │
│  │             │   • 浏览所有公开内容                     │
│  └─────────────┘                                        │
└─────────────────────────────────────────────────────────┘
```

### 6.3 CODEOWNERS 配置示例

```
# .github/CODEOWNERS

# 站点代码：核心开发者审核
/site/                          @synnovator/core-dev

# 活动配置：各活动管理员审核
/hackathons/ai-agent-2026/      @org-admin-alice @org-admin-bob
/hackathons/enterprise-risk/    @enterprise-admin

# Profile：自动合并（Actions 校验通过后）
/profiles/                      @synnovator/auto-merge-bot

# 全局配置：超级管理员审核
/.github/                       @synnovator/admin
/scripts/                       @synnovator/admin
```

### 6.4 synnovator-admin CLI Skill 架构

```
synnovator-admin Skill
├── 活动管理
│   ├── create-hackathon    → 从模板生成 hackathon.yml + 提交 PR
│   ├── update-timeline     → 修改时间线配置 + 提交 PR
│   ├── update-track        → 修改赛道配置 + 提交 PR
│   └── close-hackathon     → 关闭活动（设置 archived 状态）
│
├── 数据查询与导出
│   ├── list-registrations  → 查询某活动报名列表（gh api）
│   ├── list-submissions    → 查询某活动提交列表（git + gh api）
│   ├── export-scores       → 导出评分汇总（CSV/JSON）
│   └── export-report       → 生成活动报告
│
├── 审计
│   ├── audit-log           → 查询变更历史（git log）
│   ├── audit-permissions   → 检查 RBAC 配置
│   └── audit-secrets       → 验证 Secrets 配置状态
│
└── 实现方式
    ├── 读操作 → git log + gh api（GitHub CLI）
    ├── 写操作 → 编辑 YAML → git commit → gh pr create
    └── 校验 → 内置 Schema 校验（提交前本地校验）
```

---

## 7. GitHub Actions 工作流架构

### 7.1 Workflow 清单

| Workflow 文件 | 触发事件 | 职责 |
|-------------|---------|------|
| `validate-hackathon.yml` | PR (hackathons/\*/hackathon.yml) | Schema V2 校验 → Label |
| `validate-profile.yml` | PR (profiles/\*.yml) | Profile Schema 校验 → 自动合并 |
| `validate-submission.yml` | PR (hackathons/\*/submissions/) | 项目 Schema 校验 → deliverables 检查 |
| `validate-score.yml` | Issue (label: judge-score) | 评分格式校验 → 分值范围检查 |
| `upload-assets.yml` | PR merge (含二进制文件) | 上传到 R2 → 填充 r2_url → 移除文件 |
| `status-update.yml` | cron (每小时) | 遍历 timeline → 更新 stage Label |
| `ai-review.yml` | PR (submission 校验通过后) | Claude API 评审摘要 |
| `ai-team-match.yml` | Issue (label: team-formation) | Claude API 组队匹配 |
| `deploy.yml` | push to main | 触发 CF Pages 重建（可选，CF Pages 自身也监听 push） |

### 7.2 Actions 与 CF Pages 分工

```
GitHub Actions 负责:                     Cloudflare Pages 负责:
├── YAML Schema 校验                     ├── 站点构建（Astro hybrid）
├── Label 管理（状态标记）                ├── 静态页面 CDN 分发
├── Bot Comment（校验结果反馈）           ├── Pages Functions 运行
├── R2 文件上传（通过 S3 API）            ├── PR Preview 部署
├── AI 评审/匹配（Claude API 调用）       └── 自定义域名/SSL
├── 阶段自动切换（cron status-update）
└── Issue 自动处理（报名/NDA/申诉）

两者不重叠：Actions 做校验和自动化，CF Pages 做站点托管和最小动态。
```

---

## 8. 前端架构

### 8.1 页面结构

```
apps/web/app/
├── page.tsx                             # 首页：活动列表聚合
├── hackathons/
│   └── [slug]/page.tsx                  # 活动详情（SSG）
├── hackers/
│   └── [id]/page.tsx                    # Hacker Profile（SSG）
├── projects/
│   └── [hackathon]/[team]/page.tsx      # 项目展示（SSG）
├── guides/
│   ├── organizer/page.tsx               # 组织者指南
│   ├── hacker/page.tsx                  # 参赛者指南
│   └── judge/page.tsx                   # 评委指南
└── api/                                 # Route Handlers
    ├── presign/route.ts
    ├── search/route.ts
    ├── vote/route.ts
    └── auth/
        ├── login/route.ts
        └── callback/route.ts
```

### 8.2 核心组件

| 组件 | 职责 | 交互方式 |
|------|------|---------|
| `GitHubRedirect.tsx` | 生成预填 Issue/PR URL，跳转 GitHub | 纯客户端 JS，`target="_blank"` |
| `ScoreCard.tsx` | 评分卡 UI → 生成 YAML → GitHubRedirect | 客户端表单 → URL 编码 |
| `Timeline.tsx` | 7 阶段时间线可视化，当前阶段高亮 | 纯展示 + 阶段感知操作提示 |
| `LanguageSwitcher.tsx` | 中英文切换 | localStorage + URL 参数 |
| `OAuthButton.tsx` | GitHub OAuth 登录按钮 | 跳转 /api/auth/login |
| `DatasetDownload.tsx` | NDA 数据集下载按钮 | 调用 /api/presign |

### 8.3 数据加载策略

```
构建时 (Build-time):
├── Astro 读取 hackathons/*/hackathon.yml → 生成活动页面
├── Astro 读取 profiles/*.yml → 生成 Profile 页面
├── 生成 search-index.json → 供客户端搜索过滤
└── 生成 sitemap.xml

运行时 (Runtime):
├── GitHubRedirect → 客户端 JS 动态生成 URL
├── /api/presign → Functions 按需生成 presigned URL
├── /api/search → Functions 查询索引（P0 可用客户端过滤替代）
└── /api/auth/* → Functions 处理 OAuth 流程
```

---

## 9. 国际化 (i18n) 架构

### 9.1 双语实现策略

```
UI 文本: site/src/i18n/{en,zh}.yml → Astro t() 函数
数据字段: YAML 双字段 (name / name_zh) → 条件渲染
Fallback: 中文优先 → 缺少翻译时显示中文内容

语言检测优先级:
  1. URL 参数 (?lang=en)
  2. localStorage 缓存
  3. 浏览器 Accept-Language
  4. 默认中文
```

---

## 10. 基础设施初始化清单

### P0 所需基础设施配置

| # | 资源 | 配置步骤 | 验收标准 |
|---|------|---------|---------|
| 1 | Cloudflare Pages 项目 | Dashboard 创建 → 连接 GitHub repo → 配置构建命令 | 首次构建成功，站点可访问 |
| 2 | Cloudflare R2 存储桶 | Dashboard 创建 → location hint: apac | 测试文件上传/下载成功 |
| 3 | R2 API Token | Dashboard 创建 → Object Read & Write → 关联存储桶 | Token 在 CF Env Vars + GitHub Secrets 中配置 |
| 4 | GitHub OAuth App | Developer Settings 创建 → callback URL 配置 | OAuth 登录流程完整走通 |
| 5 | CF Pages Environment Variables | Dashboard 配置 R2/OAuth 凭证 | Functions 可读取所有变量 |
| 6 | GitHub Repo Secrets | Settings 配置 R2/Claude API 凭证 | Actions 可读取所有 Secrets |
| 7 | 自定义域名 (可选) | CF Pages Custom domains + DNS CNAME | HTTPS 访问正常 |
| 8 | CODEOWNERS | .github/CODEOWNERS 文件配置 | PR 自动 assign 正确审核者 |
| 9 | Branch Protection | Repo Settings → main 分支保护规则 | 需 Review 才能合并到 main |
| 10 | GitHub Collaborators | Repo Settings → 配置角色 | 各角色权限生效 |

---

## 11. 架构决策记录 (ADR)

### ADR-001: 选择 Cloudflare Pages (Hybrid) 而非 GitHub Pages

- **决策**: 从 GitHub Pages 迁移到 Cloudflare Pages (Hybrid mode)
- **原因**: GitHub Pages 是纯静态托管，无法运行服务端代码。Presigned URL 生成需要服务端验证用户身份，不能在公开 Issue Comment 中暴露 URL。
- **权衡**: 增加了 Cloudflare 依赖，但获得了 Functions（边缘函数）、R2（对象存储）和全球 CDN。
- **参考**: PRD V3.1 changelog

### ADR-002: P0 不引入 D1

- **决策**: D1 作为 P1 可选项，P0 不引入
- **原因**: P0 数据量小（~3 个活动），YAML 文件即数据库，客户端过滤满足搜索需求。D1 需要额外的 Schema 设计和数据同步逻辑，增加 P0 复杂度。
- **权衡**: 数据增长后搜索性能下降，P1 引入 D1 作为缓存层。

### ADR-003: Monorepo 即管理后端

- **决策**: 将 Monorepo 定位为管理后端，通过 GitHub RBAC 控制管理权限，通过 synnovator-admin CLI Skill 执行管理操作
- **原因**: 管理操作本质上就是 YAML 编辑 + PR 提交，与 Git-native 理念一致。无需额外的 Admin Panel 或管理 API，减少基础设施依赖。
- **权衡**: 管理员需要 Git 基础知识和 CLI 使用能力，不如 Web UI 直观。Skill 降低使用门槛。

### ADR-004: GitHub OAuth App 而非 GitHub App

- **决策**: 使用 GitHub OAuth App（redirect flow）而非 GitHub App（installation token）进行用户认证
- **原因**: OAuth App 适合用户级别操作（读取用户身份），不需要安装到仓库。GitHub App 适合仓库级别操作（Bot 操作），两者用途不同。
- **状态**: 待最终确认（PRD Open Question #7）

---

## 12. 未来演进方向

### P1 可能引入的架构变更

| 变更 | 触发条件 | 影响范围 |
|------|---------|---------|
| D1 集成 | 活动数量 > 10 或搜索响应 > 500ms | 新增 D1 Schema + Functions 查询 + 数据同步 Actions |
| WebSocket / SSE | 实时评分通知需求 | 需 Durable Objects，超出 Pages Functions 范围 |
| Edge KV 缓存 | 高并发访问 | Pages Functions 前置 KV 缓存层 |

### 架构约束

- **Pages Functions 免费额度**: 100K 次/天。按 100 用户 × 10 次/天 = 1K 次/天，远低于限制
- **R2 免费额度**: 10GB 存储 + 10M 次 Class A 操作 + 10M 次 Class B 操作/月
- **Actions 公开仓库**: 免费无限分钟，最多 20 并发 job
- **Git 仓库大小**: 建议保持在 1GB 以下，大文件及时上传 R2 后从 Git 历史清理
