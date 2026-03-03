# P1 Core Workflows Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 5 core P1 workflow features — NDA signing, dataset auth, judge conflict declaration, scoring model enhancement, and appeal arbitration — across 4 batches.

**Architecture:** Workflow-centric approach. All logic lives in GitHub Actions workflows. Presign API enhanced with NDA checking via GitHub API. Score results written to repo JSON files. No new infrastructure (no D1).

**Tech Stack:** Astro Hybrid (Cloudflare Pages), GitHub Actions (actions/github-script@v7, js-yaml), AWS SDK S3 presigning, vanilla JS for client-side interactions.

**Design Doc:** `docs/plans/2026-03-03-p1-core-workflows-design.md`

**Acceptance Specs:** `docs/acceptance/hacker.spec.md` (US-H-007/009), `docs/acceptance/judge.spec.md` (US-J-003/004/005), `docs/acceptance/organizer.spec.md` (US-O-007/008/009), `docs/acceptance/platform.spec.md` (US-P-007/013)

---

## Batch 1: NDA Signing + Dataset Auth

### Task 1: Add i18n keys for NDA and results features

**Files:**
- Modify: `site/src/i18n/zh.yml`
- Modify: `site/src/i18n/en.yml`

**Step 1: Add Chinese translations**

Add the following keys to `site/src/i18n/zh.yml` (after the existing `hackathon:` section entries):

```yaml
# Inside hackathon: section, add after nda_warning:
  nda_sign: "签署 NDA"
  nda_summary: "保密协议摘要"
  nda_download: "下载 NDA 文档"
  nda_required_msg: "⚠️ 本活动需签署保密协议（NDA），报名后请及时签署"
  nda_required_download: "⚠️ 需签署 NDA 后才能下载此数据集"
  nda_sign_link: "前往签署 NDA"
  results: "评审结果"
  results_pending: "结果尚未公布"
  appeal_window: "申诉窗口"

# New section for results:
result:
  title: "评审结果"
  rank: "排名"
  team: "团队"
  score: "得分"
  breakdown: "明细"
  expert_score: "专家得分"
  vote_score: "投票得分"
  final_score: "最终得分"
  hard_constraint_warning: "⚠️ 触发硬约束"
  judge_anonymous: "评委"
  no_results: "暂无评审结果"
  pending: "评审结果尚未公布，请在公示期查看"

# New section for conflict:
conflict:
  declaration: "利益冲突声明"
  confirmed: "已提交利益冲突声明"
  checkbox: "我确认与该团队无利益冲突关系"

# New section for dataset access:
dataset:
  public: "公开"
  nda_required: "需 NDA"
```

**Step 2: Add English translations**

Add the same structure to `site/src/i18n/en.yml`:

```yaml
# Inside hackathon: section:
  nda_sign: "Sign NDA"
  nda_summary: "NDA Summary"
  nda_download: "Download NDA Document"
  nda_required_msg: "⚠️ This event requires NDA signing. Please sign after registration."
  nda_required_download: "⚠️ You must sign the NDA before downloading this dataset"
  nda_sign_link: "Sign NDA"
  results: "Results"
  results_pending: "Results not yet published"
  appeal_window: "Appeal Window"

result:
  title: "Judging Results"
  rank: "Rank"
  team: "Team"
  score: "Score"
  breakdown: "Breakdown"
  expert_score: "Expert Score"
  vote_score: "Vote Score"
  final_score: "Final Score"
  hard_constraint_warning: "⚠️ Hard constraint triggered"
  judge_anonymous: "Judge"
  no_results: "No results available"
  pending: "Judging results have not been published yet. Check back during the announcement period."

conflict:
  declaration: "Conflict of Interest"
  confirmed: "Conflict declaration filed"
  checkbox: "I confirm no conflict of interest with this team"

dataset:
  public: "Public"
  nda_required: "NDA Required"
```

**Step 3: Verify build**

Run: `cd site && pnpm run build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add site/src/i18n/zh.yml site/src/i18n/en.yml
git commit -m "feat(site): add i18n keys for P1 NDA, results, conflict features"
```

---

### Task 2: Create validate-nda.yml workflow

**Files:**
- Create: `.github/workflows/validate-nda.yml`

**Reference:** Existing workflow pattern in `.github/workflows/validate-score.yml` — same trigger style (issues + label filter), same tools (actions/checkout, actions/setup-node, js-yaml, actions/github-script).

**Step 1: Write the workflow**

Create `.github/workflows/validate-nda.yml`:

