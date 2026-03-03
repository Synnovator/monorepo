# synnovator-admin Skill 设计文档

> **版本**: 1.0
> **日期**: 2026-03-03
> **关联**: PRD §7.4, 架构设计 §6.4, 验收规范 SC-P-017
> **状态**: Approved

---

## 1. 概述

`synnovator-admin` 是 Synnovator 平台的管理 CLI Skill，封装所有管理操作。管理员通过 `/synnovator-admin <command>` 执行活动管理、数据导出、审计查询等操作。

**设计原则**：
- Skill 是用户界面层，封装 `scripts/` 调用 + YAML 编辑 + Schema 校验 + PR 创建
- 写操作走 YAML→commit→PR 流程，读操作直接输出结果
- Schema 校验脚本独立于 Skill，放在 `scripts/` 下（线上 Actions 也会调用）

---

## 2. 文件结构

```
.claude/skills/synnovator-admin/
├── SKILL.md                      ← 命令路由 + 执行流程（~300 行）
└── references/
    ├── schema-v2.md              ← hackathon.yml Schema V2 完整校验规则
    └── github-api-patterns.md    ← gh API 查询模式（Issue/PR/CODEOWNERS）

scripts/
├── create-hackathon.sh           ← 已有，生成 hackathon 骨架
├── create-profile.sh             ← 已有，生成 profile 骨架
├── submit-project.sh             ← 已有，生成 submission 骨架
└── validate-hackathon.sh         ← 新建，独立 Schema V2 校验脚本
```

---

## 3. 命令清单

| 类别 | 命令 | 操作类型 | 底层实现 |
|------|------|---------|---------|
| 活动管理 | `create-hackathon` | 写 | `scripts/create-hackathon.sh` + 模板替换 + PR |
| | `update-timeline` | 写 | Edit YAML + PR |
| | `update-track` | 写 | Edit YAML + PR |
| | `close-hackathon` | 写 | 设 `status: archived` + PR |
| 数据与人员 | `create-profile` | 写 | `scripts/create-profile.sh` + PR |
| | `submit-project` | 写 | `scripts/submit-project.sh` + PR |
| | `approve-nda` | 写 | `gh issue edit --add-label` |
| 数据导出 | `list-registrations` | 只读 | `gh issue list` |
| | `list-submissions` | 只读 | 扫描 submissions/ 目录 |
| | `export-scores` | 只读 | `gh issue list` → 解析 YAML → CSV |
| | `export-report` | 只读 | 综合以上数据 |
| 审计 | `audit-log` | 只读 | `git log` |
| | `audit-permissions` | 只读 | `gh api` + CODEOWNERS |
| | `audit-secrets` | 只读 | `gh secret list` |

---

## 4. 写操作统一流程

所有写操作遵循：

```
收集参数 → 创建分支 → 执行操作 → 校验 → commit → 提示创建 PR
```

### 4.1 `create-hackathon`

1. 交互收集：`slug`、`type`（community/enterprise/youth-league/open-source）、`name`
2. 创建分支：`git checkout -b feat/hackathon-{slug}`
3. 执行：`bash scripts/create-hackathon.sh <slug> <type> "<name>"`
4. 如果 `docs/templates/{type}/hackathon.yml` 存在，用模板内容替换生成的骨架（保留 slug/name/type 字段值）
5. 加载 `references/schema-v2.md`，引导管理员填写必要字段
6. 校验：`bash scripts/validate-hackathon.sh hackathons/<slug>/hackathon.yml`
7. `git add && git commit -m "feat(hackathons): create hackathon {slug}"`
8. 提示：`gh pr create --title "feat(hackathons): add {slug}" --body "..."`

### 4.2 `update-timeline`

1. 收集 `slug`，验证 `hackathons/<slug>/hackathon.yml` 存在
2. 读取并展示当前 timeline
3. 收集修改内容（哪个阶段、新的 start/end）
4. 使用 Edit 工具修改 YAML
5. 校验 → 分支 → commit → 提示创建 PR

### 4.3 `update-track`

1. 收集 `slug`，读取并展示当前 tracks
2. 收集修改内容（rewards、judging criteria、deliverables）
3. Edit YAML → 校验 → 分支 → commit → PR

