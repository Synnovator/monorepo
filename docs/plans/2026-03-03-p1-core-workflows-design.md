# P1 核心工作流设计文档

> **版本**: 1.0
> **日期**: 2026-03-03
> **关联 PRD**: V3.2 §11 P1 Roadmap
> **前置**: P0 全部完成（PR #3, commit 5c3eb1a）
> **状态**: Approved
> **方案**: Workflow-centric（方案 A）

---

## 1. 范围与目标

本设计覆盖 PRD §11 P1 Roadmap 的 **5 个核心工作流项目**（赛事运营必须）：

### 1.1 本批交付物

| 编号 | 项目 | 验收规范 |
|------|------|---------|
| P1-1 | NDA 签署流程 | US-H-007, US-O-007, US-P-013 |
| P1-2 | 数据集鉴权增强 | US-O-008, US-P-007 |
| P1-3 | 评审利益冲突声明 | US-J-003 |
| P1-4 | 评审模型增强（加权 + 硬约束） | US-J-004, US-J-005 |
| P1-5 | 申诉仲裁系统 | US-H-009, US-O-009 |

### 1.2 延后项目（下一轮）

| 项目 | 理由 |
|------|------|
| 代码安全扫描 | 合规检查，非赛事运营核心 |
| 导师贡献检测 | 合规检查，非赛事运营核心 |
| AI 评审摘要 | 增强功能，可独立添加 |
| AI 组队匹配 | 增强功能，可独立添加 |
| Cloudflare D1 集成 | PRD 标注可选，当前规模不需要 |

### 1.3 设计原则

- **Workflow-centric**: 所有逻辑在 GitHub Actions workflows 中实现
- **Git 为唯一真相源**: NDA 状态 = Issue Label，评分结果 = 仓库 JSON
- **零新基础设施**: 不引入 D1 或其他存储，复用 P0 的 OAuth + R2 + Actions
- **渐进增强**: 可后续叠加 API 层或 D1 缓存，不影响核心逻辑

---

## 2. 实施批次

### 2.1 依赖关系

```
Batch 1 (NDA + 数据集鉴权)        ← 无依赖（P0 基础设施已就绪）
Batch 2 (评审利益冲突声明)         ← 无依赖（Profile Schema 已有字段）
Batch 3 (评审模型增强)             ← 依赖 Batch 2（冲突检查前置）
Batch 4 (申诉仲裁系统)             ← 依赖 Batch 3（评分结果出来后才有申诉）
```

### 2.2 交付物总览

| 批次 | 新/改 Workflow | 修改 API/Lib | 新/改组件 | 新页面 |
|------|---------------|-------------|----------|--------|
| 1 | `validate-nda.yml` | `presign.ts` | DatasetDownload 增强 | — |
| 2 | 扩展 `validate-score.yml` | — | ScoreCard + JudgeCard 增强 | — |
| 3 | `aggregate-scores.yml` | — | — | `results.astro` |
| 4 | `validate-appeal.yml` | — | 详情页申诉按钮 | — |

---

## 3. Batch 1: NDA 签署流程 + 数据集鉴权

### 3.1 NDA 校验 Workflow

**文件**: `.github/workflows/validate-nda.yml`

**触发**: Issues labeled `nda-sign`

**校验链**:
1. 从 Issue title 解析：`[NDA] {username} — {hackathon-slug}`
2. 验证 hackathon 存在（读取 `hackathons/{slug}/hackathon.yml`）
3. 验证 `legal.nda.required = true`
4. 验证 Issue 作者 == Issue body 中的 GitHub username（防冒签）
5. 验证所有 checkboxes 已勾选（解析 Issue body markdown）
6. 验证用户已报名（搜索 `[Register] {username} — {slug}` Issue + label `registered`）
7. 通过 → 添加 `nda-approved` Label + Comment "✅ NDA 签署确认完成"
8. 失败 → Comment 详细错误

**关键决策**:
- NDA 签署状态唯一真相源 = Issue 上的 `nda-approved` Label
- Presign API 运行时通过 GitHub API 查询此 Label

### 3.2 Presign API 增强

**文件**: `site/src/pages/api/presign.ts`

**新增逻辑**（在 path 校验后、URL 生成前）:

```
POST /api/presign { key: "hackathons/{slug}/datasets/{name}" }
  1. [existing] 验证 session cookie
  2. [existing] 验证 key 路径安全（startsWith('hackathons/') + no '..'）
  3. [NEW] 从 key 解析 hackathon slug
  4. [NEW] 判断是否为数据集路径（包含 /datasets/）
  5. [NEW] 如果是数据集:
     → 读取 hackathon.yml 判断对应 dataset 的 access_control
     → 如果 access_control = "nda-required":
       → 调 GitHub API: GET /repos/{owner}/{repo}/issues
         ?labels=nda-approved,nda-sign
         &creator={session.login}
         &state=open
       → 过滤 title 包含 hackathon slug
       → 未找到 → 403 { error: "nda_required", message: "请先签署 NDA" }
  6. [existing] 生成 presigned URL
```

