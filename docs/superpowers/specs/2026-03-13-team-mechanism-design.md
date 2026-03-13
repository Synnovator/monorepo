# 完善组队管理机制 — 设计文档

> **Issue**: [#51](https://github.com/Synnovator/monorepo/issues/51)
> **日期**: 2026-03-13
> **状态**: Draft

## 1. 背景与目标

当前组队机制基于 GitHub Issue 实现，存在以下问题：

- 队伍不是独立实体，仅作为 submission 的嵌入数据（`project.team[]`）
- 组队 Issue 与 submission 数据不联动
- 缺少「我的队伍」视图、申请加入、退出、成员管理等完整生命周期
- 注册表单中的 Team Lead / Team Member 角色概念模糊

**目标**：将 Team 提升为仓库根级一等公民实体，建立完全 PR-driven 的团队生命周期管理，清除旧 Issue-based 组队流程。

## 2. 核心设计决策

| 决策 | 结论 | 理由 |
|------|------|------|
| Team 独立性 | 独立于活动，仓库根级 `teams/` 目录 | 一个 team 可参加多个活动，生命周期不绑定单个 hackathon |
| 创建时机 | 队长提 PR 创建 `team.yml` | 发起创建者天然成为 Team Leader |
| 加入机制 | 成员提 PR 编辑 `team.yml` → 队长 PR 评论 `/approve` → Action 合并 | Git-native，审计完整 |
| 退出机制 | 成员自主提 PR 移除自己，自动合并；队长可直接移除他人 | 退出是个人权利，队长有管理权 |
| 一人一队 | 全局限制，检查 profile 的 `hacker.team` 字段 | 简单校验，单一数据源 |
| project.yml 关联 | `team_ref` 路径引用替代内嵌 `team[]` | team.yml 是 single source of truth |
| 注册角色 | 简化为 participant / mentor / observer，移除 team 角色（team-lead / team-member）。judge 不通过注册表单，而是由 organizer 在 hackathon.yml 中指定 | 队长身份由创建 team.yml 获得，不需要注册时声明 |
| Issue-based 组队 | 完全移除 | PR-based 流程取代 |
| 状态传导 | team 报名活动 → 全员自动注册 | 成员不再需要单独注册同一活动 |

## 3. 数据模型

### 3.1 全局角色枚举

分层角色体系，新增 `packages/shared/src/schemas/roles.ts`：

```
TopLevelRole
├── Hacker
│   ├── developer
│   ├── product         # 产品经理/产品负责人
│   ├── designer
│   ├── marketing
│   └── researcher
├── Mentor
├── Judge
└── Observer
```

**各场景使用范围**：

| 场景 | 允许的角色 | 字段 |
|------|-----------|------|
| team.yml `members[].role` | Hacker 子类型（developer / product / designer / marketing / researcher） | `role` |
| team.yml `looking_for.roles` | Hacker 子类型枚举值 | `roles[]` |
| profile `registrations[].role` | participant / mentor / observer | `role` |
| profile `looking_for.roles` | 自由文本数组（如 "Frontend Developer"），不受枚举限制（面向人类阅读的标签） | `roles[]` |
| hackathon.yml `judges[]` | 由 organizer 配置，不通过注册表单 | — |
| submission `project.yml` | 不再包含团队角色（通过 `team_ref` 关联），保留 `mentors[]` | — |

**PRD 更新**：PRD §6.4 中 `project.team[].role` 枚举（leader / developer / designer / researcher / mentor）已废弃，由 `team.yml` 的 `members[].role` + 独立 `leader` 字段替代。需在 PRD 更新中移除该枚举行，新增 `team.yml` 角色枚举说明。

组队场景下 `members[].role` 限定为 Hacker 子类型。`Mentor` 角色不参与组队，但可在 hackathon 级别通过 `mentor_rules` 配置参与贡献。

### 3.2 `team.yml` Schema

**路径**: `teams/{team-slug}/team.yml`

```yaml
synnovator_team: "1.0"
name: "Team Awesome"
name_zh: "牛逼队"                    # 可选
status: recruiting                    # recruiting | formed | disbanded
leader: "alice-dev"                   # GitHub username，创建者即队长
members:                              # 不含队长
  - github: "bob-ai"
    role: developer
    joined_at: "2026-03-10"
  - github: "carol-ml"
    role: designer
    joined_at: "2026-03-11"
looking_for:                          # 可选，status=recruiting 时有意义
  roles: ["researcher", "designer"]       # Hacker 子类型枚举值
  description: "需要一位有 ML 经验的研究员和一位 UI 设计师"
hackathons:                           # team 的参赛记录
  - hackathon: "ai-hackathon-2026"
    track: "nlp"
    registered_at: "2026-03-10"
  - hackathon: "climate-hack-2026"
    track: "green-ai"
    registered_at: "2026-04-01"
created_at: "2026-03-10"
```

### 3.3 Profile 变更

`hacker.team` 提升为顶级字段，使用 team slug（与 hackathon slug 引用方式一致，数据读取层解析为 `teams/{slug}/team.yml`）：

```yaml
hacker:
  team: "team-awesome"                # team slug，全局唯一队伍引用，一人一队
  registrations:
    - hackathon: "ai-hackathon-2026"
      track: "nlp"
      role: participant
      registered_at: "2026-03-08"
```

**移除** `registrations[].team` 旧字段（per-registration 团队引用被顶级 `hacker.team` 替代）。

### 3.4 `project.yml` 变更

替换 `project.team[]` 为 slug 引用：

```yaml
project:
  name: "AI Assistant"
  track: "nlp"
  team_ref: "team-awesome"            # team slug，读取层解析为 teams/{slug}/team.yml
  deliverables:
    repo: "https://github.com/..."
```

移除 `project.team[]`。

**`project.mentors[]` 保留**：mentor 不是 team 成员（不受一人一队限制），且 `mentor_rules.max_contribution_pct` 需要在 submission 级别跟踪 mentor 参与。mentors 信息仍内嵌在 `project.yml` 中。

## 4. 工作流与 Actions

### 4.1 新增 Workflow

| Workflow | 触发条件 | 职责 |
|----------|----------|------|
| `validate-team.yml`（重写） | PR 修改 `teams/**` | 校验 schema、leader profile 存在、新成员 `hacker.team` 无值、author 权限、team size 上限（见 §4.3） |
| `sync-team-data.yml` | PR 合并到 main 且修改 `teams/**` | 单一 workflow 处理所有 profile 联动：diff 成员变更 → 更新 `hacker.team`；diff `hackathons[]` 变更 → 更新 `registrations[]`。避免多 workflow 竞态条件 |
| `team-join-approval.yml` | PR comment 包含 `/approve` | 校验评论者 = team leader → 自动合并该 PR |

### 4.2 操作 → Workflow 映射

**创建队伍**:
```
队长提 PR 创建 teams/{slug}/team.yml
→ validate-team.yml 校验
→ 合并
→ sync-team-data.yml 更新队长 profile.hacker.team
```

**加入队伍**:
```
成员提 PR 编辑 team.yml（追加自己到 members）
→ validate-team.yml 校验（含一人一队检查）
→ 队长在 PR 评论 /approve
→ team-join-approval.yml 自动合并
→ sync-team-data.yml 更新成员 profile.hacker.team
```

**退出队伍**:
```
成员提 PR 编辑 team.yml（移除自己）
→ validate-team.yml 校验 author = 被移除的 github
→ 自动合并（无需队长批准）
→ sync-team-data.yml 清除成员 profile.hacker.team
```

**队长移除成员**:
```
队长提 PR 编辑 team.yml（移除某成员）
→ validate-team.yml 校验 author = leader
→ 自动合并
→ sync-team-data.yml 清除被移除者 profile.hacker.team
```

**报名活动**:
```
队长提 PR 编辑 team.yml（追加 hackathons[] 条目）
→ validate-team.yml 校验活动存在 + 时间窗口
→ 合并
→ sync-team-data.yml 为全员追加 registrations[]
```

**提交项目**:
```
队长提 PR 创建 project.yml（含 team_ref）
→ validate-submission.yml 校验 team_ref 有效 + team status ≠ disbanded
```

**转让队长**:
```
队长提 PR 修改 team.yml（leader 改为某 member，自己加入 members）
→ validate-team.yml 校验 author = 当前 leader，新 leader 在 members 中
→ 自动合并
```

**队长退出**:
```
队长不可直接退出。必须先转让队长（见上），再以普通成员身份退出。
如果队伍仅剩队长一人，退出 = 解散（status → disbanded）。
```

### 4.3 Team Size 校验

Team 是全局实体，不绑定单个活动的 `team_size` 限制。校验分两层：

1. **全局层（validate-team.yml）**：不限制成员数量上限（team 可以是一个大社区）
2. **活动层（validate-team.yml，当 `hackathons[]` 变更时）**：校验 `leader + members.length` 满足目标活动的 `eligibility.team_size.min/max`。如果活动设置 `allow_solo: false`，则 min 至少为 2

### 4.4 Team 解散后果

当 `status` 变更为 `disbanded`：

- 所有成员的 `hacker.team` 被 `sync-team-data.yml` 清除
- 已有的 `project.yml`（含 `team_ref` 指向此 team）**不受影响**（已提交的项目是历史记录）
- 新提交被 `validate-submission.yml` 拒绝（`team status = disbanded`）
- 队伍详情页仍可访问（只读，展示 disbanded 标签），不删除历史数据

## 5. 前端变更

### 5.1 新增组件/页面

| 组件/页面 | 路径 | 说明 |
|-----------|------|------|
| `CreateTeamForm.tsx` | `apps/web/components/forms/` | 填写队名、looking_for → 生成创建 `team.yml` 的 PR URL |
| 队伍详情页 | `apps/web/app/(public)/teams/[team]/page.tsx` | 队伍信息、成员列表、参赛记录、操作按钮 |
| 队伍列表页 | `apps/web/app/(public)/teams/page.tsx` | 全局队伍浏览，按 status 分组（recruiting 优先） |
| `TeamCard.tsx` | `apps/web/components/` | 队伍卡片（队名、状态标签、成员头像、looking_for 摘要） |
| `JoinTeamButton.tsx` | `apps/web/components/` | 生成编辑 team.yml 追加自己的 PR URL |
| `LeaveTeamButton.tsx` | `apps/web/components/` | 生成移除自己的 PR URL |
| `MyTeam.tsx` | `apps/web/components/` | 「我的队伍」卡片，读取当前用户 profile 的 `hacker.team` |

### 5.2 改造组件

| 组件 | 变更 |
|------|------|
| `TeamsTab.tsx` | 从链接 GitHub Issues → 读取 `teams/` 目录渲染 TeamCard 列表，按活动过滤 |
| `RegisterForm.tsx` | 角色选项简化为 participant / mentor / observer（与 PRD 一致），移除 team-lead / team-member 选项及所有 team 相关字段 |
| 项目详情页 `[team]/page.tsx` | 成员展示从读 `project.team[]` → 通过 `team_ref` 读 `team.yml` |
| `CreateProposalForm.tsx` | Step 2 移除手动填写队员，改为自动填入用户所在 team 的 `team_ref` |

### 5.3 删除组件

| 组件 | 原因 |
|------|------|
| `TeamFormationForm.tsx` | Issue-based 组队表单，替换为 `CreateTeamForm.tsx` |

### 5.4 "+创建" 菜单

全局导航的 "+创建" 下拉新增「创建队伍」选项，直接跳转 `/teams/create`。

### 5.5 队伍详情页操作按钮

根据当前用户身份动态显示：

- **非成员** → 「申请加入」（生成编辑 team.yml 的 PR URL）
- **成员** → 「退出队伍」（生成移除自己的 PR URL）
- **队长** → 「管理成员」/「修改状态」/「转让队长」（生成编辑 PR URL）

### 5.6 数据读取层

`packages/shared/src/data/readers/teams.ts` 新增：

```typescript
listTeams()                    // 所有 team.yml
getTeamBySlug(slug)            // 单个 team
getTeamsByHackathon(hackathon) // 通过 team.hackathons[] 过滤
getTeamByMember(github)        // 通过 members + leader 匹配
```

## 6. 清除旧逻辑

### 6.1 删除文件

| 文件 | 原因 |
|------|------|
| `.github/ISSUE_TEMPLATE/team-formation.yml` | Issue-based 组队移除 |
| `apps/web/components/forms/TeamFormationForm.tsx` | 替换为 CreateTeamForm |

### 6.2 重写文件

| 文件 | 变更 |
|------|------|
| `.github/workflows/validate-team.yml` | 从 Issue-based 校验 → PR-based 校验 |

### 6.3 Schema 变更

| 文件 | 变更 |
|------|------|
| `packages/shared/src/schemas/submission.ts` | 移除 `submissionTeamMemberSchema`，`project.team[]` → `project.team_ref: z.string()`，保留 `project.mentors[]` |

### 6.4 i18n 清理

移除旧 key：`hackathon.teams_browse`、`hackathon.teams_browse_link`、`hackathon.teams_post`、`hackathon.teams_not_available`、`form.register.select_team`、`form.register.team_name`

新增 team 管理相关 key（创建队伍、加入、退出、成员管理、状态标签等）。

### 6.5 文档更新

| 文件 | 变更 |
|------|------|
| `docs/specs/synnovator-prd.md` | H9 重写（PR 创建 team.yml）、H10 重写（PR 编辑 team.yml + /approve）、RegisterForm 角色简化 |
| `docs/plans/2026-03-08-hackers-user-flow.md` | 更新组队流程描述 |
| `docs/acceptance/hacker.spec.md` | 更新组队验收场景 |
| `CLAUDE.md` | 目录导航新增 `teams/` |

## 7. 完整变更清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `teams/` | 新顶级目录 |
| `teams/_schema.yml` | team.yml 的 YAML schema 文档 |
| `packages/shared/src/schemas/team.ts` | Zod schema |
| `packages/shared/src/schemas/roles.ts` | 全局角色枚举 |
| `packages/shared/src/data/readers/teams.ts` | 数据读取函数 |
| `.github/workflows/validate-team.yml` | PR-based 校验（重写） |
| `.github/workflows/sync-team-data.yml` | 成员 ↔ profile 联动 + 活动报名传导（合并为单一 workflow 避免竞态） |
| `.github/workflows/team-join-approval.yml` | 队长 /approve 触发合并 |
| `apps/web/components/forms/CreateTeamForm.tsx` | 创建队伍表单 |
| `apps/web/components/TeamCard.tsx` | 队伍卡片 |
| `apps/web/components/JoinTeamButton.tsx` | 申请加入按钮 |
| `apps/web/components/LeaveTeamButton.tsx` | 退出按钮 |
| `apps/web/components/MyTeam.tsx` | 我的队伍组件 |
| `apps/web/app/(public)/teams/page.tsx` | 队伍列表页 |
| `apps/web/app/(public)/teams/[team]/page.tsx` | 队伍详情页 |

### 修改文件

| 文件 | 变更 |
|------|------|
| `packages/shared/src/schemas/submission.ts` | 移除 `submissionTeamMemberSchema`，`project.team[]` → `project.team_ref: z.string()` |
| `packages/shared/src/schemas/profile.ts` | 新增 `hacker.team` 顶级字段，移除 `registrations[].team` |
| `apps/web/components/TeamsTab.tsx` | 改为读 teams 数据 |
| `apps/web/components/forms/RegisterForm.tsx` | 移除 team-lead / team-member 角色，保留 participant / mentor / observer |
| `apps/web/components/forms/CreateProposalForm.tsx` | 移除手动填队员，改用 `team_ref` |
| `apps/web/app/(public)/projects/[hackathon]/[team]/page.tsx` | 通过 `team_ref` 读成员 |
| `apps/web/scripts/generate-static-data.mjs` | 新增 `collectTeams()` 函数收集 `teams/` 数据 |
| `packages/shared/src/i18n/en.json` | 移除旧 key，新增 team 管理 key |
| `packages/shared/src/i18n/zh.json` | 同上 |
| `profiles/_schema.yml` | 新增 `hacker.team` 顶级字段说明，移除 `registrations[].team` |
| `docs/specs/synnovator-prd.md` | H9/H10 重写，角色简化，§6.4 移除 `project.team[].role` 枚举、新增 `team.yml` 角色枚举 |
| `docs/plans/2026-03-08-hackers-user-flow.md` | 更新组队流程描述 |
| `docs/acceptance/hacker.spec.md` | 更新组队验收场景 |
| `CLAUDE.md` | 目录导航新增 `teams/` |

### 删除文件

| 文件 | 原因 |
|------|------|
| `.github/ISSUE_TEMPLATE/team-formation.yml` | Issue-based 组队移除 |
| `apps/web/components/forms/TeamFormationForm.tsx` | 替换为 CreateTeamForm |

## 8. 迁移

当前平台尚未有实际组队数据（无已组建的 team、无含 `project.team[]` 的 submission），因此无需数据迁移。变更为纯代码/schema/workflow 替换。

如果在实施前产生了 team-formation Issues，需手动关闭并引导用户通过新的 PR 流程创建 team。
