---
name: synnovator-admin
description: >
  Synnovator platform admin CLI — create/update/close hackathons, manage profiles and submissions,
  export scores and registrations, audit changes and permissions. Use whenever the admin needs to
  manage hackathon data, create profiles, export reports, query audit history, or perform any
  platform management operation. Also trigger when the user mentions hackathon management, YAML
  data editing, score exports, or NDA approvals in the Synnovator context. For hackathon simulation
  use /synnovator-admin:simulate; for issue monitoring use /synnovator-admin:watch-issue.
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

### Sub-Skills (independent invocation)

| Command | Invocation | What it does |
|---------|------------|-------------|
| `simulate` | `/synnovator-admin:simulate` | Generate full hackathon simulation data |
| `watch-issue` | `/synnovator-admin:watch-issue` | Monitor new bug/feature issues, AI triage + summary |

> **Tip**: `watch-issue` is designed for recurring use: `/loop 30m /synnovator-admin:watch-issue`

When the admin invokes `/synnovator-admin` without a specific command, display this table and
ask which operation they need.

---

## Write Operations

All write operations follow the same pattern:

```
Collect params → Create branch → Execute → Validate → Commit → Offer PR
```

Branch naming: `data/create-hackathon-{slug}` for hackathon ops, `data/create-profile-{username}` for profiles,
`data/submit-{hackathonSlug}-{teamSlug}` for submissions.

Commit format: `type(scope): description` — types are `feat`, `fix`, `chore`; scope is usually
`hackathons` or `profiles`.

Before committing, always run validation:
```bash
bash scripts/validate-hackathon.sh hackathons/<slug>/hackathon.yml
```

After commit, offer to create PR but never push without the admin's confirmation.

### create-hackathon

1. Ask for: `slug` (lowercase alphanumeric + hyphens), `type` (community / enterprise / youth-league / open-source), `name`
2. Create branch: `git checkout -b data/create-hackathon-{slug}`
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
   git commit -m "[创建比赛] {name_zh} / {name}"
   ```
8. Offer: `gh pr create --title "[创建比赛] {name_zh} / {name}" --body "比赛 / Hackathon: {name_zh} / {name}\n类型 / Type: {type}"`

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
4. Branch `data/create-hackathon-{slug}` → validate → commit with message `[关闭比赛] {name_zh} / {name}` → offer PR with title `[关闭比赛] {name_zh} / {name}`

### create-profile

1. Ask for GitHub username
2. Run: `bash scripts/create-profile.sh {username}`
3. The script outputs the created file path — read it
4. Guide the admin through filling: name, bio, location, skills, identity
5. Branch `data/create-profile-{username}` → commit `[创建档案] @{username}` → offer PR with title `[创建档案] @{username}`

### submit-project

1. Ask for: hackathon slug, team name, track slug
2. Verify the hackathon exists and the track slug matches one in `hackathon.yml`
3. Run: `bash scripts/submit-project.sh {slug} {team} {track}`
4. Guide editing: project name, team members, deliverables, tech stack
5. Branch `data/submit-{slug}-{team}` → commit `[提交] {project_name} → {hackathon_name_zh} · {track_name_zh}赛道` → offer PR

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

## Important Rules

- **All `references/` paths are relative to this skill's base directory** (provided by the
  system as `Base directory for this skill:` at load time), not the project root — always
  resolve via the skill directory when using the Read tool
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
