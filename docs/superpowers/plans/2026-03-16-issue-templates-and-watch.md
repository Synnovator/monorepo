# Issue Templates + Watch-Issue Skill Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Bug Report and Feature Request issue templates with automated field validation, stale handling, and AI-powered issue triage skill.

**Architecture:** GitHub Issue Forms YAML templates → validate workflows (Actions) → stale auto-close (Actions) → watch-issue skill (Claude Code). Follows existing validate-register.yml pattern for workflow structure.

**Tech Stack:** GitHub Issue Forms, GitHub Actions (`actions/github-script@v7`, `actions/stale`), `gh` CLI, Claude Code Skills

**Spec:** `docs/superpowers/specs/2026-03-16-issue-templates-and-watch-design.md`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `.github/ISSUE_TEMPLATE/bug-report.yml` | Bug Report issue form |
| Create | `.github/ISSUE_TEMPLATE/feature-request.yml` | Feature Request issue form |
| Create | `.github/ISSUE_TEMPLATE/config.yml` | Template chooser config (disable blank issues) |
| Create | `.github/workflows/validate-bug.yml` | Field completeness check for bug reports |
| Create | `.github/workflows/validate-feature.yml` | Field completeness check for feature requests |
| Create | `.github/workflows/stale.yml` | Auto-close needs-info issues after 24h |
| Modify | `.claude/skills/synnovator-admin/SKILL.md` | Append watch-issue section |
| Create | `.claude/skills/synnovator-admin/references/watch-issue-prompt.md` | AI triage system prompt |
| Modify | `.claude/skills/synnovator-admin/references/github-api-patterns.md` | Append bug/feature issue query patterns |
| Modify | `CLAUDE.md` | Update workflow table with new workflows |

---

## Chunk 1: Issue Templates + Config

