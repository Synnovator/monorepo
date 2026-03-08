# 参赛者指南

> 如何注册 Profile、报名活动、组队和提交项目。
>
> 完整操作流程和技术细节详见 [hackers-user-flow.md](./hackers-user-flow.md)。

## 概述

Synnovator 是 Git 原生的 Hackathon 平台。你的所有操作（注册、报名、提交项目）都通过 GitHub PR 或 Issue 完成。你需要一个 GitHub 账号。

## 1. 创建 Profile

访问 `/create-profile`（需 GitHub 登录），按 5 步填写：

1. **基本信息** — 姓名（中英文）、简介、所在地、语言
2. **身份** — 学生/职业人士/学术，学校/公司、专业等
3. **技能** — 技能分类 + 具体技能项
4. **更多** — 兴趣方向、找队友偏好、社交链接
5. **预览** — 确认 YAML 内容 → 提交 PR

PR 自动校验后合并，你的 Profile 页面 `/hackers/{username}` 即可访问。

### 编辑 Profile

在你的 Profile 页面点击 "Edit" → 跳转到 GitHub 编辑器修改 YAML → 提交 PR。

## 2. 报名活动

访问活动详情页 `/hackathons/{slug}`，在 `registration` 阶段：

1. 点击 "Register" 按钮
2. 选择赛道、角色（Solo / Team Lead / Team Member）、队伍名
3. 勾选条款确认
4. 提交 → 创建 `[Register]` Issue
5. Actions 自动校验（Profile 存在、资格符合、NDA 签署等）
6. 校验通过 → 打 `registered` label → 注册成功

> 如果活动要求 NDA，你需要先完成 NDA 签署（见下方）。

## 3. 签署 NDA

部分活动（enterprise 类型）要求签署保密协议：

1. 在活动详情页下载 NDA 文档
2. 点击 "Sign NDA"
3. 勾选 3 项确认 checkbox
4. 提交 → 创建 `[NDA]` Issue
5. Actions 校验 → 打 `nda-approved` label

签署后即可报名和下载受限数据集。

## 4. 组队

### 发起组队

在活动详情页 "Teams" tab：

1. 点击 "Post Team"
2. 填写队名、赛道、当前成员、需要的技能/角色
3. 提交 → 创建 `[Team]` Issue
4. 其他人可以在 Issue 下评论申请加入

### 加入已有队伍

1. 浏览活动的 "Teams" tab，查看开放的组队 Issue
2. 在感兴趣的 Issue 下评论，说明你的 GitHub 用户名、期望角色和技能
3. 队长确认后，在提交项目时将你加入 `team[]`

### 组队 → 项目提交的关联

当队伍提交项目 PR 时，PR body 包含 `Closes #N`（组队 Issue 编号），PR 合并后 Issue 自动关闭。

## 5. 提交项目

在 `submission` 阶段，访问 `/create-proposal`：

1. **选择活动** — 从列表中选
2. **项目信息** — 名称（中英文）、tagline、赛道、技术栈
3. **团队** — 添加成员 (GitHub username + 角色)
4. **交付物** — 代码仓库 URL、Demo URL、视频 URL、项目描述
5. **预览** → 提交 PR

PR 文件: `hackathons/{slug}/submissions/{teamSlug}/project.yml`

### 附件上传

如果项目包含 PDF 文档或其他二进制文件，通过 PR 一起提交。Actions 会自动将它们上传到 R2 云存储并更新 YAML 中的 URL。

### 编辑已提交项目

在项目详情页 `/projects/{hackathon}/{team}` 点击 "Edit" → 跳转到 GitHub 编辑器。

## 6. 查看结果

活动进入 `announcement` 阶段后，访问 `/results/{slug}` 查看排行榜。

## 7. 提交申诉

如果对结果有异议，在 `announcement` 阶段：

1. 在活动详情页点击 "Appeal"
2. 选择你的队伍、填写申诉类型和详细描述
3. 附上证据（链接、截图等）
4. 确认 "组织者的最终决定具有约束力"
5. 提交 → 创建 `[Appeal]` Issue

组织者会在 Issue 中回复处理结果。

## 数据在哪里？

| 你的数据 | 存储位置 |
|---------|---------|
| Profile | `profiles/{username}-{uuid}.yml` (Git) |
| 注册记录 | GitHub Issue → 同步到 Profile YAML |
| NDA 签署记录 | GitHub Issue → 同步到 Profile YAML |
| 项目提交 | `hackathons/{slug}/submissions/{team}/project.yml` (Git) |
| 评分记录 | GitHub Issue (judge-score label) |
| 申诉记录 | GitHub Issue (appeal label) |
| 文件附件 | Cloudflare R2 云存储 |

所有 Git 数据都有完整的版本历史，可追溯、可审计。
