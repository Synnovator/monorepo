# Hackathons User Flow — 活动创建者/组织者操作手册

> 本文档描述 Hackathon 创建者（Organizer）的完整操作列表、数据流、UI 组件、Issue/PR 模板、Actions Workflow 及实现状态。

## 角色定义

| 角色 | GitHub 权限 | 职责 |
|------|------------|------|
| **Creator** | Write | 创建活动、配置基础信息 |
| **Organizer** | Write + CODEOWNERS | 管理活动全生命周期、处理申诉、审批 |
| **Admin** | Admin | 管理仓库权限、Secrets、分支保护 |

---

## 操作总览

| # | 操作 | 触发方式 | 数据目标 | 实现状态 |
|---|------|---------|---------|---------|
| O1 | 创建活动 | 表单 → PR | `hackathons/{slug}/hackathon.yml` | ✅ 已实现 |
| O2 | 编辑活动 | Skill / GitHub 编辑 → PR | 同上 | ⚠️ 仅 Skill |
| O3 | 配置赛道 & 奖项 | 表单 Step 4 / Skill | `hackathon.yml → tracks[]` | ✅ 已实现 |
| O4 | 管理 7 阶段时间线 | 表单 Step 3 / Skill | `hackathon.yml → timeline` | ✅ 已实现 |
| O5 | 配置评委 & 评审规则 | Skill / 手动编辑 YAML | `hackathon.yml → judges[], tracks[].judging` | ⚠️ 仅 Skill/手动 |
| O6 | 发布活动事件 (AMA/Workshop) | Skill / 手动编辑 YAML | `hackathon.yml → events[]` | ⚠️ 仅 Skill/手动 |
| O7 | 设置 FAQ | Skill / 手动编辑 YAML | `hackathon.yml → faq[]` | ⚠️ 仅 Skill/手动 |
| O8 | 配置 NDA 流程 | 表单 Step 5 (enterprise) / Skill | `hackathon.yml → legal.nda` | ✅ 已实现 |
| O9 | 管理数据集 | Skill / 手动编辑 YAML | `hackathon.yml → datasets[]` | ⚠️ 仅 Skill/手动 |
| O10 | 上传 Banner / Logo | **未实现** | R2 bucket | ❌ 缺失 |
| O11 | 查看注册列表 | **未实现** | Issue 查询 | ❌ 缺失 |
| O12 | 处理申诉 | Issue comment + label | Issue 操作 | ✅ 已实现 |
| O13 | 查看/导出评分 | Skill / 结果页 | `results/{track}.json` | ⚠️ 部分实现 |
| O14 | 关闭活动 | Skill → PR | `hackathon.yml` 归档 | ⚠️ 仅 Skill |

---

## 详细操作流程

### O1: 创建活动

```
Creator 访问 /create-hackathon
  → 填写 8 步表单 (CreateHackathonForm)
  → Step 0: 选择活动类型 (community/enterprise/youth-league)
  → Step 1: 基本信息 (name, slug, tagline)
  → Step 2: 组织者 (organizers[])
  → Step 3: 时间线 (TimelineEditor, 7 阶段 + 预设 4w/8w/12w)
  → Step 4: 赛道 (tracks[], criteria[], rewards[])
  → Step 5: 法律条款 (license, IP, NDA — enterprise 专属)
  → Step 6: 设置 (eligibility, team_size, languages, public_vote)
  → Step 7: YAML 预览
  → buildPRUrl() → 打开 GitHub 创建 PR
  → PR 文件: hackathons/{slug}/hackathon.yml
  → Actions: validate-hackathon.yml 校验 Schema
  → CODEOWNERS review → 合并 → 自动部署
```

**UI 组件**: `apps/web/components/forms/CreateHackathonForm.tsx`
**子组件**: `apps/web/components/forms/TimelineEditor.tsx`
**数据提交**: `buildPRUrl()` → GitHub PR
**分支命名**: `data/hackathon-{slug}`
**Actions**: `validate-hackathon.yml`

### O2: 编辑活动

```
Organizer 通过 synnovator-admin Skill 或 GitHub Web 编辑器
  → 修改 hackathon.yml 内容
  → 提交 PR → validate-hackathon.yml 校验
  → CODEOWNERS review → 合并
```

**当前状态**: 无前端编辑 UI，仅 Skill 和 GitHub 原生编辑器
**缺失**: 前端 "Edit Hackathon" 页面（预填现有数据的表单）

### O3–O9: 配置子项

这些操作都是 hackathon.yml 的子字段编辑，通过 O1 创建时一次性配置，或通过 O2 后续编辑。

| 子项 | YAML 路径 | 表单 Step | 后续编辑方式 |
|------|----------|-----------|------------|
| 赛道 & 奖项 | `tracks[]` | Step 4 | Skill / GitHub 编辑 |
| 时间线 | `timeline` | Step 3 | Skill `update-timeline` |
| 评委 | `judges[]` | — | Skill / GitHub 编辑 |
| 活动事件 | `events[]` | — | Skill / GitHub 编辑 |
| FAQ | `faq[]` | — | Skill / GitHub 编辑 |
| NDA | `legal.nda` | Step 5 | Skill / GitHub 编辑 |
| 数据集 | `datasets[]` | — | Skill / GitHub 编辑 |

