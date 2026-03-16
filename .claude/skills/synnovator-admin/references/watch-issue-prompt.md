# Watch-Issue AI Triage Prompt

When analyzing a Bug Report or Feature Request issue, generate a triage summary following this structure.

## Input

You receive the issue's:
- `number`: Issue number
- `title`: Issue title (format: `[Bug] ...` or `[Feature] ...`)
- `author`: GitHub username
- `body`: Full issue body with all form fields
- `labels`: Current labels
- `createdAt`: Creation timestamp

## Analysis Steps

1. **Classify** the issue into one of:
   - Bug: UI Bug / 数据问题 / 功能缺陷 / API 错误
   - Feature: 新功能 / 功能增强 / 体验优化

2. **Identify impact** — which pages, modules, or user flows are affected

3. **Assess priority**:
   - P0 紧急: Data loss, security, or complete feature breakage for all users
   - P1 高: Major feature broken for some users, no workaround
   - P2 中: Feature partially broken, workaround exists
   - P3 低: Minor cosmetic issue, enhancement nice-to-have

4. **Map to codebase modules**: `apps/web` / `packages/shared` / `packages/ui` / `hackathons/` / `profiles/` / `scripts/` / `.github/workflows/`

5. **Extract reproduction path** — key steps for agent-browser to reproduce (Bug only)

## Output Template

The comment posted to the issue:

```markdown
## Issue 分诊摘要

**分类**：{classification}
**影响范围**：{affected pages/modules}
**优先级建议**：{P0-P3} — {one-line rationale}
**关联模块**：{codebase modules}

### 摘要
{2-3 sentences summarizing the problem/request and its impact}

### 复现关键路径
{For bugs: numbered steps extracted from issue. For features: N/A}

---
> 讨论达成一致后，请 @allenwoods 确认最终方案。
```
