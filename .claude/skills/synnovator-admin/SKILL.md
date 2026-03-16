---
name: synnovator-admin
description: >
  Synnovator platform admin CLI — create/update/close hackathons, manage profiles and submissions,
  export scores and registrations, audit changes and permissions, and simulate full hackathon
  scenarios with synthetic data, and monitor issues with AI-powered triage. Use whenever the admin
  needs to manage hackathon data, create profiles, export reports, query audit history, simulate
  hackathon scenarios, monitor new bug/feature issues, or perform any platform management operation.
  Also trigger when the user mentions hackathon management, YAML data editing, score exports,
  NDA approvals, 模拟活动, 生成仿真数据, simulate hackathon, forge challenge scenario,
  活动虚拟数据, watch issues, or issue triage in the Synnovator context.
---

# Synnovator Admin

Platform administration skill for the Synnovator Git-native Hackathon platform. Every management
operation goes through this skill — it wraps `scripts/` CLI tools, YAML editing, Schema validation,
and PR creation into guided interactive workflows.

## Quick Reference

| Command | Type | What it does |
|---------|------|-------------|
| `create-hackathon` | Write | Generate hackathon from template, guide field editing, validate, PR |
| `update-timeline` | Write | Modify timeline stages in hackathon.yml, validate, PR |
| `update-track` | Write | Modify track config (rewards, criteria, deliverables), validate, PR |
| `close-hackathon` | Write | Set `status: archived`, PR |
| `create-profile` | Write | Generate hacker profile skeleton, guide editing, PR |
| `submit-project` | Write | Generate submission skeleton, guide editing, PR |
| `approve-nda` | Write | Find NDA issue, add `nda-approved` label |
| `simulate` | Write | Generate full hackathon simulation data (hackathon.yml + profiles + submissions + archive) |
| `list-registrations` | Read | Query registration issues for a hackathon |
| `list-submissions` | Read | Scan submission directories and show status |
| `export-scores` | Read | Parse score issues into CSV |
| `export-report` | Read | Generate comprehensive activity report |
| `audit-log` | Read | Query git history for a hackathon |
| `audit-permissions` | Read | Check RBAC config (collaborators + CODEOWNERS) |
| `audit-secrets` | Read | Verify required GitHub Secrets are configured |
| `watch-issue` | Watch | Monitor new bug/feature issues, AI triage + summary |

When the admin invokes `/synnovator-admin` without a specific command, display this table and
ask which operation they need.

---

## Write Operations

All write operations follow the same pattern:

```
Collect params → Create branch → Execute → Validate → Commit → Offer PR
```

Branch naming: `data/hackathon-{slug}` for hackathon ops, `data/profile-{username}` for profiles,
`data/submission-{slug}-{team}` for submissions.

Commit format: `type(scope): description` — types are `feat`, `fix`, `chore`; scope is usually
`hackathons` or `profiles`.

Before committing, always run validation:
```bash
bash scripts/validate-hackathon.sh hackathons/<slug>/hackathon.yml
```

After commit, offer to create PR but never push without the admin's confirmation.

### create-hackathon

1. Ask for: `slug` (lowercase alphanumeric + hyphens), `type` (community / enterprise / youth-league / open-source), `name`
2. Create branch: `git checkout -b data/hackathon-{slug}`
3. Run: `bash scripts/create-hackathon.sh {slug} {type} "{name}"`
4. Check if `docs/templates/{type}/hackathon.yml` exists — if so, read the template and use its
   structure to replace the generated skeleton. Preserve the `slug`, `name`, and `type` values
   from step 1; copy everything else from the template.
5. Read `references/schema-v2.md` to understand the full field structure.
   Guide the admin through filling required fields:
   - Timeline stages (at minimum: registration, development, submission, judging, announcement)
   - Tracks (name, slug, rewards, judging criteria with weights summing to 1.0)
   - Organizers (name, role)
   - Eligibility (open_to, team_size)
   - For enterprise type: legal section (NDA, IP ownership, compliance)