### O10: 上传 Banner / Logo ❌

**当前状态**: 不支持。hackathon.yml 中 `organizers[].logo` 和 `sponsors[].logo` 是 URL 字段，需要用户自行上传到外部并填写 URL。

**期望流程**:
```
Organizer 在创建/编辑表单中上传图片
  → 前端调用 upload API → 上传到 R2
  → 返回 R2 URL → 自动填入 YAML 字段
```

**需要实现**:
- `POST /api/upload` API route (接收文件 → 上传 R2 → 返回 URL)
- 表单中的文件上传组件
- R2 bucket 配置

### O11: 查看注册列表 ❌

**当前状态**: 无 UI 可查看谁注册了某个活动。

**期望流程**:
```
Organizer 访问 /hackathons/{slug} → "Registrations" tab (仅 organizer 可见)
  → 前端调用 GitHub API 查询 Issues:
    label: "registered", "hackathon:{slug}"
  → 展示注册者列表 (username, track, role, team, 注册时间)
```

**替代方案**: 通过 `gh issue list --label "registered,hackathon:{slug}"` CLI 查询

### O12: 处理申诉 ✅

```
参赛者提交 [Appeal] Issue → validate-appeal.yml 校验
  → 自动打 label: appeal:pending, hackathon:{slug}
  → 自动 assign 给 organizers
  → Organizer 在 Issue 中回复 comment
  → Organizer 手动打 label: appeal:accepted 或 appeal:rejected
  → (如果 accepted) Organizer 修改 results 或重新评分
```

**Actions**: `validate-appeal.yml`
**Issue Template**: `.github/ISSUE_TEMPLATE/appeal.yml`

### O13: 查看/导出评分 ⚠️

```
评分阶段结束 → aggregate-scores.yml (daily cron) 聚合评分
  → 写入 hackathons/{slug}/results/{track}.json
  → Organizer 可在结果页 /results/{slug} 查看

  或: synnovator-admin Skill → export-scores → 导出 CSV/JSON
```

**Actions**: `aggregate-scores.yml`
**页面**: `/results/[slug]`
**Skill**: `synnovator-admin export-scores`
**缺失**: 前端无 "Export" 按钮下载评分明细

---

## 涉及的文件清单

### UI 组件

| 组件 | 路径 | 状态 |
|------|------|------|
| CreateHackathonForm | `apps/web/components/forms/CreateHackathonForm.tsx` | ✅ |
| TimelineEditor | `apps/web/components/forms/TimelineEditor.tsx` | ✅ |
| ReviewActions (Admin) | `apps/web/components/admin/ReviewActions.tsx` | ✅ |
| ReviewList (Admin) | `apps/web/components/admin/ReviewList.tsx` | ✅ |
| EditHackathonForm | — | ❌ 缺失 |
| FileUploadField | — | ❌ 缺失 |
| RegistrationsList | — | ❌ 缺失 |

### Issue Templates

| 模板 | 路径 | Label | 状态 |
|------|------|-------|------|
| (无 organizer 专用模板) | — | — | N/A |

> Organizer 操作主要通过 PR（创建/编辑 YAML），不使用 Issue Templates。
> 处理申诉是在 hacker 创建的 Appeal Issue 上操作。

### Actions Workflows

| Workflow | 路径 | 触发 | 状态 |
|---------|------|------|------|
| validate-hackathon | `.github/workflows/validate-hackathon.yml` | PR (hackathons/**) | ✅ |
| aggregate-scores | `.github/workflows/aggregate-scores.yml` | Cron daily + manual | ✅ |
| status-update | `.github/workflows/status-update.yml` | Cron daily + manual | ✅ |
| upload-assets | `.github/workflows/upload-assets.yml` | PR (submissions/**) | ✅ |

### Skill 命令

| 命令 | 功能 | 状态 |
|------|------|------|
| `create-hackathon` | 创建活动 YAML + PR | ✅ |
| `update-timeline` | 修改时间线 | ✅ |
| `update-track` | 修改赛道 | ✅ |
| `close-hackathon` | 归档活动 | ✅ |
| `export-scores` | 导出评分 | ✅ |
| `audit` | 审计操作历史 | ✅ |

---

## 缺失功能汇总

| # | 缺失项 | 优先级 | 所需工作 |
|---|--------|--------|---------|
| G1 | Banner/Logo 上传 (R2) | P2 | API route + 表单组件 + R2 配置 |
| G2 | 注册列表查看 | P1 | 前端 Tab + GitHub API 查询 |
| G3 | 前端编辑活动入口 | P2 | 跳转到 GitHub 编辑页 或 预填表单 |
| G4 | 评分导出按钮 | P2 | 结果页增加下载按钮 |
| G5 | 缺失 GitHub labels | P0 | 需在 repo 中创建 `registration`, `registered`, `nda-sign`, `nda-approved`, `judge-score`, `score-validated`, `appeal`, `appeal:pending`, `appeal:accepted`, `appeal:rejected`, `team-formation` 等 |
