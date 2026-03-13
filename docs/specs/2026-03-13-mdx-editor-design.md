# MDX 编辑器设计文档

> 为活动（Hackathon）、提案（Proposal）、档案（Profile）三种内容类型添加 MDX 富文本编辑器，支持图片/PDF 上传、自定义组件、双语编辑和实时预览。

**日期**: 2026-03-13
**状态**: Draft
**关联 Issue**: #51（组队管理，单独处理）

---

## 1. 背景与目标

### 现状

- 项目描述存储为 YAML 纯文本字符串（`description` / `description_zh`）
- PRD 已规划 `README.mdx` 但未实现
- 编辑入口仅提案有 `EditProjectButton`（跳转 GitHub 网页编辑器），活动和档案无编辑入口
- 文件上传基础设施已有：R2 presign 路由 + `upload-assets.yml` GitHub Actions

### 目标

1. 为三种内容类型提供站内 MDX 编辑器（Split-pane：左写右预览）
2. 支持拖拽/粘贴上传图片和 PDF
3. 提供场景化自定义 MDX 组件（复用现有 UI 组件库）
4. 创建时自动生成 MDX 模板文件，支持管理员编辑模板
5. 统一数据读取抽象（DataProvider），为未来环境迁移做准备

---

## 2. 架构概览

### 方案选择：编辑器 SDK + 场景页面（方案 C）

```
packages/ui/src/components/editor/       # 编辑器基础设施（SDK）
  MdxEditor, EditorPane, PreviewPane, EditorToolbar,
  ImageUploader, ComponentInserter, types

packages/ui/src/components/mdx-components/  # MDX 自定义组件
  common/, hackathon/, proposal/, profile/

apps/web/app/(admin)/edit/               # 场景页面（胶水层）
  hackathon/[slug]/page.tsx
  proposal/[hackathon]/[team]/page.tsx
  profile/[username]/page.tsx
```

**职责分离**：
- 编辑器组件（packages/ui）：编辑 + 预览 + 上传，不关心内容来源和提交方式
- 场景页面（apps/web）：加载数据 + 配置可用组件集 + 权限校验 + 提交 PR

### 数据流

```
编辑流程：
  详情页「编辑内容」→ /edit/* 路由
    → 鉴权 + 权限校验（organizer/team/self）
    → GitHub API 读取当前 .mdx 文件（不存在则加载模板）
    → MdxEditor 组件渲染
    → 拖入图片 → /api/r2/upload → R2 临时桶 → 返回临时 URL → 插入 MDX
    → 右侧实时预览（debounce 300ms）
    → 提交：扫描临时 URL → 下载 blob → 替换为 ./assets/ 相对路径
    → /api/submit-pr：创建分支 + 提交 .mdx + assets → PR
    → CI：upload-assets.yml → 上传 R2 正式桶 → 回写正式 URL

构建流程：
  generate-static-data.mjs
    → 读取 .mdx 文件 → @mdx-js/mdx 编译为序列化格式
    → 写入分离的 static-mdx/{slug}.json
    → 页面级 import 渲染

渲染流程：
  DataProvider.getHackathonMdx(slug, lang)
    → 返回编译后 MDX → run() 执行为 React 组件
    → 注入场景对应的自定义组件集 → 渲染
```

---

## 3. 文件结构与内容模型

### MDX 文件布局

```
hackathons/{slug}/
├── hackathon.yml                 # 现有，不变
├── description.mdx               # 新增：活动整体描述
├── description.zh.mdx
├── tracks/
│   ├── {track-slug}.mdx          # 新增：赛道描述
│   └── {track-slug}.zh.mdx
├── stages/
│   ├── {stage-slug}.mdx          # 新增：阶段描述
│   └── {stage-slug}.zh.mdx
├── assets/                       # 新增：活动图片
│   └── *.png / *.jpg
└── submissions/{team-slug}/
    ├── project.yml               # 现有，不变
    ├── README.mdx                # 新增：提案描述
    ├── README.zh.mdx
    └── assets/
        └── *.png / *.jpg

profiles/
├── {username}-{uuid}.yml         # 现有，不变
└── {username}-{uuid}/            # 新增：profile 资源目录
    ├── bio.mdx
    ├── bio.zh.mdx
    └── assets/
        └── *.png / *.jpg
```

