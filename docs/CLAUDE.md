# CLAUDE.md — docs（设计文档）

本目录是 Synnovator 的文档仓库，包含系统规格、实施计划和用户指南。License: CC0-1.0。

## 目录结构

```
docs/
├── specs/       → 系统规格文档（PRD、设计系统等）
├── acceptance/  → 验收规范（Given-When-Then BDD 格式）
├── plans/       → 实施计划和架构设计
├── guides/      → 指南（基础设施配置、用户指南）
└── README.md    → 文档导航
```

## 文档类型

| 类型 | 位置 | 说明 | 权威性 |
|------|------|------|--------|
| PRD | `specs/synnovator-prd.md` | 权威数据 Schema 和架构设计 | **权威源** — Schema 和架构以此为准 |
| 设计系统 | `specs/design-system.md` | Neon Forge 主题：色彩、字体、间距、布局 | **权威源** — UI 设计以此为准 |
| 验收规范 | `acceptance/*.spec.md` | 按角色组织的 Given-When-Then 验收场景 | **权威源** — 功能验收以此为准 |
| 指南 | `guides/*.md` | 基础设施配置、用户操作指南 | **当前** — 反映实际配置 |
| 计划 | `plans/YYYY-MM-DD-*.md` | 实施计划和设计决策 | **历史参考** — 完成后仅供追溯 |

### 关键指南

| 文件 | 说明 |
|------|------|
| `guides/infra-setup.md` | Cloudflare Workers + R2 + GitHub OAuth 配置 |
| `guides/hackathons-user-flow.md` | 参赛者操作流程 |
| `guides/hackers-user-flow.md` | Hacker Profile 操作流程 |

## 文档编写规范

- 文档主体使用**中文**，技术术语保留英文原文
- 使用 Markdown 格式，标题层级不超过 4 级
- 代码示例使用 fenced code blocks，标注语言类型

### 命名约定

- 规格文档：`{domain}-spec.md` 或 `{domain}-prd.md`
- 设计系统：`design-system.md`
- 计划文档：`YYYY-MM-DD-{name}.md`
- 验收规范：`{role}.spec.md`
- 指南：`guides/{topic}.md` 或 `guides/{role}-guide.md`

## 校验命令

```bash
bash scripts/validate-hackathon.sh docs/templates/community/hackathon.yml  # 校验模板 YAML
```

模板位于 `templates/{community,enterprise,youth-league}/hackathon.yml`，作为新活动的起点模板。

## 注意事项

- 修改 spec 后检查交叉引用是否仍然正确
- 添加新文档时更新 `README.md` 的文档导航
- 设计系统变更需同步检查 `apps/web/CLAUDE.md` 中的引用
- `plans/` 文档在实施完成后为**只读历史**，不应再修改
