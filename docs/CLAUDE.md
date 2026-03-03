# CLAUDE.md — docs（设计文档）

本目录是 Synnovator 的文档仓库，包含系统规格、实施计划和用户指南。License: CC0-1.0。

## 目录结构

```
docs/
├── specs/       → 系统规格文档（PRD、设计系统等）
├── acceptance/  → 验收规范（Given-When-Then BDD 格式）
├── plans/       → 实施计划和架构设计
├── *-guide.md   → 用户指南（组织者、参赛者、评委）
└── README.md    → 文档导航
```

## 文档类型

| 类型 | 位置 | 说明 |
|------|------|------|
| PRD | `specs/synnovator-prd.md` | 权威数据 Schema 和架构设计 |
| 设计系统 | `specs/design-system.md` | Neon Forge 主题：色彩、字体、间距、布局 |
| 验收规范 | `acceptance/*.spec.md` | 按角色组织的 Given-When-Then 验收场景 |
| 计划 | `plans/YYYY-MM-DD-*.md` | 实施计划和设计决策 |
| 用户指南 | `*-guide.md` | 面向组织者/参赛者/评委的操作指南 |

## 文档编写规范

- 文档主体使用**中文**，技术术语保留英文原文
- 使用 Markdown 格式，标题层级不超过 4 级
- 代码示例使用 fenced code blocks，标注语言类型

### 命名约定

- 规格文档：`{domain}-spec.md` 或 `{domain}-prd.md`
- 计划文档：`YYYY-MM-DD-{name}.md`
- 用户指南：`{role}-guide.md`

## 注意事项

- 修改 spec 后检查交叉引用是否仍然正确
- 添加新文档时更新 `README.md` 的文档导航
