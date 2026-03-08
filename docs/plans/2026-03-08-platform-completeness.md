# Platform Completeness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete all missing platform features identified in the user flow docs, establish Issue→Action→PR data sync pattern, remove AI team matching, and fix all configuration gaps.

**Architecture:** Issue-triggered workflows validate user actions and sync conclusions into YAML via automated PRs. Direct PRs for user-authored content (profiles, projects, hackathons). D1/R2 for high-frequency/binary operations.

**Tech Stack:** GitHub Actions (YAML workflows), Next.js API routes, Cloudflare D1/R2/Functions, TypeScript, Zod schemas

**References:**
- `docs/plans/2026-03-08-hackathons-user-flow.md`
- `docs/plans/2026-03-08-hackers-user-flow.md`

---

## Phase 0: Cleanup & Configuration (P0)

### Task 1: Remove AI team matching from entire codebase

**Files:**
- Modify: `packages/shared/src/schemas/hackathon.ts:170`
- Modify: `hackathons/enterprise-fintech-risk-2025/hackathon.yml:293`
- Modify: `hackathons/dishuihu-ai-opc-global-challenge-2026/hackathon.yml:255`
- Modify: `.claude/skills/synnovator-admin/references/schema-v2.md:156`
- Modify: `docs/specs/synnovator-prd.md:159,503`
- Modify: `docs/acceptance/hacker.spec.md:270,281-295`
- Modify: `docs/acceptance/platform.spec.md:276-288`
- Modify: `docs/guides/infra-setup.md:183,333`
- Modify: `docs/plans/2026-03-03-architecture-design.md:479`
- Modify: `docs/plans/2026-03-03-p0-site-core-implementation.md:320,1073`
- Modify: `docs/plans/2026-03-05-nextjs-migration-implementation.md:622`

**Step 1: Remove from Zod schema**

In `packages/shared/src/schemas/hackathon.ts`, remove the `ai_team_matching` field from the settings schema.

**Step 2: Remove from hackathon YAML files**

In both hackathon YAML files, delete the `ai_team_matching: false` line from settings.

**Step 3: Remove from schema reference doc**

In `.claude/skills/synnovator-admin/references/schema-v2.md`, delete the `ai_team_matching` field.

**Step 4: Remove from PRD**

In `docs/specs/synnovator-prd.md`:
- Line 159: Delete `│   │   ├── ai-team-match.yml` from workflow listing
- Line 503: Delete `ai_team_matching: true` from example schema

**Step 5: Remove from acceptance specs**

In `docs/acceptance/hacker.spec.md`:
- Remove SC-H-008.2 "AI 组队匹配建议" scenario (lines ~281-289)
- Remove SC-H-008.3 "AI 匹配未启用" scenario (lines ~290-295)
- Update SC-H-008 description to remove AI reference in the "涉及层" line

In `docs/acceptance/platform.spec.md`:
- Remove entire US-P-009 section "AI Team Matching" (lines ~276-288)

**Step 6: Remove from infra guide and architecture docs**

In `docs/guides/infra-setup.md`:
- Line 183: Remove `ai-team-match` from the sentence
- Line 333: Remove `ai-team-match` from the sentence

In `docs/plans/2026-03-03-architecture-design.md`:
- Line 479: Remove the `ai-team-match.yml` row from the workflow table

**Step 7: Remove from implementation plan docs**

In `docs/plans/2026-03-03-p0-site-core-implementation.md`:
- Line 320: Remove `ai_team_matching: false`
- Line 1073: Remove `ai_team_matching: z.boolean().optional(),`

In `docs/plans/2026-03-05-nextjs-migration-implementation.md`:
- Line 622: Remove `ai_team_matching: z.boolean().optional(),`

**Step 8: Verify no remaining references**

Run: `grep -r "ai_team_matching\|ai-team-match\|ai_team\|AI 匹配" --include="*.ts" --include="*.tsx" --include="*.yml" --include="*.yaml" --include="*.md" .`
Expected: No matches

**Step 9: Commit**

```bash
git add -A
git commit -m "chore: remove AI team matching from all docs, schemas, and configs

AI team matching is descoped. Platform supports manual team finding
via GitHub Issues only."
```

---

### Task 2: Create missing GitHub labels

**Step 1: Create all required labels via gh CLI**

