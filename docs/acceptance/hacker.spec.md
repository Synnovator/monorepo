# 参赛者验收规范 — hacker.spec.md

> **角色**: Hacker（AI 开发者/工程师）
> **核心需求**: 注册 Profile、发现活动、组队、提交项目、展示作品

---

## US-H-001: 创建个人 Profile [P0]

> **前置条件**: 拥有 GitHub 账号且未创建 Synnovator Profile
> **涉及层**: Site 页面 → GitHubRedirect → GitHub PR → Actions 校验 → profiles/ 目录

### SC-H-001.1: 从站点发起 Profile 创建

- **Given** 用户访问站点首页或「参赛者指南」页面（`/guides/hacker`）
- **And** 用户已登录 GitHub
- **When** 用户点击「创建 Profile」按钮
- **Then** GitHubRedirect 组件生成预填 PR URL，参数包含：
  - repo: `{org}/monorepo`
  - path: `profiles/{username}.yml`
  - branch: `profile/{username}`
  - 模板内容：Profile YAML 骨架（含必填字段注释和示例值）
- **And** 浏览器跳转到 GitHub 新文件创建页
- **And** 按钮下方有步骤说明："1. 点击创建 → 2. 编辑 YAML → 3. 提交 PR → 4. 等待自动合并"

### SC-H-001.2: Profile YAML 格式校验通过

- **Given** 用户提交了包含 `profiles/{username}.yml` 的 PR
- **And** YAML 内容符合 Profile Schema V2（包含必填字段：`synnovator_profile`, `hacker.github`, `hacker.name`）
- **When** GitHub Actions `validate-profile` workflow 被触发
- **Then** 校验通过 → PR 获得 `profile-valid` Label
- **And** Bot 评论 "✅ Profile 校验通过，等待合并"
- **And** Actions 自动为文件名追加 UUID（`{username}-{uuid}.yml`）

### SC-H-001.3: Profile YAML 格式校验失败

- **Given** 用户提交的 Profile PR 中 YAML 缺少必填字段或格式错误
- **When** GitHub Actions `validate-profile` workflow 被触发
- **Then** 校验失败 → PR 获得 `needs-fix` Label
- **And** Bot 评论具体错误信息，如 "❌ 缺少必填字段: hacker.github"
- **And** 用户修复后重新 push，workflow 自动重新校验

### SC-H-001.4: Profile 合并后页面可见

- **Given** Profile PR 已通过校验且被合并到 main
- **When** GitHub Pages 重新部署完成
- **Then** `/hackers/{id}` 页面可访问（id 为 `{username}-{uuid}`）
- **And** 页面展示 Profile 中所有公开字段：name、avatar、bio、skills、experience、links
- **And** 页面内嵌「编辑 Profile」引导链接（指向 GitHub 文件编辑 URL）

---

## US-H-002: 浏览活动列表 [P0]

> **前置条件**: 站点已部署且 hackathons/ 下有至少 1 个活动
> **涉及层**: hackathons/ YAML 数据 → Astro 构建 → Site 首页

### SC-H-002.1: 首页活动卡片列表

- **Given** hackathons/ 目录下存在多个已合并的 hackathon.yml
- **When** 用户访问站点首页（`/`）
- **Then** 页面展示活动卡片列表
- **And** 每个卡片显示：活动名称（name_zh/name）、tagline、当前阶段、注册截止时间
- **And** 卡片点击可跳转到 `/hackathons/{slug}`

### SC-H-002.2: 活动状态筛选

- **Given** 活动列表包含不同阶段的活动（registration、development、judging 等）
- **When** 用户使用状态筛选器
- **Then** 列表按选中的阶段过滤显示
- **And** 默认展示所有活跃活动（非 award 已结束的活动）

### SC-H-002.3: 活动类型标识

- **Given** 活动有不同类型（community / enterprise / youth-league）
- **When** 活动列表渲染
- **Then** 每个卡片显示类型标签（如「社区」「企业悬赏」「高校竞赛」）

---

## US-H-003: 查看活动详情 [P0]

> **前置条件**: 活动已合并到 main
> **涉及层**: hackathons/{slug}/hackathon.yml → Astro 动态路由 → Site 详情页

