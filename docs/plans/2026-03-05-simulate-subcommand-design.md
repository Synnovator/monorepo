# Design: synnovator-admin `simulate` Subcommand

> Date: 2026-03-05
> Status: Approved
> Author: Human + Claude

## Background

challenge-scenario-forge is an independent skill that generates complete hackathon simulation archives (Markdown) covering the full lifecycle from creation to award distribution. It supports two organizer personas (enterprise / youth-league) and outputs self-consistent participant data, scoring sheets, and risk scenarios.

The admin wants to integrate this capability into synnovator-admin as a `simulate` subcommand that generates **real YAML data files** (not just Markdown archives) — hackathon.yml, profiles, and submissions — indistinguishable from actual platform data.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Integration model | Merge into synnovator-admin as subcommand | Single entry point for all admin ops; consistent UX |
| Output format | YAML data files (schema-v2 compliant) | "Looks like real data" — admin distinguishes sim vs real |
| Output location | `hackathons/{slug}/` + `profiles/` | Same paths as real data |
| Data scope | Full suite: hackathon.yml + profiles + submissions | Complete simulation for demo/interview prep |
| Interaction mode | Guided, step-by-step parameter collection | Consistent with other write commands |
| Implementation tool | **skill-creator** skill | Use skill-creator to draft, test, and optimize the SKILL.md changes |

## Architecture

### File Changes

```
.claude/skills/synnovator-admin/
├── SKILL.md                          ← Add simulate section + update description
└── references/
    ├── schema-v2.md                  (existing)
    ├── github-api-patterns.md        (existing)
    ├── simulate-output-template.md   ← NEW (from challenge-scenario-forge)
    ├── simulate-risk-playbook.md     ← NEW (from challenge-scenario-forge)
    ├── simulate-example-a.md         ← NEW (from challenge-scenario-forge)
    └── simulate-example-b.md         ← NEW (from challenge-scenario-forge)
```

### Generated Data Structure

After one `simulate` execution:

```
hackathons/{slug}/
├── hackathon.yml              ← schema-v2 compliant
├── simulation-archive.md      ← Full Markdown archive (0-7 chapters)
└── submissions/
    ├── team-{name-1}/project.yml
    ├── team-{name-2}/project.yml
    └── ... (≥8 virtual submissions)

profiles/
├── {username-1}-{uuid}.yml
├── {username-2}-{uuid}.yml
└── ... (count based on participant_scale)
```

## simulate Workflow

### Command Type

Write operation — follows standard pattern:
```
Collect params → Create branch → Execute → Validate → Commit → Offer PR
```

Branch naming: `feat/simulate-{slug}`

### Parameter Collection (Guided)

| Step | Parameter | Required | Default |
|------|-----------|----------|---------|
| 1 | `slug` | Yes | — |
| 2 | `organizer_type` | Yes | `enterprise` |
| 3 | `challenge_theme` | Yes | "AI 驱动的智能运营方案探索" |
| 4 | `participant_scale` | No | `medium` (visitors≈5000, registrations≈300, submissions≈60) |
| 5 | `tracks` | No | Technical track + Business track |
| 6 | `timeline` | No | 12-week standard (starting T+7 from current date) |
| 7 | `team_policy` | No | 2-5 members, teaming allowed |
| 8 | `judging_model` | No | Expert only 100%; 4 criteria |
| 9 | `risk_event_toggles` | No | All enabled |
| 10 | `random_seed` | No | `42` |

Admin can say "use defaults" at any step to skip remaining parameters.

### Execution Steps

1. **Confirm persona** — `organizer_type` determines NDA/IP/confidentiality/open-source defaults
2. **Create branch** — `git checkout -b feat/simulate-{slug}`
3. **Generate hackathon.yml**
   - Load `references/schema-v2.md` for field structure
   - Load `references/simulate-output-template.md` for content richness
   - Fill legal/eligibility/settings per `organizer_type`
   - Generate fictional organizers/judges/events/FAQ
4. **Generate profiles**
   - Count by `participant_scale`: small 5-8, medium 15-20, large 30-40
   - Fictional but natural Chinese names, backgrounds, skills
   - Conform to profile schema
5. **Generate submissions**
   - Count by `participant_scale`: small 3-5, medium 8-12, large 15-20
   - Team members drawn from generated profiles
   - Cover different tracks and deliverable types
6. **Generate simulation-archive.md**
   - Follow `references/simulate-output-template.md` chapters 0-7
   - Load `references/simulate-risk-playbook.md` for ≥5 risk scenarios
   - Include funnel data, post samples, scoring sheets, KPI dashboard
7. **Self-consistency check**
   - Funnel: visitors > registrations > teams > submissions > winners
   - Profile count ≥ total unique team members across all submissions
   - Weighted scores calculate correctly
   - Timeline has no inversions
8. **Validate** — `bash scripts/validate-hackathon.sh hackathons/{slug}/hackathon.yml`
9. **Review** — Display generated file list for admin review
10. **Commit** — Single commit with all generated files
11. **Offer PR**

### Quality Checklist

- [ ] hackathon.yml passes validate-hackathon.sh
- [ ] Funnel numbers decrease monotonically in simulation-archive.md
- [ ] Profile count matches participant_scale
- [ ] Submissions ≥ 8, all team members have corresponding profiles
- [ ] Weighted scoring totals calculate correctly
- [ ] Risk scenarios ≥ 5 types (in simulation-archive.md)
- [ ] Enterprise: NDA + IP clauses / Youth-league: open-source license declaration
- [ ] No real personally identifiable information

### Two Organizer Personas

| Dimension | Enterprise (`enterprise`) | Youth League (`youth-league`) |
|-----------|--------------------------|-------------------------------|
| Organizer | Tech/software company | Regional youth league, gov agencies, university consortia |
| IP | Owned by organizer; NDA required | Open-source or author-owned |
| Confidentiality | High | Low |
| Rewards | Cash / pilot contract / procurement qualification | Certificates / internships / competition honors |
| Risk focus | R-01 to R-05 (data leak, IP infringement) | R-03 to R-08 (content violations, credential fraud) |

### Data Generation Rules (from challenge-scenario-forge)

- **Natural numbers**: Avoid round alignment (317 registrations, not 300)
- **Fictional identifiers**: Fictional names (陈梦阳, 李思远), companies (智海科技, 云擎网络), placeholder URLs
- **Persona-specific**: Enterprise archives emphasize NDA/IP; Youth-league emphasize student eligibility
- **Post diversity**: ≥12 sample posts covering 8+ types (announcements, Q&A, experience sharing, complaints, team recruitment, mentor Q&A, celebrations, appeals)

## Implementation Approach

**Use the `skill-creator` skill** to implement changes to synnovator-admin:

1. Copy 4 reference files from challenge-scenario-forge to `synnovator-admin/references/`
2. Use skill-creator to draft the `simulate` section in SKILL.md
3. Use skill-creator to update the frontmatter `description` with simulate-related trigger words
4. Run test cases via skill-creator to verify the simulate workflow works correctly
5. Use skill-creator's description optimization to improve triggering accuracy

## References

| File | Purpose |
|------|---------|
| `references/simulate-output-template.md` | Chapters 0-7 structure and content requirements |
| `references/simulate-risk-playbook.md` | 8 risk scenario types for chapter 5 |
| `references/simulate-example-a.md` | Medium-small enterprise pilot example |
| `references/simulate-example-b.md` | Large-scale youth-league competition example |
| `references/schema-v2.md` | YAML schema for hackathon/profile/submission |
