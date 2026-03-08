# Hackers User Flow — 活动参与者操作手册

> 本文档描述 Hacker（参赛者）和 Judge（评委）的完整操作列表、数据流、UI 组件、Issue/PR 模板、Actions Workflow 及实现状态。

## 角色定义

| 角色 | GitHub 权限 | 职责 |
|------|------------|------|
| **Hacker** | Read (public) | 参赛者/开发者，提交项目 |
| **Judge** | Read (public) | 评委，提交评分 |
| **Visitor** | None (匿名) | 浏览者，只读 |

---

## Hacker 操作总览

| # | 操作 | 触发方式 | 数据层 | 实现状态 |
|---|------|---------|--------|---------|
| H1 | 创建 Profile | 表单 → PR | Layer 1 (PR) | ✅ 已实现 |
| H2 | 编辑 Profile | — | Layer 1 (PR) | ❌ 缺失 |
| H3 | 浏览活动列表 | 只读 | — | ✅ 已实现 |
| H4 | 查看活动详情 | 只读 | — | ✅ 已实现 |
| H5 | 注册报名 | 表单 → PR | **应改为 Issue → Action → PR** | ⚠️ 需重构 |
| H6 | 签署 NDA | 表单 → PR | **应改为 Issue → Action → PR** | ⚠️ 需重构 |
| H7 | 提交项目/提案 | 表单 → PR | Layer 1 (PR) | ✅ 已实现 |
| H8 | 编辑已提交项目 | — | Layer 1 (PR) | ❌ 缺失 |
| H9 | 发起组队/找队友 | 表单 → Issue | Layer 2 (Issue) | ✅ 已实现 |
| H10 | 申请加入队伍 | — | Layer 2 (Issue comment) | ❌ 缺失 |
| H11 | 提交申诉 | 表单 → Issue | Layer 2 (Issue) | ✅ 已实现 |
| H12 | 点赞项目 | — | Layer 3 (D1) | ❌ 缺失 |
| H13 | 公投 (Reactions) | — | Layer 3 (D1/GitHub Reactions) | ❌ 缺失 |
| H14 | 下载数据集 | API presign | Layer 3 (Functions + R2) | ⚠️ 部分实现 |
| H15 | 查看排行榜 | 只读 | — | ✅ 已实现 |

## Judge 操作总览

| # | 操作 | 触发方式 | 数据层 | 实现状态 |
|---|------|---------|--------|---------|
| J1 | 查看待评项目 | 只读 | — | ✅ 已实现 |
| J2 | 提交评分 | 表单 → Issue | Layer 2 (Issue) → Action 聚合 → PR | ✅ 已实现 |
| J3 | 利益冲突声明 | checkbox in Score Issue | Layer 2 (Issue) | ✅ 已实现 |
| J4 | 查看评分结果 | 只读 | — | ✅ 已实现 |

## Visitor 操作总览

| # | 操作 | 触发方式 | 数据层 | 实现状态 |
|---|------|---------|--------|---------|
| V1 | 浏览活动/项目/Profile | 只读 | — | ✅ 已实现 |
| V2 | 查看指南 | 只读 | — | ✅ 已实现 |
| V3 | 公投点赞 | — | Layer 3 (D1) | ❌ 缺失 |

---

## 详细操作流程

### H1: 创建 Profile ✅

```
Hacker 访问 /create-profile (需 GitHub 登录)
  → 填写 5 步表单 (ProfileCreateForm)
  → Step 0: 基本信息 (name, bio, location, languages)
  → Step 1: 身份 (student/professional/academic, affiliation)
  → Step 2: 技能 (skills: category + items)
  → Step 3: 更多 (interests, looking_for, social links)
  → Step 4: YAML 预览 & 提交
  → buildPRUrl() → 打开 GitHub 创建 PR
  → PR 文件: profiles/{username}-{uuid}.yml
  → Actions: validate-profile.yml 校验
  → Auto-merge (schema 通过即可)
```

**UI 组件**: `apps/web/components/forms/ProfileCreateForm.tsx`
**数据提交**: `buildPRUrl()` → GitHub PR
**分支**: `data/profile-{username}`
**Actions**: `validate-profile.yml`
**Schema**: `packages/shared/src/schemas/profile.ts`

### H2: 编辑 Profile ❌

**当前状态**: 无编辑入口。

