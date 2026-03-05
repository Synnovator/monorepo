# 设计文档对齐方案

> **日期**: 2026-03-05
> **状态**: 已批准
> **范围**: docs/ 目录下所有设计文档与 site/ 实际实现的对齐

## 背景

随着 site/ 实现的演进，多个设计文档与实际代码之间出现了偏差。本方案定义了一个分层的对齐策略，按优先级分三批修复。

## 差距分析总结

### 偏差分类

| 类别 | 问题数 | 严重度 |
|------|--------|--------|
| 事实性错误（文档描述与实现不符） | 12+ | 高 |
| 缺失文档（已实现但未记录的功能） | 10+ | 中 |
| Schema 不对齐（PRD ↔ Zod ↔ 模板三方不一致） | 20+ | 高 |
| 设计 Token 未实现（CSS 缺失 spacing/layout） | 17 | 低 |

### 按文档的偏差程度

| 文档 | 匹配度 | 关键偏差 |
|------|--------|----------|
| design-system.md | ~70% | 17 个 spacing/layout token 未在 CSS 实现；缺少 shadcn/ui 映射层文档 |
| architecture-design.md | ~90% | output mode 已改为 hybrid；未记录新增插件 |
| p0-site-core-design.md | ~85% | 静态渲染改为按需渲染；Pages Functions 从 P1 提前到 P0 |
| smart-forms-design.md | ~95% | 新增组件（CreateProposal、TimelineEditor）未记录 |
| platform.spec.md | ~90% | i18n 使用 `?lang=en` 查询参数而非 URL 路径前缀 |
| infra-setup.md | ~80% | 部署命令过时；缺少环境变量 |
| synnovator-prd.md ↔ content.config.ts | ~75% | 8+ 字段缺失、8 个枚举未校验、类型不匹配 |

---

## 方案：分层修复（Triage & Prioritize）

### Tier 1: 修复事实性错误（本次 PR）

立即修复会误导读者的文档错误。仅修改文档，不改代码。

#### 1.1 architecture-design.md

- **Output mode**: 将 `output: 'static'` 相关描述改为 `output: 'hybrid'`，说明站点已使用 Astro Hybrid + Cloudflare adapter
- **Content Collections 路径**: `src/content/config.ts` → `src/content.config.ts`（Astro 5 新约定）
- **新增插件**: 补充 `@astrojs/mdx`、`@modyfi/vite-plugin-yaml`、`vite-plugin-svgr` 的说明

#### 1.2 p0-site-core-design.md

- **渲染模式**: 说明关键页面使用 `export const prerender = false`（按需渲染），而非构建时静态生成
- **P0/P1 边界调整**: Pages Functions（OAuth、presigned URL）已在 P0 实现，更新阶段划分说明
- **搜索实现**: 更新为浏览器端过滤（非构建时生成 search-index.json）

#### 1.3 platform.spec.md

- **SC-P-002.1 语言切换**: 将 "URL 前缀 `/en/`" 修正为 "查询参数 `?lang=en`"
- **SC-P-002.3 Fallback**: 确认默认语言为中文的行为描述

#### 1.4 infra-setup.md

- **环境变量**: 补充 `GITHUB_OWNER`、`GITHUB_REPO` 到 wrangler.toml `[vars]` 说明
- **兼容性标志**: 补充 `compatibility_flags = ["nodejs_compat"]`
- **部署命令**: 更新为 `wrangler deploy`（生产）和 `wrangler versions upload`（预览）
- **deploy:preview 脚本**: 记录非 main 分支的预览部署方式

#### 1.5 design-system.md

- **Spacing/Layout 状态标注**: 在 spacing 和 layout tokens 章节添加 `[未实现]` 标记，说明这些 token 已规范但 CSS 中尚未定义
- **shadcn/ui 映射层**: 新增章节说明 Neon Forge token → shadcn/ui 语义变量的映射关系
- **Font 变量**: 记录 `--font-heading`、`--font-body`、`--font-code`、`--font-zh` CSS 变量

