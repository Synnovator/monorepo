---
name: watch-issue
description: >
  Two-phase AI triage for GitHub Bug Reports and Feature Requests: Phase 1 posts non-technical
  triage comments (with codebase investigation and optional screenshots) for product discussion;
  Phase 2 posts technical implementation plans after solution is confirmed. Designed for recurring
  use via /loop. Use this skill whenever the admin wants to: check for new issues, scan or triage
  bugs and feature requests, monitor issue activity, review untriaged issues, set up automated
  issue watching, assess issue priority, post triage summaries, or follow up on solution-confirmed
  issues. Also trigger when the admin mentions: watch issues, issue 分诊, 监控 Issue, new bugs,
  扫描 issue, 优先级评估, or asks about issue status in the Synnovator context. This skill handles
  the full lifecycle from initial triage to development handoff — if the request involves GitHub
  issues in any way (reading, analyzing, commenting, labeling), this skill likely applies.
---

# Watch Issue

Monitor new Bug Reports and Feature Requests, perform AI-powered triage, and post summary comments.

> **References path**: All `references/` paths resolve to `../references/` relative to this file
> (the parent skill's shared reference directory).

**Invocation**: `/loop 30m /synnovator-admin:watch-issue`

**Prerequisite**: `/loop` is a Claude Code built-in skill that repeats a slash command at the
specified interval. The loop runs in the local Claude Code session and stops when the session closes.

## Two-Phase Triage Model

Triage comments are split into two phases to serve different audiences:

- **Phase 1 — 产品/运营视角**: Non-technical, posted immediately. Focuses on user impact,
  necessity judgment, and high-level options in business language. Includes visual evidence
  (screenshots) when possible. @mentions the issue author for confirmation.
- **Phase 2 — 开发视角**: Technical, posted only after product discussion concludes (triggered
  by `solution-confirmed` label). Contains code references, root cause analysis, and
  implementation recommendations. @mentions @allenwoods for final confirmation and adds
  `discussion-completed` label.

## Execution Steps

### Scan A — New Issues (Phase 1)

1. **Query new issues** — read `references/github-api-patterns.md` for the exact queries:
   ```bash
   gh issue list --label "bug" --label "triaged" --state open --search "-label:watched" --json number,title,author,createdAt,body,labels --limit 50
   gh issue list --label "enhancement" --label "triaged" --state open --search "-label:watched" --json number,title,author,createdAt,body,labels --limit 50
   ```

2. **For each issue**:

   a. Parse the issue body to extract form field values

   b. **Investigate the codebase** — this is the critical step that turns triage from paraphrase
      into analysis:
      - From the issue content, identify which user flow / page / module is involved
      - Use Glob and Grep to locate the relevant source files
      - Read the key files to understand **what the current code actually does**
      - For bugs: trace the code path to identify where the failure likely occurs
      - For features: check whether the requested behavior (or a partial version) already exists
      - **Validate candidate fix approaches**: before proposing any option, verify it is
        technically feasible. Consider: does the API/mechanism actually exist? Do users have
        the required permissions (most users are Read-only)? Does the target endpoint support
        the needed parameters? Does the approach work for existing files vs new files?
        Discard any option that fails validation — do not present it as a possibility

   c. **Visual verification (best-effort)** — use `agent-browser` to capture the current state.
      This step is best-effort: if the app is inaccessible, requires special auth, or the flow
      cannot be triggered, skip and proceed with text-only triage.

      **Target URL**: `https://home.synnovator.space/` (production) or `http://localhost:3000`
      (dev, if running). Prefer production for accuracy.

      **What to capture**:

      - **For bugs** — follow the reproduction steps from the issue:
        1. Screenshot the starting state (the page before the action)
        2. Perform the action that triggers the bug
        3. Screenshot the error / unexpected result
        4. If applicable, screenshot what a normal/expected state looks like for comparison

      - **For features** — capture the current flow to illustrate "现状":
        1. Screenshot the relevant page in its current state
        2. If the feature is about a flow (e.g., creation → submission), screenshot key steps
        3. Highlight the moment where the gap exists (e.g., "after submission, this is all the
           user sees")

      **Screenshot naming**: `issue-{number}-{step}.png` (e.g., `issue-61-error.png`)

      **Embedding screenshots in GitHub comments**:
      Upload each screenshot and collect the resulting URLs. Then embed in the comment as:
      ```markdown
      ![{description}]({url})
      ```

      **Upload mechanism** (in order of preference):
      1. Use GitHub's user-content upload if available
      2. Upload to the repo via Contents API on an `assets/screenshots` branch:
         ```bash
         BASE64=$(base64 < screenshot.png | tr -d '\n')
         URL=$(gh api repos/{owner}/{repo}/contents/.github/screenshots/issue-{number}-{name}.png \
           --method PUT \
           -f message="chore: screenshot for #{number}" \
           -f content="$BASE64" \
           -f branch="assets/screenshots" \
           --jq '.content.download_url')
         ```
      3. **Fallback**: if upload is not feasible, use text description blocks:
         ```markdown
         > 📸 **{场景描述}**：{what was observed on screen}
         ```

   d. Read `references/watch-issue-prompt.md` for the Phase 1 triage prompt structure

   e. Generate a **Phase 1 comment** (product/ops perspective) that includes:
      - Necessity assessment in business terms
      - Whether existing alternatives or workarounds exist
      - High-level options described without code jargon
      - Screenshots or visual descriptions embedded in relevant sections
      - @mention the issue author asking for confirmation

   f. Post the Phase 1 comment: `gh issue comment {number} --body "{summary}"`

   g. Add the `watched` label: `gh issue edit {number} --add-label "watched"`

### Scan B — Solution-Confirmed Issues (Phase 2)

3. **Query issues ready for Phase 2**:
   ```bash
   gh issue list --label "solution-confirmed" --state open --search "-label:discussion-completed" --json number,title,author,createdAt,body,labels --limit 50
   ```

4. **For each issue**:
   a. Read the issue body and all comments to understand the product discussion outcome
   b. If not already investigated, perform codebase investigation (same as step 2b)
   c. Read `references/watch-issue-prompt.md` for the Phase 2 triage prompt structure
   d. Generate a **Phase 2 comment** (developer perspective) that includes:
      - Code references with specific file paths
      - Root cause analysis (for bugs) or implementation assessment (for features)
      - Concrete implementation options with complexity and module scope
      - Clear recommendation aligned with the confirmed solution direction
   e. Post the Phase 2 comment: `gh issue comment {number} --body "{summary}"`
   f. Add the `discussion-completed` label: `gh issue edit {number} --add-label "discussion-completed"`
   g. @mention @allenwoods in the comment for final confirmation

### Scan C — Watched Issues with New Replies (Follow-up)

5. **Query watched issues that may have new replies**:
   ```bash
   gh issue list --label "watched" --state open --search "-label:solution-confirmed" --json number,title,author,createdAt,labels,comments --limit 50
   ```

6. **For each issue**, check if there are comments from the issue author **after** the last
   bot/triage comment. If so, the author has replied to the Phase 1 triage and needs follow-up.

   a. Read the latest comments to understand the author's response
   b. Summarize what the author said (direction choice, clarification, pushback, etc.)
   c. **Do not auto-post** — instead, include these in the scan report for admin attention.
      The admin decides whether to add `solution-confirmed` or continue the discussion.

   This scan bridges the gap between Phase 1 (triage posted, awaiting response) and Phase 2
   (solution confirmed, ready for dev). Without it, author replies would go unnoticed until
   someone manually checks the issue.

### Scan Report

7. **Output scan report** to the terminal:
   ```
   ━━━ watch-issue 扫描报告 ━━━
     扫描时间：{timestamp}
     Phase 1 — 新 Bug：{count} 个 | 新 Feature：{count} 个

     #{number} [{priority} {type}] {title summary} — @{author}
          → 影响：{impact} | 📸 {有截图/仅文字}

     Phase 2 — 待开发确认：{count} 个

     #{number} [{type}] {title summary}
          → 确认方案：{solution direction}

     待跟进 — 作者已回复：{count} 个

     #{number} [{type}] {title summary} — @{author} 回复于 {time}
          → 回复摘要：{summary of reply}

     无需处理：{count} 个
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

8. **If no new issues found in any scan**, output:
   ```
   ━━━ watch-issue 扫描报告 ━━━
     扫描时间：{timestamp}
     无新 Issue 需要处理
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```