**期望流程**:
```
方案 A (简单): Hacker 访问 /hackers/{id} → "Edit" 按钮
  → 跳转到 GitHub Web 编辑器:
    github.com/{org}/{repo}/edit/main/profiles/{username}-{uuid}.yml
  → 用户编辑 YAML → 提交 PR → validate-profile.yml → Auto-merge

方案 B (完整): Hacker 访问 /create-profile?edit=true
  → 表单预填现有数据
  → 修改后生成新 YAML → buildPRUrl() → PR 覆盖旧文件
```

### H3–H4: 浏览与查看 ✅

```
访问 / (首页) → HackathonFilter 筛选 (all/active/upcoming/ended + 搜索)
  → 点击 HackathonCard → /hackathons/{slug}
  → HackathonTabs: 详情 / 提交项目 / 排行榜
  → 阶段相关 UI:
    registration → 显示 "Register" 按钮
    development → 显示 "注册已关闭"
    submission → 显示 "Submit Project" 按钮
    judging → 显示 Judge 面板 (仅评委)
    announcement → 显示结果 + "Appeal" 按钮
```

**UI 组件**: `HackathonFilter.tsx`, `HackathonCard.tsx`, `HackathonTabs.tsx`
**页面**: `apps/web/app/(public)/hackathons/[slug]/page.tsx`

### H5: 注册报名 ⚠️ 需重构

**当前实现** (PR 方式):
```
Hacker 在活动详情页 → RegisterForm
  → 选择 track, role, team
  → 勾选 terms + profile 确认
  → 调用 /api/check-profile 验证 profile 存在
  → 检查是否已注册 (查 profile YAML 中 registrations[])
  → buildPRUrl() → PR 修改 profiles/{username}-{uuid}.yml
    追加: registrations[]: [{hackathon, track, role, team, registered_at}]
  → Auto-merge
```

**重构为 Issue → Action → PR 方式**:
```
Hacker 在活动详情页 → RegisterForm
  → 填写 track, role, team
  → buildIssueUrl() → 创建 [Register] Issue
    template: register.yml
    labels: registration, hackathon:{slug}
  → Actions: validate-register.yml
    ├─ 验证 profile 存在
    ├─ 验证活动在 registration 阶段
    ├─ 验证 eligibility (open_to, restrictions, blacklist)
    ├─ 验证未重复注册
    ├─ (如果 NDA required) 验证已签 NDA
    └─ 校验通过 → 打 label: registered
  → sync-registrations.yml (periodic / on-label)
    → 读取所有 registered Issue
    → 创建 PR 更新 profiles/{username}.yml 的 registrations[]
    → Auto-merge
```

**UI 组件**: `apps/web/components/forms/RegisterForm.tsx`
**Issue Template**: `.github/ISSUE_TEMPLATE/register.yml`
**Actions 需要**: `validate-register.yml` ❌ 缺失, `sync-registrations.yml` ❌ 缺失

### H6: 签署 NDA ⚠️ 需重构

**当前实现** (PR 方式):
```
Hacker 在活动详情页 → NDASignForm
  → 勾选 3 个 NDA 确认 checkbox
  → 调用 /api/check-profile 验证 profile 存在
  → 检查是否已签 (查 profile YAML 中 nda_signed[])
  → buildPRUrl() → PR 修改 profiles/{username}-{uuid}.yml
    追加: nda_signed[]: [{hackathon, signed_at}]
  → Auto-merge
```

**重构为 Issue → Action → PR 方式**:
```
Hacker 在活动详情页 → NDASignForm
  → 下载 NDA PDF (可选)
  → 勾选 3 个确认 checkbox
  → buildIssueUrl() → 创建 [NDA] Issue
    template: nda-sign.yml
    labels: nda-sign, hackathon:{slug}
  → Actions: validate-nda.yml (已存在)
    ├─ 验证标题格式 [NDA] {username} — {slug}
    ├─ 验证活动需要 NDA
    ├─ 验证 Issue 作者 = 声称的 username
    ├─ 验证所有 checkbox 勾选
    └─ 校验通过 → 打 label: nda-approved
  → sync-nda.yml (periodic / on-label)
    → 读取所有 nda-approved Issue
    → 创建 PR 更新 profiles/{username}.yml 的 nda_signed[]
    → Auto-merge
```

**UI 组件**: `apps/web/components/forms/NDASignForm.tsx`
**Issue Template**: `.github/ISSUE_TEMPLATE/nda-sign.yml`
**Actions**: `validate-nda.yml` ✅ 已存在, `sync-nda.yml` ❌ 缺失