### 双语策略

- 文件名后缀区分：`description.mdx`（英文默认）/ `description.zh.mdx`（中文）
- 与现有 `_zh` 后缀命名习惯一致
- 构建时 glob `*.zh.mdx` 自动识别语言版本
- 编辑器内 EN/ZH tab 切换，提交时两个文件一起写入 PR

### MDX ↔ YAML 关联

通过**文件名 = slug** 约定关联，不在 YAML 中添加路径字段：
- `tracks/{track.slug}.mdx` → 关联到对应赛道
- `stages/{stage-key}.mdx` → 关联到对应阶段
- 减少数据冗余和不一致风险

### 模板系统

独立存储在 `config/templates/`，管理员可编辑：

```
config/templates/
├── hackathon/
│   ├── description.mdx / description.zh.mdx
│   ├── track.mdx / track.zh.mdx
│   └── stage.mdx / stage.zh.mdx
├── proposal/
│   └── README.mdx / README.zh.mdx
└── profile/
    └── bio.mdx / bio.zh.mdx
```

- 创建表单提交 PR 时 → 读取模板 → 变量替换（`{hackathon-name}`, `{track-name}` 等）→ 写入目标目录
- 编辑器打开时文件不存在（异常情况）→ 用模板填充 + 提示用户

---

## 4. 编辑器组件架构

### 组件层次

```
packages/ui/src/components/editor/
├── MdxEditor.tsx                # 顶层：split-pane 布局 + 状态管理
├── EditorPane.tsx               # 左侧：CodeMirror 6 封装
├── PreviewPane.tsx              # 右侧：MDX 实时预览
├── EditorToolbar.tsx            # 工具栏（可配置按钮组）
├── ImageUploader.tsx            # 拖拽/粘贴/点击上传
├── ComponentInserter.tsx        # 组件插入面板
└── types.ts                     # 类型定义
```

### 核心接口

```typescript
interface MdxEditorProps {
  initialContent: string
  availableComponents: ComponentDefinition[]
  onSave: (content: string, assets: Asset[]) => Promise<void>
  lang: "en" | "zh"
  templateContent?: string
}

interface ComponentDefinition {
  name: string
  category: "common" | "hackathon" | "proposal" | "profile"
  snippet: string
  description: string
  icon: LucideIcon
}

interface Asset {
  filename: string
  blob: Blob
  tempUrl: string
}
```

### 工具栏

```
┌─────────────────────────────────────────────────────────────┐
│ B  I  ~S~  H1 H2 H3 │ 📋 ``` 🔗 │ 🖼️ 📎 │ ⧉ 组件 ▼ │ 🌐 EN/ZH │ 💾 保存 │
│ 基础格式               代码/链接   上传    组件插入   语言切换   提交    │
└─────────────────────────────────────────────────────────────┘
```

- 基础格式：加粗、斜体、删除线、标题（快捷键支持）
- 代码/链接：行内代码、代码块（带语言选择）、链接
- 上传：图片（拖拽/粘贴/点击，≤5MB）、PDF（≤20MB）
- 组件插入：DropdownMenu，按场景过滤，点击插入 snippet
- 语言切换：Tabs（EN / ZH），切换编辑 `.mdx` / `.zh.mdx`
- 保存：提交 PR

### 关键交互

**图片上传**：
```
拖入/粘贴图片 → ImageUploader 拦截
  → 校验类型（png/jpg/gif/webp）+ 大小（≤5MB）
  → POST /api/r2/upload → R2 临时桶 → 返回临时 URL
  → 插入 ![alt](tempUrl) → 预览面板即时显示
  → 本地维护 Asset[] 列表
```

**组件插入**：
```
点击「组件」→ DropdownMenu 显示当前场景可用组件
  → 每项：图标 + 名称 + 说明
  → 点击 → 在光标位置插入预填 snippet → 用户编辑 props → 实时预览