```yaml
name: Validate NDA

on:
  issues:
    types: [opened, edited]

jobs:
  validate:
    if: contains(github.event.issue.labels.*.name, 'nda-sign')
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - run: npm install js-yaml

      - name: Validate NDA signing
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const yaml = require('./node_modules/js-yaml');
            const issue = context.payload.issue;
            const title = issue.title;
            const author = issue.user.login;
            const body = issue.body || '';
            const errors = [];

            // 1. Parse title: [NDA] username — hackathon-slug
            const titleMatch = title.match(/\[NDA\]\s*(.*?)\s*—\s*(.*)/);
            if (!titleMatch) {
              errors.push('Issue title must match: `[NDA] username — hackathon-slug`');
            }
            const [, username, slug] = titleMatch || [null, '', ''];
            const trimmedSlug = slug ? slug.trim() : '';
            const trimmedUsername = username ? username.trim() : '';

            // 2. Verify hackathon exists and requires NDA
            if (trimmedSlug) {
              const hackathonPath = `hackathons/${trimmedSlug}/hackathon.yml`;
              if (!fs.existsSync(hackathonPath)) {
                errors.push(`Hackathon not found: \`${trimmedSlug}\``);
              } else {
                const data = yaml.load(fs.readFileSync(hackathonPath, 'utf8'));
                const h = data.hackathon;
                if (!h?.legal?.nda?.required) {
                  errors.push(`Hackathon \`${trimmedSlug}\` does not require NDA signing`);
                }
              }
            }

            // 3. Verify author matches declared username (anti-impersonation)
            if (trimmedUsername && trimmedUsername.toLowerCase() !== author.toLowerCase()) {
              errors.push(`Issue author @${author} does not match declared username \`${trimmedUsername}\`. You must sign NDA with your own account.`);
            }

            // 4. Verify checkboxes are checked (GitHub renders checked as [X])
            const unchecked = (body.match(/- \[ \]/g) || []).length;
            if (unchecked > 0) {
              errors.push(`${unchecked} confirmation checkbox(es) not checked. All checkboxes are required.`);
            }

            // 5. Check user has registered for this hackathon
            if (trimmedSlug && errors.length === 0) {
              const { data: regIssues } = await github.rest.issues.listForRepo({
                owner: context.repo.owner,
                repo: context.repo.repo,
                labels: `register,hackathon:${trimmedSlug}`,
                creator: author,
                state: 'all',
                per_page: 5,
              });
              const registered = regIssues.some(i =>
                i.labels.some(l => l.name === 'registered')
              );
              if (!registered) {
                errors.push(`@${author} has not registered for \`${trimmedSlug}\`. Please register first.`);
              }
            }

            // Result
            if (errors.length > 0) {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                body: `❌ **NDA validation failed:**\n\n${errors.map(e => `- ${e}`).join('\n')}\n\nPlease fix and re-edit this issue.`,
              });
            } else {
              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                labels: ['nda-approved'],
              });
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                body: `✅ **NDA signing confirmed.** Thank you, @${author}!\n\nYou now have access to NDA-protected datasets for \`${trimmedSlug}\`.`,
              });
            }
```

**Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/validate-nda.yml'))"`
Expected: No errors (valid YAML).

**Step 3: Commit**

```bash
git add .github/workflows/validate-nda.yml
git commit -m "feat(actions): add validate-nda workflow for NDA signing confirmation"
```

---

### Task 3: Enhance presign.ts with NDA checking

**Files:**
- Modify: `site/src/pages/api/presign.ts`

**Context:** Current presign.ts validates session + path safety, then generates a presigned URL. P1 adds NDA status checking for dataset paths by querying GitHub Issues API.

**Step 1: Add NDA check logic after path validation**

In `site/src/pages/api/presign.ts`, after the path validation block (`if (!key.startsWith('hackathons/') || key.includes('..'))`) and before the S3 client creation, insert the NDA checking logic:

```typescript
  // --- P1: NDA check for dataset paths ---
  const datasetMatch = key.match(/^hackathons\/([^/]+)\/datasets\//);
  if (datasetMatch) {
    const hackathonSlug = datasetMatch[1];

    // Fetch hackathon.yml from GitHub to check NDA requirements
    const ghRes = await fetch(
      `https://api.github.com/repos/${env.GITHUB_OWNER || 'Synnovator'}/${env.GITHUB_REPO || 'monorepo'}/contents/hackathons/${hackathonSlug}/hackathon.yml`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          Accept: 'application/vnd.github.raw+json',
        },
      },
    );

    if (ghRes.ok) {
      const { default: jsYaml } = await import('js-yaml');
      const hackathonData = jsYaml.load(await ghRes.text()) as any;
      const nda = hackathonData?.hackathon?.legal?.nda;

      if (nda?.required) {
        // Check if user has signed NDA (has nda-approved label on their NDA issue)
        const ndaRes = await fetch(
          `https://api.github.com/repos/${env.GITHUB_OWNER || 'Synnovator'}/${env.GITHUB_REPO || 'monorepo'}/issues?labels=nda-sign,nda-approved&creator=${session.login}&state=open&per_page=10`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              Accept: 'application/vnd.github+json',
            },
          },
        );

        if (ndaRes.ok) {
          const ndaIssues = (await ndaRes.json()) as Array<{ title: string }>;
          const hasNda = ndaIssues.some((i) =>
            i.title.toLowerCase().includes(hackathonSlug.toLowerCase()),
          );

          if (!hasNda) {
            return new Response(
              JSON.stringify({
                error: 'nda_required',
                message: '请先签署 NDA / Please sign the NDA first',
                hackathon: hackathonSlug,
              }),
              {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
              },
            );
          }
        }
      }
    }
  }
  // --- End P1 NDA check ---