### H7: 提交项目/提案 ✅

```
Hacker 访问 /create-proposal
  → 填写 5 步表单 (CreateProposalForm)
  → Step 0: 选择活动
  → Step 1: 项目信息 (name, tagline, track, tech_stack)
  → Step 2: 团队成员 (github, role)
  → Step 3: 交付物 (repo, demo, video, description)
  → Step 4: YAML 预览 & 提交
  → buildPRUrl() → PR
  → PR 文件: hackathons/{slug}/submissions/{teamSlug}/project.yml
  → Actions: validate-submission.yml 校验
  → (如果包含二进制文件) upload-assets.yml 上传到 R2
  → Review → 合并
```

**UI 组件**: `apps/web/components/forms/CreateProposalForm.tsx`
**数据提交**: `buildPRUrl()` → GitHub PR
**分支**: `data/submission-{slug}-{teamSlug}`
**Actions**: `validate-submission.yml`, `upload-assets.yml`

### H8: 编辑已提交项目 ❌

**当前状态**: 无编辑入口。

**期望流程**:
```
方案 A (简单): 项目详情页 /projects/{hackathon}/{team} → "Edit" 按钮
  → 跳转到 GitHub 编辑器编辑 project.yml → PR → validate → merge

方案 B (完整): /create-proposal?edit={hackathon}/{team}
  → 表单预填现有数据 → 修改 → 提交 PR 覆盖
```

### H9: 发起组队/找队友 ✅

```
Hacker 在活动详情页 → TeamFormationForm
  → 填写: team_name, track, purpose (looking/formed), members, looking_for, project_idea
  → buildIssueUrl() → 创建 [Team] Issue
    template: team-formation.yml
    labels: team-formation, hackathon:{slug}
  → (当前无 validate workflow)
```

**UI 组件**: `apps/web/components/forms/TeamFormationForm.tsx`
**Issue Template**: `.github/ISSUE_TEMPLATE/team-formation.yml`
**Actions**: ❌ 缺失 `validate-team.yml`

### H10: 申请加入队伍 ❌

**当前状态**: 无申请机制。

**期望流程**:
```
Hacker B 浏览 [Team] Issues (在活动详情页 "Teams" tab 或 GitHub Issues 页面)
  → 看到 Hacker A 的 [Team] Issue (purpose: "Looking for teammates")
  → B 在 Issue 下用结构化 comment 申请:
    "**申请加入**
    - GitHub: @B-username
    - Role: developer
    - Skills: React, TypeScript, ML"
  → A 回复确认 (或用 👍 Reaction)
  → 最终在提交项目 PR 时, team[] 包含 A 和 B
  → PR body 包含 "Closes #{team-issue-number}"
  → PR 合并 → Team Issue 自动关闭
```

**需要实现**:
- 活动详情页 "Teams" tab (展示该活动的 team-formation Issues)
- Issue comment 的结构化申请模板
- validate-team.yml 校验 Issue 合法性

### H11: 提交申诉 ✅

```
活动进入 announcement 阶段 → 结果页显示 "Appeal" 按钮
  → Hacker 在活动详情页 → AppealForm
  → 选择 team, 填写 appeal_type, description, evidence
  → 勾选 acknowledgment
  → buildIssueUrl() → 创建 [Appeal] Issue
    template: appeal.yml
    labels: appeal, hackathon:{slug}
  → Actions: validate-appeal.yml
    ├─ 验证标题格式
    ├─ 验证活动在 announcement 阶段
    ├─ 验证申诉者是团队成员
    └─ 校验通过 → 打 label: appeal:pending, 自动 assign organizers
  → Organizer 处理 (见 hackathons-user-flow O12)
```

**UI 组件**: `apps/web/components/forms/AppealForm.tsx`
**Issue Template**: `.github/ISSUE_TEMPLATE/appeal.yml`
**Actions**: `validate-appeal.yml` ✅

### H12: 点赞项目 ❌

**当前状态**: `project.yml` schema 有 `likes: number` 字段，ProposalsViewToggle 有 "Hot" 排序，但没有点赞按钮。

**期望流程**:
```
任何登录用户 在 /proposals 或 /projects/{hackathon}/{team}
  → 点击 ❤️ 按钮
  → 前端 POST /api/like { hackathon, team }
  → Functions 验证 OAuth session
  → D1 记录: INSERT INTO likes (user, hackathon, team, created_at)
  → D1 查询: SELECT COUNT(*) FROM likes WHERE hackathon=? AND team=?
  → 返回更新后的 likes 数量
  → 前端实时更新数字
```

