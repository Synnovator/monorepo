# 访客验收规范 — visitor.spec.md

> **角色**: Visitor（浏览者/潜在参赛者）
> **核心需求**: 浏览活动、查看项目展示、了解参与方式

---

## US-V-001: 浏览活动列表 [P0]

> **前置条件**: 无（无需登录）
> **涉及层**: hackathons/ YAML → Astro 构建 → Site 首页

### SC-V-001.1: 无需登录即可浏览

- **Given** 用户未登录 GitHub
- **When** 用户访问站点首页（`/`）
- **Then** 页面正常展示活动列表，无任何登录拦截
- **And** 活动卡片展示所有公开信息（名称、tagline、状态、时间）

### SC-V-001.2: 空状态处理

- **Given** hackathons/ 目录下没有任何活动数据
- **When** 用户访问站点首页
- **Then** 页面展示友好的空状态提示："暂无活动，敬请期待"
- **And** 如果站点有「组织者指南」，展示 "想举办活动？查看组织者指南" 链接

---

## US-V-002: 查看活动详情 [P0]

> **前置条件**: 无
> **涉及层**: hackathons/{slug}/hackathon.yml → Site 详情页

### SC-V-002.1: 完整信息展示（无操作按钮）

- **Given** 访客访问 `/hackathons/{slug}`
- **When** 页面加载完成
- **Then** 页面展示活动的所有公开信息（同 SC-H-003.1）
- **And** 报名/提交等操作按钮仍可见，但点击后跳转到 GitHub（需要登录）

### SC-V-002.2: 活动不存在处理

- **Given** 用户访问 `/hackathons/{不存在的slug}`
- **When** 页面加载
- **Then** 返回 404 页面
- **And** 页面提供「返回活动列表」链接

---

## US-V-003: 查看参赛者 Profile [P0]

> **前置条件**: 无
> **涉及层**: profiles/ YAML → Site Profile 页

### SC-V-003.1: 公开 Profile 页面

- **Given** profiles/ 目录下存在某用户的 YAML 文件
- **When** 访客访问 `/hackers/{id}`
- **Then** 页面展示该用户的公开信息：头像、姓名、简介、技能、项目经历
- **And** 页面不包含编辑操作链接（仅本人可编辑）

### SC-V-003.2: Profile 不存在处理

- **Given** 访客访问 `/hackers/{不存在的id}`
- **When** 页面加载
- **Then** 返回 404 页面
- **And** 页面提供「浏览参赛者」或「创建 Profile」链接

---

## US-V-004: 查看项目展示 [P0]

> **前置条件**: 活动有已提交的项目
> **涉及层**: submissions/ YAML → Site 项目列表/详情

### SC-V-004.1: 项目列表展示

- **Given** 某活动的 `submissions/` 目录下有已合并的项目
- **When** 访客在活动详情页查看「项目展示」区域
- **Then** 页面列出所有已提交的项目
- **And** 每个项目显示：项目名称、团队成员、Track、tagline
- **And** 项目卡片可点击查看详情

### SC-V-004.2: 项目详情展示

- **Given** 访客点击某项目卡片
- **When** 项目详情加载
- **Then** 页面展示：
  - 项目名称和描述（description/description_zh）
  - 团队成员列表（链接到各自 Profile 页）
  - 技术栈标签（tech_stack）
  - 提交物链接（repo、demo、video、slides）
  - 代码参考声明（references）

---

## US-V-005: 参与公众投票 [P1]

> **前置条件**: 活动配置 `settings.public_vote = "reactions"`
> **涉及层**: GitHub PR Reactions → Actions 统计

### SC-V-005.1: 投票引导

- **Given** 活动配置 `public_vote = "reactions"` 且 `vote_emoji = "👍"`
- **And** 活动处于 `judging` 或 `announcement` 阶段
- **When** 用户查看项目展示
- **Then** 每个项目旁显示投票引导："在 GitHub PR 上点击 👍 为此项目投票"
- **And** 提供跳转到项目提交 PR 的链接

### SC-V-005.2: 投票统计展示

- **Given** 项目 PR 上已有 Reactions 数据
- **When** Actions 定期统计 Reactions 计数
- **Then** 项目展示页显示当前票数
- **And** 如果 `judging.mode = "expert_plus_vote"`，说明投票占总分的 `vote_weight`%

---

## US-V-006: 查看操作指南 [P0]

> **前置条件**: 无
> **涉及层**: Site 指南页面

### SC-V-006.1: 指南入口可发现

- **Given** 用户访问站点任意页面
- **When** 查看导航栏/页脚
- **Then** 可见「指南」或「帮助」入口
- **And** 链接到指南索引页

### SC-V-006.2: 参赛者指南页面内容完整

- **Given** 用户访问 `/guides/hacker`
- **When** 页面加载完成
- **Then** 页面包含以下章节且每章节有 GitHubRedirect 操作链接：
  - "创建 Profile" → 链接到 PR 创建页
  - "浏览活动" → 链接到活动列表
  - "报名参加" → 链接到 Issue 提交页（说明性，非特定活动）
  - "提交项目" → 链接到 PR 创建页（说明性）
  - "组队找人" → 链接到 Issue 提交页
- **And** 每个章节包含操作步骤、截图/示意图（可选）、注意事项

### SC-V-006.3: 组织者指南和评委指南可访问

- **Given** 用户访问 `/guides/organizer` 或 `/guides/judge`
- **When** 页面加载完成
- **Then** 组织者指南包含：创建活动、配置 Track、管理评审、处理申诉的完整流程
- **And** 评委指南包含：查看项目、提交评分、利益冲突声明的完整流程
- **And** 每个指南的操作步骤都有对应的 GitHubRedirect 链接
