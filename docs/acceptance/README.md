# Synnovator 验收规范 — Feature Matrix 索引

> **版本**: 1.0
> **日期**: 2026-03-03
> **格式**: Given-When-Then (BDD)
> **阶段划分**: 沿用 PRD V3.2 的 P0 / P1 / P2

## 使用说明

本目录包含 Synnovator 平台的端到端验收规范，按角色组织。每个 `.spec.md` 文件包含该角色的所有 User Story 和 Scenario，使用标准 Given-When-Then 格式。

### 验收流程

1. 按 Phase 筛选待验收的 User Story
2. 逐个执行 Scenario 中描述的操作
3. 对照 Then 条件检查实际结果
4. 在下方 Feature Matrix 更新状态

### 编号规范

- **User Story**: `US-{角色}-{三位序号}` — O(组织者), H(参赛者), J(评委), V(访客), P(平台)
- **Scenario**: `SC-{角色}-{Story序号}.{Scenario序号}`
- **状态**: ⬜ 待验收 / ✅ 通过 / ❌ 未通过

---

## Feature Matrix

### P0 — MVP（Month 1-2）

| ID | Feature | 角色 | Scenario 数 | 规范文件 | 状态 |
|----|---------|------|-------------|---------|------|
| US-O-001 | 创建 Hackathon 活动 | 组织者 | 4 | [organizer.spec.md](organizer.spec.md) | ⬜ |
| US-O-002 | 配置 Track 与奖项 | 组织者 | 3 | [organizer.spec.md](organizer.spec.md) | ⬜ |
| US-O-003 | 管理活动时间线（7 阶段） | 组织者 | 3 | [organizer.spec.md](organizer.spec.md) | ⬜ |
| US-O-004 | 配置评委与评分规则 | 组织者 | 2 | [organizer.spec.md](organizer.spec.md) | ⬜ |
| US-O-005 | 发布活动事件 | 组织者 | 2 | [organizer.spec.md](organizer.spec.md) | ⬜ |
| US-O-006 | 设置 FAQ | 组织者 | 2 | [organizer.spec.md](organizer.spec.md) | ⬜ |
| US-H-001 | 创建个人 Profile | 参赛者 | 4 | [hacker.spec.md](hacker.spec.md) | ⬜ |
| US-H-002 | 浏览活动列表 | 参赛者 | 3 | [hacker.spec.md](hacker.spec.md) | ⬜ |
| US-H-003 | 查看活动详情 | 参赛者 | 3 | [hacker.spec.md](hacker.spec.md) | ⬜ |
| US-H-004 | 报名参加活动 | 参赛者 | 4 | [hacker.spec.md](hacker.spec.md) | ⬜ |
| US-H-005 | 提交项目 | 参赛者 | 4 | [hacker.spec.md](hacker.spec.md) | ⬜ |
| US-H-006 | 查看个人 Profile 页面 | 参赛者 | 2 | [hacker.spec.md](hacker.spec.md) | ⬜ |
| US-J-001 | 查看待评分项目列表 | 评委 | 2 | [judge.spec.md](judge.spec.md) | ⬜ |
| US-J-002 | 提交评分 | 评委 | 3 | [judge.spec.md](judge.spec.md) | ⬜ |
| US-V-001 | 浏览活动列表 | 访客 | 2 | [visitor.spec.md](visitor.spec.md) | ⬜ |
| US-V-002 | 查看活动详情 | 访客 | 2 | [visitor.spec.md](visitor.spec.md) | ⬜ |
| US-V-003 | 查看参赛者 Profile | 访客 | 2 | [visitor.spec.md](visitor.spec.md) | ⬜ |
| US-V-004 | 查看项目展示 | 访客 | 2 | [visitor.spec.md](visitor.spec.md) | ⬜ |
| US-V-006 | 查看操作指南 | 访客 | 3 | [visitor.spec.md](visitor.spec.md) | ⬜ |
| US-P-001 | Astro 站点构建与部署 (CF Pages) | 平台 | 4 | [platform.spec.md](platform.spec.md) | ⬜ |
| US-P-002 | 双语支持 (i18n) | 平台 | 3 | [platform.spec.md](platform.spec.md) | ⬜ |
| US-P-003 | GitHubRedirect 组件 | 平台 | 3 | [platform.spec.md](platform.spec.md) | ⬜ |
| US-P-004 | YAML Schema 校验 | 平台 | 4 | [platform.spec.md](platform.spec.md) | ⬜ |
| US-P-005 | 状态自动管理 | 平台 | 3 | [platform.spec.md](platform.spec.md) | ⬜ |
| US-P-006 | Self-document 指南系统 | 平台 | 3 | [platform.spec.md](platform.spec.md) | ⬜ |
| US-P-011 | CF Pages 项目初始化 | 平台 | 3 | [platform.spec.md](platform.spec.md) | ⬜ |
| US-P-012 | R2 存储桶初始化 | 平台 | 3 | [platform.spec.md](platform.spec.md) | ⬜ |
| US-P-013 | Presigned URL 安全鉴权 | 平台 | 4 | [platform.spec.md](platform.spec.md) | ⬜ |
| US-P-014 | GitHub OAuth 集成 | 平台 | 3 | [platform.spec.md](platform.spec.md) | ⬜ |
| US-P-015 | GitHub Secrets 与凭证管理 | 平台 | 3 | [platform.spec.md](platform.spec.md) | ⬜ |
| US-P-016 | Monorepo 管理后端与 RBAC | 平台 | 4 | [platform.spec.md](platform.spec.md) | ⬜ |
| US-P-017 | synnovator-admin CLI Skill | 平台 | 4 | [platform.spec.md](platform.spec.md) | ⬜ |

