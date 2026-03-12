# 创建提案页面设计

**日期**: 2026-03-05
**状态**: Approved

## 背景

NavBar 的 "+创建" 下拉菜单有两个链接：`/create-hackathon`（已实现）和 `/create-proposal`（页面不存在，当前 404）。需要创建"创建提案"页面，让参赛者通过表单提交项目到指定 hackathon。

## 架构

### 文件结构

```
site/src/
├── pages/create-proposal.astro              # SSR 页面（读取 hackathon 数据）
└── components/forms/CreateProposalForm.tsx   # React 分步表单组件
```

### 数据流

```
create-proposal.astro (SSR, prerender=false)
  └─ 读取 hackathons/*/hackathon.yml → 提取 {slug, name, name_zh, tracks[]}
  └─ 传入 CreateProposalForm props: { hackathons, lang }

CreateProposalForm (React client:load)
  └─ Step 0: 选择活动 → 加载该活动的 tracks
  └─ Step 1: 项目信息（name, tagline, track, tech_stack）
  └─ Step 2: 团队成员（github, role，动态增减）
  └─ Step 3: 提交物（repo, video, demo, description）
  └─ Step 4: 预览 YAML + 提交到 GitHub
```

### 提交方式

复用 `buildPRUrl()` 生成 GitHub 新建文件 URL：
- filename: `hackathons/{hackathon-slug}/submissions/{team-slug}/project.yml`
- team-slug: `team-{第一个成员github}-{项目name slug}`

## 表单步骤

### Step 0 — 选择活动

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| hackathon | select | Yes | 从现有活动列表中选择 |

### Step 1 — 项目信息

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | text | Yes | 项目英文名 |
| name_zh | text | No | 项目中文名 |
| tagline | text | Yes | 一句话描述（英文） |
| tagline_zh | text | No | 一句话描述（中文） |
| track | select | Yes | 从所选活动的赛道中选择 |
| tech_stack | tag input | Yes | 技术栈标签（回车添加） |

### Step 2 — 团队成员

动态列表，至少 1 人：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| github | text | Yes | GitHub 用户名 |
| role | text | Yes | 角色（Lead Developer 等） |

### Step 3 — 提交物

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| repo | url | Yes | GitHub 仓库链接 |
| video | url | No | 演示视频链接 |
| demo | url | No | 在线演示链接 |
| description | textarea | No | 项目详细描述（英文） |
| description_zh | textarea | No | 项目详细描述（中文） |

文件上传（PDF、附件）暂不支持，用户可在 PR 中手动添加。

### Step 4 — 预览 & 提交

- 显示生成的 `project.yml` YAML 预览
- 显示目标文件路径
- 登录检查（`useAuth()`）
- "提交到 GitHub" 按钮

## i18n

在 `en.yml` 和 `zh.yml` 中新增 `create_proposal:` 命名空间，模式与 `create_hackathon:` 一致。

## 生成的 YAML 格式

遵循 PRD §6.3 Project Submission Schema：

```yaml
synnovator_submission: "2.0"

project:
  name: "..."
  name_zh: "..."
  tagline: "..."
  tagline_zh: "..."
  track: "..."
  team:
    - github: "..."
      role: "..."
  deliverables:
    repo: "..."
    video: "..."
    demo: "..."
  tech_stack: [...]
  description: |
    ...
  description_zh: |
    ...
```

## 复用组件

- `buildPRUrl()` / `openGitHubUrl()` — GitHub URL 生成
- `formatYaml()` — YAML 序列化
- `validateRequired()` — 必填校验
- `useAuth()` — 登录状态检查
- Neon Forge 设计系统样式（与 CreateHackathonForm 一致）