**需要实现**:
- D1 schema: `likes` table
- `POST /api/like` API route
- `GET /api/likes?hackathon=&team=` API route
- 前端 LikeButton 组件
- ProposalsViewToggle "Hot" 排序改为使用 D1 数据

### H13: 公投 (Reactions) ❌

**当前状态**: hackathon.yml schema 有 `public_vote: "reactions"` 和 `vote_emoji` 设置，但无实现。

**设计决策**: 公投是否使用 D1 (与 H12 共用) 还是 GitHub PR Reactions？
- **方案 A: D1** (推荐) — 与点赞共用 `likes` table，加一个 `type` 字段区分 like/vote
- **方案 B: GitHub Reactions** — 在项目 PR 上用 Reaction，但依赖 PR 存在

### H14: 下载数据集 ⚠️ 部分实现

```
活动配置了 datasets[] + access_control
  → 公开数据集: 直接展示 download_url
  → NDA 受限数据集:
    → Hacker 点击 "Download"
    → 前端 POST /api/presign { key }
    → Functions 验证 OAuth session + 检查 nda-approved label
    → 返回 R2 presigned URL (4 小时有效)
    → 浏览器下载
```

**API**: `POST /api/presign` ✅ 存在
**缺失**: 前端缺少 Dataset 下载按钮组件

---

## Judge 详细操作流程

### J2: 提交评分 ✅

```
活动进入 judging 阶段 → 评委看到 ScoreCard 组件
  → 对每个评审维度打分 (滑块 + 数字输入)
  → 填写每维度 comment (可选)
  → 填写 overall_comment
  → 勾选利益冲突声明
  → buildIssueUrl() → 创建 [Score] Issue
    labels: judge-score, hackathon:{slug}
    body: YAML 格式的评分数据
  → Actions: validate-score.yml
    ├─ 验证标题格式 [Score] {team} — {slug} / {track}
    ├─ 验证活动和赛道存在
    ├─ 验证评委身份 (github in judges[])
    ├─ 验证未重复评分
    ├─ 验证分数范围
    ├─ 验证 conflict checkbox
    └─ 校验通过 → 打 label: score-validated, track:{slug}
  → aggregate-scores.yml (cron daily)
    → 聚合所有 score-validated Issues
    → 计算加权平均分
    → 生成 results/{track}.json → commit → push
```

**UI 组件**: `apps/web/components/ScoreCard.tsx`
**Issue Template**: `.github/ISSUE_TEMPLATE/judge-score.yml`
**Actions**: `validate-score.yml` ✅, `aggregate-scores.yml` ✅

---

## 涉及的文件清单

### UI 组件

| 组件 | 路径 | 状态 |
|------|------|------|
| ProfileCreateForm | `apps/web/components/forms/ProfileCreateForm.tsx` | ✅ |
| RegisterForm | `apps/web/components/forms/RegisterForm.tsx` | ⚠️ 需重构 (PR → Issue) |
| NDASignForm | `apps/web/components/forms/NDASignForm.tsx` | ⚠️ 需重构 (PR → Issue) |
| CreateProposalForm | `apps/web/components/forms/CreateProposalForm.tsx` | ✅ |
| TeamFormationForm | `apps/web/components/forms/TeamFormationForm.tsx` | ✅ |
| ScoreCard | `apps/web/components/ScoreCard.tsx` | ✅ |
| AppealForm | `apps/web/components/forms/AppealForm.tsx` | ✅ |
| HackathonFilter | `apps/web/components/HackathonFilter.tsx` | ✅ |
| ProjectCard | `apps/web/components/ProjectCard.tsx` | ✅ |
| ProposalsViewToggle | `apps/web/components/ProposalsViewToggle.tsx` | ✅ |
| EditProfileButton | — | ❌ 缺失 |
| EditProjectButton | — | ❌ 缺失 |
| LikeButton | — | ❌ 缺失 |
| DatasetDownloadButton | — | ❌ 缺失 |
| TeamsTab | — | ❌ 缺失 |

### Issue Templates

