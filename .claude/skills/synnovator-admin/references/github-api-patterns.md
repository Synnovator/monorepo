# GitHub API Patterns Reference

Load this file when executing export or audit commands that use `gh` CLI or GitHub API.

## Issue Queries

### List Registrations

```bash
gh issue list \
  --label "register,hackathon:{slug}" \
  --json number,title,author,createdAt,labels \
  --limit 500
```

Parse the JSON output. Each item has:
- `number`: Issue number
- `title`: Usually "[Register] username — hackathon-slug"
- `author.login`: GitHub username
- `createdAt`: ISO timestamp
- `labels[].name`: Check for `registration-approved` to determine status

### List Score Issues

```bash
gh issue list \
  --label "judge-score,hackathon:{slug}" \
  --json number,title,body,author \
  --limit 500
```

Title format: `[Score] team-name — hackathon-slug / track-slug`

Parse team and track from title:
```
[Score] {team} — {slug} / {track}
```

### Extract Scores from Issue Body

Score issues contain a YAML block in the body. Look for the `scores:` section:

```yaml
scores:
  - criterion: "Innovation"
    score: 85
    weight: 0.3
    comment: "Good approach but could improve..."
  - criterion: "Technical Depth"
    score: 92
    weight: 0.3
    comment: "Excellent implementation"
```

To extract: find the YAML block between ` ```yaml ` and ` ``` ` fences in the body,
or look for lines starting with `scores:` followed by indented list items.

### Find NDA Issues

```bash
gh issue list \
  --label "nda-sign" \
  --search "{username} {slug}" \
  --json number,title,author \
  --limit 10
```

Title format: `[NDA] {username} — {hackathon-slug}`

### Approve NDA

```bash
gh issue edit {number} --add-label "nda-approved"
gh issue comment {number} --body "NDA approved by @{admin-username} on $(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

## Collaborator & Permission Queries

### List Collaborators

```bash
gh api repos/{owner}/{repo}/collaborators \
  --jq '.[] | {login: .login, role: .role_name}'
```

Role values: `admin`, `maintain`, `write`, `triage`, `read`

### List Team Members (if using GitHub Teams)

```bash
gh api orgs/{org}/teams/{team-slug}/members \
  --jq '.[].login'
```

## CODEOWNERS Format

The `.github/CODEOWNERS` file maps paths to responsible teams/users:

```
/hackathons/*/                 @Synnovator/maintainers
/profiles/                     @Synnovator/maintainers
/site/                         @Synnovator/developers
/.github/                      @Synnovator/admins
```

Parse each line as: `{path-pattern} {owners...}`

When auditing permissions, cross-reference collaborator roles against CODEOWNERS to identify:
- Users with write access but not listed in CODEOWNERS for areas they maintain
- CODEOWNERS entries referencing teams/users without repo access

## Secrets

### List Configured Secrets

```bash
gh secret list
```

Output format (tab-separated): `NAME  UPDATED`

### Required Secrets Checklist

| Secret | Purpose |
|--------|---------|
| `R2_ACCESS_KEY_ID` | R2 S3-compatible API key |
| `R2_SECRET_ACCESS_KEY` | R2 S3-compatible API secret |
| `R2_ENDPOINT` | R2 S3-compatible endpoint URL |
| `R2_BUCKET_NAME` | R2 bucket name |

Note: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `AUTH_SECRET` are CF Pages environment
variables (not GitHub Secrets), so they won't appear in `gh secret list`.

## PR Creation Pattern

For write operations that end with a PR:

```bash
gh pr create \
  --title "feat(hackathons): add {slug}" \
  --body "$(cat <<'EOF'
## Summary

- Created new hackathon: {name}
- Type: {type}
- Timeline: {registration_start} to {announcement_end}

## Checklist

- [ ] hackathon.yml validated (Schema V2)
- [ ] Timeline dates are correct
- [ ] Track criteria weights sum to 1.0
- [ ] Organizer information complete
EOF
)"
```

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