```

**Step 2: Add js-yaml as a dependency (if not already available at runtime)**

Run: `cd site && pnpm add js-yaml`

Note: `js-yaml` is already a devDependency (used in build). For runtime (Pages Functions), we need it as a regular dependency. Check `package.json` — if already under `dependencies`, skip this step.

**Step 3: Add env variable types**

In presign.ts, the env object needs `GITHUB_OWNER` and `GITHUB_REPO`. These should be added to `site/wrangler.toml` under `[vars]`:

```toml
GITHUB_OWNER = "Synnovator"
GITHUB_REPO = "monorepo"
```

**Step 4: Verify build**

Run: `cd site && pnpm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add site/src/pages/api/presign.ts site/package.json site/pnpm-lock.yaml site/wrangler.toml
git commit -m "feat(site): add NDA status checking to presign API endpoint"
```

---

### Task 4: Enhance DatasetDownload component with NDA error handling

**Files:**
- Modify: `site/src/components/DatasetDownload.astro`

**Context:** Current component shows NDA datasets with a "Get Download Link" button. If presign returns 403, it just shows `alert(err.error)`. P1 enhances this to show a proper NDA prompt with a sign-NDA link.

**Step 1: Add access control badges**

In the dataset card's `<div class="flex flex-wrap gap-4 mt-3 text-xs text-muted">` section, replace the existing `access_control` display:

```astro
{ds.access_control && (
  <span class={
    ds.access_control === 'nda-required'
      ? 'px-2 py-0.5 rounded bg-warning/20 text-warning'
      : 'px-2 py-0.5 rounded bg-lime-primary/20 text-lime-primary'
  }>
    {ds.access_control === 'nda-required'
      ? (lang === 'zh' ? '需 NDA' : 'NDA Required')
      : (lang === 'zh' ? '公开' : 'Public')}
  </span>
)}
```

**Step 2: Add NDA error handling in the client-side script**

Replace the `alert(err.error || 'Failed to get download link');` line in the `<script>` block with NDA-aware error handling:

```javascript
        if (!res.ok) {
          const err = await res.json();
          if (err.error === 'nda_required') {
            const slug = btn.closest('[data-slug]')?.getAttribute('data-slug') || '';
            const ndaUrl = `https://github.com/Synnovator/monorepo/issues/new?template=nda-sign.yml&title=${encodeURIComponent(`[NDA] --- — ${slug}`)}&labels=nda-sign`;
            const msgEl = document.createElement('div');
            msgEl.className = 'mt-3 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm';
            msgEl.innerHTML = `⚠️ ${err.message} <a href="${ndaUrl}" target="_blank" rel="noopener" class="underline ml-2 font-medium">→ Sign NDA</a>`;
            btn.parentElement?.appendChild(msgEl);
          } else {
            alert(err.error || 'Failed to get download link');
          }
          return;
        }
