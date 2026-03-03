# P0 站点核心页面设计文档

> **版本**: 1.0
> **日期**: 2026-03-03
> **关联 PRD**: V3.2 §11 P0 Roadmap
> **状态**: Approved

---

## 1. 范围与目标

P0 第一批实施聚焦**站点核心页面**：构建可运行的 Astro 站点，从 YAML 数据生成活动列表、活动详情、Profile 页面，落地 Neon Forge 设计系统，实现 GitHubRedirect 跳转能力。

### 1.1 本批交付物

- 示范活动数据（enterprise-fintech-risk-2025，从 docx 档案转出）
- Neon Forge 设计系统 CSS tokens + 字体 + 布局
- Astro Content Collections 数据加载层
- 首页（活动列表）、活动详情页、Profile 页、404 页
- GitHubRedirect / Timeline / ScoreCard 等核心组件
- 中英双语 i18n 基础

### 1.2 不在本批范围

- Cloudflare Pages Hybrid 切换（保持 `output: 'static'`）
- Pages Functions（/api/*）
- GitHub Actions 深度校验增强
- GitHub OAuth 认证流程
- R2 文件上传

### 1.3 部署目标

保持 GitHub Pages (static) 部署，后续批次切换到 Cloudflare Pages。

---

## 2. 架构分层

```
Layer 1: 示范数据
  enterprise-fintech-risk-2025.docx
  → hackathons/enterprise-fintech-risk-2025/hackathon.yml
  → profiles/ (2-3 个示例)
  → submissions/ (2 个获奖作品示例)

Layer 2: Neon Forge 设计系统
  → CSS custom properties (design tokens from design-system.md)
  → 字体加载 (Space Grotesk/Inter/Poppins/Noto Sans SC)
  → BaseLayout 升级 (NavBar + main + Footer + 主题)

Layer 3: 数据加载
  → Astro Content Collections (defineCollection + zod schema)
  → 外部 YAML 目录映射到 src/content/
  → 搜索索引 JSON 构建时生成

Layer 4: 页面 & 组件
  → 首页 (活动列表卡片 + 状态筛选)
  → /hackathons/[slug] (活动详情全展示)
  → /hackers/[id] (Profile 页)
  → /404 (友好错误页)
  → 核心组件 (GitHubRedirect, Timeline, TrackSection, etc.)
  → i18n 基础 (zh/en 切换)
```

每层可独立验证，依赖关系为 Layer 1 → 2 → 3 → 4。

---

## 3. Layer 1: 示范数据

### 3.1 数据来源

从 `enterprise-fintech-risk-2025.docx` 模拟档案提取，转为 Schema V2 YAML。

### 3.2 文件清单

| 文件 | 说明 |
|------|------|
| `hackathons/enterprise-fintech-risk-2025/hackathon.yml` | 完整活动配置（双赛道、NDA、7 阶段时间线、FAQ、Events、5 评委、数据集） |
| `hackathons/enterprise-fintech-risk-2025/assets/` | Banner 占位 |
| `hackathons/enterprise-fintech-risk-2025/submissions/team-refuse-zero/project.yml` | 获奖作品「拒绝清零」（模型优化赛道一等奖） |
| `hackathons/enterprise-fintech-risk-2025/submissions/team-compliance-express/project.yml` | 获奖作品「合规快车」（可解释性赛道一等奖） |
| `profiles/zhou-haoran-a1b2c3d4.yml` | 「拒绝清零」队长 |
| `profiles/song-yuhan-e5f6g7h8.yml` | 「可信决策」成员 |

### 3.3 关键映射

- `type: "enterprise"` — 企业悬赏类型
- `ip_ownership: "organizer"` — IP 转让
- `nda.required: true` — 签署 NDA
- `eligibility.open_to: "all"` + `blacklist` 排除主办方员工
- `allow_multi_track: true`, `multi_track_rule: "independent"` — 独立双报
- 评委 5 人（赵文博/林晓慧/吴昊/张汝萍/钱世宁）
- 队伍信息通过 `project.yml` 的 `team` 字段体现，不增加独立实体

---

## 4. Layer 2: Neon Forge 设计系统

### 4.1 CSS Design Tokens

在 `site/src/styles/global.css` 中定义，对应 `docs/specs/design-system.md` 速查表：

```css
@import "tailwindcss";

@theme {
  /* Colors */
  --color-lime-primary: #BBFD3B;
  --color-mint: #74FFBB;
  --color-cyan: #41FAF4;
  --color-pink: #FF74A7;
  --color-neon-blue: #4C78FF;
  --color-orange: #FB7A38;
  --color-surface: #181818;
  --color-dark-bg: #222222;
  --color-secondary-bg: #333333;
  --color-near-black: #00000E;
  --color-muted: #8E8E8E;
  --color-light-gray: #DCDCDC;
  --color-success: #00B42A;
  --color-error: #FA541C;
  --color-warning: #FAAD14;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 36px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 20px;
  --radius-pill: 50px;
}
```

### 4.2 字体加载

Google Fonts CDN `<link>` 在 BaseLayout `<head>` 中加载：
- Space Grotesk (700, 900) — 标题
- Inter (400) — 正文
- Poppins (500) — 数字与代码
- Noto Sans SC (400) — 中文

使用 `font-display: swap` 避免 FOIT。

### 4.3 布局

BaseLayout 升级为：
- NavBar（logo + 导航链接 + LanguageSwitcher + GitHub 链接）
- main（slot）
- Footer（版权 + 快速链接 + repo 链接）

---

## 5. Layer 3: 数据加载

### 5.1 Astro Content Collections

```typescript
// site/src/content/config.ts
import { defineCollection, z } from 'astro:content';

