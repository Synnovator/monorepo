---
name: simulate
description: >
  Generate a complete hackathon simulation with schema-v2 compliant YAML data and rich Markdown
  archive using fictional but realistic data. Use when the admin mentions: simulate hackathon,
  forge challenge scenario, 模拟活动, 生成仿真数据, 活动虚拟数据, operational dry-run, demo data,
  or pitch materials. Also trigger for requests involving synthetic hackathon data generation
  at any scale (small/medium/large).
---

# Simulate Hackathon

Generate a complete hackathon simulation — schema-v2 compliant YAML data files plus a rich
Markdown archive — using fictional but realistic data. The output is indistinguishable from
real platform data. Useful for user research interviews, operational dry-runs, demos, and
pitch materials.

> **References path**: All `references/` paths resolve to `../references/` relative to this file
> (the parent skill's shared reference directory).

> **Shared rules**: Branch naming, commit format, validation, and other conventions follow
> the parent skill's Important Rules — see `../SKILL.md`.

Branch naming: `data/simulate-{slug}`

## Organizer Personas

**Two organizer personas** shape defaults for legal, eligibility, confidentiality, and risk focus:

| Dimension | Enterprise (`enterprise`) | Youth League (`youth-league`) |
|-----------|--------------------------|-------------------------------|
| IP | Owned by organizer; NDA required | Open-source or author-owned |
| Confidentiality | High (NDA + data policy) | Low |
| Rewards | Cash / pilot contract / procurement | Certificates / internships / honors |
| Risk focus | R-01–R-05 (data leak, IP infringement) | R-03–R-08 (content violations, credential fraud) |

## Parameter Collection

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

## Execution Steps

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

## Data Generation Rules

- **Natural numbers** — avoid round alignment (use 317, not 300; 4,312, not 4,000)
- **Fictional identifiers** — Chinese names (陈梦阳, 李思远), companies (智海科技, 云擎网络),
  placeholder URLs (`https://github.com/synnovator-demo/proj-xxx`)
- **Persona-specific** — enterprise archives emphasize NDA/IP/data policy;
  youth-league archives emphasize student eligibility and mentor rules
- **Post diversity** — ≥12 sample posts covering: official announcements, technical Q&A,
  experience sharing, complaints, team recruitment, mentor Q&A, celebrations, appeals
- **No real PII** — no real phone numbers, ID numbers, or registered company names

## Quality Checklist

Before committing, verify:
- [ ] `hackathon.yml` passes `validate-hackathon.sh`
- [ ] Funnel numbers decrease monotonically in `simulation-archive.md`
- [ ] Profile count matches `participant_scale`
- [ ] Submissions ≥ 8 (for medium/large), team members all have profiles
- [ ] Weighted scoring totals calculate correctly
- [ ] Risk scenarios ≥ 5 types in `simulation-archive.md`
- [ ] Enterprise: NDA + IP clauses present / Youth-league: open-source license declared
- [ ] No real personally identifiable information anywhere

## Reference Files

| File | When to load |
|------|-------------|
| `references/schema-v2.md` | Always — YAML field structure for hackathon, profile, submission |
| `references/simulate-output-template.md` | Always — chapters 0–7 structure for simulation-archive.md |
| `references/simulate-risk-playbook.md` | Step 6 — risk scenarios for chapter 5 |
| `references/simulate-example-a.md` | On request — medium-small enterprise pilot example |
| `references/simulate-example-b.md` | On request — large-scale youth-league competition example |