```

**语言切换**：
```
EN/ZH tab → 保存当前内容到本地状态 → 加载另一语言内容
  → 提交时两个文件一起写入 PR
```

**实时预览**：
```
CodeMirror onChange → debounce 300ms
  → @mdx-js/mdx 浏览器端编译（evaluate）→ 注入组件 → 渲染
  → 编译错误 → 预览面板显示错误信息（行号 + 提示）
```

### 编辑器复用现有 UI 组件

| 编辑器部件 | 复用的 UI 组件 |
|-----------|---------------|
| 工具栏按钮 | `Button` variant="ghost" size="icon" + `Tooltip` |
| 组件插入面板 | `DropdownMenu` |
| 语言切换 | `Tabs` |
| 图片上传对话框 | `Dialog` |
| 提交确认 | `Dialog` + `Button` |
| 编辑区滚动 | `ScrollArea` |
| 错误提示 | `Alert` variant="destructive" |

---

## 5. MDX 自定义组件

### 组件总览

```
packages/ui/src/components/mdx-components/
├── common/          Callout, ImageGallery, Video
├── hackathon/       Timeline, PrizeTable, SponsorGrid
├── proposal/        TechStack, DemoEmbed, TeamRoles
├── profile/         ProjectShowcase, SkillBadges
└── index.ts         按场景分组导出
```

### 复用矩阵

| MDX 组件 | 复用的 UI 原子组件 |
|----------|-------------------|
| Callout | Alert + AlertTitle + AlertDescription |
| ImageGallery | Dialog（lightbox） |
| Video | Card + CardContent |
| Timeline | Badge（状态）+ Separator（连接线） |
| PrizeTable | Card + Badge（奖项标签） |
| SponsorGrid | Avatar（logo）+ Card + Badge（tier） |
| TechStack | Badge variant="outline" |
| DemoEmbed | Card + Button（fallback） |
| TeamRoles | Avatar + Badge（角色）+ Card |
| ProjectShowcase | Card + CardHeader + CardContent + CardFooter |
| SkillBadges | Badge（level 映射 variant） |

### Props 定义

**通用组件**

```typescript
// Callout — 提示/警告/建议框
<Callout type="info | warning | tip" title="可选标题">
  内容支持 Markdown
</Callout>

// ImageGallery — 多图展示（网格 + 点击放大）
<ImageGallery
  images={[{ src: "...", alt: "...", caption: "..." }]}
  columns={2 | 3}
/>

// Video — 视频嵌入（YouTube / Bilibili / 直链）
<Video url="https://..." title="演示视频" />
```

**活动组件**

```typescript
// Timeline — 活动时间线
<Timeline
  items={[{ date: "2026-03-15", label: "报名开始", status: "completed | active | upcoming" }]}
/>

// PrizeTable — 奖项表格
<PrizeTable
  prizes={[{ rank: "🥇 一等奖", reward: "$5,000", count: 1 }]}
/>

// SponsorGrid — 赞助商展示（按 tier 分组）
<SponsorGrid
  sponsors={[{ name: "Anthropic", logo: "...", tier: "platinum | gold | silver", url: "..." }]}
/>
```

**提案组件**

```typescript
// TechStack — 技术栈标签云
<TechStack items={["React", "TypeScript", "Claude API"]} />

// DemoEmbed — iframe 沙箱内嵌 demo
<DemoEmbed url="https://..." height={400} title="在线演示" />

// TeamRoles — 团队成员角色展示
<TeamRoles
  members={[{ github: "alice", role: "leader", contribution: "架构设计" }]}
/>
```

**档案组件**

```typescript
// ProjectShowcase — 项目作品集卡片
<ProjectShowcase
  projects={[{ name: "AI助手", description: "...", url: "...", image: "..." }]}
/>

// SkillBadges — 技能标签（分级）
<SkillBadges
  skills={[{ name: "TypeScript", level: "expert | intermediate | beginner" }]}