const hackathons = defineCollection({
  type: 'data',
  schema: z.object({
    synnovator_version: z.string(),
    hackathon: z.object({
      name: z.string(),
      name_zh: z.string().optional(),
      slug: z.string(),
      // ... Schema V2 字段
    }),
    // ... tracks, judges, etc.
  }),
});

const profiles = defineCollection({
  type: 'data',
  schema: z.object({
    synnovator_profile: z.string(),
    hacker: z.object({
      github: z.string(),
      name: z.string(),
      // ...
    }),
  }),
});
```

### 5.2 外部目录映射

Astro content 目录必须在 `src/content/`。通过以下方式引用 monorepo 根目录数据：

**方案 A**（推荐）：构建前脚本（`prebuild`）将 `../../hackathons/` 和 `../../profiles/` 复制到 `src/content/`。

**方案 B**：使用 symlink。

选择方案 A，在 `package.json` 添加 `prebuild` 脚本确保数据同步。

### 5.3 搜索索引

构建时从 hackathons collection 提取 `{slug, name, name_zh, type, tagline, stage}` 生成 `public/search-index.json`，供客户端过滤。

---

## 6. Layer 4: 页面 & 组件

### 6.1 页面

| 页面 | 路由 | 数据源 | 核心功能 |
|------|------|--------|---------|
| 首页 | `/` | hackathons collection | 活动卡片列表 + 状态筛选 + 类型标签 + 空状态处理 |
| 活动详情 | `/hackathons/[slug]` | hackathon.yml | 基础信息、主办方、时间线、赛道、评委、FAQ、Events、阶段操作按钮 |
| Profile | `/hackers/[id]` | profiles/*.yml | 个人信息 + 技能标签 + 经历 + 操作引导 |
| 404 | `/404` | — | 友好错误页 + 返回链接 |

### 6.2 组件

| 组件 | 职责 |
|------|------|
| `NavBar.astro` | 顶部导航（logo + 链接 + LanguageSwitcher + GitHub） |
| `Footer.astro` | 页脚 |
| `HackathonCard.astro` | 活动卡片 |
| `Timeline.astro` | 7 阶段时间线，当前阶段高亮 |
| `TrackSection.astro` | 赛道信息（奖项 + 评审标准 + 提交物） |
| `JudgeCard.astro` | 评委卡片 |
| `FAQAccordion.astro` | FAQ 折叠面板 |
| `EventCalendar.astro` | 运营事件列表 |
| `GitHubRedirect.astro` | 预填 Issue/PR URL 生成 + 跳转 |
| `SkillBadge.astro` | 技能标签 |
| `LanguageSwitcher.astro` | 中英文切换 |

### 6.3 GitHubRedirect 组件

Props：`action` (register/submit/appeal/create-profile/edit-file), `hackathonSlug?`, `templateData?`

生成逻辑：根据 action 类型构造 GitHub URL：
- register → `/issues/new?template=register.yml&title=...&labels=...`
- submit → `/new/{branch}?filename=...&value={template}`
- create-profile → `/new/main?filename=profiles/{username}.yml&value={skeleton}`

纯客户端 JS，`<a target="_blank">`。

### 6.4 i18n

- UI 文案：`src/i18n/zh.yml` + `en.yml` → `t(key)` 工具函数
- 数据字段：`name`/`name_zh` 条件渲染
- 语言检测：URL `?lang=` > localStorage > `navigator.language` > 默认 zh
- LanguageSwitcher 组件保存选择

---

## 7. 验收标准对照

本批实施覆盖以下验收场景：

| 验收场景 | 覆盖状态 |
|---------|---------|
| SC-V-001.1: 无需登录即可浏览 | 完全覆盖 |
| SC-V-001.2: 空状态处理 | 完全覆盖 |
| SC-V-002.1: 活动详情完整展示 | 完全覆盖 |
| SC-V-002.2: 活动不存在 404 | 完全覆盖 |
| SC-V-003.1: Profile 公开页面 | 完全覆盖 |
| SC-V-003.2: Profile 不存在 404 | 完全覆盖 |
| SC-V-004.1: 项目列表展示 | 部分覆盖（有示范提交数据） |
| SC-V-006.1: 指南入口可发现 | 部分覆盖（NavBar 有链接，指南页内容下一批） |
| SC-H-002.1: 首页活动卡片列表 | 完全覆盖 |
| SC-H-002.2: 活动状态筛选 | 完全覆盖 |
| SC-H-002.3: 活动类型标识 | 完全覆盖 |
| SC-H-003.1: 活动详情完整信息 | 完全覆盖 |
| SC-H-003.2: 报名引导 | 完全覆盖（GitHubRedirect） |
| SC-H-006.1: Profile 页面内容 | 完全覆盖 |

---

## 8. 技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 部署模式 | `output: 'static'`（本批保持） | 降低复杂度，Hybrid 切换下一批 |
| YAML 加载 | Astro Content Collections | 内置 Schema 校验 + 类型安全 + 动态路由 |
| 外部数据映射 | prebuild 脚本复制 | 比 symlink 更可靠，跨平台兼容 |
| CSS 方案 | Tailwind CSS 4 @theme + CSS custom properties | 与设计系统 tokens 一致，无需 tailwind.config.js |
| 字体加载 | Google Fonts CDN + font-display: swap | 简单可靠，P0 不需要自托管字体 |
| 队伍数据 | project.yml 的 team 字段 | 与 PRD Schema 一致，不增加额外实体 |
| i18n | 自建 t() 函数 + YAML 翻译文件 | 轻量级，P0 不需要完整 i18n 框架 |