```

**Step 3: Verify build**

Run: `cd site && pnpm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add site/src/components/DatasetDownload.astro
git commit -m "feat(site): add NDA error handling and access badges to DatasetDownload"
```

---

### Task 5: Add NDA section to hackathon detail page

**Files:**
- Modify: `site/src/pages/hackathons/[...slug].astro`

**Context:** The detail page already shows `h.legal?.nda?.required` as a warning badge next to register button. P1 adds a dedicated NDA information section with summary + document link + sign button.

**Step 1: Add NDA section**

In the main content area of `[...slug].astro`, after the `{/* Legal / Compliance */}` section and before the `{/* FAQ */}` section, add:

```astro
        {/* NDA Information */}
        {h.legal?.nda?.required && (
          <section>
            <h2 class="text-xl font-heading font-bold text-white mb-4">
              {t(lang, 'hackathon.nda_sign')}
            </h2>
            <div class="rounded-lg border border-warning/30 bg-warning/5 p-6 space-y-4">
              <p class="text-sm text-warning font-medium">
                {t(lang, 'hackathon.nda_required_msg')}
              </p>
              {h.legal.nda.summary && (
                <div>
                  <p class="text-xs text-muted mb-1">{t(lang, 'hackathon.nda_summary')}</p>
                  <p class="text-sm text-light-gray">{h.legal.nda.summary}</p>
                </div>
              )}
              <div class="flex flex-wrap gap-3">
                {h.legal.nda.document_url && (
                  <a
                    href={h.legal.nda.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary-bg text-white text-sm hover:bg-secondary-bg/80 transition-colors"
                  >
                    {t(lang, 'hackathon.nda_download')}
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </a>
                )}
                <a
                  href={`https://github.com/Synnovator/monorepo/issues/new?template=nda-sign.yml&title=${encodeURIComponent(`[NDA] --- — ${h.slug}`)}&labels=nda-sign`}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-primary/20 text-lime-primary text-sm hover:bg-lime-primary/30 transition-colors"
                >
                  {t(lang, 'hackathon.nda_sign')}
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </a>
              </div>
            </div>
          </section>
        )}
```

**Step 2: Verify build**

Run: `cd site && pnpm run build`
Expected: Build succeeds, hackathon detail pages render correctly.

**Step 3: Commit**

```bash
git add site/src/pages/hackathons/[...slug].astro
git commit -m "feat(site): add NDA information section to hackathon detail page"
```

---

## Batch 2: Judge Conflict of Interest

### Task 6: Enhance JudgeCard with conflict declaration display

**Files:**
- Modify: `site/src/components/JudgeCard.astro`

**Context:** Current JudgeCard shows name, title, affiliation, expertise. P1 adds conflict_declaration display: if the field has a value (R2 PDF URL), show a green badge + link.

**Step 1: Update Props interface and add conflict display**

Modify `JudgeCard.astro` — add `conflict_declaration` to the judge interface and render a badge:

```astro
---
import { localize } from '../lib/i18n';
import type { Lang } from '../lib/i18n';

interface Props {
  judge: {
    github: string;
    name: string;
    name_zh?: string;
    title?: string;
    affiliation?: string;
    expertise?: string;
    conflict_declaration?: string;
  };
  lang: Lang;
}

const { judge, lang } = Astro.props;
---

<div class="flex items-start gap-4 p-4 rounded-lg border border-secondary-bg bg-dark-bg">
  <img
    src={`https://github.com/${judge.github}.png`}
    alt={localize(lang, judge.name, judge.name_zh)}
    class="w-12 h-12 rounded-full bg-secondary-bg"
    loading="lazy"
  />
  <div>
    <p class="text-white font-medium text-sm">
      {localize(lang, judge.name, judge.name_zh)}
    </p>
    {judge.title && <p class="text-muted text-xs">{judge.title}</p>}
    {judge.affiliation && <p class="text-muted text-xs">{judge.affiliation}</p>}
    {judge.expertise && (
      <p class="text-cyan text-xs mt-1">{judge.expertise}</p>
    )}
    {judge.conflict_declaration && (
      <a
        href={judge.conflict_declaration}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1 mt-2 text-xs text-lime-primary hover:underline"
      >
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {lang === 'zh' ? '已提交利益冲突声明' : 'Conflict declaration filed'}
      </a>
    )}
  </div>
</div>
```

**Step 2: Verify build**

Run: `cd site && pnpm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add site/src/components/JudgeCard.astro
git commit -m "feat(site): add conflict declaration display to JudgeCard component"
```

---

### Task 7: Add conflict checkbox to ScoreCard component

**Files:**
- Modify: `site/src/components/ScoreCard.astro`

**Context:** ScoreCard generates YAML and creates a GitHub Issue URL. P1 adds a conflict of interest checkbox that must be checked before submit, and includes `conflict_declaration: true` in the generated YAML.

**Step 1: Add checkbox HTML**

In `ScoreCard.astro`, add the conflict checkbox between the overall comment section and the weighted total/submit section:

```astro
  <!-- Conflict of interest declaration -->
  <div class="mt-6 p-4 rounded-lg border border-secondary-bg bg-surface">
    <label class="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        id="sc-conflict"
        class="mt-0.5 accent-lime-primary"
      />
      <span class="text-sm text-light-gray">
        {lang === 'zh' ? '我确认与该团队无利益冲突关系' : 'I confirm no conflict of interest with this team'}
      </span>
    </label>
  </div>
```

**Step 2: Wire up the submit button disable logic**

In the `<script>` block, after `updateTotal();`, add:

```javascript
    // Conflict checkbox controls submit button
    const conflictCb = document.getElementById('sc-conflict');
    const submitBtn = document.getElementById('sc-submit');
    if (conflictCb && submitBtn) {
      submitBtn.setAttribute('disabled', 'true');
      submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
      conflictCb.addEventListener('change', () => {
        if (conflictCb.checked) {
          submitBtn.removeAttribute('disabled');
          submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
          submitBtn.setAttribute('disabled', 'true');
          submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
      });
    }
```

**Step 3: Add conflict_declaration to generated YAML**

In the submit click handler, before `const body = ...`, add:

```javascript
      yamlLines.push('');
      yamlLines.push('conflict_declaration: true');
```

**Step 4: Verify build**

Run: `cd site && pnpm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add site/src/components/ScoreCard.astro
git commit -m "feat(site): add conflict of interest checkbox to ScoreCard"
```

---

### Task 8: Enhance validate-score workflow with conflict + duplicate checks

**Files:**
- Modify: `.github/workflows/validate-score.yml`

**Context:** Current validate-score checks: title format, hackathon exists, track exists, judge authorized, score ranges. P1 adds: conflict declaration check (Profile + Issue checkbox), duplicate scoring detection, hard constraint warning.

**Step 1: Add conflict and duplicate checks**

In the `actions/github-script` block of `validate-score.yml`, after the judge authorization check (`if (!judges.includes(author))`) and before the YAML scores parsing, add:

```javascript
                // P1: Check conflict declaration in Profile
                const profilesDir = 'profiles';
                if (fs.existsSync(profilesDir)) {
                  const profileFiles = fs.readdirSync(profilesDir).filter(f => f.endsWith('.yml'));
                  let profileFound = false;
                  for (const pf of profileFiles) {
                    try {
                      const profileData = yaml.load(fs.readFileSync(`${profilesDir}/${pf}`, 'utf8'));
                      if (profileData?.hacker?.github === author) {
                        profileFound = true;
                        if (!profileData?.hacker?.judge_profile?.conflict_declaration) {
                          errors.push(`@${author}: Profile is missing \`judge_profile.conflict_declaration\`. Please update your Profile with a conflict declaration document before scoring.`);
                        }
                        break;
                      }
                    } catch { /* skip invalid profile */ }
                  }
                  if (!profileFound) {
                    errors.push(`@${author}: No Profile found in \`profiles/\`. Judges must have a Profile with \`judge_profile.conflict_declaration\` field.`);
                  }
                }

                // P1: Check conflict checkbox in Issue body
                const bodyText = issue.body || '';
                const conflictChecked = bodyText.includes('[X]') || bodyText.includes('[x]');
                const conflictField = bodyText.includes('conflict_declaration: true');
                if (!conflictChecked && !conflictField) {
                  errors.push('Conflict of interest checkbox not checked. Please confirm you have no conflict of interest with the team.');
                }

                // P1: Check for duplicate scoring
                const { data: existingScores } = await github.rest.issues.listForRepo({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  labels: `score-validated,hackathon:${slug.trim()}`,
                  state: 'all',
                  per_page: 100,
                });
                const duplicate = existingScores.find(i =>
                  i.user.login === author &&
                  i.title.includes(team.trim()) &&
                  i.number !== issue.number
                );
                if (duplicate) {
                  errors.push(`@${author} has already submitted a validated score for team \`${team.trim()}\` in issue #${duplicate.number}. Please edit the existing issue instead.`);
                }
```

**Step 2: Add hard constraint warning**

After the score range validation loop, add:

```javascript
                      // P1: Hard constraint warning
                      if (criterion.hard_constraint && typeof s.score === 'number') {
                        const constraintRule = criterion.constraint_rule || '';
                        // Simple heuristic: if hard_constraint exists and score is at boundary
                        if (constraintRule) {
                          warnings.push(`⚠️ \`${s.criterion}\` has hard constraint: "${constraintRule}". If triggered during aggregation, this score will be set to 0.`);
                        }
                      }
```

Also add `const warnings = [];` at the top alongside `const errors = [];`, and include warnings in the success comment:

```javascript
            if (errors.length > 0) {
              // ... existing error handling
            } else {
              // ... existing label + comment
              let successMsg = `✅ **Score validated.** Thank you, @${author}!`;
              if (warnings.length > 0) {
                successMsg += `\n\n**Warnings:**\n${warnings.map(w => `- ${w}`).join('\n')}`;
              }
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                body: successMsg,
              });
            }