### Task 1: Bug Report Template

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug-report.yml`

- [ ] **Step 1: Create bug-report.yml**

```yaml
name: Bug Report
description: 报告 Synnovator 平台的 Bug
title: "[Bug] "
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: |
        ## 提交前请确认
        - 我已在 [home.synnovator.space](https://home.synnovator.space) 上实际操作并确认问题存在
        - 我已阅读 [PRD](https://github.com/Synnovator/monorepo/blob/main/docs/specs/synnovator-prd.md) 中相关功能的描述，确认这是 Bug 而非预期行为
        - 我已搜索[已有 Issues](https://github.com/Synnovator/monorepo/issues?q=is%3Aissue+label%3Abug)，确认没有重复报告

  - type: dropdown
    id: role
    attributes:
      label: 你的身份
      description: 你在平台中的角色
      options:
        - 参赛选手
        - 评委
        - 主办方管理员
        - 访客
    validations:
      required: true

  - type: input
    id: hackathon-url
    attributes:
      label: 相关活动页面 URL
      description: 如果 Bug 与某个具体活动相关，请粘贴该活动页面的完整 URL
      placeholder: "https://home.synnovator.space/hackathons/xxx"
    validations:
      required: false

  - type: textarea
    id: steps
    attributes:
      label: 复现步骤
      description: |
        请按时间顺序，逐步描述你的操作。好的复现步骤应该能让任何人照做就能看到问题。
        ❌ "无法创建团队"
        ✅ "1. 登录账号 xxx  2. 进入活动 test-youth-hackathons  3. 点击'创建团队'  4. 填写团队名称、简介  5. 点击'前往 GitHub 创建团队'  6. 页面显示 'Unauthorized User'，且返回后已填信息丢失"
      placeholder: |
        1. 打开 https://home.synnovator.space/hackathons/xxx
        2. 点击 ...
        3. 填写 ...
        4. 点击 ...
        5. 看到 ...
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: 期望行为
      description: 你认为正确的结果应该是什么？
      placeholder: "点击'创建团队'后应跳转到 GitHub Issue 创建页，且团队信息被预填"
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: 实际行为
      description: 实际发生了什么？包括错误信息、异常状态等
      placeholder: "页面显示 'Unauthorized User' 弹窗，关闭后返回团队编辑页，之前填写的信息全部清空"
    validations:
      required: true

  - type: dropdown
    id: browser
    attributes:
      label: 浏览器
      options:
        - Chrome
        - Firefox
        - Safari
        - Edge
        - 其他（请在补充信息中说明）
    validations:
      required: true

  - type: dropdown
    id: device
    attributes:
      label: 设备类型
      options:
        - 桌面端
        - 移动端
    validations:
      required: true

  - type: textarea
    id: screenshots
    attributes:
      label: 截图或录屏
      description: 拖拽上传截图或录屏，能极大帮助定位问题
      placeholder: 拖拽图片到此处上传
    validations:
      required: false

  - type: textarea
    id: extra
    attributes:
      label: 补充信息
      description: 控制台报错、网络请求失败截图、或其他你认为有帮助的信息
    validations:
      required: false
```

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/ISSUE_TEMPLATE/bug-report.yml'))"`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add .github/ISSUE_TEMPLATE/bug-report.yml
git commit -m "ci: add Bug Report issue template"
```

### Task 2: Feature Request Template

**Files:**
- Create: `.github/ISSUE_TEMPLATE/feature-request.yml`

- [ ] **Step 1: Create feature-request.yml**

```yaml
name: Feature Request
description: 提出 Synnovator 平台的功能增强建议
title: "[Feature] "
labels: ["enhancement"]
body:
  - type: markdown
    attributes:
      value: |
        ## 提交前请确认
        - 我已在 [home.synnovator.space](https://home.synnovator.space) 上体验了现有功能
        - 我已阅读 [PRD](https://github.com/Synnovator/monorepo/blob/main/docs/specs/synnovator-prd.md)，确认该功能尚未规划或实现
        - 我已搜索[已有 Issues](https://github.com/Synnovator/monorepo/issues?q=is%3Aissue+label%3Aenhancement)，确认没有重复提议

  - type: textarea
    id: problem
    attributes:
      label: 你遇到了什么问题或痛点？
      description: |
        描述促使你提出这个需求的具体场景。
        ❌ "希望增加通知功能"
        ✅ "我作为参赛选手，注册活动后无法得知活动时间线变更（如截止日期延期），每次都要手动去活动页面查看，曾因此错过提交窗口"
      placeholder: "我作为（角色），在（场景）中，遇到了（问题）..."
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: 你建议的解决方案
      description: 描述你期望的功能表现。如果有多种方案，请列出你最推荐的
      placeholder: "希望在活动时间线变更时，通过 GitHub Notification / Email 通知已注册的选手..."
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: 你考虑过的替代方案
      description: 你是否尝试过其他方式解决这个问题？效果如何？
      placeholder: "目前我通过每天手动检查活动页来跟踪变更，但容易遗漏"
    validations:
      required: false

  - type: dropdown
    id: scope
    attributes:
      label: 影响的用户群体
      options:
        - 所有用户
        - 参赛选手
        - 评委
        - 主办方/管理员
        - 访客
    validations:
      required: true

  - type: textarea
    id: references
    attributes:
      label: 参考资料
      description: 相关的竞品功能截图、文章链接、或设计草图
    validations:
      required: false
```

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/ISSUE_TEMPLATE/feature-request.yml'))"`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add .github/ISSUE_TEMPLATE/feature-request.yml
git commit -m "ci: add Feature Request issue template"
```

### Task 3: Template Chooser Config

**Files:**
- Create: `.github/ISSUE_TEMPLATE/config.yml`

- [ ] **Step 1: Create config.yml**

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

- [ ] **Step 2: Verify all 7 templates are listed**

`config.yml` affects ALL issue templates (not just the new ones). After creation, verify that all 7 templates will appear in the chooser: register, judge-score, team-formation, nda-sign, appeal, bug-report, feature-request.

Run: `ls .github/ISSUE_TEMPLATE/*.yml | grep -v config`
Expected: 7 files listed

- [ ] **Step 3: Commit**

```bash
git add .github/ISSUE_TEMPLATE/config.yml
git commit -m "ci: add issue template chooser config, disable blank issues"
```

---

## Chunk 2: Labels + Validate Workflows

### Task 4: Create GitHub Labels

Labels must exist before workflows can add them. Create via `gh` CLI.

**Prerequisite:** Must be done before Tasks 5-7 so workflows can reference these labels.

- [ ] **Step 1: Create labels**

```bash
gh label create "needs-info" --color "fbca04" --description "信息不完整，等待补充" --force
gh label create "triaged" --color "0e8a16" --description "已通过字段完整性检查" --force
gh label create "watched" --color "c5def5" --description "AI 已生成分诊摘要" --force
gh label create "closed-incomplete" --color "cccccc" --description "因信息不完整自动关闭" --force
gh label create "bug" --color "d73a4a" --description "Bug Report" --force
gh label create "enhancement" --color "0075ca" --description "Feature Request" --force
```

- [ ] **Step 2: Verify labels exist**

Run: `gh label list --search "needs-info" --json name,color`
Expected: JSON output showing the label

### Task 5: validate-bug.yml

**Files:**
- Create: `.github/workflows/validate-bug.yml`
- Reference: `.github/workflows/validate-register.yml` (pattern to follow)

- [ ] **Step 1: Create validate-bug.yml**

Follow `validate-register.yml` structure. Use `actions/github-script@v7` for body parsing and label management. This is a complete, self-contained YAML file — the `script: |` block scalar contains all the JavaScript inline.

```yaml
name: Validate Bug Report

on:
  issues:
    types: [opened, edited, labeled]

jobs:
  validate:
    if: |
      contains(github.event.issue.labels.*.name, 'bug') &&
      (github.event.action != 'labeled' || github.event.label.name == 'bug')
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: read
    steps:
      - name: Validate bug report fields
        uses: actions/github-script@v7
        with:
          script: |
            const issue = context.payload.issue;
            const body = issue.body || '';
            const errors = [];

            // Parse Issue Forms body: split by ### headers
            // Note: field labels are Chinese text without ASCII regex-special chars
            function getField(body, label) {
              const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`### ${escaped}\\s*\\n\\s*([\\s\\S]*?)(?=\\n### |$)`);
              const match = body.match(regex);
              if (!match) return '';
              const value = match[1].trim();
              if (value === '_No response_' || value === '') return '';
              return value;
            }

            // Required fields
            const requiredFields = [
              { id: 'role', label: '你的身份' },
              { id: 'steps', label: '复现步骤' },
              { id: 'expected', label: '期望行为' },
              { id: 'actual', label: '实际行为' },
              { id: 'browser', label: '浏览器' },
              { id: 'device', label: '设备类型' },
            ];

            const missing = [];
            for (const field of requiredFields) {
              if (!getField(body, field.label)) {
                missing.push(field.label);
              }
            }

            // Optional URL validation
            const hackathonUrl = getField(body, '相关活动页面 URL');
            if (hackathonUrl && !hackathonUrl.startsWith('https://home.synnovator.space/')) {
              errors.push(`活动页面 URL 应以 \`https://home.synnovator.space/\` 开头，当前值：\`${hackathonUrl}\``);
            }

            if (missing.length > 0) {
              errors.push(`以下必填字段为空：${missing.map(f => `**${f}**`).join('、')}`);
            }

            const currentLabels = issue.labels.map(l => l.name);

            if (errors.length > 0) {
              // Add needs-info, remove triaged if present
              if (!currentLabels.includes('needs-info')) {
                await github.rest.issues.addLabels({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: issue.number,
                  labels: ['needs-info'],
                });
              }
              if (currentLabels.includes('triaged')) {
                await github.rest.issues.removeLabel({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: issue.number,
                  name: 'triaged',
                });
              }

              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                body: [
                  '⚠️ **Bug Report 信息不完整**\n',
                  ...errors.map(e => `- ${e}`),
                  '',
                  '请编辑 Issue 补充以上信息。示例：',
                  '> 1. 登录账号 xxx  2. 进入活动页面  3. 点击某按钮  4. 看到错误信息 "xxx"',
                  '',
                  '编辑完成后，系统会自动重新验证。24 小时内未补充将自动关闭。',
                ].join('\n'),
              });
            } else {
              // All fields present — add triaged, remove needs-info
              if (!currentLabels.includes('triaged')) {
                await github.rest.issues.addLabels({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: issue.number,
                  labels: ['triaged'],
                });
              }
              if (currentLabels.includes('needs-info')) {
                await github.rest.issues.removeLabel({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: issue.number,
                  name: 'needs-info',
                });
              }

              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                body: '✅ **Bug Report 验证通过。** 感谢提交！团队将尽快查看。\n\n> 讨论达成一致后，请 @allenwoods 确认最终方案。',
              });
            }
```

- [ ] **Step 2: Validate workflow YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/validate-bug.yml'))"`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/validate-bug.yml
git commit -m "ci: add validate-bug workflow for Bug Report field checks"
```

### Task 6: validate-feature.yml

**Files:**
- Create: `.github/workflows/validate-feature.yml`

- [ ] **Step 1: Create validate-feature.yml**

Same structure as validate-bug.yml, with different label (`enhancement`) and field list. This is a complete, self-contained YAML file.

```yaml
name: Validate Feature Request

on:
  issues:
    types: [opened, edited, labeled]

jobs:
  validate:
    if: |
      contains(github.event.issue.labels.*.name, 'enhancement') &&
      (github.event.action != 'labeled' || github.event.label.name == 'enhancement')
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: read
    steps:
      - name: Validate feature request fields
        uses: actions/github-script@v7
        with:
          script: |
            const issue = context.payload.issue;
            const body = issue.body || '';
            const errors = [];

            function getField(body, label) {
              const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const regex = new RegExp(`### ${escaped}\\s*\\n\\s*([\\s\\S]*?)(?=\\n### |$)`);
              const match = body.match(regex);
              if (!match) return '';
              const value = match[1].trim();
              if (value === '_No response_' || value === '') return '';
              return value;
            }

            const requiredFields = [
              { id: 'problem', label: '你遇到了什么问题或痛点？' },
              { id: 'solution', label: '你建议的解决方案' },
              { id: 'scope', label: '影响的用户群体' },
            ];

            const missing = [];
            for (const field of requiredFields) {
              if (!getField(body, field.label)) {
                missing.push(field.label);
              }
            }

            if (missing.length > 0) {
              errors.push(`以下必填字段为空：${missing.map(f => `**${f}**`).join('、')}`);
            }

            const currentLabels = issue.labels.map(l => l.name);

            if (errors.length > 0) {
              if (!currentLabels.includes('needs-info')) {
                await github.rest.issues.addLabels({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: issue.number,
                  labels: ['needs-info'],
                });
              }
              if (currentLabels.includes('triaged')) {
                await github.rest.issues.removeLabel({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: issue.number,
                  name: 'triaged',
                });
              }

              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                body: [
                  '⚠️ **Feature Request 信息不完整**\n',
                  ...errors.map(e => `- ${e}`),
                  '',
                  '请编辑 Issue 补充以上信息。示例：',
                  '> "我作为参赛选手，注册活动后无法得知活动时间线变更，曾因此错过提交窗口"',
                  '',
                  '编辑完成后，系统会自动重新验证。24 小时内未补充将自动关闭。',
                ].join('\n'),
              });
            } else {
              if (!currentLabels.includes('triaged')) {
                await github.rest.issues.addLabels({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: issue.number,
                  labels: ['triaged'],
                });
              }
              if (currentLabels.includes('needs-info')) {
                await github.rest.issues.removeLabel({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: issue.number,
                  name: 'needs-info',
                });
              }

              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                body: '✅ **Feature Request 验证通过。** 感谢建议！团队将评估可行性。\n\n> 讨论达成一致后，请 @allenwoods 确认最终方案。',
              });
            }
```

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/validate-feature.yml'))"`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/validate-feature.yml
git commit -m "ci: add validate-feature workflow for Feature Request field checks"
```

### Task 7: stale.yml

**Files:**
- Create: `.github/workflows/stale.yml`

- [ ] **Step 1: Create stale.yml**

```yaml
name: Close Stale Issues

on:
  schedule:
    - cron: "0 */6 * * *"
  workflow_dispatch:

jobs:
  stale:
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - uses: actions/stale@v9
        with:
          days-before-stale: -1
          days-before-close: 1
          stale-issue-label: needs-info
          close-issue-label: closed-incomplete
          only-labels: needs-info
          exempt-issue-labels: triaged,watched
          remove-stale-when-updated: false
          close-issue-message: |
            由于未在 24 小时内补充所需信息，此 Issue 已自动关闭。
            补充信息后可随时编辑 Issue 内容并 reopen，validate workflow 会重新验证。
          days-before-pr-stale: -1
          days-before-pr-close: -1
```

- [ ] **Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/stale.yml'))"`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/stale.yml
git commit -m "ci: add stale workflow for needs-info auto-close (24h)"
```

---

## Chunk 3: Skill + Docs

### Task 8: watch-issue Skill

**Files:**
- Modify: `.claude/skills/synnovator-admin/SKILL.md` (append watch-issue section)
- Create: `.claude/skills/synnovator-admin/references/watch-issue-prompt.md`
- Modify: `.claude/skills/synnovator-admin/references/github-api-patterns.md` (append queries)

**Implementation note:** Use `/skill-creator` skill to assist with creating the watch-issue sub-command.

- [ ] **Step 1: Create watch-issue-prompt.md**

Create at `.claude/skills/synnovator-admin/references/watch-issue-prompt.md`:

```markdown
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

- [ ] **Step 2: Append to github-api-patterns.md**

Add the following section to the end of `.claude/skills/synnovator-admin/references/github-api-patterns.md`:

```markdown
## Bug/Feature Issue Queries

### List Triaged Bug Reports (unwatched)

```bash
gh issue list \
  --label "bug" --label "triaged" \
  --state open \
  --search "-label:watched" \
  --json number,title,author,createdAt,body,labels \
  --limit 50
```

### List Triaged Feature Requests (unwatched)

```bash
gh issue list \
  --label "enhancement" --label "triaged" \
  --state open \
  --search "-label:watched" \
  --json number,title,author,createdAt,body,labels \
  --limit 50
```

### Add Watch Label + Post Triage Comment

```bash
gh issue edit {number} --add-label "watched"
gh issue comment {number} --body "$(cat <<'EOF'
{triage comment content}
EOF
)"
```
```

- [ ] **Step 3: Append watch-issue section to SKILL.md**

Insert between the `---` separator after `audit-secrets` (line ~331 of SKILL.md) and `## Important Rules` (line ~333). This creates a new `## Watch Operations` top-level section:

```markdown
---

## Watch Operations

### watch-issue

Monitor new Bug Reports and Feature Requests, perform AI-powered triage, and post summary comments.

**Invocation**: `/loop 30m /synnovator-admin:watch-issue`

**Prerequisite**: `/loop` is a Claude Code built-in skill that repeats a slash command at the specified interval. The loop runs in the local Claude Code session and stops when the session closes.

**Execution steps**:

1. **Query new issues** — read `references/github-api-patterns.md` for the exact queries:
   ```bash
   gh issue list --label "bug" --label "triaged" --state open --search "-label:watched" --json number,title,author,createdAt,body,labels --limit 50
   gh issue list --label "enhancement" --label "triaged" --state open --search "-label:watched" --json number,title,author,createdAt,body,labels --limit 50
   ```

2. **For each issue**:
   a. Parse the issue body to extract form field values
   b. Read `references/watch-issue-prompt.md` for the AI triage prompt structure
   c. Analyze the issue and generate a triage summary
   d. Post the triage summary as a comment: `gh issue comment {number} --body "{summary}"`
   e. Add the `watched` label: `gh issue edit {number} --add-label "watched"`

3. **Output scan report** to the terminal:
   ```
   ━━━ watch-issue 扫描报告 ━━━
     扫描时间：{timestamp}
     新 Bug：{count} 个 | 新 Feature：{count} 个

     #{number} [{priority} {type}] {title summary} — @{author}
          → 影响：{impact} | 模块：{module}

     无需处理：{count} 个（已有摘要或待补充信息）
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

4. **If no new issues found**, output:
   ```
   ━━━ watch-issue 扫描报告 ━━━
     扫描时间：{timestamp}
     无新 Issue 需要处理
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```
```

- [ ] **Step 4: Commit skill changes**

```bash
git add .claude/skills/synnovator-admin/SKILL.md
git add .claude/skills/synnovator-admin/references/watch-issue-prompt.md
git add .claude/skills/synnovator-admin/references/github-api-patterns.md
git commit -m "feat(skills): add watch-issue sub-command to synnovator-admin"
```

### Task 9: Update CLAUDE.md and synnovator-admin Quick Reference

**Files:**
- Modify: `CLAUDE.md` (root)

- [ ] **Step 1: Add new workflows to the table**

In the `## GitHub Actions 工作流` table in `CLAUDE.md`, add these rows:

| Workflow | 触发条件 | 用途 |
|----------|----------|------|
| `validate-bug.yml` | Issue with `bug` label | 校验 Bug Report 必填字段 |
| `validate-feature.yml` | Issue with `enhancement` label | 校验 Feature Request 必填字段 |
| `stale.yml` | schedule (every 6h) | 自动关闭 needs-info 超时 Issue |

Also update the Quick Reference table in `SKILL.md` (`.claude/skills/synnovator-admin/SKILL.md`) to include:

| `watch-issue` | Watch | Monitor new bug/feature issues, AI triage + summary |

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add validate-bug, validate-feature, stale to workflow table"
```