### P1 — Git-native Workflows（Month 3-4）

| ID | Feature | 角色 | Scenario 数 | 规范文件 | 状态 |
|----|---------|------|-------------|---------|------|
| US-O-007 | 配置 NDA 签署流程 | 组织者 | 2 | [organizer.spec.md](organizer.spec.md) | ⬜ |
| US-O-008 | 管理 Dataset 资源 | 组织者 | 2 | [organizer.spec.md](organizer.spec.md) | ⬜ |
| US-O-009 | 处理申诉 Appeal | 组织者 | 3 | [organizer.spec.md](organizer.spec.md) | ⬜ |
| US-O-010 | 配置 AI Review | 组织者 | 2 | [organizer.spec.md](organizer.spec.md) | ⬜ |
| US-H-007 | 签署 NDA | 参赛者 | 3 | [hacker.spec.md](hacker.spec.md) | ⬜ |
| US-H-008 | 组队/找队友 | 参赛者 | 3 | [hacker.spec.md](hacker.spec.md) | ⬜ |
| US-H-009 | 提交申诉 | 参赛者 | 2 | [hacker.spec.md](hacker.spec.md) | ⬜ |
| US-H-010 | 双轨道提交 | 参赛者 | 3 | [hacker.spec.md](hacker.spec.md) | ⬜ |
| US-J-003 | 声明利益冲突 | 评委 | 2 | [judge.spec.md](judge.spec.md) | ⬜ |
| US-J-004 | 结构化评分（加权计算） | 评委 | 3 | [judge.spec.md](judge.spec.md) | ⬜ |
| US-J-005 | 查看评分结果汇总 | 评委 | 2 | [judge.spec.md](judge.spec.md) | ⬜ |
| US-V-005 | 参与公众投票 | 访客 | 2 | [visitor.spec.md](visitor.spec.md) | ⬜ |
| US-P-007 | R2 文件上传 | 平台 | 3 | [platform.spec.md](platform.spec.md) | ⬜ |
| US-P-008 | AI Review Workflow | 平台 | 2 | [platform.spec.md](platform.spec.md) | ⬜ |
| US-P-009 | AI Team Matching | 平台 | 2 | [platform.spec.md](platform.spec.md) | ⬜ |

### P2 — Enhancement（Month 5+）

| ID | Feature | 角色 | Scenario 数 | 规范文件 | 状态 |
|----|---------|------|-------------|---------|------|
| US-P-010 | 代码抄袭检测 | 平台 | 2 | [platform.spec.md](platform.spec.md) | ⬜ |

---

## 统计

| 维度 | P0 | P1 | P2 | 合计 |
|------|----|----|----|----|
| User Story | 31 | 16 | 1 | 48 |
| Scenario (预估) | ~90 | ~37 | ~2 | ~129 |

## 规范文件

| 文件 | 角色 | User Story 数 |
|------|------|---------------|
| [organizer.spec.md](organizer.spec.md) | 组织者 | 10 |
| [hacker.spec.md](hacker.spec.md) | 参赛者 | 10 |
| [judge.spec.md](judge.spec.md) | 评委 | 5 |
| [visitor.spec.md](visitor.spec.md) | 访客 | 6 |
| [platform.spec.md](platform.spec.md) | 平台基础设施 | 17 |