6. Validate: `bash scripts/validate-hackathon.sh hackathons/{slug}/hackathon.yml`
7. Stage and commit:
   ```bash
   git add hackathons/{slug}/
   git commit -m "feat(hackathons): create hackathon {slug}"
   ```
8. Offer: `gh pr create --title "feat(hackathons): add {slug}" --body "New hackathon: {name}"`

### update-timeline

1. Ask for hackathon `slug`
2. Read `hackathons/{slug}/hackathon.yml` — verify it exists
3. Display current timeline stages with dates
4. Ask which stage(s) to update and the new start/end dates (ISO 8601 format)
5. Edit the YAML using the Edit tool
6. Validate → branch (if not already on one) → commit → offer PR

### update-track

1. Ask for hackathon `slug`
2. Read and display current tracks (name, slug, rewards, judging criteria)
3. Ask what to change: rewards, criteria weights, deliverables, or add/remove a track
4. Edit the YAML — when modifying criteria weights, remind the admin they must sum to 1.0
5. Validate → branch → commit → offer PR

### close-hackathon

1. Ask for hackathon `slug`
2. Read the YAML — confirm the hackathon exists and is not already archived
3. Add `status: archived` under the `hackathon:` key
4. Branch → validate → commit with message `chore(hackathons): close hackathon {slug}` → offer PR

### create-profile

1. Ask for GitHub username
2. Run: `bash scripts/create-profile.sh {username}`
3. The script outputs the created file path — read it
4. Guide the admin through filling: name, bio, location, skills, identity
5. Branch → commit `feat(profiles): create profile for {username}` → offer PR

### submit-project

1. Ask for: hackathon slug, team name, track slug
2. Verify the hackathon exists and the track slug matches one in `hackathon.yml`
3. Run: `bash scripts/submit-project.sh {slug} {team} {track}`
4. Guide editing: project name, team members, deliverables, tech stack
5. Branch → commit `feat(hackathons): add submission {team} for {slug}` → offer PR

### approve-nda

1. Ask for: hackathon `slug` and GitHub `username`
2. Verify the hackathon requires NDA (`legal.nda.required == true`)
3. Find the NDA issue — read `references/github-api-patterns.md` for the query pattern:
   ```bash
   gh issue list --label "nda-sign" --search "{username} {slug}" --json number,title,author --limit 10
   ```
4. Confirm with admin which issue to approve
5. Add label: `gh issue edit {number} --add-label "nda-approved"`
6. Add comment: `gh issue comment {number} --body "NDA approved by @{admin}"`

### simulate

Generate a complete hackathon simulation — schema-v2 compliant YAML data files plus a rich
Markdown archive — using fictional but realistic data. The output is indistinguishable from
real platform data. Useful for user research interviews, operational dry-runs, demos, and
pitch materials.

Branch naming: `data/simulate-{slug}`

**Two organizer personas** shape defaults for legal, eligibility, confidentiality, and risk focus:

| Dimension | Enterprise (`enterprise`) | Youth League (`youth-league`) |
|-----------|--------------------------|-------------------------------|
| IP | Owned by organizer; NDA required | Open-source or author-owned |
| Confidentiality | High (NDA + data policy) | Low |
| Rewards | Cash / pilot contract / procurement | Certificates / internships / honors |
| Risk focus | R-01–R-05 (data leak, IP infringement) | R-03–R-08 (content violations, credential fraud) |

#### Parameter collection

Guide the admin through these parameters one at a time. The admin can say "use defaults" at
any step to accept all remaining defaults.

| # | Parameter | Required | Default |
|---|-----------|----------|---------|
| 1 | `slug` | Yes | — |
| 2 | `organizer_type` | Yes | `enterprise` |
| 3 | `challenge_theme` | Yes | "AI 驱动的智能运营方案探索" |
| 4 | `participant_scale` | No | `medium` |
| 5 | `tracks` | No | Technical + Business |
| 6 | `timeline` | No | 12-week standard (T+7 from today) |
| 7 | `team_policy` | No | 2–5 members |
| 8 | `judging_model` | No | Expert only; 4 criteria |
| 9 | `risk_event_toggles` | No | All enabled |
| 10 | `random_seed` | No | `42` |