**GitHub API 优化**:
- 使用 session 中的 `access_token` 调用（已认证，rate limit 5000/hour）
- 单次 API 调用即可判断 NDA 状态
- 仅数据集下载路径触发 NDA 检查，其他 R2 路径不受影响

### 3.3 hackathon.yml NDA 数据读取

**方案**: Presign API 需要在运行时读取 hackathon.yml 来判断 NDA 配置。

两种方式选择：
- **a) 构建时内联**: 将 hackathon 的 NDA 配置打包到构建产物中（需要 Astro 构建管道支持）
- **b) GitHub API 读取**: 从 GitHub Contents API 读取 YAML（额外一次 API 调用）

**选择 b)**：简单直接，1 次额外 API 调用，hackathon.yml 文件小（几 KB），结果可在 Function 内短期缓存。

### 3.4 DatasetDownload 组件增强

**文件**: `site/src/components/DatasetDownload.astro`

**变更**:
- 下载按钮点击收到 403 + `error: "nda_required"` 时:
  - 显示提示："⚠️ 需签署 NDA 后才能下载此数据集"
  - 显示"签署 NDA"链接（GitHubRedirect → `nda-sign.yml` Issue）
- 数据集卡片上显示 NDA 状态标记:
  - `access_control = "public"` → 绿色"公开"标签
  - `access_control = "nda-required"` → 黄色"需 NDA"标签

### 3.5 活动详情页 NDA 展示

**文件**: `site/src/pages/hackathons/[...slug].astro`

**变更**:
- 如果 `legal.nda.required = true`:
  - 报名区域显示 NDA 声明："⚠️ 本活动需签署保密协议（NDA）"
  - 展示 NDA 摘要（`legal.nda.summary`）
  - 如果 `legal.nda.document_url` 非空，提供 NDA 文档下载链接
  - 显示"签署 NDA"按钮（GitHubRedirect → Issue）

---

## 4. Batch 2: 评审利益冲突声明

### 4.1 validate-score 增加冲突检查

**文件**: `.github/workflows/validate-score.yml`

**新增步骤**（在现有 judge 身份校验后）:

```
评分 Issue 提交 → validate-score workflow:
  1. [existing] 解析 title: [Score] team — slug / track
  2. [existing] 验证 judge 在 hackathon.yml judges 列表中
  3. [NEW] 从 profiles/ 搜索评委 Profile（github == issue_author）
  4. [NEW] 检查 judge_profile.conflict_declaration 非空
     → 为空 → Comment "❌ 请先在 Profile 中上传利益冲突声明文档"
     → 提供 Profile 编辑链接
  5. [NEW] 检查 Issue body 中利益冲突 checkbox 已勾选
     → 未勾选 → Comment "❌ 请确认利益冲突声明" + label blocked:conflict
  6. [NEW] 重复评分检测: 搜索同一 judge 对同一 team 的已有 score-validated Issue
     → 存在 → Comment "❌ 已存在评分记录，如需修改请编辑原 Issue"
  7. [existing] 评分范围校验
  8. [existing] 通过 → label score-validated
```

### 4.2 ScoreCard 组件增强

**文件**: `site/src/components/ScoreCard.astro`

**变更**:
- 评分表单底部增加利益冲突声明 checkbox:
  - "我确认与该团队无利益冲突关系"（必填）
- 未勾选时"提交评分"按钮禁用（客户端 JS 控制）
- checkbox 状态序列化到生成的 Issue body YAML 中:
  ```yaml
  conflict_declaration: true
  ```

### 4.3 JudgeCard 组件增强

**文件**: `site/src/components/JudgeCard.astro`

**变更**:
- 如果 `conflict_declaration` 非空 → 显示绿色标记 "已提交利益冲突声明"
- 声明文档链接可点击（指向 R2 PDF URL）
- 如果为空 → 不显示任何标记（不公开暴露未提交状态）

### 4.4 judge-score Issue Template 更新

**文件**: `.github/ISSUE_TEMPLATE/judge-score.yml`

**新增 field**:
```yaml
- type: checkboxes
  id: conflict
  attributes:
    label: "利益冲突声明"
    options:
      - label: "我确认与被评团队无利益冲突关系"
        required: true
```

---

## 5. Batch 3: 评审模型增强

### 5.1 评分汇总 Workflow

**文件**: `.github/workflows/aggregate-scores.yml`

