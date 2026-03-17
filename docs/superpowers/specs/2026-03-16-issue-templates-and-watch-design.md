# Issue Templates + Watch-Issue Skill 设计

> **日期**：2026-03-16
> **状态**：Draft
> **范围**：GitHub Issue 模板、字段验证 Workflow、Stale 机制、watch-issue Skill

## 1. 背景与目标

Synnovator 仓库已有 5 个面向参与者的 Issue 模板（registration、judge-score、nda-sign、team-formation、appeal），但缺少 **Bug Report** 和 **Feature Request** 模板。

**目标**：
- 引导 issue 提交者提供完整、可复现的信息
- 自动化字段完整性检查，信息不足时提醒并限时补充
- 为管理员提供 AI 驱动的 issue 分诊和摘要能力

**非目标**：
- 不做提交者身份限制（任何人都可以提交）
- 不自动分配 issue 给具体开发者

## 2. 交付物

| 交付物 | 路径 | 说明 |
|--------|------|------|
| Bug Report 模板 | `.github/ISSUE_TEMPLATE/bug-report.yml` | Issue Form 格式 |
| Feature Request 模板 | `.github/ISSUE_TEMPLATE/feature-request.yml` | Issue Form 格式 |
| 模板选择器配置 | `.github/ISSUE_TEMPLATE/config.yml` | 禁用空白 issue |
| Bug 验证 Workflow | `.github/workflows/validate-bug.yml` | 字段完整性检查 |
| Feature 验证 Workflow | `.github/workflows/validate-feature.yml` | 字段完整性检查 |
| Stale Workflow | `.github/workflows/stale.yml` | needs-info 超时关闭 |
| watch-issue Skill | `.claude/skills/synnovator-admin/` | AI 分诊 + 摘要 |

## 3. Issue 模板设计

### 3.1 Bug Report (`bug-report.yml`)