/>
```

### 场景注入映射

```typescript
export const commonComponents = { Callout, ImageGallery, Video }
export const hackathonComponents = { ...commonComponents, Timeline, PrizeTable, SponsorGrid }
export const proposalComponents = { ...commonComponents, TechStack, DemoEmbed, TeamRoles }
export const profileComponents = { ...commonComponents, ProjectShowcase, SkillBadges }
```

编辑器预览和最终页面渲染共用同一套组件定义。

---

## 6. API 路由与上传管道

### R2 路由统一命名空间

| 路由 | 方法 | 职责 | 变更 |
|------|------|------|------|
| `/api/r2/download` | GET | 生成 R2 签名下载链接（数据集） | 重命名自 `/api/presign` |
| `/api/r2/upload` | POST | 上传文件到 R2 临时桶 | 新增 |

### `/api/r2/upload` 规格

```
POST /api/r2/upload
Request: FormData { file: File, context: "hackathon" | "proposal" | "profile" }
Response: { url: string, filename: string, size: number }

流程：
1. 鉴权：验证 GitHub OAuth session
2. 校验：
   - 文件类型白名单：image/png, image/jpeg, image/gif, image/webp, application/pdf
   - 大小限制：图片 ≤ 5MB，PDF ≤ 20MB
3. 生成唯一文件名：{context}/{timestamp}-{hash}.{ext}
4. 上传到 R2 临时桶（bucket: synnovator-temp）
5. 返回临时 URL
```

### 提交时 URL 重写

```
用户点击「提交」→ 客户端：
  1. 正则扫描 MDX 中 R2 临时 URL
  2. fetch 下载 blob → 生成 ./assets/{filename} 相对路径 → 替换 URL
  3. 调用 /api/submit-pr（扩展为多文件）：
     files: [
       { path: "description.mdx", content: mdxContent },
       { path: "assets/img1.png", content: base64Blob, encoding: "base64" },
     ]
  4. CI upload-assets.yml → 上传 R2 正式桶 → 回写正式 URL
```

### `/api/submit-pr` 扩展

```typescript
// 向后兼容：旧格式（单文件）仍支持
{ type: "hackathon", filename: "hackathon.yml", content: yamlString }

