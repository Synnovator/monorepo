# Acceptance Specs Design — Synnovator 验收规范设计

**日期**: 2026-03-03
**状态**: Approved

## 目标

为 Synnovator 平台制定端到端验收规范，采用 Given-When-Then 格式，覆盖 PRD V3.0 定义的全部用户流程。规范用于最终验收检查，而非执行计划。

## 设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| Self-document 层级 | 独立指南页面 + 页面内嵌引导 | 两者互补，覆盖完整 |
| 验收范围 | 端到端全流程 | Site + Schema + Actions + Issue Templates + Deploy |
| Phase 划分 | 沿用 PRD P0/P1/P2 | 保持一致性 |
| 文件组织 | A+C 混合（角色文件 + Feature Matrix） | 角色视角验收 + 全局追踪 |
| 语言 | 中文，tech term 用英文 | 与团队沟通一致 |
| 平台基础设施 | 独立 platform.spec.md | 跨角色的基础设施单独验收 |

## 文件结构

```
docs/acceptance/
  README.md                 ← Feature Matrix 索引
  organizer.spec.md         ← 组织者验收（10 US）
  hacker.spec.md            ← 参赛者验收（10 US）
  judge.spec.md             ← 评委验收（5 US）
  visitor.spec.md           ← 访客验收（6 US）
  platform.spec.md          ← 平台基础设施验收（9 US）
```

## 编号规范

- **User Story**: `US-{角色}-{三位序号}` → O(组织者), H(参赛者), J(评委), V(访客), P(平台)
- **Scenario**: `SC-{角色}-{Story序号}.{Scenario序号}`
- **Phase 标签**: `[P0]` / `[P1]` / `[P2]`

## Scenario 格式

每个 US 包含 header（角色、前置条件、涉及层），每个 Scenario 使用 Given-When-Then + And/Or 扩展，包含具体值（文件路径、Label 名称等）。
