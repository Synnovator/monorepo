---
name: watch-issue
description: >
  Monitor new Bug Report and Feature Request issues with AI-powered triage. Posts summary comments
  and adds watched labels. Designed for recurring use via /loop. Use when the admin mentions:
  watch issues, issue triage, monitor bugs, 监控 Issue, issue 分诊, or wants to set up automated
  issue monitoring in the Synnovator context.
---

# Watch Issue

Monitor new Bug Reports and Feature Requests, perform AI-powered triage, and post summary comments.

> **References path**: All `references/` paths resolve to `../references/` relative to this file
> (the parent skill's shared reference directory).

**Invocation**: `/loop 30m /synnovator-admin:watch-issue`

**Prerequisite**: `/loop` is a Claude Code built-in skill that repeats a slash command at the
specified interval. The loop runs in the local Claude Code session and stops when the session closes.

## Execution Steps

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