### SC-H-003.1: 活动详情页完整信息展示

- **Given** 用户访问 `/hackathons/{slug}`
- **When** 页面加载完成
- **Then** 页面展示以下区域：
  - 活动基础信息（名称、tagline、类型、描述）
  - 主办方与赞助方列表（含 logo）
  - 时间线可视化（7 阶段，当前阶段高亮）
  - Track 列表（奖项、评审标准、提交物要求）
  - 评委列表
  - 事件日历（AMA/Workshop 等）
  - FAQ 折叠面板
  - 参赛资格说明（eligibility）

### SC-H-003.2: 报名引导（registration 阶段）

- **Given** 活动处于 `registration` 阶段
- **When** 用户查看活动详情页
- **Then** 页面显示「立即报名」按钮（GitHubRedirect → Issue）
- **And** 按钮下方有简要步骤说明："1. 点击报名 → 2. 确认 Issue 内容 → 3. 提交 → 4. 等待审核"
- **And** 如果活动需要 NDA，报名按钮旁标注 "⚠️ 需签署 NDA"

### SC-H-003.3: 阶段相关操作提示

- **Given** 活动处于 `development` 阶段
- **When** 用户查看活动详情页
- **Then** 页面显示"开发中"状态，展示提交截止倒计时
- **And** 显示「提交项目」按钮（但标注"提交窗口尚未开启，请在 {submission.start} 后提交"）

---

## US-H-004: 报名参加活动 [P0]

> **前置条件**: 用户已创建 Profile，活动处于 registration 阶段
> **涉及层**: Site 表单 → Issue [Register] → validate-register.yml 校验 → `registered` Label → sync-issue-data.yml → PR → profile YAML

### SC-H-004.1: 提交报名 Issue

- **Given** 用户已有 Profile（profiles/ 目录下存在其 YAML 文件）
- **And** 活动处于 `registration` 阶段
- **When** 用户在详情页填写报名表单（RegisterForm）并提交
- **Then** RegisterForm 通过 GitHub API 创建 Issue：
  - title: `[Register] {username} — {hackathon-slug}`
  - labels: `register`, `hackathon:{slug}`
  - body: 包含用户 GitHub 用户名、活动 slug、赛道等报名信息
- **And** 页面显示提交成功提示及 Issue 链接

### SC-H-004.2: 报名校验 — Profile 存在

- **Given** 用户提交了报名 Issue
- **When** `validate-register.yml` workflow 被触发
- **Then** Actions 检查 `profiles/` 目录下是否存在该用户的 YAML 文件
- **And** 如果不存在 → Bot 评论提示先创建 Profile + 提供 Profile 创建链接
- **And** Issue 获得 `blocked:no-profile` Label

### SC-H-004.3: 报名校验 — eligibility 检查

- **Given** 用户提交了报名 Issue 且 Profile 存在
- **And** 活动的 `eligibility.open_to = "students"`
- **When** `validate-register.yml` 检查用户 Profile 的 `identity.type`
- **Then** 如果 `identity.type = "student"` → 校验通过，Issue 获得 `registered` Label
- **Or** 如果 `identity.type != "student"` → Bot 评论提示本活动仅限学生参加

### SC-H-004.4: 报名成功 — 数据持久化

- **Given** 报名 Issue 通过所有校验并获得 `registered` Label
- **When** `sync-issue-data.yml` 被 Label 事件触发
- **Then** Actions 解析 Issue body 中的报名数据
- **And** 创建 PR 将报名记录写入用户的 profile YAML（`registrations` 数组）
- **And** Bot 在 Issue 评论报名成功确认及 PR 链接
- **And** 如果活动需要 NDA → Bot 追加提示在开发前完成 NDA 签署

---

## US-H-005: 提交项目 [P0]

> **前置条件**: 用户已报名，活动处于 submission 阶段
> **涉及层**: Site → GitHubRedirect → PR submissions/ → Actions 校验

### SC-H-005.1: 从站点发起项目提交