### 4.4 `close-hackathon`

1. 收集 `slug`，确认活动存在且未 archived
2. 在 `hackathon.yml` 的 `hackathon` 下添加 `status: archived`
3. 分支 → 校验 → commit → PR

### 4.5 `create-profile`

1. 收集 GitHub username
2. `bash scripts/create-profile.sh <username>`
3. 引导编辑 → commit → PR

### 4.6 `submit-project`

1. 收集 hackathon slug、team name、track slug
2. `bash scripts/submit-project.sh <slug> <team> <track>`
3. 引导编辑 → commit → PR

### 4.7 `approve-nda`

1. 收集 `slug` + `username`
2. 查找 NDA Issue：`gh issue list --label "nda-sign,hackathon:{slug}" --search "{username}"`
3. 确认找到后：`gh issue edit <number> --add-label "nda-approved"`
4. 添加 comment 记录审批

---

## 5. 只读操作流程

### 5.1 `list-registrations`

```bash
gh issue list --label "register,hackathon:{slug}" --json number,title,author,createdAt,labels --limit 500
```
格式化为表格输出。

### 5.2 `list-submissions`

扫描 `hackathons/{slug}/submissions/*/project.yml`，读取每个项目的：
- `project.name`、`project.track`、`project.team`、deliverables 状态

### 5.3 `export-scores`

1. `gh issue list --label "judge-score,hackathon:{slug}" --json body,author,title --limit 500`
2. 从每个 Issue body 解析 YAML 评分块
3. 生成 CSV：`judge,team,track,criterion,score,weight,comment`
4. 保存到 `hackathons/{slug}/scores-export.csv`（本地文件，不 commit）

### 5.4 `export-report`

综合报告：活动信息 + 报名统计 + 提交统计 + 评分汇总。

### 5.5 `audit-log`

```bash
git log --oneline --since="{from}" --until="{to}" -- hackathons/{slug}/
```

### 5.6 `audit-permissions`

1. `gh api repos/{owner}/{repo}/collaborators --jq '.[] | {login, role_name}'`
2. 读取 `.github/CODEOWNERS`
3. 对比输出权限矩阵

### 5.7 `audit-secrets`

```bash
gh secret list
```
检查必要 Secrets 是否已配置。

---

## 6. `validate-hackathon.sh` 校验脚本

**位置**：`scripts/validate-hackathon.sh`
**接口**：`bash scripts/validate-hackathon.sh <path-to-hackathon.yml>`
**退出码**：0 = 通过，1 = 失败（错误信息输出到 stderr）
**依赖**：`yq`（YAML CLI 工具）

**校验规则**：
1. `synnovator_version` == `"2.0"`
2. 必填字段存在：`hackathon.name`, `hackathon.slug`, `hackathon.type`, `hackathon.timeline`
3. `hackathon.type` ∈ `{community, enterprise, youth-league, open-source}`
4. `hackathon.slug` 格式：仅 `[a-z0-9-]`
5. Timeline 阶段时间顺序：每个阶段 `start < end`
6. `tracks[].judging.criteria[].weight` 求和 ≈ 1.0（允许浮点误差 ±0.01）
7. 如果 `type == enterprise` 且 `legal.nda.required == true`，则 `legal.nda.url` 不为空

---

## 7. references/ 内容规划

### `references/schema-v2.md`（~200 行）
- hackathon.yml 完整字段结构和约束
- 各 type 的特殊要求
- 示例 YAML 片段

### `references/github-api-patterns.md`（~100 行）
- `gh issue list` 按 label 过滤模式
- `gh api` 调用 collaborators、secrets 接口
- Issue body YAML 评分块解析方法
- CODEOWNERS 文件格式

---

## 8. 验收覆盖

| 验收场景 | 对应设计 |
|---------|---------|
| SC-P-017.1: Skill 安装和可用性 | SKILL.md frontmatter 触发 + 命令清单展示 |
| SC-P-017.2: 活动配置管理 | §4 写操作流程 + validate-hackathon.sh |
| SC-P-017.3: 数据导出 | §5.1-5.4 只读操作 |
| SC-P-017.4: 审计查询 | §5.5-5.7 审计操作 |
