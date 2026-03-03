# 组织者验收规范 — organizer.spec.md

> **角色**: Organizer（企业/社区/生态方）
> **核心需求**: 快速创建活动、管理 Track、查看提交、配置评审和合规规则

---

## US-O-001: 创建 Hackathon 活动 [P0]

> **前置条件**: 拥有 GitHub 账号，了解 YAML 基本语法
> **涉及层**: Site 指南页 → GitHub PR → Actions 校验 → hackathons/ 目录 → Site 页面渲染

### SC-O-001.1: 从站点发起活动创建

- **Given** 组织者访问站点的「组织者指南」页面（`/guides/organizer`）
- **When** 组织者点击「创建活动」按钮
- **Then** 页面展示活动类型选择（community / enterprise / youth-league）
- **And** 选择类型后，GitHubRedirect 组件生成预填 PR URL，指向对应 Template Repo 的 `hackathon.yml` 骨架
- **And** 页面内嵌操作步骤说明："1. 选择活动类型 → 2. Fork 模板仓库 → 3. 编辑 hackathon.yml → 4. 提交 PR"

### SC-O-001.2: hackathon.yml 基础字段校验通过

- **Given** 组织者提交了包含 `hackathons/{slug}/hackathon.yml` 的 PR
- **And** YAML 包含所有必填字段：`synnovator_version`, `hackathon.name`, `hackathon.slug`, `hackathon.type`, `hackathon.timeline`
- **When** GitHub Actions `validate-hackathon` workflow 被触发
- **Then** 校验通过 → PR 获得 `hackathon-valid` Label
- **And** Bot 评论 "✅ hackathon.yml 校验通过，等待 Maintainer 审核"

### SC-O-001.3: hackathon.yml 校验失败

- **Given** 组织者提交的 hackathon.yml 缺少必填字段（如 `timeline`）或格式错误
- **When** GitHub Actions `validate-hackathon` workflow 被触发
- **Then** 校验失败 → PR 获得 `needs-fix` Label
- **And** Bot 评论具体错误信息，如 "❌ 缺少必填字段: hackathon.timeline"
- **And** 组织者修复后重新 push，workflow 自动重新触发校验

### SC-O-001.4: 活动合并后页面可见

- **Given** hackathon PR 已通过校验且被 Maintainer 合并到 main
- **When** GitHub Pages 自动重新部署完成
- **Then** 首页活动列表中出现该活动卡片，展示 name、tagline、状态、时间
- **And** `/hackathons/{slug}` 详情页可访问，展示完整活动信息
- **And** 详情页包含「编辑活动」引导链接（指向 GitHub 文件编辑 URL）

---

## US-O-002: 配置 Track 与奖项 [P0]

> **前置条件**: hackathon.yml 已创建
> **涉及层**: hackathon.yml `tracks` 字段 → Actions 校验 → Site 详情页渲染

### SC-O-002.1: 多 Track 配置与渲染

- **Given** hackathon.yml 的 `tracks` 数组包含 2 个以上 Track 定义
- **And** 每个 Track 包含 `name`, `name_zh`, `slug`, `description`, `rewards`, `judging`, `deliverables`
- **When** 活动详情页加载
- **Then** 页面按 Track 分区展示：Track 名称、描述、奖项列表、评审标准、提交物要求
- **And** 每个 Track 区域包含「查看详情」或锚点定位

### SC-O-002.2: 多类型奖励结构渲染

- **Given** 某 Track 的 `rewards` 包含多种类型：`cash`, `internship`, `certificate`, `job`, `other`
- **When** 活动详情页加载该 Track 区域
- **Then** 页面分类展示所有奖项：
  - cash 类型显示金额和名次
  - internship/job 类型显示描述和名额
  - certificate/other 类型显示描述

### SC-O-002.3: deliverables 提交物要求展示

- **Given** 某 Track 的 `deliverables` 包含 `required` 和 `optional` 列表
- **When** 活动详情页加载该 Track 区域
- **Then** 页面区分展示必须提交物（标注 ✱ 必须）和可选提交物
- **And** 每个提交物显示 `type`, `format`, `description`

---

## US-O-003: 管理活动时间线（7 阶段）[P0]

> **前置条件**: hackathon.yml 包含完整 `timeline` 配置
> **涉及层**: hackathon.yml `timeline` → Actions `status-update` → Site 详情页 → Label 管理

### SC-O-003.1: 7 阶段时间线页面展示