- **Given** 活动处于 `submission` 阶段
- **And** 用户已报名（Issue 有 `registered` Label）
- **When** 用户在详情页点击「提交项目」
- **Then** GitHubRedirect 生成预填 PR URL：
  - path: `hackathons/{slug}/submissions/{team-name}/project.yml`
  - branch: `submit/{team-name}`
  - 模板内容：project.yml 骨架（含 `synnovator_submission: "2.0"` 及所有字段注释）
- **And** 页面展示提交物要求清单（来自 hackathon.yml 的 deliverables）

### SC-H-005.2: project.yml 校验通过

- **Given** 用户提交了包含 `project.yml` 的 PR
- **And** YAML 符合 Submission Schema V2
- **And** `project.track` 对应 hackathon.yml 中存在的 track slug
- **And** `deliverables` 的所有 `required` 项均已填写
- **When** GitHub Actions `validate-submission` workflow 被触发
- **Then** 校验通过 → PR 获得 `submission-valid` Label
- **And** Bot 评论 "✅ 项目提交校验通过"

### SC-H-005.3: project.yml 校验失败

- **Given** 用户提交的 project.yml 缺少必填字段或 track slug 不匹配
- **When** GitHub Actions `validate-submission` workflow 被触发
- **Then** 校验失败 → PR 获得 `needs-fix` Label
- **And** Bot 评论具体错误列表，如：
  - "❌ 缺少必填 deliverable: repo"
  - "❌ track 'unknown-track' 不在活动 Track 列表中"

### SC-H-005.4: 提交窗口外拒绝

- **Given** 活动不处于 `submission` 阶段（如仍在 development 或已进入 judging）
- **When** 用户提交项目 PR
- **Then** Actions 校验提交时间
- **And** Bot 评论 "❌ 提交窗口未开启或已关闭（提交期：{submission.start} — {submission.end}）"
- **And** PR 获得 `submission:out-of-window` Label

---

## US-H-006: 查看个人 Profile 页面 [P0]

> **前置条件**: Profile 已合并
> **涉及层**: profiles/ YAML → Astro 动态路由 → Site Profile 页

### SC-H-006.1: Profile 页面内容展示

- **Given** 用户的 Profile YAML 已合并到 main
- **When** 访问 `/hackers/{id}`
- **Then** 页面展示以下信息：
  - 头像（GitHub avatar）、姓名（name/name_zh）、简介（bio/bio_zh）
  - 技能标签（skills 分类展示）
  - 兴趣领域（interests）
  - 团队偏好（looking_for: roles, team_size, collaboration_style）
  - 项目经历（experience.projects）
  - 参赛记录（experience.hackathons）
  - 社交链接（links）

### SC-H-006.2: Profile 页面操作引导

- **Given** 用户查看自己的 Profile 页面
- **When** 页面加载完成
- **Then** 页面内嵌以下操作链接：
  - 「编辑 Profile」→ GitHub 文件编辑 URL
  - 「浏览活动」→ 首页活动列表
  - 「查看我的报名」→ GitHub Issues 筛选页（label:registered + author:{username}）

---

## US-H-007: 签署 NDA [P0]

> **前置条件**: 活动需要 NDA（`legal.nda.required = true`），用户已报名
> **涉及层**: Site 表单 → Issue [NDA] → validate-nda.yml 校验 → `nda-approved` Label → sync-issue-data.yml → PR → profile YAML

### SC-H-007.1: NDA 签署引导

- **Given** 用户已报名的活动要求 NDA 签署
- **When** 用户在活动详情页查看 NDA 信息
- **Then** 页面展示：
  - NDA 文档下载链接（R2 PDF）
  - NDA 摘要文本（`legal.nda.summary`）
  - NDA 签署表单（NDASignForm）
- **And** 页面内嵌步骤说明："1. 下载并阅读 NDA → 2. 勾选确认 → 3. 提交 → 4. 等待审核"

### SC-H-007.2: NDA 签署确认

- **Given** 用户通过 NDASignForm 提交了 NDA 签署 Issue
- **And** Issue 中包含 NDA 确认声明
- **When** `validate-nda.yml` workflow 被触发
- **Then** Actions 校验 Issue 格式和用户报名状态
- **And** 校验通过后 Issue 获得 `nda-approved` Label