**Scale presets** — `participant_scale` controls how much data to generate:

| Scale | Profiles | Submissions | Visitors | Registrations |
|-------|----------|-------------|----------|---------------|
| `small` | 5–8 | 3–5 | ~1,500 | ~100 |
| `medium` | 15–20 | 8–12 | ~5,000 | ~300 |
| `large` | 30–40 | 15–20 | ~15,000 | ~800 |

#### Execution steps

1. **Confirm persona** — `organizer_type` selects default legal/eligibility/risk settings
2. **Create branch** — `git checkout -b data/simulate-{slug}`
3. **Generate `hackathon.yml`**
   - Read `references/schema-v2.md` for field structure
   - Read `references/simulate-output-template.md` for content richness guidance
   - Fill `legal`, `eligibility`, `settings` per `organizer_type`
   - Generate fictional organizers, judges, events, FAQ, datasets (enterprise)
   - Enterprise: `legal.nda.required: true`, `ip_ownership: organizer`, compliance notes
   - Youth-league: `eligibility.open_to: students`, `legal.license: Apache-2.0`, mentor rules
4. **Generate profiles** — create `profiles/{username}-{uuid}.yml` files
   - Count per `participant_scale` table above
   - Fictional Chinese names, natural backgrounds, varied skills and experience levels
   - Each file conforms to profile schema in `references/schema-v2.md`
5. **Generate submissions** — create `hackathons/{slug}/submissions/team-{name}/project.yml`
   - Count per `participant_scale` table above
   - Team members drawn from generated profiles (each profile used at most once)
   - Cover all tracks; varied deliverable types (repo, video, demo, document)
6. **Generate `simulation-archive.md`** — the rich Markdown companion document
   - Read `references/simulate-output-template.md` and follow chapters 0–7 exactly
   - Read `references/simulate-risk-playbook.md` and inject ≥5 risk scenarios into chapter 5
   - Include: funnel data, ≥12 post samples (8+ types), scoring sheets, KPI dashboard
   - Read `references/simulate-example-a.md` or `simulate-example-b.md` if admin requests examples
7. **Self-consistency check** — verify before committing:
   - Funnel: visitors > registrations > teams > submissions > winners (monotonic decrease)
   - Profile count ≥ total unique team members across all submissions
   - Judging criteria weights sum to 1.0 (±0.01) per track
   - Timeline stages are chronological with no overlaps
   - Weighted scores in archive calculate correctly
8. **Validate** — `bash scripts/validate-hackathon.sh hackathons/{slug}/hackathon.yml`
9. **Review** — list all generated files for admin inspection
10. **Commit** — single commit with all files:
    ```bash
    git add hackathons/{slug}/ profiles/
    git commit -m "feat(hackathons): simulate hackathon {slug}"
    ```
11. **Offer PR**

#### Data generation rules

- **Natural numbers** — avoid round alignment (use 317, not 300; 4,312, not 4,000)
- **Fictional identifiers** — Chinese names (陈梦阳, 李思远), companies (智海科技, 云擎网络),
  placeholder URLs (`https://github.com/synnovator-demo/proj-xxx`)
- **Persona-specific** — enterprise archives emphasize NDA/IP/data policy;
  youth-league archives emphasize student eligibility and mentor rules
- **Post diversity** — ≥12 sample posts covering: official announcements, technical Q&A,
  experience sharing, complaints, team recruitment, mentor Q&A, celebrations, appeals
- **No real PII** — no real phone numbers, ID numbers, or registered company names

#### Quality checklist