- **Given** hackathon.yml 定义了 7 个阶段：draft, registration, development, submission, judging, announcement, award
- **And** 每个阶段包含 `start` 和 `end` 时间戳
- **When** 活动详情页加载
- **Then** 页面展示时间线可视化组件，标注每个阶段的起止时间
- **And** 当前阶段高亮显示
- **And** 页面内嵌当前阶段可执行的操作提示（如 registration 阶段显示「立即报名」）

### SC-O-003.2: 阶段自动切换

- **Given** 当前时间超过某阶段的 `end` 时间
- **When** GitHub Actions `status-update` workflow 定时触发（cron）
- **Then** 活动 Label 自动从当前阶段更新为下一阶段（如 `stage:registration` → `stage:development`）
- **And** 站点重新构建后，详情页显示更新后的当前阶段

### SC-O-003.3: 阶段感知的操作控制

- **Given** 活动处于 `submission` 阶段
- **When** 参赛者访问活动详情页
- **Then** 页面显示「提交项目」按钮（GitHubRedirect → PR）
- **And** 报名按钮变为禁用状态，显示"报名已截止"
- **Given** 活动处于 `judging` 阶段
- **When** 评委访问活动详情页
- **Then** 页面显示「开始评分」按钮（GitHubRedirect → Issue）

---

## US-O-004: 配置评委与评分规则 [P0]

> **前置条件**: hackathon.yml 包含 `judges` 和 `tracks[].judging` 配置
> **涉及层**: hackathon.yml → Site 详情页 → ScoreCard 组件

### SC-O-004.1: 评委列表展示

- **Given** hackathon.yml 的 `judges` 数组包含评委信息（github, name, name_zh, title, affiliation, expertise）
- **When** 活动详情页加载
- **Then** 页面展示评委列表：头像（GitHub avatar）、姓名、头衔、所属机构、专长领域

### SC-O-004.2: 评审规则展示

- **Given** 某 Track 的 `judging` 配置包含 `mode`, `criteria` 数组
- **And** 每个 criterion 有 `name`, `name_zh`, `weight`, `score_range`, `hard_constraint`
- **When** 活动详情页加载该 Track 区域
- **Then** 页面展示评审模式（专家评审 / 专家+投票）
- **And** 展示各评审维度及其权重（百分比）
- **And** hard_constraint=true 的维度标注 "⚠️ 硬约束"

---

## US-O-005: 发布活动事件（AMA/Workshop）[P0]

> **前置条件**: hackathon.yml 包含 `events` 配置
> **涉及层**: hackathon.yml `events` → Site 详情页

### SC-O-005.1: 事件列表渲染

- **Given** hackathon.yml 的 `events` 数组包含多个事件
- **And** 每个事件包含 `name`, `name_zh`, `type`, `datetime`, `duration_minutes`
- **When** 活动详情页加载
- **Then** 页面按时间排序展示事件列表
- **And** 每个事件显示：名称、类型标签（AMA/直播/工作坊/线下活动/截止日）、日期时间、时长

### SC-O-005.2: 线上/线下事件区分

- **Given** 事件包含 `url`（线上）或 `location`（线下）
- **When** 页面渲染该事件
- **Then** 线上事件显示会议链接按钮
- **And** 线下事件显示地点信息和容纳人数（`capacity`）

---

## US-O-006: 设置 FAQ [P0]

> **前置条件**: hackathon.yml 包含 `faq` 配置
> **涉及层**: hackathon.yml `faq` → Site 详情页

### SC-O-006.1: FAQ 双语渲染

- **Given** hackathon.yml 的 `faq` 数组包含条目，每条有 `q`, `q_en`, `a`, `a_en`
- **When** 活动详情页加载
- **Then** 页面展示 FAQ 折叠面板（Accordion）
- **And** 中文站展示 `q` / `a`，英文站展示 `q_en` / `a_en`

### SC-O-006.2: FAQ 缺少翻译时的 fallback

- **Given** 某 FAQ 条目只有中文（缺少 `q_en` / `a_en`）
- **When** 英文站加载该 FAQ
- **Then** 显示中文内容作为 fallback（不报错、不留空）

---

## US-O-007: 配置 NDA 签署流程 [P1]

> **前置条件**: hackathon.yml 中 `legal.nda.required = true`
> **涉及层**: hackathon.yml → Site 报名引导 → Issue Template `nda-sign.yml` → Actions

### SC-O-007.1: NDA 要求在页面上展示