### SC-H-007.3: NDA 签署数据持久化

- **Given** NDA Issue 获得 `nda-approved` Label
- **When** `sync-issue-data.yml` 被 Label 事件触发
- **Then** Actions 解析 Issue body 中的 NDA 签署数据
- **And** 创建 PR 将 NDA 签署记录写入用户的 profile YAML（`nda_signed` 数组）
- **And** Bot 在 Issue 评论 NDA 签署确认及 PR 链接

### SC-H-007.4: NDA 签署后获取数据集

- **Given** NDA 签署已通过（`nda-approved` Label）
- **And** 活动有 `access_control = "nda-required"` 的数据集
- **When** 用户在活动详情页点击「获取数据集」
- **Then** 前端调用 Pages Functions `/api/presign`（携带 OAuth token）
- **And** Functions 验证用户身份 + NDA 签署状态 → 返回 R2 presigned URL
- **And** 用户可下载数据集（有效期 4 小时，详见 US-P-013）

---

## US-H-008: 组队/找队友 [P1]

> **前置条件**: 用户已创建 Profile 且有 `looking_for` 字段
> **涉及层**: Site → Issue Template `team-formation.yml`

### SC-H-008.1: 提交组队请求

- **Given** 用户希望找队友
- **When** 用户在活动详情页点击「找队友」按钮
- **Then** GitHubRedirect 生成预填 Issue URL：
  - template: `team-formation.yml`
  - title: `[Team] {username} 寻找队友 — {hackathon-slug}`
  - labels: `team-formation`, `hackathon:{slug}`
- **And** Issue 作为公开的队友招募帖子存在，其他参赛者可通过 Issue 评论联系

---

## US-H-009: 提交申诉 [P1]

> **前置条件**: 活动处于 announcement 阶段（公示期）
> **涉及层**: Site → Issue Template `appeal.yml` → Label 路由

### SC-H-009.1: 从站点提交申诉

- **Given** 活动处于 `announcement` 阶段
- **When** 用户在活动详情页点击「提交申诉」按钮
- **Then** GitHubRedirect 生成预填 Issue URL：
  - template: `appeal.yml`
  - title: `[Appeal] {team-name} — {hackathon-slug}/{track}`
  - labels: `appeal`, `hackathon:{slug}`
- **And** Issue body 预填申诉模板（申诉原因、相关证据、期望结果）

### SC-H-009.2: 申诉状态跟踪

- **Given** 用户已提交申诉 Issue
- **When** 组织者处理并添加 `appeal:accepted` 或 `appeal:rejected` Label
- **Then** 用户通过 GitHub 通知获知处理结果
- **And** Issue 中有组织者的回应 Comment

---

## US-H-010: 双轨道提交 [P1]

> **前置条件**: hackathon.yml 中 `settings.allow_multi_track = true`
> **涉及层**: Site → PR submissions/ → Actions 校验

### SC-H-010.1: 双轨道提交说明展示

- **Given** 活动配置 `allow_multi_track = true` 且 `multi_track_rule = "independent"`
- **When** 用户查看活动详情页的提交说明
- **Then** 页面展示双轨道提交说明："本活动允许同一团队报名多个赛道，每个赛道需独立提交项目"

### SC-H-010.2: 独立双轨道提交

- **Given** `multi_track_rule = "independent"`
- **When** 用户为同一团队提交两个赛道的项目
- **Then** 需要分别创建两个 PR：
  - `submissions/{team-name}-{track1-slug}/project.yml`
  - `submissions/{team-name}-{track2-slug}/project.yml`
- **And** 每个 PR 独立校验，对应各自 Track 的 deliverables 要求

### SC-H-010.3: 共享双轨道提交

- **Given** `multi_track_rule = "shared"`
- **When** 用户提交双轨道项目
- **Then** 只需创建一个 PR：`submissions/{team-name}/project.yml`
- **And** project.yml 中 `track` 字段为数组：`["track1-slug", "track2-slug"]`
- **And** Actions 校验该项目同时满足两个 Track 的必须 deliverables