// 新格式：多文件
{
  type: "hackathon",
  files: [
    { path: "hackathons/{slug}/hackathon.yml", content: yamlString },
    { path: "hackathons/{slug}/description.mdx", content: mdxString },
    { path: "hackathons/{slug}/assets/hero.png", content: base64, encoding: "base64" },
  ]
}
```

### R2 临时桶清理

GitHub Action（cron 每天 UTC 00:00）→ 列出 synnovator-temp 桶 → 删除超过 24 小时的文件。

---

## 7. 路由与权限设计

### 编辑器路由

```
apps/web/app/(admin)/edit/
├── hackathon/[slug]/page.tsx           # 活动编辑（Tab: 描述 / 赛道* / 阶段*）
├── proposal/[hackathon]/[team]/page.tsx # 提案编辑
└── profile/[username]/page.tsx          # 档案编辑
```

### 权限校验

```
用户进入 /edit/* → Server Component：
  1. getSession() → 未登录 → redirect 登录
  2. 按类型校验：
     活动：hackathon.yml organizers[] 包含当前用户
     提案：project.yml team[] 包含当前用户
     档案：URL username 匹配当前用户
  3. 无权限 → 403 页面
  4. 有权限 → 渲染编辑器
```

### 详情页编辑入口

```typescript
// 三种详情页各自添加条件渲染的编辑按钮
{isOrganizer && <EditButton href={`/edit/hackathon/${slug}`} />}
{isTeamMember && <EditButton href={`/edit/proposal/${hackathon}/${team}`} />}
{isOwner && <EditButton href={`/edit/profile/${username}`} />}
```

### 活动编辑器 Tab 结构

```
┌──────────────────────────────────────────────────────────────┐
│  活动描述  │  赛道: AI安全  │  赛道: 公平性  │  阶段: 报名  │  阶段: 提交  │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┬────────────────────┐                │
│  │ CodeMirror 编辑区    │ 实时预览面板        │                │
│  └─────────────────────┴────────────────────┘                │
│                                  [ EN / ZH ]       [ 提交 ]  │
└──────────────────────────────────────────────────────────────┘
```

- Tab 来自 hackathon.yml 的 tracks[] 和 timeline 的 slug
- 切换 Tab 时自动保存当前内容到本地状态
- 提交时所有修改过的文件一起打包进 PR

### 未保存变更保护

使用 `beforeunload` 事件，有未保存内容时提示确认。

---

## 8. 构建管道变更

### generate-static-data.mjs 扩展

```
现有：hackathons/*.yml + profiles/*.yml + themes/*.yml → static-data.json
新增：*.mdx → @mdx-js/mdx compile → static-mdx/{slug}.json（分离存储）
```

关联逻辑：
- `hackathons/{slug}/description.mdx` → `hackathon.descriptionMdx`
- `hackathons/{slug}/tracks/{track-slug}.mdx` → `track.descriptionMdx`
- `hackathons/{slug}/stages/{stage-key}.mdx` → `stage.descriptionMdx`
- `submissions/{team}/README.mdx` → `submission.readmeMdx`
- `profiles/{username}/bio.mdx` → `profile.bioMdx`
- 所有 `.zh.mdx` 同理（`*MdxZh` 字段）

文件不存在时返回 null，不中断构建。

### 体积控制

- MDX 编译结果从主 `static-data.json` 分离为 `static-mdx/{slug}.json`
- 页面级 import，不全量打包
- 构建缓存：对比 .mdx 文件 hash，未变更的跳过重编译

### 新增依赖

```
@mdx-js/mdx              # MDX 编译器
remark-gfm                # GFM 支持（表格、删除线、任务列表）
@uiw/react-codemirror     # CodeMirror 6 React 封装
@codemirror/lang-markdown  # Markdown 语法高亮
@codemirror/lang-javascript # JSX 语法高亮
```

---

## 9. DataProvider 抽象

### 统一数据读取接口

```typescript
// packages/shared/src/data/provider.ts
export interface DataProvider {
  listHackathons(): Hackathon[]
  getHackathon(slug: string): Hackathon | null
  listProfiles(): Profile[]
  getProfile(github: string): Profile | null
  listSubmissions(): SubmissionWithMeta[]
  getResults(hackathonSlug: string): any[]

  // MDX 读取
  getHackathonMdx(slug: string, lang: Lang): SerializedMDX | null
  getTrackMdx(hackathonSlug: string, trackSlug: string, lang: Lang): SerializedMDX | null
  getStageMdx(hackathonSlug: string, stageSlug: string, lang: Lang): SerializedMDX | null
  getSubmissionMdx(hackathonSlug: string, teamSlug: string, lang: Lang): SerializedMDX | null
  getProfileMdx(username: string, lang: Lang): SerializedMDX | null
}
```

### 两种实现

```typescript
// 实现 1：静态 JSON（Cloudflare Workers）
class StaticDataProvider implements DataProvider {
  // 从 static-data.json + static-mdx/*.json 读取
}

// 实现 2：文件系统（Node.js 环境）
class FsDataProvider implements DataProvider {
  // 用 node:fs 读 YAML + 编译 MDX
}
```

### 页面使用

```typescript
// apps/web/lib/data.ts — 单一入口
export const data: DataProvider = new StaticDataProvider()
// 迁移时改为：new FsDataProvider(process.cwd())
```

---

## 10. 设计系统合规

### 合规清单

| 规范 | 编辑器 | MDX 组件 | 要点 |
|------|--------|----------|------|
| OKLCH 语义令牌 | ✅ | ✅ | 禁止 hex/rgb，token-audit 自动守护 |
| Light/Dark 自适应 | ✅ | ✅ | CodeMirror 双主题跟随 useTheme() |
| Hackathon 类型色覆盖 | — | ✅ | data-hackathon-type 级联 --brand |
| i18n — UI 文案 | ✅ | ✅ | 通过 t(lang, key)，扩展 zh.json/en.json |
| i18n — 内容 | ✅ | — | EN/ZH tab 切换 .mdx/.zh.mdx |
| 字体 | ✅ | ✅ | 编辑区 font-code，预览 font-sans，标题 font-heading |
| 间距节奏 | ✅ | ✅ | max-w-7xl 页面级，mb-12/mb-8 区块级 |
| 圆角 | ✅ | ✅ | --radius 系列令牌 |
| 动效 | ✅ | ✅ | 仅 transform+opacity，prefers-reduced-motion 尊重 |
| 无障碍 WCAG AA | ✅ | ✅ | 4.5:1 对比度，focus-visible，aria-label |
| 交互状态 | ✅ | ✅ | hover/focus/disabled 遵循组件模式 |

### CodeMirror 主题同步

```typescript
const { resolvedTheme } = useTheme()
const cmTheme = resolvedTheme === 'dark' ? editorDarkTheme : editorLightTheme
```

editorDarkTheme / editorLightTheme 从 OKLCH 语义令牌生成。

### MDX 预览 prose 样式

自定义 prose 样式（不使用 @tailwindcss/typography 默认值）：
- 标题：font-heading + text-foreground
- 正文：font-sans + text-foreground
- 代码块：font-code + bg-muted
- 链接：text-primary + hover:text-primary/80

### i18n 新增翻译键

```json
{
  "editor": {
    "save": "提交更改",
    "preview": "预览",
    "insertComponent": "插入组件",
    "uploadImage": "上传图片",
    "uploadPdf": "上传 PDF",
    "switchLang": "切换语言",
    "unsavedChanges": "有未保存的更改，确定离开？",
    "imageExceedsLimit": "图片大小不能超过 5MB",
    "pdfExceedsLimit": "PDF 大小不能超过 20MB",
    "submitPr": "提交 PR",
    "prCreated": "PR 已创建",
    "editContent": "编辑内容"
  }
}
```

---

## 11. 技术选型

| 技术 | 用途 | 选择原因 |
|------|------|----------|
| CodeMirror 6 (`@uiw/react-codemirror`) | 编辑器引擎 | 轻量（~200KB），MDX 语法高亮，移动端友好 |
| `@mdx-js/mdx` | MDX 编译 | 构建时预编译 + 编辑器实时预览 |
| `next-mdx-remote` 或 `@mdx-js/mdx` run() | MDX 渲染 | Next.js 生态标准，支持自定义组件注入 |
| `remark-gfm` | GFM 支持 | 表格、删除线、任务列表 |
| Cloudflare R2 | 文件存储 | 现有基础设施，临时桶 + 正式桶 |

---

## 12. 决策记录

| # | 决策 | 选择 | 备选 | 理由 |
|---|------|------|------|------|
| 1 | 编辑体验 | Split-pane | WYSIWYG / Block | 用户是开发者，MDX 需要 JSX 语法支持 |
| 2 | 内容模型 | 独立 .mdx 文件 | YAML 内联 | 避免缩进地狱，Git diff 友好，与 PRD README.mdx 规划一致 |
| 3 | 文件组织 | 子目录（tracks/, stages/） | 扁平命名 | 目录整洁，glob 方便，支持扩展 |
| 4 | 双语 | 文件名后缀（.zh.mdx） | 语言子目录 / 单文件分区 | 与 _zh 习惯一致，不增加层级 |
| 5 | 图片存储 | R2 临时 → Git 持久 → CI 正式 R2 | R2 永久 / 纯 Git | Git-native 架构一致，无孤儿文件 |
| 6 | 编辑器引擎 | CodeMirror 6 | Monaco | 轻量，移动端友好，无需 IDE 级体验 |
| 7 | 架构 | SDK + 场景页面 | 统一组件 / 独立编辑器 | 关注点分离，可测试，与 packages/ui 一致 |
| 8 | 表单关系 | 分离 | 新增步骤 | 向导不宜更长，编辑需要大屏空间 |
| 9 | 组件策略 | 复用现有 UI | 独立实现 | 设计一致性，减少维护 |
| 10 | 模板 | 独立存储 config/templates/ | 硬编码 | 管理员可编辑 |
| 11 | API 命名 | /api/r2/* | /api/presign + /api/upload | 统一命名空间 |
| 12 | 数据抽象 | DataProvider 接口 | 现状（两套独立路径） | 为迁移做准备，统一调用方式 |