Before committing, verify:
- [ ] `hackathon.yml` passes `validate-hackathon.sh`
- [ ] Funnel numbers decrease monotonically in `simulation-archive.md`
- [ ] Profile count matches `participant_scale`
- [ ] Submissions ≥ 8 (for medium/large), team members all have profiles
- [ ] Weighted scoring totals calculate correctly
- [ ] Risk scenarios ≥ 5 types in `simulation-archive.md`
- [ ] Enterprise: NDA + IP clauses present / Youth-league: open-source license declared
- [ ] No real personally identifiable information anywhere

#### Reference files

| File | When to load |
|------|-------------|
| `references/schema-v2.md` | Always — YAML field structure for hackathon, profile, submission |
| `references/simulate-output-template.md` | Always — chapters 0–7 structure for simulation-archive.md |
| `references/simulate-risk-playbook.md` | Step 6 — risk scenarios for chapter 5 |
| `references/simulate-example-a.md` | On request — medium-small enterprise pilot example |
| `references/simulate-example-b.md` | On request — large-scale youth-league competition example |

---

## Read Operations

Read operations never modify repo data. They query git history, GitHub API, or scan local files
and output formatted results.

For commands that use `gh` CLI, read `references/github-api-patterns.md` for exact query patterns
and JSON parsing.

### list-registrations

1. Ask for hackathon `slug`
2. Query:
   ```bash
   gh issue list --label "register,hackathon:{slug}" --json number,title,author,createdAt,labels --limit 500
   ```
3. Format as a table: #, Author, Date, Status (check for `registration-approved` label)

### list-submissions

1. Ask for hackathon `slug`
2. Scan `hackathons/{slug}/submissions/*/project.yml`
3. For each project.yml, read and extract: project name, track, team members, deliverables status
4. Format as a table with completion indicators (repo URL present? video? document?)

### export-scores

1. Ask for hackathon `slug` and optional track filter
2. Query score issues — see `references/github-api-patterns.md` for the parsing pattern
3. From each issue body, extract the YAML score block
4. Generate CSV with columns: `judge,team,track,criterion,score,weight,comment`
5. Save to `hackathons/{slug}/scores-export.csv` (local file, do NOT commit)
6. Display summary statistics (average scores per team, per criterion)

### export-report

1. Ask for hackathon `slug`
2. Gather data from multiple sources:
   - Basic info from `hackathon.yml`
   - Registration count from `list-registrations`
   - Submission count and status from `list-submissions`
   - Score summary from `export-scores` (if scores exist)
3. Output a structured report with sections: Overview, Timeline Status, Registrations,
   Submissions, Scores (if available), Tracks Summary

### audit-log

1. Ask for: hackathon `slug`, optional date range (`--since`, `--until`)
2. Run:
   ```bash
   git log --oneline --since="{from}" --until="{to}" -- hackathons/{slug}/
   ```
3. For more detail on a specific commit, offer: `git show {hash} -- hackathons/{slug}/`

### audit-permissions

1. Query collaborators:
   ```bash
   gh api repos/{owner}/{repo}/collaborators --jq '.[] | {login: .login, role: .role_name}'
   ```
2. Read `.github/CODEOWNERS` and parse path → team mappings
3. Display a permissions matrix comparing GitHub roles against CODEOWNERS coverage
4. Flag any mismatches (e.g., a user with Write access but not in CODEOWNERS for their area)

### audit-secrets

1. List configured secrets:
   ```bash
   gh secret list
   ```
2. Check against required secrets: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`,
   `R2_BUCKET_NAME`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `AUTH_SECRET`
3. Report which are present and which are missing (values are never shown)

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

---

## Important Rules

- Use `pnpm` for any JavaScript tooling — never `npm` or `npx` (enforced by hook)
- Always show generated/modified files for review before committing
- Never commit directly to `main` — always create a feature branch and PR
- Never push without admin confirmation
- Commit messages follow `type(scope): description` convention
- Write operations create local changes only — the admin decides when to push and create PR
- Read operations are side-effect-free — they output data but never modify files
- When editing YAML, preserve existing comments and formatting where possible
- For Schema details beyond what's in this file, read `references/schema-v2.md`
- For GitHub API query patterns, read `references/github-api-patterns.md`