#### 1.6 docs/README.md

- 确认所有文件引用路径正确，更新 plans/ 目录下的文档列表

---

### Tier 2: 补充缺失文档 ✅ 已完成

> 已在 PR #23 中与 Tier 1 一并完成。

记录已实现但无对应文档的功能。

#### 2.1 更新 architecture-design.md

- **新增 API 端点**: `/api/check-profile`、`/api/auth/logout`
- **依赖更新**: MDX 支持、YAML loader、SVGR、Radix UI
- **React 19**: 记录 React 版本升级

#### 2.2 更新 smart-forms-design.md

- **新增组件**: `CreateProposalForm.tsx`、`TimelineEditor.tsx`、`HackathonTabs.tsx`
- **组件清单同步**: 确保所有 `src/components/` 下的组件在文档中有记录

#### 2.3 更新 platform.spec.md

- **Guides Hub**: 补充 `/guides/index.astro` 页面的验收条件
- **Proposals 页面**: 补充 `/proposals` 和 `/create-proposal` 的验收条件
- **Results 页面**: 补充 `/results/[...slug]` 的验收条件

#### 2.4 新建组件清单文档（可选）

- 如果组件数量持续增长，考虑创建 `docs/specs/component-inventory.md`
- 列出所有 Astro 组件、React 组件、UI 组件及其用途

---

### Tier 3: Schema 与代码对齐（Backlog）

涉及代码修改，需要单独测试。

#### 3.1 PRD ↔ Zod Schema 对齐

**需决策的问题**:
- `weight` 字段：统一为 0-1 小数还是 0-100 整数？（推荐小数，与现有数据一致）
- `judge.expertise`：统一为数组还是字符串？（推荐数组，与 profile schema 一致）
- `sponsors` 结构：使用 `tier` 还是 `role`？（需确认设计意图）

**代码修改**:
- 为 8 个字段添加 enum 校验（`open_to`、`ip_ownership`、`license`、`judging.mode`、`access_control`、`event.type`、`public_vote`、`multi_track_rule`）
- 补充缺失的 Zod 字段（`mentors`、`references`、`deliverables.slides`、`deliverables.attachments`）
- 修复 `judge.expertise` 类型为数组

**PRD 文档修改**:
- 补充 `hacker.nda_signed[]` 和 `hacker.registrations[]` 审计字段到 §6.2
- 统一 weight 格式说明
- 统一 sponsors 字段说明

#### 3.2 模板修复

- 三个模板（community、enterprise、youth-league）补充 `draft` 和 `award` 时间线阶段
- 统一 weight 格式
- 统一 organizer role 枚举值

#### 3.3 CSS Token 实现

- 在 `site/src/styles/global.css` 的 `@theme` 块中添加 6 个 spacing token
- 添加 11 个 layout dimension token
- 添加 `--color-white` 变量，替换 shadcn 映射中的硬编码 `white`

---

## 执行计划

| 阶段 | 范围 | 预计文件数 | 依赖 |
|------|------|-----------|------|
| Tier 1 | 修复 6 个文档的事实性错误 | 6 files | 无 |
| Tier 2 | 补充缺失功能文档 | 3-4 files | Tier 1 合并后 |
| Tier 3 | Schema 对齐 + CSS Token | 5-8 files (含代码) | Tier 2 合并后 + 设计决策确认 |

## 风险

| 风险 | 缓解措施 |
|------|----------|
| Tier 3 Schema 变更可能破坏现有数据 | 先用现有 YAML 数据测试 Zod schema 变更 |
| 文档更新后仍会漂移 | 建议在 PR review 流程中加入 "docs impact" 检查 |
| Tier 3 中的设计决策（weight 格式等）需讨论 | 在 Tier 1/2 执行期间异步收集意见 |
