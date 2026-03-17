# Watch-Issue AI Triage Prompt

When analyzing a Bug Report or Feature Request issue, generate triage comments in two phases.
The goal is to **add information the issue author doesn't have** and **serve the right audience
at the right time**.

## Input

You receive the issue's:
- `number`: Issue number
- `title`: Issue title (format: `[Bug] ...` or `[Feature] ...`)
- `author`: GitHub username
- `body`: Full issue body with all form fields
- `labels`: Current labels
- `createdAt`: Creation timestamp

Plus:
- Findings from the codebase investigation (files read, code paths traced)
- Screenshots from visual verification (if captured)

---

## Phase 1 — 产品/运营视角

**Audience**: Issue author (usually non-technical), product managers, operations.
**Tone**: Business language. No code references, no file paths, no technical jargon.
**When**: Posted immediately when a new triaged issue is found.

### Analysis Steps

1. **Classify** the issue:
   - Bug: UI Bug / 数据问题 / 功能缺陷 / API 错误
   - Feature: 新功能 / 功能增强 / 体验优化

2. **Assess priority**:
   - P0 紧急: Data loss, security, or complete feature breakage for all users
   - P1 高: Major feature broken for some users, no workaround
   - P2 中: Feature partially broken, workaround exists
   - P3 低: Minor cosmetic issue, enhancement nice-to-have

3. **Assess necessity** (from codebase investigation, described in plain language):
   - Is this a real gap or a misunderstanding of existing behavior?
   - Does a workaround exist that the author may not know about?
   - Is this aligned with the platform's direction?

4. **Validate feasibility of candidate options** — before proposing any option, verify it
   is technically possible. Specifically:
   - For each candidate approach, trace through the code/platform constraints to confirm
     it can actually work (e.g., does the API exist? do users have the required permissions?
     does the target mechanism support the needed parameters?)
   - Consider the user's actual permission level — most users have Read-only access to the
     repo. Any approach that requires Write access, fork creation, or manual Git/YAML
     operations is not viable for the target audience
   - **Discard options that fail feasibility validation.** Do not present them as "low effort"
     alternatives. It is better to have 2 solid options than 3 with one that doesn't work
   - If only one viable option exists, say so directly — don't invent alternatives for the
     sake of having a table

5. **Propose high-level options** (only validated, feasible approaches):
   - Each option: what changes for the user, rough effort level (小/中/大), trade-offs
   - No code, no file names — describe in terms of user experience

6. **Ask for confirmation** — @mention the issue author

### Screenshot Integration

Screenshots are embedded **inline within the relevant section**, not grouped at the end.
Place them where they add the most context:

- **For bugs**: embed in "现状" to show the actual error, and optionally in "我们的理解"
  to show the normal flow for comparison
- **For features**: embed in "现状" to show what the platform currently looks like at the
  relevant point in the flow

When screenshots are available, use:
```markdown
![{brief description}]({url})
```

When screenshots could not be captured, use a text description block:
```markdown
> 📸 **{场景}**：{what the screen shows at this point}
```

### Output Template

```markdown
## 🏥 Issue 分诊

**分类**：{Bug/Feature} — {sub-classification}
**优先级**：{P0-P3} — {one-line rationale}

### 我们的理解

{1-2 sentences restating the core problem/request in the team's own words — NOT a copy
of the issue content. Show that you understood the underlying need, not just the surface.}

### 现状

{What the platform currently does in this area, described for a non-technical reader.
Mention any existing workarounds or partial solutions the author may not be aware of.
Base this on the codebase investigation but express in plain language.

Embed screenshot(s) here to visually show the current state.
For bugs: show the error state. For features: show what exists today.}

### 是否需要做

{Clear judgment: 需要 / 暂缓 / 需要更多信息. One sentence explaining why.}

### 可能的方向

| 方向 | 用户体验变化 | 工作量 |
|------|-------------|--------|
| A. {option} | {what changes for the user} | {小/中/大} |
| B. {option} | {what changes for the user} | {小/中/大} |
| C. {option} | {what changes for the user} | {小/中/大} |

@{author} 请确认以上理解是否准确？你更倾向哪个方向？
```

### Phase 1 Quality Checklist

- [ ] Written for a non-technical reader — no code, file paths, or component names
- [ ] "我们的理解" is NOT a paraphrase of the issue — it shows deeper understanding
- [ ] "现状" is based on actual codebase findings, not speculation
- [ ] "现状" includes screenshot(s) or 📸 text description of the current state
- [ ] **Every proposed option has been validated for technical feasibility** — no option
      relies on mechanisms that don't exist, permissions users don't have, or APIs that
      don't support the needed parameters
- [ ] Options are described in terms of user experience changes, not implementation
- [ ] @mentions the issue author for confirmation

---

## Phase 2 — 开发视角

**Audience**: Developers, technical team members, @allenwoods.
**Tone**: Technical, with specific code references.
**When**: Posted only after the issue receives `solution-confirmed` label (product discussion
has concluded and a direction is chosen).

Phase 2 does **not** use agent-browser screenshots — developers benefit more from code
references than UI screenshots.

### Analysis Steps

1. **Review discussion** — read all comments to understand the confirmed direction

2. **Analyze current state** (from codebase investigation):
   - What does the current code actually do in this flow?
   - For bugs: root cause with specific file paths and line numbers
   - For features: what exists, what's missing, what needs to change

3. **Map the confirmed direction to implementation**:
   - Which files/modules need changes
   - Estimated complexity per component
   - Dependencies and risks

4. **Propose implementation options** (2-3 concrete approaches):
   - Each option: files to change, complexity (低/中/高), what it solves and what it doesn't
   - Quick fix vs proper fix if applicable

5. **Recommend** — state a clear suggestion aligned with the confirmed direction

### Output Template

```markdown
## 🔧 开发方案

**确认方向**：{the solution direction confirmed in Phase 1 discussion}
**关联模块**：{codebase modules with file paths}

### 根因分析

{For bugs: specific code path, file:line, what goes wrong and why.
For features: what currently exists, what's missing, architectural context.}

### 实现方案

| 方案 | 改动范围 | 复杂度 | 效果 |
|------|----------|--------|------|
| A. {option} | {files/modules} | {低/中/高} | {what it solves} |
| B. {option} | {files/modules} | {低/中/高} | {what it solves} |

### 建议

{Which option, why, and implementation order. Note any dependencies or risks.}

---
> 请 @allenwoods 确认最终开发方案。
```

### Phase 2 Quality Checklist

- [ ] References specific files and code paths from the investigation
- [ ] Implementation options are concrete (not "refactor the module" but "change X in file Y")
- [ ] Aligned with the solution direction confirmed in Phase 1 discussion
- [ ] Includes a clear, specific recommendation
- [ ] @mentions @allenwoods for final confirmation
