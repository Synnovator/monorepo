# 组织者指南

> 如何在 Synnovator 上创建和管理 Hackathon 活动。
>
> 完整操作流程和技术细节详见 [hackathons-user-flow.md](./hackathons-user-flow.md)。

## 概述

Synnovator 是 Git 原生的 Hackathon 平台。活动创建和管理通过 GitHub PR 完成——编辑 YAML 配置、提交 PR、Actions 自动校验、合并后自动部署。

作为组织者，你可以通过两种方式管理活动：
1. **Web 表单** — 访问 `/create-hackathon`，8 步引导创建
2. **synnovator-admin Skill** — 在 Claude Code 中执行管理命令

## 创建活动

### 方式一：Web 表单

1. 访问 `/create-hackathon`，选择活动类型（community / enterprise / youth-league）
2. 填写基本信息：活动名称（中英文）、slug、tagline
3. 添加组织者信息
4. 配置 7 阶段时间线（可使用 4 周 / 8 周 / 12 周预设）
5. 设置赛道：名称、评审维度（weights 总和 = 1.0）、奖项
6. 法律条款：License、IP 归属、NDA（enterprise 类型）
7. 设置：资格条件、团队规模、语言、公投
8. 预览 YAML → 提交 PR

PR 将自动触发 `validate-hackathon.yml` 进行 Schema 校验。CODEOWNERS 审批后合并，活动页面自动生成。

### 方式二：synnovator-admin Skill

```
/synnovator-admin create-hackathon <slug>
```

Skill 会引导你填写必要信息，自动生成 YAML 并创建 PR。

### 数据分支命名

活动相关的数据 PR 使用 `data/hackathon-{slug}` 分支名。

## 编辑活动

创建后的修改同样通过 PR 提交：

- **Skill**: `/synnovator-admin update-timeline <slug>`, `update-track <slug>` 等
- **GitHub Web 编辑器**: 直接编辑 `hackathons/{slug}/hackathon.yml` → 提交 PR

## 管理流程

### 7 阶段生命周期

```
draft → registration → development → submission → judging → announcement → award
```

每个阶段通过 `hackathon.yml` 中的 `timeline` 字段配置起止时间。`status-update.yml` Actions 每日自动更新阶段 label。

### 处理申诉

活动进入 `announcement` 阶段后，参赛者可提交 `[Appeal]` Issue。

1. Actions 自动校验申诉有效性（时间窗口、团队身份）
2. 自动打 `appeal:pending` label 并 assign 给 organizer
3. 你在 Issue 中回复处理结果
4. 手动打 `appeal:accepted` 或 `appeal:rejected` label

### 查看注册情况

目前通过 CLI 查询：

```bash
gh issue list --label "registered,hackathon:{slug}" --state all
```

### 导出评分

```
/synnovator-admin export-scores <slug>
```

或查看结果页 `/results/{slug}`。

## hackathon.yml 关键字段

| 字段 | 说明 |
|------|------|
| `hackathon.name` / `name_zh` | 活动名称（英文/中文） |
| `hackathon.slug` | URL 标识符 |
| `hackathon.type` | community / enterprise / youth-league / open-source |
| `hackathon.timeline` | 7 个阶段的 start/end 时间 |
| `hackathon.tracks[]` | 赛道配置（名称、评审维度、奖项、交付物要求） |
| `hackathon.judges[]` | 评委列表（GitHub username、专长） |
| `hackathon.eligibility` | 参赛资格（open_to、team_size、restrictions） |
| `hackathon.legal.nda` | NDA 配置（required、document_url） |
| `hackathon.datasets[]` | 数据集（access_control: public / nda-required） |
| `hackathon.events[]` | 活动事件（AMA、Workshop） |
| `hackathon.faq[]` | FAQ（中英文） |
| `hackathon.settings.public_vote` | 公投设置 |

详细 Schema 参考 [PRD §6.1](../specs/synnovator-prd.md) 和 [hackathon Zod schema](../../packages/shared/src/schemas/hackathon.ts)。