- **Given** hackathon.yml 中 `legal.nda.required = true` 且 `legal.nda.document_url` 非空
- **When** 活动详情页加载
- **Then** 报名区域显示 NDA 声明："⚠️ 本活动需签署保密协议（NDA）"
- **And** 提供 NDA 文档下载链接（指向 R2 存储的 PDF）
- **And** 展示 NDA 摘要（`legal.nda.summary`）

### SC-O-007.2: 未签 NDA 不可报名

- **Given** 用户尝试报名一个 `nda.required = true` 的活动
- **And** 用户尚未提交 NDA 签署 Issue（或 Issue 未获得 `nda-approved` Label）
- **When** Actions 处理报名 Issue
- **Then** Actions Bot 评论："❌ 请先签署 NDA 后再报名"
- **And** 报名 Issue 获得 `blocked:nda` Label

---

## US-O-008: 管理 Dataset 资源 [P1]

> **前置条件**: hackathon.yml 包含 `datasets` 配置
> **涉及层**: hackathon.yml `datasets` → Site 详情页 → R2 存储

### SC-O-008.1: Dataset 信息展示

- **Given** hackathon.yml 的 `datasets` 数组包含数据集声明
- **And** 包含 `name`, `description`, `access_control`, `format`, `size`
- **When** 活动详情页加载
- **Then** 页面展示数据集列表：名称、描述、格式、大小
- **And** `access_control = "public"` 的数据集直接显示下载链接
- **And** `access_control = "nda-required"` 的数据集显示 "签署 NDA 后可获取"

### SC-O-008.2: NDA 签署后获取 Dataset 下载链接

- **Given** 用户已签署 NDA（Issue 获得 `nda-approved` Label）
- **And** Dataset 的 `access_control = "nda-required"`
- **When** 用户在活动详情页点击「获取数据集」
- **Then** 前端调用 Pages Functions `/api/presign`（携带 OAuth token）
- **And** Functions 验证用户身份 + NDA 签署状态
- **And** 验证通过 → 返回 R2 presigned URL（有效期 4 小时）
- **And** 用户可下载数据集（详见 US-P-013）

---

## US-O-009: 处理申诉 Appeal [P1]

> **前置条件**: 活动处于 `announcement` 阶段（公示期）
> **涉及层**: Issue Template `appeal.yml` → Label 路由 → 组织者处理

### SC-O-009.1: 申诉 Issue 自动路由

- **Given** 参赛者提交了 Appeal Issue（使用 `appeal.yml` 模板）
- **And** Issue 包含 hackathon slug 和 track 信息
- **When** Actions 处理该 Issue
- **Then** Issue 自动添加 Label：`appeal` + `hackathon:{slug}`
- **And** Issue 自动 assign 给活动的 organizers（基于 CODEOWNERS 或 hackathon.yml 中的 organizers.github）

### SC-O-009.2: 组织者回应申诉

- **Given** 组织者收到 Appeal Issue 通知
- **When** 组织者在 Issue 中回应（Comment）
- **Then** 可以添加 `appeal:accepted` 或 `appeal:rejected` Label
- **And** Bot 通知申诉者处理结果

### SC-O-009.3: 申诉窗口时间限制

- **Given** 活动已离开 `announcement` 阶段（公示期结束）
- **When** 用户尝试提交 Appeal Issue
- **Then** Actions 检测到申诉窗口已关闭
- **And** Bot 评论："❌ 申诉窗口已关闭（公示期：{start} — {end}）"
- **And** Issue 获得 `appeal:expired` Label 并自动关闭

---

## US-O-010: 配置 AI Review [P1]

> **前置条件**: hackathon.yml 中 `settings.ai_review = true`
> **涉及层**: hackathon.yml → Actions `ai-review.yml` → Claude API → PR Comment

### SC-O-010.1: 项目提交后自动触发 AI 评审摘要

- **Given** hackathon.yml 中 `settings.ai_review = true`
- **And** 参赛者提交了项目 PR（包含 `project.yml`）
- **When** PR 通过 `validate-submission` 校验
- **Then** Actions 触发 `ai-review` workflow
- **And** Claude API 分析 project.yml 内容（description, tech_stack, deliverables）
- **And** Bot 在 PR 中评论 AI 生成的评审摘要（项目概述、技术亮点、潜在风险）

### SC-O-010.2: AI Review 未启用时不触发

- **Given** hackathon.yml 中 `settings.ai_review = false`
- **When** 参赛者提交项目 PR
- **Then** 不触发 `ai-review` workflow
- **And** PR 中无 AI 评审摘要 Comment