**前置引导**（markdown 区域）：
- 提交前确认已在 [home.synnovator.space](https://home.synnovator.space) 上操作并确认问题存在
- 提交前确认已阅读 [PRD](docs/specs/synnovator-prd.md) 中相关功能描述，确认是 Bug 而非预期行为
- 提交前确认已搜索已有 Issues，无重复报告

**自动 label**：`bug`

**标题格式**：`[Bug] {简要描述}`

**字段**：

| ID | 类型 | 标签 | 必填 | 说明 |
|----|------|------|------|------|
| `role` | dropdown | 你的身份 | 是 | 参赛选手 / 评委 / 主办方管理员 / 访客 |
| `hackathon-url` | input | 相关活动页面 URL | 否 | 须匹配 `https://home.synnovator.space/*` |
| `steps` | textarea | 复现步骤 | 是 | 逐步操作描述，含正反例引导 |
| `expected` | textarea | 期望行为 | 是 | 正确结果应该是什么 |
| `actual` | textarea | 实际行为 | 是 | 实际发生了什么，含错误信息 |
| `browser` | dropdown | 浏览器 | 是 | Chrome / Firefox / Safari / Edge / 其他 |
| `device` | dropdown | 设备类型 | 是 | 桌面端 / 移动端 |
| `screenshots` | textarea | 截图或录屏 | 否 | 拖拽上传 |
| `extra` | textarea | 补充信息 | 否 | 控制台报错、网络请求等 |

**复现步骤正反例引导**：

```
❌ "无法创建团队"
✅ "1. 登录账号 xxx  2. 进入活动 test-youth-hackathons
    3. 点击'创建团队'  4. 填写团队名称、简介
    5. 点击'前往 GitHub 创建团队'
    6. 页面显示 'Unauthorized User'，且返回后已填信息丢失"
```

### 3.2 Feature Request (`feature-request.yml`)

**前置引导**：
- 提交前确认已在 [home.synnovator.space](https://home.synnovator.space) 上体验现有功能
- 提交前确认已阅读 [PRD](docs/specs/synnovator-prd.md)，确认功能尚未规划或实现
- 提交前确认已搜索已有 Issues，无重复提议

**自动 label**：`enhancement`

**标题格式**：`[Feature] {简要描述}`

**字段**：

| ID | 类型 | 标签 | 必填 | 说明 |
|----|------|------|------|------|
| `problem` | textarea | 你遇到了什么问题或痛点？ | 是 | 具体场景描述，含正反例引导 |
| `solution` | textarea | 你建议的解决方案 | 是 | 期望的功能表现 |
| `alternatives` | textarea | 你考虑过的替代方案 | 否 | 已尝试的其他方式 |
| `scope` | dropdown | 影响的用户群体 | 是 | 所有用户 / 参赛选手 / 评委 / 主办方 / 访客 |
| `references` | textarea | 参考资料 | 否 | 竞品截图、文章、设计草图 |

**问题描述正反例引导**：

```
❌ "希望增加通知功能"
✅ "我作为参赛选手，注册活动后无法得知活动时间线变更（如截止日期延期），
    每次都要手动去活动页面查看，曾因此错过提交窗口"
```

### 3.3 模板选择器 (`config.yml`)

```yaml
blank_issues_enabled: false
contact_links:
  - name: "使用帮助"
    url: https://home.synnovator.space
    about: 如果你不确定是否是 Bug，请先浏览平台
  - name: "一般性问题"
    url: https://github.com/Synnovator/monorepo/discussions
    about: 提问、讨论、或寻求使用帮助
```

强制所有 issue 必须选择模板，防止信息不完整的空白 issue。非 Bug / Feature 的一般性问题引导至 Discussions。

## 4. Validate Workflows

### 4.1 `validate-bug.yml`

**触发**：`issues: [opened, edited, labeled]`（含 `labeled` 以处理 Issue Forms label 异步添加的竞态条件），与现有 `validate-register.yml` 等 workflow 保持一致。

**Guard 条件**：
```yaml
if: |
  contains(github.event.issue.labels.*.name, 'bug') &&
  (github.event.action != 'labeled' || github.event.label.name == 'bug')
```

**权限**：
```yaml
permissions:
  issues: write
  contents: read
```

**检查逻辑**：解析 issue body，验证以下必填字段非空：
- `role`（身份）
- `steps`（复现步骤）
- `expected`（期望行为）
- `actual`（实际行为）
- `browser`（浏览器）
- `device`（设备类型）

附加检查：如果 `hackathon-url` 非空，验证其匹配 `https://home.synnovator.space/*`。

**Label 状态机**：
- 任何必填字段为空 → 添加 `needs-info` label + 留评论列出缺少字段（引用模板中的好例子）
- 所有字段完整 → 添加 `triaged` label + 移除 `needs-info`（如之前有）
- 用户编辑 issue 触发 `edited` 事件 → 重新验证：通过则移除 `needs-info` 加 `triaged`，仍不通过则更新评论列出剩余缺失字段

**注意**：仅 `edited` 事件（用户修改 issue body）触发重新验证。用户仅发表评论不会触发 validate workflow，因此不会绕过字段检查（见 §5.1 中 stale 配置对评论的处理）。

### 4.2 `validate-feature.yml`

**触发**：同 4.1，guard 条件替换为 `enhancement` label。

**权限**：同 4.1。

**检查字段**：
- `problem`（问题/痛点）
- `solution`（建议方案）
- `scope`（影响范围）

**Label 状态机**：同 4.1。

### 4.3 Issue Body 解析方式

GitHub Issue Forms 生成的 body 格式为：

```markdown
### 你的身份

参赛选手

### 复现步骤

1. 打开 ...
2. 点击 ...
```

通过 `### {label}` 标题分割，提取每个字段的内容。判断字段为空的标准：标题下方无内容或仅有空白字符 / `_No response_`。

## 5. Stale 机制

### 5.1 `stale.yml`

使用 [`actions/stale`](https://github.com/actions/stale) 官方 Action。

**完整配置**：
```yaml
schedule: '0 */6 * * *'  # 每 6 小时运行（24h 超时无需更频繁）
```

```yaml
with:
  days-before-stale: -1                  # 禁用 stale 自身的过期检测（由 validate workflow 添加 needs-info）
  days-before-close: 1                   # needs-info 标记后 1 天无响应则关闭
  stale-issue-label: needs-info          # 以 needs-info 作为 stale 标记
  close-issue-label: closed-incomplete   # 关闭时添加的 label
  only-labels: needs-info                # 仅处理带 needs-info 的 issue，不影响其他 issue
  exempt-issue-labels: triaged,watched   # 已分诊的 issue 豁免
  remove-stale-when-updated: false       # 仅评论不移除 needs-info（须编辑 issue body 触发 validate 重新验证）
  close-issue-message: |
    由于未在 24 小时内补充所需信息，此 Issue 已自动关闭。
    补充信息后可随时编辑 Issue 内容并 reopen，validate workflow 会重新验证。
```

**关键设计决策**：`remove-stale-when-updated: false` — 用户仅发表评论不会自动移除 `needs-info`。用户必须**编辑 issue body** 补充缺失字段，触发 validate workflow 重新验证后由 workflow 移除 `needs-info`。这防止了用户通过评论保活而不实际补充信息的情况。

### 5.2 Label 体系扩展

| Label | 颜色 | 用途 |
|-------|------|------|
| `bug` | `#d73a4a` 红色 | Bug Report（模板自动添加） |
| `enhancement` | `#0075ca` 蓝色 | Feature Request（模板自动添加） |
| `needs-info` | `#fbca04` 黄色 | 信息不完整，等待补充 |
| `triaged` | `#0e8a16` 绿色 | 已通过字段完整性检查 |
| `watched` | `#c5def5` 浅蓝 | AI 已生成分诊摘要 |

## 6. watch-issue Skill

### 6.1 定位

在 `synnovator-admin` skill 中新增 `watch-issue` 子命令。管理员通过以下方式启动：

```
/loop 30m /synnovator-admin:watch-issue
```

每 30 分钟自动扫描新的 Bug Report 和 Feature Request。

**前置条件**：`/loop` 是 Claude Code 内置 skill，用于按指定间隔重复执行 slash command。管理员需在本地 Claude Code 会话中启动，会话关闭则停止。

### 6.2 扫描范围

```bash
# 查找已通过字段检查（triaged）但尚未被 AI 处理（无 watched label）的 issue
# 使用 --search "-label:watched" 在 API 层排除，避免客户端过滤
gh issue list --label "bug" --label "triaged" --state open --search "-label:watched" --json number,title,author,createdAt,body
gh issue list --label "enhancement" --label "triaged" --state open --search "-label:watched" --json number,title,author,createdAt,body
```

### 6.3 每个 Issue 的处理流程

1. **读取 issue body**，解析各字段内容
2. **AI 分析**，生成分诊摘要
3. **发布评论**到 issue：

```markdown
## Issue 分诊摘要

**分类**：[UI Bug / 数据问题 / 功能缺陷 / API 错误 / 新功能 / 功能增强 / 体验优化]
**影响范围**：[涉及的页面/模块，如：团队创建流程、活动详情页]
**优先级建议**：[P0 紧急 / P1 高 / P2 中 / P3 低] — 理由简述
**关联模块**：[apps/web / packages/shared / hackathons/ / profiles/ / scripts/ / workflows]

### 摘要
（2-3 句话概括问题本质和影响）

### 复现关键路径
（从 issue 中提取的核心操作路径，方便 agent-browser 复现）

---
> 讨论达成一致后，请 @allenwoods 确认最终方案。
```

4. **添加 `watched` label**，避免重复扫描
5. **终端输出汇总**

### 6.4 终端输出格式

```
━━━ watch-issue 扫描报告 ━━━
  扫描时间：2026-03-16 14:30 UTC
  新 Bug：2 个 | 新 Feature：1 个

  #142 [P1 Bug] 团队创建报 Unauthorized — @zhangsan
       → 影响：团队创建流程 | 模块：apps/web
  #145 [P2 Bug] 活动详情页时间线显示错位 — @lisi
       → 影响：活动展示 | 模块：apps/web
  #148 [P3 Feature] 希望支持活动时间线变更通知 — @wangwu
       → 影响：所有用户 | 模块：workflows

  无需处理：3 个（已有摘要或待补充信息）
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 6.5 Skill 文件变更

```
.claude/skills/synnovator-admin/
├── SKILL.md                    # 追加 watch-issue 章节
└── references/
    ├── github-api-patterns.md  # 追加 issue 查询模式
    └── watch-issue-prompt.md   # 新增：AI 分诊 system prompt
```

**实现方式**：使用 `/skill-creator` skill 创建。`watch-issue` 作为 `synnovator-admin` 的子命令（`synnovator-admin:watch-issue`），通过在 `SKILL.md` 中追加章节实现，不创建独立 skill 目录。`/skill-creator` 用于生成 `watch-issue-prompt.md` 参考文件和辅助 SKILL.md 章节编写。

## 7. 决策流转

Issue 讨论充分、有明确修改意见后：
1. validate workflow 通过后的评论包含提示："讨论达成一致后，请 @allenwoods 确认最终方案"
2. watch-issue 的摘要评论末尾同样包含此提醒
3. @allenwoods 作为 repo owner 做最终决定

## 8. 整体数据流

```
提交者创建 Issue（选择模板）
  → Issue Form 强制填写必填字段，标题格式：[Bug]/[Feature] + 简要描述
  → 模板自动添加 bug / enhancement label
  → validate-bug.yml / validate-feature.yml 触发（opened / edited / labeled）
    → 字段完整 → 添加 triaged label
    → 字段缺失 → 添加 needs-info label + 评论要求补充
      → 24h 内作者编辑 issue body → validate 重新触发 → 通过则移除 needs-info 加 triaged
      → 24h 无编辑 → stale.yml 自动关闭（标记 closed-incomplete）
      → 关闭后作者可编辑 body 并 reopen
  → watch-issue（每 30 分钟）扫描 triaged 且无 watched 的 issue
    → AI 分诊 → 发布摘要评论 + 添加 watched label
    → 管理员终端收到汇总报告
  → 团队讨论 → @allenwoods 最终确认
```