```bash
# Issue workflow labels
gh label create "registration" --description "Hackathon registration request" --color "0E8A16"
gh label create "registered" --description "Registration validated and approved" --color "006B75"
gh label create "nda-sign" --description "NDA signing confirmation" --color "D93F0B"
gh label create "nda-approved" --description "NDA validated and approved" --color "0E8A16"
gh label create "judge-score" --description "Judge scoring submission" --color "1D76DB"
gh label create "score-validated" --description "Score validated by Actions" --color "006B75"
gh label create "appeal" --description "Result appeal" --color "E4E669"
gh label create "appeal:pending" --description "Appeal awaiting organizer review" --color "FBCA04"
gh label create "appeal:accepted" --description "Appeal accepted" --color "0E8A16"
gh label create "appeal:rejected" --description "Appeal rejected" --color "D93F0B"
gh label create "appeal:expired" --description "Appeal window expired" --color "BFDADC"
gh label create "team-formation" --description "Team formation request" --color "C5DEF5"

# Hackathon & track routing labels
gh label create "hackathon:dishuihu-ai-opc-global-challenge-2026" --description "Hackathon routing" --color "EDEDED"
gh label create "hackathon:enterprise-fintech-risk-2025" --description "Hackathon routing" --color "EDEDED"

# Stage labels
gh label create "stage:draft" --description "Hackathon in draft stage" --color "E6E6E6"
gh label create "stage:registration" --description "Hackathon in registration stage" --color "BFD4F2"
gh label create "stage:development" --description "Hackathon in development stage" --color "0075CA"
gh label create "stage:submission" --description "Hackathon in submission stage" --color "7057FF"
gh label create "stage:judging" --description "Hackathon in judging stage" --color "D876E3"
gh label create "stage:announcement" --description "Hackathon in announcement stage" --color "FBCA04"
gh label create "stage:award" --description "Hackathon in award stage" --color "0E8A16"

# Blocker labels
gh label create "blocked:nda-required" --description "Registration blocked — NDA not signed" --color "B60205"
gh label create "blocked:no-profile" --description "Registration blocked — no profile found" --color "B60205"
```

**Step 2: Fix existing Issues**

```bash
# Issue #9: Fix title and add label
gh issue edit 9 --title "[NDA] allenwoods — enterprise-fintech-risk-2025"
gh issue edit 9 --add-label "nda-sign"

# Issue #10: Add missing label
gh issue edit 10 --add-label "registration"
```

**Step 3: Verify**

```bash
gh label list --limit 50
gh issue view 9 --json title,labels
gh issue view 10 --json title,labels
```

> Note: This task runs `gh` CLI commands, no file changes needed. No commit.

---

### Task 3: Update CONTRIBUTING.md — fix branch strategy

**Files:**
- Modify: `CONTRIBUTING.md:68-84`

**Step 1: Update branch strategy section**

Replace the current branch strategy (lines 68-84) with:

```markdown
## 分支策略

### 代码开发分支

```
feat/xxx ──→ main → [自动部署]
fix/xxx  ──→ main
docs/xxx ──→ main
```

| 前缀 | 用途 | 示例 |
|------|------|------|
| `feat/*` | 新功能开发 | `feat/add-voting-ui` |
| `fix/*` | Bug 修复 | `fix/i18n-fallback` |
| `docs/*` | 文档变更 | `docs/update-prd` |
| `refactor/*` | 重构 | `refactor/extract-utils` |
| `chore/*` | 配置/依赖 | `chore/bump-deps` |
| `ci/*` | CI/CD 变更 | `ci/add-lint-check` |

### 数据操作分支

平台数据变更（YAML）使用 `data/` 前缀，与代码分支区分：

| 前缀 | 用途 | 示例 |
|------|------|------|
| `data/hackathon-*` | 创建/编辑活动 | `data/hackathon-ai-challenge-2026` |
| `data/profile-*` | 创建/编辑 Profile | `data/profile-alice` |
| `data/submission-*` | 提交项目 | `data/submission-ai-challenge-team-alpha` |
| `data/simulate-*` | 模拟数据 | `data/simulate-fintech-2025` |
| `data/sync-*` | Actions 自动同步 | `data/sync-registrations-2026-03-08` |

## Pull Request

1. 从 `main` 创建功能/数据分支
2. 开发完成后提交 PR 到 `main`
3. PR 标题遵循 Commit 规范格式
4. 合并后自动部署
```

**Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: update branch strategy — remove dev branch, add data/* namespace"
```

---

### Task 4: Update Skill branch naming conventions

**Files:**
- Modify: `.claude/skills/synnovator-admin/SKILL.md`

**Step 1: Find and update branch naming patterns**

In the Skill file, change all branch naming from `feat/hackathon-{slug}`, `feat/profile-{username}`, `feat/submission-{slug}-{team}`, `feat/simulate-{slug}` to `data/hackathon-{slug}`, `data/profile-{username}`, `data/submission-{slug}-{team}`, `data/simulate-{slug}` respectively.

**Step 2: Commit**

```bash
git add .claude/skills/synnovator-admin/SKILL.md
git commit -m "chore(skills): use data/* branch prefix for data operations"
```

---

## Phase 1: Issue→Action→PR Infrastructure (P1)

### Task 5: Create validate-register.yml workflow

**Files:**
- Create: `.github/workflows/validate-register.yml`

**Step 1: Write the workflow**

```yaml
name: Validate Registration
on:
  issues:
    types: [opened, edited]

jobs:
  validate:
    if: contains(github.event.issue.labels.*.name, 'registration')
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - name: Parse Issue
        id: parse
        uses: actions/github-script@v7
        with:
          script: |
            const body = context.payload.issue.body || '';
            const title = context.payload.issue.title || '';

            // Parse title: [Register] {username} — {hackathon-slug}
            const titleMatch = title.match(/^\[Register\]\s+(\S+)\s+—\s+(\S+)$/);
            if (!titleMatch) {
              core.setFailed('Title must match: [Register] {username} — {hackathon-slug}');
              return;
            }
            const [, username, hackathonSlug] = titleMatch;

            // Anti-impersonation: issue author must match declared username
            const author = context.payload.issue.user.login;
            if (author.toLowerCase() !== username.toLowerCase()) {
              core.setFailed(`Author mismatch: Issue author is @${author} but title declares @${username}`);
              return;
            }

            // Parse body fields
            const getField = (label) => {
              const regex = new RegExp(`### ${label}\\s*\\n\\s*(.+)`, 'i');
              const match = body.match(regex);
              return match ? match[1].trim() : '';
            };

            const hackathon = getField('Hackathon Slug') || hackathonSlug;
            const track = getField('Track Slug');
            const role = getField('Role');

            core.setOutput('username', username);
            core.setOutput('hackathon', hackathon);
            core.setOutput('track', track);
            core.setOutput('role', role);

      - name: Validate hackathon exists
        id: hackathon
        run: |
          SLUG="${{ steps.parse.outputs.hackathon }}"
          if [ ! -f "hackathons/${SLUG}/hackathon.yml" ]; then
            echo "error=Hackathon '${SLUG}' not found" >> $GITHUB_OUTPUT
            exit 1
          fi
          echo "found=true" >> $GITHUB_OUTPUT

      - name: Validate profile exists
        run: |
          USERNAME="${{ steps.parse.outputs.username }}"
          PROFILE=$(find profiles/ -name "${USERNAME}-*.yml" -type f | head -1)
          if [ -z "$PROFILE" ]; then
            echo "::error::Profile not found for @${USERNAME}. Create a profile first."
            exit 1
          fi

      - name: Check hackathon stage
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const slug = '${{ steps.parse.outputs.hackathon }}';
            const yaml = fs.readFileSync(`hackathons/${slug}/hackathon.yml`, 'utf8');

            // Simple stage check: registration.start <= now <= registration.end
            const regStartMatch = yaml.match(/registration:\s*\n\s*start:\s*["']?(\S+)/);
            const regEndMatch = yaml.match(/registration:\s*\n\s*start:\s*\S+\s*\n\s*end:\s*["']?(\S+)/);

            if (regStartMatch && regEndMatch) {
              const now = new Date();
              const start = new Date(regStartMatch[1]);
              const end = new Date(regEndMatch[1]);
              if (now < start) {
                core.setFailed('Registration has not opened yet');
              } else if (now > end) {
                core.setFailed('Registration has closed');
              }
            }

      - name: Check NDA requirement
        id: nda
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const slug = '${{ steps.parse.outputs.hackathon }}';
            const username = '${{ steps.parse.outputs.username }}';
            const yaml = fs.readFileSync(`hackathons/${slug}/hackathon.yml`, 'utf8');

            const ndaRequired = yaml.includes('nda:') && yaml.includes('required: true');
            if (!ndaRequired) {
              core.setOutput('nda_required', 'false');
              return;
            }

            // Check for nda-approved Issue
            const issues = await github.rest.issues.listForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              labels: `nda-sign,nda-approved`,
              state: 'all',
              per_page: 100
            });
            const ndaSigned = issues.data.some(i =>
              i.title.includes(username) && i.title.includes(slug)
            );
            if (!ndaSigned) {
              core.setFailed(`NDA required but not signed. Please sign the NDA first.`);
              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                labels: ['blocked:nda-required']
              });
            }
            core.setOutput('nda_required', 'true');

      - name: Check duplicate registration
        uses: actions/github-script@v7
        with:
          script: |
            const username = '${{ steps.parse.outputs.username }}';
            const slug = '${{ steps.parse.outputs.hackathon }}';
            const issues = await github.rest.issues.listForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              labels: 'registered',
              state: 'all',
              per_page: 100
            });
            const duplicate = issues.data.some(i =>
              i.title.includes(username) && i.title.includes(slug)
            );
            if (duplicate) {
              core.setFailed(`@${username} is already registered for ${slug}`);
            }

      - name: Approve registration
        if: success()
        uses: actions/github-script@v7
        with:
          script: |
            const username = '${{ steps.parse.outputs.username }}';
            await github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              labels: ['registered', `hackathon:${{ steps.parse.outputs.hackathon }}`]
            });
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `✅ Registration approved for @${username}!\n\nTrack: ${{ steps.parse.outputs.track }}\nRole: ${{ steps.parse.outputs.role }}`
            });

      - name: Post failure comment
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `❌ Registration validation failed. Please check the errors above and try again.`
            });
```

**Step 2: Commit**

```bash
git add .github/workflows/validate-register.yml
git commit -m "ci: add validate-register.yml workflow for registration validation"
```

---

### Task 6: Create validate-team.yml workflow

**Files:**
- Create: `.github/workflows/validate-team.yml`

**Step 1: Write the workflow**

```yaml
name: Validate Team Formation
on:
  issues:
    types: [opened, edited]

jobs:
  validate:
    if: contains(github.event.issue.labels.*.name, 'team-formation')
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - name: Parse and validate
        uses: actions/github-script@v7
        with:
          script: |
            const body = context.payload.issue.body || '';
            const title = context.payload.issue.title || '';

            // Parse title: [Team] {team-name} — {hackathon-slug}
            const titleMatch = title.match(/^\[Team\]\s+(.+?)\s+—\s+(\S+)$/);
            if (!titleMatch) {
              core.setFailed('Title must match: [Team] {team-name} — {hackathon-slug}');
              return;
            }
            const [, teamName, slug] = titleMatch;

            // Verify hackathon exists
            const fs = require('fs');
            const hackathonPath = `hackathons/${slug}/hackathon.yml`;
            if (!fs.existsSync(hackathonPath)) {
              core.setFailed(`Hackathon '${slug}' not found`);
              return;
            }

            // Validate track if specified
            const trackMatch = body.match(/### Track Slug\s*\n\s*(\S+)/i);
            if (trackMatch) {
              const track = trackMatch[1];
              const yaml = fs.readFileSync(hackathonPath, 'utf8');
              if (!yaml.includes(`slug: ${track}`) && !yaml.includes(`slug: "${track}"`)) {
                core.setFailed(`Track '${track}' not found in hackathon '${slug}'`);
                return;
              }
            }

            // Add routing labels
            await github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              labels: [`hackathon:${slug}`]
            });

            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `✅ Team formation post validated for hackathon \`${slug}\`.\n\n**Looking to join this team?** Comment below with your GitHub username, desired role, and relevant skills.`
            });
```

**Step 2: Commit**

```bash
git add .github/workflows/validate-team.yml
git commit -m "ci: add validate-team.yml workflow for team formation validation"
```

---

### Task 7: Create sync-issue-data.yml workflow (unified sync)

**Files:**
- Create: `.github/workflows/sync-issue-data.yml`

This is a single unified workflow that syncs validated Issue data into YAML files. It handles both registrations and NDA records.

**Step 1: Write the workflow**

```yaml
name: Sync Issue Data to YAML
on:
  # Trigger when validation labels are added
  issues:
    types: [labeled]
  # Also run on schedule as safety net
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  sync-registrations:
    if: >
      github.event_name == 'schedule' ||
      github.event_name == 'workflow_dispatch' ||
      github.event.label.name == 'registered'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: read
    steps:
      - uses: actions/checkout@v4
        with:
          ref: main

      - name: Collect and sync registrations
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const path = require('path');

            // Fetch all registered Issues
            const issues = await github.paginate(github.rest.issues.listForRepo, {
              owner: context.repo.owner,
              repo: context.repo.repo,
              labels: 'registered',
              state: 'all',
              per_page: 100
            });

            // Group by username
            const registrations = {};
            for (const issue of issues) {
              const match = issue.title.match(/^\[Register\]\s+(\S+)\s+—\s+(\S+)$/);
              if (!match) continue;
              const [, username, hackathon] = match;

              // Parse body for details
              const body = issue.body || '';
              const getField = (label) => {
                const regex = new RegExp(`### ${label}\\s*\\n\\s*(.+)`, 'i');
                const m = body.match(regex);
                return m ? m[1].trim() : '';
              };

              if (!registrations[username]) registrations[username] = [];
              registrations[username].push({
                hackathon,
                track: getField('Track Slug'),
                role: getField('Role').toLowerCase().replace(/[()]/g, '').replace(/\s+/g, '-'),
                registered_at: issue.created_at
              });
            }

            // For each user, find their profile and check/update registrations
            const profileDir = 'profiles';
            const files = fs.readdirSync(profileDir).filter(f => f.endsWith('.yml'));
            let changed = false;

            for (const [username, regs] of Object.entries(registrations)) {
              const profileFile = files.find(f => f.startsWith(`${username}-`));
              if (!profileFile) continue;

              const filePath = path.join(profileDir, profileFile);
              let content = fs.readFileSync(filePath, 'utf8');

              for (const reg of regs) {
                // Check if already present
                if (content.includes(`hackathon: "${reg.hackathon}"`) ||
                    content.includes(`hackathon: ${reg.hackathon}`)) {
                  continue;
                }

                // Append registration entry
                if (!content.includes('registrations:')) {
                  content += '\n  registrations:\n';
                }
                content += `    - hackathon: "${reg.hackathon}"\n`;
                content += `      track: "${reg.track}"\n`;
                content += `      role: "${reg.role}"\n`;
                content += `      registered_at: "${reg.registered_at}"\n`;
                changed = true;
              }

              if (changed) {
                fs.writeFileSync(filePath, content);
              }
            }

            core.setOutput('changed', changed.toString());

      - name: Create PR if changed
        if: steps.*.outputs.changed == 'true'
        run: |
          DATE=$(date +%Y-%m-%d)
          BRANCH="data/sync-registrations-${DATE}"
          git checkout -b "${BRANCH}"
          git add profiles/
          git commit -m "chore: sync registration data from Issues [automated]"
          git push origin "${BRANCH}"
          gh pr create \
            --title "chore: sync registration data from validated Issues" \
            --body "Automated sync of registration data from GitHub Issues with \`registered\` label into profile YAML files." \
            --base main
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  sync-nda:
    if: >
      github.event_name == 'schedule' ||
      github.event_name == 'workflow_dispatch' ||
      github.event.label.name == 'nda-approved'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: read
    steps:
      - uses: actions/checkout@v4
        with:
          ref: main

      - name: Collect and sync NDA records
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const path = require('path');

            // Fetch all nda-approved Issues
            const issues = await github.paginate(github.rest.issues.listForRepo, {
              owner: context.repo.owner,
              repo: context.repo.repo,
              labels: 'nda-approved',
              state: 'all',
              per_page: 100
            });

            const ndaRecords = {};
            for (const issue of issues) {
              const match = issue.title.match(/^\[NDA\]\s+(\S+)\s+—\s+(\S+)$/);
              if (!match) continue;
              const [, username, hackathon] = match;

              if (!ndaRecords[username]) ndaRecords[username] = [];
              ndaRecords[username].push({
                hackathon,
                signed_at: issue.created_at
              });
            }

            const profileDir = 'profiles';
            const files = fs.readdirSync(profileDir).filter(f => f.endsWith('.yml'));
            let changed = false;

            for (const [username, records] of Object.entries(ndaRecords)) {
              const profileFile = files.find(f => f.startsWith(`${username}-`));
              if (!profileFile) continue;

              const filePath = path.join(profileDir, profileFile);
              let content = fs.readFileSync(filePath, 'utf8');

              for (const rec of records) {
                if (content.includes(`hackathon: "${rec.hackathon}"`) &&
                    content.includes('nda_signed:')) {
                  continue;
                }

                if (!content.includes('nda_signed:')) {
                  content += '\n  nda_signed:\n';
                }
                content += `    - hackathon: "${rec.hackathon}"\n`;
                content += `      signed_at: "${rec.signed_at}"\n`;
                changed = true;
              }

              if (changed) {
                fs.writeFileSync(filePath, content);
              }
            }

            core.setOutput('changed', changed.toString());

      - name: Create PR if changed
        if: steps.*.outputs.changed == 'true'
        run: |
          DATE=$(date +%Y-%m-%d)
          BRANCH="data/sync-nda-${DATE}"
          git checkout -b "${BRANCH}"
          git add profiles/
          git commit -m "chore: sync NDA records from Issues [automated]"
          git push origin "${BRANCH}"
          gh pr create \
            --title "chore: sync NDA records from validated Issues" \
            --body "Automated sync of NDA signing records from GitHub Issues with \`nda-approved\` label into profile YAML files." \
            --base main
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Step 2: Commit**

```bash
git add .github/workflows/sync-issue-data.yml
git commit -m "ci: add sync-issue-data.yml — persist Issue conclusions to YAML via PR"
```

---

### Task 8: Refactor RegisterForm to use Issue instead of PR

**Files:**
- Modify: `apps/web/components/forms/RegisterForm.tsx`

**Step 1: Read current implementation**

Read the full file to understand current buildPRUrl logic.

**Step 2: Replace buildPRUrl with buildIssueUrl**

Change the submit handler to:
1. Remove YAML generation and profile fetching/editing logic
2. Instead, use `buildIssueUrl()` with:
   - template: `register.yml`
   - title: `[Register] {username} — {hackathonSlug}`
   - labels: `registration`
   - Pre-fill fields: hackathon, github, track, role, team

Keep existing validations:
- Profile existence check via `/api/check-profile`
- Duplicate registration check (can now check via Issue search instead of profile YAML)

**Step 3: Commit**

```bash
git add apps/web/components/forms/RegisterForm.tsx
git commit -m "refactor(web): RegisterForm uses Issue instead of PR for registration"
```

---

### Task 9: Refactor NDASignForm to use Issue instead of PR

**Files:**
- Modify: `apps/web/components/forms/NDASignForm.tsx`

**Step 1: Read current implementation**

Read the full file to understand current buildPRUrl logic.

**Step 2: Replace buildPRUrl with buildIssueUrl**

Change the submit handler to:
1. Remove YAML generation and profile fetching/editing logic
2. Use `buildIssueUrl()` with:
   - template: `nda-sign.yml`
   - title: `[NDA] {username} — {hackathonSlug}`
   - labels: `nda-sign`
   - Pre-fill fields: hackathon, github

Keep existing validations:
- Profile existence check
- Duplicate NDA check (check via Issue search instead of profile YAML)

**Step 3: Commit**

```bash
git add apps/web/components/forms/NDASignForm.tsx
git commit -m "refactor(web): NDASignForm uses Issue instead of PR for NDA signing"
```

---

## Phase 2: Missing UI Features (P1–P2)

### Task 10: Add Teams tab to hackathon detail page

**Files:**
- Modify: `apps/web/app/(public)/hackathons/[slug]/page.tsx` (or the tabs component)
- Create: `apps/web/components/TeamsTab.tsx`

**Step 1: Create TeamsTab component**

Component that:
1. Accepts `hackathonSlug` prop
2. Links to GitHub Issues filtered by `team-formation` + `hackathon:{slug}` labels:
   `https://github.com/{org}/{repo}/issues?q=label:team-formation+label:hackathon:{slug}+is:open`
3. Shows a "Post Team" button that opens TeamFormationForm
4. Displays a message explaining how to browse and join teams

**Step 2: Add TeamsTab to HackathonTabs**

Add a "Teams" tab alongside existing tabs (Details, Submissions, Leaderboard).
Show during `registration` and `development` stages.

**Step 3: Commit**

```bash
git add apps/web/components/TeamsTab.tsx apps/web/app/\(public\)/hackathons/\[slug\]/page.tsx
git commit -m "feat(web): add Teams tab to hackathon detail page"
```

---

### Task 11: Add Edit Profile button

**Files:**
- Modify: `apps/web/app/(public)/hackers/[id]/page.tsx`

**Step 1: Add "Edit" button**

For logged-in users viewing their own profile, show an "Edit" button that links to:
`https://github.com/{org}/{repo}/edit/main/profiles/{username}-{uuid}.yml`

The button should only appear when `session.login === profileUsername`.

**Step 2: Commit**

```bash
git add apps/web/app/\(public\)/hackers/\[id\]/page.tsx
git commit -m "feat(web): add Edit Profile button linking to GitHub editor"
```

---

### Task 12: Add Edit Project button

**Files:**
- Modify: `apps/web/app/(public)/projects/[hackathon]/[team]/page.tsx`

**Step 1: Add "Edit" button**

For logged-in users who are team members, show an "Edit" button that links to:
`https://github.com/{org}/{repo}/edit/main/hackathons/{slug}/submissions/{team}/project.yml`

**Step 2: Commit**

```bash
git add apps/web/app/\(public\)/projects/
git commit -m "feat(web): add Edit Project button linking to GitHub editor"
```

---

### Task 13: Add Dataset download section to hackathon page

**Files:**
- Create: `apps/web/components/DatasetSection.tsx`
- Modify: hackathon detail page to include DatasetSection

**Step 1: Create DatasetSection component**

Component that:
1. Reads `datasets[]` from hackathon config
2. For `access_control: "public"`: show direct download link
3. For `access_control: "nda-required"`: show download button that calls `/api/presign`
4. Display dataset metadata: name, format, size

**Step 2: Add to hackathon detail page**

Include in the Details tab, after existing content.

**Step 3: Commit**

```bash
git add apps/web/components/DatasetSection.tsx
git commit -m "feat(web): add Dataset download section with NDA-gated presigned URLs"
```

---

## Phase 3: Docs & Schema Alignment

### Task 14: Update CLAUDE.md and project docs

**Files:**
- Modify: `CLAUDE.md` — update data flow diagram to show Issue→Action→PR pattern
- Modify: `docs/specs/synnovator-prd.md` — update workflow descriptions (remove AI matching, add sync pattern)
- Modify: `docs/acceptance/hacker.spec.md` — update registration/NDA scenarios to reflect Issue-based flow

**Step 1: Update data flow in CLAUDE.md**

Replace the data flow section with:
```
用户 PR → hackathons/*.yml / profiles/*.yml → Actions 校验 → Merge → apps/web/ 构建 → Cloudflare Pages
用户 Issue → 注册/NDA/评分/申诉/组队 → Actions 校验 → Label → sync-issue-data → PR → Merge
管理员 Skill → scripts/ + YAML 编辑 → PR → Actions 校验 → Merge
```

**Step 2: Update acceptance specs**

Update hacker.spec.md registration and NDA scenarios to reflect:
- RegisterForm → Issue (not PR)
- Actions validate → `registered` label
- sync-issue-data → PR persists data

**Step 3: Commit**

```bash
git add CLAUDE.md docs/
git commit -m "docs: update data flow docs for Issue→Action→PR sync pattern"
```

---

## Execution Summary

| Phase | Tasks | Priority | Estimated Scope |
|-------|-------|----------|----------------|
| Phase 0 | T1–T4: Cleanup, labels, branch naming | P0 | 11 files edited + CLI commands |
| Phase 1 | T5–T9: Workflows + form refactors | P1 | 3 new workflows + 2 form refactors |
| Phase 2 | T10–T13: UI features | P1–P2 | 3 new components + 3 page modifications |
| Phase 3 | T14: Doc updates | P1 | 3 doc files |

**Dependencies:**
- T2 (labels) must run before T5–T7 (workflows depend on labels existing)
- T5 (validate-register) should exist before T8 (RegisterForm refactor)
- T6 (validate-nda exists already) → T9 (NDASignForm refactor) can proceed
- T10–T13 are independent of each other