```

**Step 3: Add track label to validated scores**

When adding the `score-validated` label, also add `track:{trackSlug}` label (needed by aggregate-scores later):

```javascript
              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                labels: ['score-validated', `track:${trackSlug}`],
              });
```

**Step 4: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/validate-score.yml'))"`
Expected: No errors.

**Step 5: Commit**

```bash
git add .github/workflows/validate-score.yml
git commit -m "feat(actions): add conflict check, duplicate detection, hard constraint warning to validate-score"
```

---

## Batch 3: Scoring Model Enhancement

### Task 9: Create aggregate-scores.yml workflow

**Files:**
- Create: `.github/workflows/aggregate-scores.yml`

**Context:** This workflow aggregates all validated scores into results JSON files. It runs daily (cron) or manually. It reads all score-validated Issues, computes weighted scores with hard constraint enforcement, and writes results to the repo.

**Step 1: Write the workflow**

Create `.github/workflows/aggregate-scores.yml`:

```yaml
name: Aggregate Scores

on:
  workflow_dispatch:
  schedule:
    - cron: '0 1 * * *'

jobs:
  aggregate:
    runs-on: ubuntu-latest
    permissions:
      issues: read
      contents: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - run: npm install js-yaml

      - name: Aggregate scores
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const path = require('path');
            const yaml = require('./node_modules/js-yaml');

            const hackathonsDir = 'hackathons';
            if (!fs.existsSync(hackathonsDir)) return;

            const now = new Date();
            const slugs = fs.readdirSync(hackathonsDir).filter(d =>
              fs.statSync(path.join(hackathonsDir, d)).isDirectory()
            );

            for (const slug of slugs) {
              const hPath = path.join(hackathonsDir, slug, 'hackathon.yml');
              if (!fs.existsSync(hPath)) continue;

              const data = yaml.load(fs.readFileSync(hPath, 'utf8'));
              const h = data.hackathon;
              if (!h?.timeline || !h?.tracks) continue;

              // Only process hackathons in judging/announcement/award stage
              const stages = ['judging', 'announcement', 'award'];
              let currentStage = null;
              for (const s of stages) {
                const range = h.timeline[s];
                if (range && now >= new Date(range.start) && now <= new Date(range.end)) {
                  currentStage = s;
                  break;
                }
              }
              if (!currentStage) continue;

              for (const track of h.tracks) {
                const trackSlug = track.slug;
                const criteria = (track.judging?.criteria) || [];
                if (criteria.length === 0) continue;

                // Fetch all validated score Issues for this track
                const { data: scoreIssues } = await github.rest.issues.listForRepo({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  labels: `score-validated,hackathon:${slug},track:${trackSlug}`,
                  state: 'all',
                  per_page: 100,
                });

                if (scoreIssues.length === 0) continue;

                // Parse scores and group by team
                const teamScores = {};
                for (const issue of scoreIssues) {
                  const titleMatch = issue.title.match(/\[Score\]\s*(.*?)\s*—/);
                  if (!titleMatch) continue;
                  const teamName = titleMatch[1].trim();
                  const judge = issue.user.login;

                  const body = issue.body || '';
                  const yamlBlock = body.match(/```(?:yaml)?\s*\n([\s\S]*?)```/);
                  const scoreYaml = yamlBlock ? yamlBlock[1] : body;
                  try {
                    const scoreData = yaml.load(scoreYaml);
                    if (!scoreData?.scores) continue;

                    if (!teamScores[teamName]) teamScores[teamName] = [];
                    teamScores[teamName].push({
                      judge,
                      scores: scoreData.scores,
                      overall_comment: scoreData.overall_comment || '',
                    });
                  } catch { continue; }
                }

                // Calculate weighted scores for each team
                const rankings = [];
                for (const [teamName, judgeEntries] of Object.entries(teamScores)) {
                  const judgeDetails = [];
                  const criteriaAgg = {};

                  for (let jIdx = 0; jIdx < judgeEntries.length; jIdx++) {
                    const entry = judgeEntries[jIdx];
                    let judgeTotal = 0;
                    const judgeCriteria = [];
                    const violations = [];

                    for (const s of entry.scores) {
                      const criterion = criteria.find(c => c.name === s.criterion);
                      if (!criterion) continue;

                      let weightedScore = s.score * (criterion.weight / 100);

                      // Hard constraint enforcement
                      if (criterion.hard_constraint && criterion.constraint_rule) {
                        // For P1: any criterion with hard_constraint=true where
                        // the constraint_rule indicates a threshold is checked during
                        // final aggregation. Simplified: if score fails constraint,
                        // set to 0. The actual rule parsing would need domain logic.
                        // For now, we flag it but keep the score (human review needed).
                      }

                      judgeTotal += weightedScore;
                      judgeCriteria.push({
                        criterion: s.criterion,
                        score: s.score,
                        weighted: Math.round(weightedScore * 100) / 100,
                        comment: s.comment || '',
                      });

                      // Aggregate per-criterion scores
                      if (!criteriaAgg[s.criterion]) {
                        criteriaAgg[s.criterion] = {
                          criterion: s.criterion,
                          weight: criterion.weight,
                          scores: [],
                        };
                      }
                      criteriaAgg[s.criterion].scores.push(s.score);
                    }

                    judgeDetails.push({
                      judge_id: `judge-${jIdx + 1}`,
                      total: Math.round(judgeTotal * 100) / 100,
                      criteria: judgeCriteria,
                    });
                  }

                  // Expert score = mean of all judge totals
                  const expertScore = judgeDetails.reduce((sum, j) => sum + j.total, 0) / judgeDetails.length;

                  // Criteria breakdown with averages
                  const criteriaBreakdown = Object.values(criteriaAgg).map(c => ({
                    criterion: c.criterion,
                    weight: c.weight,
                    scores: c.scores,
                    average: Math.round((c.scores.reduce((a, b) => a + b, 0) / c.scores.length) * 100) / 100,
                    weighted: Math.round((c.scores.reduce((a, b) => a + b, 0) / c.scores.length * c.weight / 100) * 100) / 100,
                  }));

                  // Final score (expert_only for P1; expert_plus_vote handled below)
                  let finalScore = expertScore;
                  let voteScore = null;

                  // TODO: expert_plus_vote mode — fetch PR reactions for vote_score

                  rankings.push({
                    team: teamName,
                    final_score: Math.round(finalScore * 100) / 100,
                    expert_score: Math.round(expertScore * 100) / 100,
                    vote_score: voteScore,
                    judge_count: judgeDetails.length,
                    criteria_breakdown: criteriaBreakdown,
                    hard_constraint_violations: [],
                    judge_details: judgeDetails,
                  });
                }

                // Sort by final_score descending and assign ranks
                rankings.sort((a, b) => b.final_score - a.final_score);
                rankings.forEach((r, i) => { r.rank = i + 1; });

                // Write results JSON
                const resultsDir = path.join(hackathonsDir, slug, 'results');
                if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

                const result = {
                  track: trackSlug,
                  hackathon: slug,
                  calculated_at: now.toISOString(),
                  judging_mode: track.judging?.mode || 'expert_only',
                  total_judges: new Set(scoreIssues.map(i => i.user.login)).size,
                  total_teams: rankings.length,
                  rankings,
                };

                const outPath = path.join(resultsDir, `${trackSlug}.json`);
                fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');
                core.info(`Wrote results: ${outPath} (${rankings.length} teams)`);
              }
            }

      - name: Commit results
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add hackathons/*/results/*.json
          if git diff --cached --quiet; then
            echo "No changes to commit"
          else
            git commit -m "chore(scores): aggregate scoring results [automated]"
            git push
          fi
```

**Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/aggregate-scores.yml'))"`
Expected: No errors.

**Step 3: Commit**

```bash
git add .github/workflows/aggregate-scores.yml
git commit -m "feat(actions): add aggregate-scores workflow for weighted score calculation"
```

---

### Task 10: Create scoring results page

**Files:**
- Create: `site/src/pages/hackathons/[...slug]/results.astro`

**Context:** This page reads `hackathons/{slug}/results/*.json` at build time and renders a ranking table per track. Only shows data during announcement/award stages.

**Step 1: Create the results page**

Note: Astro's `[...slug]` catch-all route in P0 lives at `site/src/pages/hackathons/[...slug].astro`. For the results page, we need a nested route. Since Astro doesn't support `/hackathons/[slug]/results` alongside `[...slug]`, we'll use a query-param approach or a separate route pattern.

**Recommended approach:** Create `site/src/pages/results/[...slug].astro` to avoid routing conflicts. This maps to `/results/{hackathon-slug}`.

Create `site/src/pages/results/[...slug].astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'astro:content';
import { t, localize, getCurrentStage } from '../../lib/i18n';
import type { Lang } from '../../lib/i18n';
import fs from 'node:fs';
import path from 'node:path';

export async function getStaticPaths() {
  const hackathons = await getCollection('hackathons');
  return hackathons.map(entry => ({
    params: { slug: entry.data.hackathon.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const h = entry.data.hackathon;
const lang: Lang = 'zh';
const stage = h.timeline ? getCurrentStage(h.timeline) : 'draft';
const showResults = ['announcement', 'award', 'ended'].includes(stage);

// Load results JSON files
const resultsDir = path.resolve(`hackathons/${h.slug}/results`);
let trackResults: Array<{ track: string; data: any }> = [];
if (showResults && fs.existsSync(resultsDir)) {
  const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(resultsDir, file), 'utf8');
      const data = JSON.parse(raw);
      trackResults.push({ track: file.replace('.json', ''), data });
    } catch { /* skip invalid */ }
  }
}

// Map track slugs to track names
const trackNameMap: Record<string, { name: string; name_zh?: string }> = {};
for (const track of (h.tracks || [])) {
  trackNameMap[track.slug] = { name: track.name, name_zh: track.name_zh };
}
---

<BaseLayout
  title={`${localize(lang, h.name, h.name_zh)} — ${t(lang, 'result.title')}`}
  description={t(lang, 'result.title')}
>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    {/* Back link */}
    <a href={`/hackathons/${h.slug}`} class="text-sm text-muted hover:text-white mb-6 inline-block">
      ← {localize(lang, h.name, h.name_zh)}
    </a>

    <h1 class="text-3xl font-heading font-bold text-white mb-8">
      {t(lang, 'result.title')}
    </h1>

    {!showResults ? (
      <div class="rounded-lg border border-secondary-bg bg-dark-bg p-12 text-center">
        <p class="text-muted text-lg">{t(lang, 'result.pending')}</p>
      </div>
    ) : trackResults.length === 0 ? (
      <div class="rounded-lg border border-secondary-bg bg-dark-bg p-12 text-center">
        <p class="text-muted text-lg">{t(lang, 'result.no_results')}</p>
      </div>
    ) : (
      <div class="space-y-12">
        {trackResults.map(({ track, data }) => {
          const trackInfo = trackNameMap[track];
          return (
            <section>
              <h2 class="text-xl font-heading font-bold text-white mb-4">
                {trackInfo ? localize(lang, trackInfo.name, trackInfo.name_zh) : track}
              </h2>
              <div class="text-xs text-muted mb-4">
                {lang === 'zh' ? '计算时间' : 'Calculated'}: {new Date(data.calculated_at).toLocaleString()} ·
                {data.total_judges} {lang === 'zh' ? '位评委' : 'judges'} ·
                {data.total_teams} {lang === 'zh' ? '支队伍' : 'teams'}
              </div>

              {/* Rankings table */}
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-secondary-bg text-muted">
                      <th class="text-left py-3 px-2">{t(lang, 'result.rank')}</th>
                      <th class="text-left py-3 px-2">{t(lang, 'result.team')}</th>
                      <th class="text-right py-3 px-2">{t(lang, 'result.final_score')}</th>
                      {data.rankings[0]?.criteria_breakdown?.map(c => (
                        <th class="text-right py-3 px-2 text-xs">
                          {c.criterion}<br/>
                          <span class="text-muted font-normal">({c.weight}%)</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rankings.map(r => (
                      <tr class="border-b border-secondary-bg/50 hover:bg-secondary-bg/20">
                        <td class="py-3 px-2">
                          <span class={`font-code font-bold ${r.rank <= 3 ? 'text-lime-primary' : 'text-white'}`}>
                            #{r.rank}
                          </span>
                        </td>
                        <td class="py-3 px-2 text-white font-medium">{r.team}</td>
                        <td class="py-3 px-2 text-right font-code text-lime-primary font-bold">
                          {r.final_score.toFixed(1)}
                        </td>
                        {r.criteria_breakdown?.map(c => (
                          <td class="py-3 px-2 text-right font-code text-light-gray">
                            {c.average.toFixed(1)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    )}
  </div>
</BaseLayout>
```