**触发**: `workflow_dispatch` + schedule cron `0 1 * * *`（每日 UTC 01:00）

**逻辑**:

```
遍历每个 hackathon:
  如果阶段不是 judging/announcement/award → 跳过
  遍历每个 track:
    1. 搜索 Issues: label:score-validated + label:hackathon:{slug} + label:track:{track-slug}
    2. 对每个 Issue 解析 YAML 评分数据
    3. 按团队分组评委评分
    4. 对每个团队计算:
       a. 每个 criterion: raw_score × (weight / 100) = weighted_score
       b. hard_constraint 检查:
          如果 criterion.hard_constraint = true
          且 raw_score 触发 constraint_rule
          → weighted_score = 0, 记录 violation
       c. 单评委总分 = Σ(weighted_score)
       d. 专家得分 = mean(所有评委总分)
       e. 如果 mode = "expert_plus_vote":
          → 最终分 = 专家得分 × (100 - vote_weight)/100 + 投票得分 × vote_weight/100
       f. 否则: 最终分 = 专家得分
    5. 按最终分降序排名
    6. 写入 hackathons/{slug}/results/{track-slug}.json
    7. git add + commit + push
```

### 5.2 结果 JSON Schema

**路径**: `hackathons/{slug}/results/{track-slug}.json`

```json
{
  "track": "model-optimization",
  "hackathon": "enterprise-fintech-risk-2025",
  "calculated_at": "2026-03-15T01:00:00Z",
  "judging_mode": "expert_only",
  "total_judges": 3,
  "total_teams": 5,
  "rankings": [
    {
      "rank": 1,
      "team": "team-alpha",
      "project_name": "RiskGuard Pro",
      "final_score": 87.5,
      "expert_score": 87.5,
      "vote_score": null,
      "judge_count": 3,
      "criteria_breakdown": [
        {
          "criterion": "FRR_metric",
          "weight": 35,
          "scores": [85, 90, 88],
          "average": 87.67,
          "weighted": 30.68
        }
      ],
      "hard_constraint_violations": [],
      "judge_details": [
        {
          "judge_id": "judge-1",
          "total": 85,
          "criteria": [
            { "criterion": "FRR_metric", "score": 85, "comment": "..." }
          ]
        }
      ]
    }
  ]
}
```

### 5.3 硬约束执行

**validate-score.yml 增强**（硬约束警告）:

在评分范围校验后，如果某 criterion 的 `hard_constraint = true`:
- 检查 score 是否可能触发 `constraint_rule`
- 触发时 Comment 警告："⚠️ {criterion_name} 分数 {score} 可能触发硬约束（{constraint_rule}），汇总时此项将计为 0 分"
- **不阻止评分提交**（给评委修改机会）

**aggregate-scores.yml 执行**（硬约束计算）:
- 在计算加权分时，如果 `hard_constraint = true` 且分数触发 `constraint_rule` → `weighted_score = 0`
- 记录到 `hard_constraint_violations` 数组中

**设计决策**: 硬约束在评分提交时**警告**，在汇总时**执行**。

### 5.4 投票得分计算

对于 `mode = "expert_plus_vote"` 的 Track：
- 投票得分来源：项目 PR 的 GitHub Reactions 数量
- P1 简化处理：`aggregate-scores.yml` 通过 GitHub API 查询 PR Reactions 数
- 归一化为 0-100 分（最高 Reactions 的项目 = 100 分，按比例缩放）

### 5.5 评分结果页面

**文件**: `site/src/pages/hackathons/[...slug]/results.astro`

**设计**:
- 构建时读取 `hackathons/{slug}/results/*.json`
- 如果无结果文件或活动不在 announcement/award 阶段 → 显示"结果尚未公布"
- 结果展示:
  - 按 Track 分区
  - 每个 Track 显示排名表：名次、团队名、最终得分、各维度平均分
  - 获奖团队（对应 track.rewards 的名次）标注奖项
- 评分明细:
  - 默认匿名化（"评委 1"/"评委 2"）
  - 各维度分数分布
  - 硬约束触发标注 "⚠️"

---

## 6. Batch 4: 申诉仲裁系统

### 6.1 申诉校验 Workflow

**文件**: `.github/workflows/validate-appeal.yml`

**触发**: Issues labeled `appeal`

**校验链**:
1. 从 Issue title 解析：`[Appeal] {team-name} — {hackathon-slug}/{track}`
2. 验证 hackathon 存在（读取 `hackathons/{slug}/hackathon.yml`）
3. **窗口期检查**: 从 `timeline.announcement` 获取公示期时间范围
   - 当前时间不在 announcement 阶段 → Comment "❌ 申诉窗口已关闭（公示期：{start} — {end}）" + label `appeal:expired` + 关闭 Issue