| 模板 | 路径 | Label | Actions | 状态 |
|------|------|-------|---------|------|
| register.yml | `.github/ISSUE_TEMPLATE/register.yml` | `registration` | ❌ 缺 validate-register.yml | ⚠️ |
| nda-sign.yml | `.github/ISSUE_TEMPLATE/nda-sign.yml` | `nda-sign` | ✅ validate-nda.yml | ✅ |
| judge-score.yml | `.github/ISSUE_TEMPLATE/judge-score.yml` | `judge-score` | ✅ validate-score.yml | ✅ |
| appeal.yml | `.github/ISSUE_TEMPLATE/appeal.yml` | `appeal` | ✅ validate-appeal.yml | ✅ |
| team-formation.yml | `.github/ISSUE_TEMPLATE/team-formation.yml` | `team-formation` | ❌ 缺 validate-team.yml | ⚠️ |

### Actions Workflows

| Workflow | 路径 | 触发 | 状态 |
|---------|------|------|------|
| validate-profile | `.github/workflows/validate-profile.yml` | PR (profiles/*) | ✅ |
| validate-submission | `.github/workflows/validate-submission.yml` | PR (submissions/**) | ✅ |
| validate-nda | `.github/workflows/validate-nda.yml` | Issue (nda-sign) | ✅ |
| validate-score | `.github/workflows/validate-score.yml` | Issue (judge-score) | ✅ |
| validate-appeal | `.github/workflows/validate-appeal.yml` | Issue (appeal) | ✅ |
| validate-register | — | — | ❌ 缺失 |
| validate-team | — | — | ❌ 缺失 |
| sync-registrations | — | — | ❌ 缺失 |
| sync-nda | — | — | ❌ 缺失 |
| aggregate-scores | `.github/workflows/aggregate-scores.yml` | Cron + manual | ✅ |

---

## 数据持久化模式

### Issue → Action → PR 同步模式 (核心设计)

```
用户操作 → 创建 Issue (轻量 UX)
  → Actions validate-*.yml 校验
  → Actions 打 label 标记状态
  → sync-*.yml (triggered by label / cron)
    → 读取已验证的 Issues
    → 生成/更新 YAML 数据文件
    → 创建 PR → Auto-merge
  → 数据落盘到 Git
```

适用操作:
- **注册**: Issue → `registered` label → sync → profile.yml `registrations[]`
- **NDA**: Issue → `nda-approved` label → sync → profile.yml `nda_signed[]`
- **评分**: Issue → `score-validated` label → aggregate → `results/{track}.json`
- **申诉**: Issue → organizer 处理 → `appeal:accepted/rejected` label → (如需修改结果) 手动 PR

不适用操作 (直接 PR):
- **创建 Profile**: 直接 PR (用户主动编辑的数据)
- **提交项目**: 直接 PR (包含文件)
- **创建/编辑活动**: 直接 PR (organizer 操作)

---

## 缺失功能汇总

| # | 缺失项 | 优先级 | 层 | 所需工作 |
|---|--------|--------|---|---------|
| G1 | validate-register.yml | P0 | Actions | 新建 workflow |
| G2 | validate-team.yml | P1 | Actions | 新建 workflow |
| G3 | sync-registrations.yml | P1 | Actions | 新建 workflow (Issue → PR) |
| G4 | sync-nda.yml | P1 | Actions | 新建 workflow (Issue → PR) |
| G5 | RegisterForm 重构 | P1 | 前端 | PR → Issue 方式 |
| G6 | NDASignForm 重构 | P1 | 前端 | PR → Issue 方式 |
| G7 | 编辑 Profile 入口 | P2 | 前端 | EditProfileButton |
| G8 | 编辑项目入口 | P2 | 前端 | EditProjectButton |
| G9 | Teams tab (活动详情页) | P1 | 前端 | TeamsTab 组件 |
| G10 | 申请加入队伍流程 | P2 | 前端+文档 | comment 模板 + 文档 |
| G11 | 点赞功能 | P2 | D1 + Functions + 前端 | LikeButton + API + D1 |
| G12 | 公投功能 | P2 | D1 + Functions + 前端 | 与点赞共用基础设施 |
| G13 | Dataset 下载按钮 | P2 | 前端 | DatasetDownloadButton |
| G14 | 删除 AI 组队匹配 | P0 | 全局 | 清理 11 个文件 |
| G15 | 创建 GitHub labels | P0 | Admin | `registration`, `registered`, `nda-approved` 等 |
| G16 | 更新 CONTRIBUTING.md | P0 | 文档 | 删除 dev 分支引用 |
| G17 | 更新分支命名规范 | P0 | 文档+Skill | `data/*` 前缀用于数据操作 |