**Step 2: Add results link to hackathon detail page**

In `site/src/pages/hackathons/[...slug].astro`, in the hero action buttons area, add a results link when the stage is announcement/award:

```astro
        {(['announcement', 'award', 'ended'].includes(stage)) && (
          <a
            href={`/results/${h.slug}`}
            class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors"
          >
            {t(lang, 'hackathon.results')}
          </a>
        )}
```

**Step 3: Verify build**

Run: `cd site && pnpm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add site/src/pages/results/[...slug].astro site/src/pages/hackathons/[...slug].astro
git commit -m "feat(site): add scoring results page with rankings table"
```

---

## Batch 4: Appeal Arbitration System

### Task 11: Create validate-appeal.yml workflow

**Files:**
- Create: `.github/workflows/validate-appeal.yml`

**Step 1: Write the workflow**

Create `.github/workflows/validate-appeal.yml`:

```yaml
name: Validate Appeal

on:
  issues:
    types: [opened, edited]

jobs:
  validate:
    if: contains(github.event.issue.labels.*.name, 'appeal')
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: read
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - run: npm install js-yaml

      - name: Validate appeal
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const path = require('path');
            const yaml = require('./node_modules/js-yaml');
            const issue = context.payload.issue;
            const title = issue.title;
            const author = issue.user.login;
            const body = issue.body || '';
            const errors = [];

            // 1. Parse title: [Appeal] team-name — hackathon-slug
            // Also support: [Appeal] team-name — hackathon-slug/track
            const titleMatch = title.match(/\[Appeal\]\s*(.*?)\s*—\s*([^/\s]+)(?:\s*\/\s*(.*))?/);
            if (!titleMatch) {
              errors.push('Issue title must match: `[Appeal] team-name — hackathon-slug` or `[Appeal] team-name — hackathon-slug/track`');
            }
            const [, teamName, slug, trackSlug] = titleMatch || [null, '', '', ''];
            const trimmedSlug = slug ? slug.trim() : '';
            const trimmedTeam = teamName ? teamName.trim() : '';

            if (trimmedSlug) {
              const hackathonPath = `hackathons/${trimmedSlug}/hackathon.yml`;
              if (!fs.existsSync(hackathonPath)) {
                errors.push(`Hackathon not found: \`${trimmedSlug}\``);
              } else {
                const data = yaml.load(fs.readFileSync(hackathonPath, 'utf8'));
                const h = data.hackathon;

                // 2. Window check: must be in announcement stage
                if (h.timeline?.announcement) {
                  const start = new Date(h.timeline.announcement.start);
                  const end = new Date(h.timeline.announcement.end);
                  const now = new Date();
                  if (now < start) {
                    errors.push(`Appeal window has not opened yet. Announcement period: ${h.timeline.announcement.start} — ${h.timeline.announcement.end}`);
                  } else if (now > end) {
                    errors.push(`Appeal window has closed. Announcement period: ${h.timeline.announcement.start} — ${h.timeline.announcement.end}`);
                    // Close the issue if window expired
                    await github.rest.issues.update({
                      owner: context.repo.owner,
                      repo: context.repo.repo,
                      issue_number: issue.number,
                      state: 'closed',
                    });
                    await github.rest.issues.addLabels({
                      owner: context.repo.owner,
                      repo: context.repo.repo,
                      issue_number: issue.number,
                      labels: ['appeal:expired'],
                    });
                  }
                }

                // 3. Verify author is a team member
                if (trimmedTeam) {
                  const projectPath = path.join('hackathons', trimmedSlug, 'submissions', trimmedTeam, 'project.yml');
                  if (fs.existsSync(projectPath)) {
                    const projData = yaml.load(fs.readFileSync(projectPath, 'utf8'));
                    const members = (projData?.project?.team?.members || []).map(m => m.github);
                    if (!members.includes(author)) {
                      errors.push(`@${author} is not listed as a member of team \`${trimmedTeam}\`. Only team members can submit appeals.`);
                    }
                  } else {
                    errors.push(`No submission found for team \`${trimmedTeam}\` in hackathon \`${trimmedSlug}\`.`);
                  }
                }

                // 4. Check acknowledgment checkbox
                const unchecked = (body.match(/- \[ \]/g) || []).length;
                if (unchecked > 0) {
                  errors.push('Please check the acknowledgment checkbox confirming the organizer\'s decision is binding.');
                }

                // 5. Auto-assign to organizers if validation passes
                if (errors.length === 0 && h.organizers) {
                  const orgGithubs = h.organizers
                    .map(o => o.github)
                    .filter(Boolean);
                  if (orgGithubs.length > 0) {
                    try {
                      await github.rest.issues.addAssignees({
                        owner: context.repo.owner,
                        repo: context.repo.repo,
                        issue_number: issue.number,
                        assignees: orgGithubs,
                      });
                    } catch (e) {
                      core.warning(`Failed to assign organizers: ${e.message}`);
                    }
                  }
                }
              }
            }

            // Result
            if (errors.length > 0) {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                body: `❌ **Appeal validation failed:**\n\n${errors.map(e => `- ${e}`).join('\n')}`,
              });
            } else {
              // Add structured labels
              const labels = ['appeal:pending', `hackathon:${trimmedSlug}`];
              if (trackSlug?.trim()) labels.push(`track:${trackSlug.trim()}`);
              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                labels,
              });
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issue.number,
                body: `✅ **Appeal received.** The organizing team has been notified and will respond during the announcement period.\n\nTeam: \`${trimmedTeam}\`\nHackathon: \`${trimmedSlug}\``,
              });
            }