4. 验证 Issue 作者是该团队成员（读取 `hackathons/{slug}/submissions/{team}/project.yml` 的 `team.members`）
   - 非团队成员 → Comment "❌ 仅团队成员可提交申诉"
5. 验证 acknowledgment checkbox 已勾选（"组织者最终裁决具有约束力"）
6. 通过 → 自动 assign 给 organizers（从 `hackathon.yml` 的 `organizers[].github`）
7. 添加 labels：`appeal:pending` + `hackathon:{slug}` + `track:{track-slug}`
8. Comment "✅ 申诉已受理，已通知活动组织方。组织者将在公示期内回应。"

### 6.2 Appeal Issue Template 增强

**文件**: `.github/ISSUE_TEMPLATE/appeal.yml`

**新增/修改 field**:
```yaml
- type: dropdown
  id: expected_result
  attributes:
    label: "期望结果"
    options:
      - "重新评分"
      - "修改排名"
      - "规则解释说明"
      - "其他"
  validations:
    required: true
```

### 6.3 活动详情页申诉入口

**文件**: `site/src/pages/hackathons/[...slug].astro`

**变更**:
- 仅在 `announcement` 阶段显示"提交申诉"按钮
- 按钮使用 GitHubRedirect 生成预填 Issue URL
- 其他阶段不渲染此按钮

### 6.4 申诉处理流程（组织者侧）

组织者通过 GitHub Issue 原生功能处理：
- 在 Issue Comment 中回应
- 添加 `appeal:accepted` 或 `appeal:rejected` Label 表示结果
- GitHub 通知自动告知申诉方

无需额外 workflow — Label 变更即最终裁决记录。

---

## 7. 技术决策总结

| 决策 | 选择 | 理由 |
|------|------|------|
| 架构模式 | Workflow-centric（方案 A） | 与 P0 一致，零新基础设施 |
| NDA 状态存储 | Issue Label (`nda-approved`) | Git-native，GitHub API 可查询 |
| NDA 检查位置 | Presign API 运行时 | 最小变更，复用现有 session |
| hackathon.yml 读取 | GitHub Contents API | 简单直接，文件小可缓存 |
| 评分结果存储 | 仓库 JSON 文件 | 构建时可读，可审计 |
| 硬约束时机 | 提交时警告，汇总时执行 | 给评委修改机会 |
| 评委匿名化 | 结果页默认匿名 | 保护评委隐私 |
| 投票得分 | PR Reactions 归一化 | 复用 P0 已有机制 |
| D1 集成 | 不引入 | PRD 标注可选，规模不需要 |
| 申诉裁决 | Issue Label | 组织者用原生 GitHub 操作 |

---

## 8. 变更文件清单

### 新文件

| 文件 | 类型 | 批次 |
|------|------|------|
| `.github/workflows/validate-nda.yml` | Workflow | 1 |
| `.github/workflows/aggregate-scores.yml` | Workflow | 3 |
| `.github/workflows/validate-appeal.yml` | Workflow | 4 |
| `site/src/pages/hackathons/[...slug]/results.astro` | Page | 3 |

### 修改文件

| 文件 | 变更内容 | 批次 |
|------|---------|------|
| `site/src/pages/api/presign.ts` | NDA 状态检查 | 1 |
| `site/src/components/DatasetDownload.astro` | NDA 错误提示 + 状态标记 | 1 |
| `site/src/pages/hackathons/[...slug].astro` | NDA 展示 + 申诉按钮 | 1, 4 |
| `.github/workflows/validate-score.yml` | 利益冲突 + 硬约束警告 + 重复检测 | 2, 3 |
| `site/src/components/ScoreCard.astro` | 利益冲突 checkbox | 2 |
| `site/src/components/JudgeCard.astro` | 冲突声明标记 | 2 |
| `.github/ISSUE_TEMPLATE/judge-score.yml` | 利益冲突 checkbox | 2 |
| `.github/ISSUE_TEMPLATE/appeal.yml` | expected_result field | 4 |

---

## 9. 验收覆盖

| PRD P1 项目 | 覆盖状态 | 验收规范 |
|------------|---------|---------|
| NDA 签署流程 | Batch 1 | US-H-007, US-O-007 |
| 数据集管理增强 | Batch 1 | US-O-008, US-P-007, US-P-013 |
| 评审利益冲突声明 | Batch 2 | US-J-003 |
| 评审模型增强 | Batch 3 | US-J-004, US-J-005 |
| 申诉仲裁系统 | Batch 4 | US-H-009, US-O-009 |
| 代码安全扫描 | 延后 | — |
| 导师贡献检测 | 延后 | — |
| AI 评审摘要 | 延后 | — |
| AI 组队匹配 | 延后 | — |
| D1 集成 | 延后 | — |
