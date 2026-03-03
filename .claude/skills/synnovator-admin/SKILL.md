---
name: synnovator-admin
description: Synnovator platform admin commands — create hackathons, manage timelines, export scores, audit changes. Use when user needs to manage hackathon data, profiles, or platform configuration.
---

# Synnovator Admin

Platform administration commands for the Synnovator Git-native Hackathon platform.

## Available Commands

### /synnovator-admin create-hackathon

Create a new hackathon event.

**Flow:**
1. Ask for: slug, type (community/enterprise/youth-league/open-source), name
2. Run: `bash scripts/create-hackathon.sh <slug> <type> "<name>"`
3. Open the generated `hackathons/<slug>/hackathon.yml` for editing
4. Guide admin through filling required fields (timeline, tracks, eligibility)
5. Commit and offer to create PR

### /synnovator-admin create-profile

Create a new hacker profile.

**Flow:**
1. Ask for: GitHub username
2. Run: `bash scripts/create-profile.sh <username>`
3. Open generated profile for editing
4. Commit and offer to create PR

### /synnovator-admin submit-project

Create a project submission skeleton.

**Flow:**
1. Ask for: hackathon slug, team name, track slug
2. Run: `bash scripts/submit-project.sh <slug> <team> <track>`
3. Open generated project.yml for editing
4. Commit and offer to create PR

### /synnovator-admin update-timeline

Update a hackathon's timeline dates.

**Flow:**
1. Ask for: hackathon slug
2. Read current timeline from `hackathons/<slug>/hackathon.yml`
3. Show current dates, ask which stage to update
4. Edit the YAML with new dates
5. Commit and offer to create PR

### /synnovator-admin export-scores

Export scores for a hackathon to CSV.

**Flow:**
1. Ask for: hackathon slug
2. Use `gh issue list` to find Issues with label `judge-score,hackathon:<slug>`
3. Parse YAML scores from each Issue body
4. Generate CSV output (judge, team, track, criterion, score, comment)
5. Save to file or display

### /synnovator-admin audit

View change history for a hackathon.

**Flow:**
1. Ask for: hackathon slug, optional date range
2. Run: `git log --oneline hackathons/<slug>/`
3. Display formatted results

## Important Rules

- Always validate inputs before running scripts
- Always show generated files for review before committing
- Never commit directly to main — always create a branch and PR
- Use `pnpm` (never npm/npx)
- Follow commit convention: `type(scope): description`