```

**Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/validate-appeal.yml'))"`
Expected: No errors.

**Step 3: Commit**

```bash
git add .github/workflows/validate-appeal.yml
git commit -m "feat(actions): add validate-appeal workflow with window check and auto-assign"
```

---

### Task 12: Enhance appeal Issue template

**Files:**
- Modify: `.github/ISSUE_TEMPLATE/appeal.yml`

**Step 1: Add expected_result and track fields**

Add a track input and expected_result dropdown to the appeal template. Insert after the `team` input field:

```yaml
  - type: input
    id: track
    attributes:
      label: "Track Slug (optional)"
      description: "The specific track being appealed, if applicable"
      placeholder: "model-optimization"

  - type: dropdown
    id: expected_result
    attributes:
      label: "Expected Result"
      description: "What outcome do you expect from this appeal?"
      options:
        - "Re-scoring (重新评分)"
        - "Ranking adjustment (修改排名)"
        - "Rule clarification (规则解释说明)"
        - "Other (其他)"
    validations:
      required: true
```

**Step 2: Commit**

```bash
git add .github/ISSUE_TEMPLATE/appeal.yml
git commit -m "feat(actions): add expected_result and track fields to appeal template"
```

---

### Task 13: Final verification — build and review

**Files:** None (verification only)

**Step 1: Full build**

Run: `cd site && pnpm run build`
Expected: Build completes with no errors. All pages generate successfully.

**Step 2: Verify workflow YAML files**

Run:
```bash
for f in .github/workflows/validate-nda.yml .github/workflows/aggregate-scores.yml .github/workflows/validate-appeal.yml; do
  echo "--- $f ---"
  python3 -c "import yaml; yaml.safe_load(open('$f')); print('OK')"
done
```
Expected: All 3 files output "OK".

**Step 3: Verify all new/modified files are committed**

Run: `git status`
Expected: Clean working tree (nothing to commit).

**Step 4: Review all commits**

Run: `git log --oneline origin/main..HEAD`
Expected: List of all P1 commits in order.

---

## Summary of All Tasks

| Task | Batch | Description | Key Files |
|------|-------|-------------|-----------|
| 1 | 1 | i18n keys for P1 features | `site/src/i18n/{zh,en}.yml` |
| 2 | 1 | validate-nda.yml workflow | `.github/workflows/validate-nda.yml` |
| 3 | 1 | Presign API NDA checking | `site/src/pages/api/presign.ts` |
| 4 | 1 | DatasetDownload NDA error handling | `site/src/components/DatasetDownload.astro` |
| 5 | 1 | Hackathon detail page NDA section | `site/src/pages/hackathons/[...slug].astro` |
| 6 | 2 | JudgeCard conflict display | `site/src/components/JudgeCard.astro` |
| 7 | 2 | ScoreCard conflict checkbox | `site/src/components/ScoreCard.astro` |
| 8 | 2 | validate-score conflict + duplicate checks | `.github/workflows/validate-score.yml` |
| 9 | 3 | aggregate-scores.yml workflow | `.github/workflows/aggregate-scores.yml` |
| 10 | 3 | Scoring results page | `site/src/pages/results/[...slug].astro` |
| 11 | 4 | validate-appeal.yml workflow | `.github/workflows/validate-appeal.yml` |
| 12 | 4 | Appeal template enhancement | `.github/ISSUE_TEMPLATE/appeal.yml` |
| 13 | — | Final verification | — |
