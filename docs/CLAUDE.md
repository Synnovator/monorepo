# CLAUDE.md — docs（设计文档）

本目录是 Synnovator 的文档仓库，包含系统规格和实施计划。License: CC0-1.0。

## 目录结构

```
docs/
├── specs/       → 系统规格文档
└── plans/       → 实施计划
```

## 文档编写规范

- 文档主体使用**中文**，技术术语保留英文原文
- 使用 Markdown 格式，标题层级不超过 4 级
- 代码示例使用 fenced code blocks，标注语言类型

### 命名约定

- 规格文档：`{domain}-spec.md`
- 计划文档：`YYYY-MM-DD-{name}.md`

## 注意事项

- 修改 spec 后检查交叉引用是否仍然正确
- 添加新文档时更新 `README.md` 的文档导航
