# simulate Subcommand Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `simulate` subcommand to the synnovator-admin skill that generates full hackathon simulation data (YAML + Markdown archive) using the challenge-scenario-forge methodology.

**Architecture:** Copy 4 reference files from challenge-scenario-forge into synnovator-admin/references/. Then use the skill-creator skill to draft the `simulate` section in SKILL.md, update the description frontmatter, run test cases, and optimize triggering.

**Tech Stack:** Claude Code Skills (SKILL.md + references/), skill-creator workflow, YAML (schema-v2)

**Design doc:** `docs/plans/2026-03-05-simulate-subcommand-design.md`

---

### Task 1: Copy reference files from challenge-scenario-forge

**Files:**
- Create: `.claude/skills/synnovator-admin/references/simulate-output-template.md`
- Create: `.claude/skills/synnovator-admin/references/simulate-risk-playbook.md`
- Create: `.claude/skills/synnovator-admin/references/simulate-example-a.md`
- Create: `.claude/skills/synnovator-admin/references/simulate-example-b.md`

**Step 1: Extract the zip (if not already extracted)**

```bash
unzip -o /Users/h2oslabs/Workspace/Synnovator/monorepo/challenge-scenario-forge.zip -d /tmp/csf-extract
```

**Step 2: Copy the 4 reference files with `simulate-` prefix**

```bash
REFS=".claude/skills/synnovator-admin/references"
cp /tmp/csf-extract/challenge-scenario-forge/references/output-template.md "$REFS/simulate-output-template.md"
cp /tmp/csf-extract/challenge-scenario-forge/references/risk-playbook.md "$REFS/simulate-risk-playbook.md"
cp /tmp/csf-extract/challenge-scenario-forge/references/example-a.md "$REFS/simulate-example-a.md"
cp /tmp/csf-extract/challenge-scenario-forge/references/example-b.md "$REFS/simulate-example-b.md"
```

**Step 3: Verify all 6 files exist in references/**

```bash
ls -la .claude/skills/synnovator-admin/references/
```

Expected: 6 files total (2 existing + 4 new).

**Step 4: Commit**

```bash
git add .claude/skills/synnovator-admin/references/simulate-*.md
git commit -m "feat(skills): add simulate reference files from challenge-scenario-forge"
```

---

### Task 2: Use skill-creator to update synnovator-admin SKILL.md

**IMPORTANT:** This task uses the `skill-creator` skill. Invoke it with:

```
/skill-creator
```

Provide it with the following context:

> I want to **modify an existing skill** — `synnovator-admin` located at `.claude/skills/synnovator-admin/SKILL.md`.
>
> The modification is to add a new `simulate` subcommand. Here's what needs to happen:
>
> **1. Update the frontmatter `description`** to include simulate-related trigger words. The new description should be:
>
> ```yaml
> description: >
>   Synnovator platform admin CLI — create/update/close hackathons, manage profiles and submissions,
>   export scores and registrations, audit changes and permissions, and simulate full hackathon
>   scenarios with synthetic data. Use whenever the admin needs to manage hackathon data, create
>   profiles, export reports, query audit history, simulate hackathon scenarios, or perform any
>   platform management operation. Also trigger when the user mentions hackathon management,
>   YAML data editing, score exports, NDA approvals, 模拟活动, 生成仿真数据, simulate hackathon,
>   forge challenge scenario, or 活动虚拟数据 in the Synnovator context.
> ```
>
> **2. Add `simulate` to the Quick Reference table**, after `approve-nda`:
>
> ```markdown
> | `simulate` | Write | Generate full hackathon simulation data (hackathon.yml + profiles + submissions + archive) |
> ```
>
> **3. Add a `### simulate` section** in the Write Operations area, after the `### approve-nda` section and before `## Read Operations`. The section should contain the full workflow from the design doc at `docs/plans/2026-03-05-simulate-subcommand-design.md`.
>
> The simulate section should include:
> - Parameter collection table (10 params, guided step-by-step)
> - Two organizer personas table (enterprise vs youth-league)
> - Execution steps 1-11 (confirm persona → create branch → generate hackathon.yml → generate profiles → generate submissions → generate simulation-archive.md → self-consistency check → validate → review → commit → offer PR)
> - Data generation rules (natural numbers, fictional identifiers, persona-specific content, post diversity)
> - Scale tables (profile counts and submission counts per participant_scale)
> - Quality checklist
> - Reference file loading instructions:
>   - Load `references/schema-v2.md` for YAML field structure
>   - Load `references/simulate-output-template.md` for archive chapter structure (chapters 0-7)
>   - Load `references/simulate-risk-playbook.md` for risk scenarios (chapter 5)
>   - Load `references/simulate-example-a.md` when user requests enterprise example
>   - Load `references/simulate-example-b.md` when user requests youth-league example
>
> **4. Add a reference file table** at the bottom of the simulate section describing when to load each reference file.

Follow the skill-creator workflow:
- It will help you draft the SKILL.md changes
- It will create test cases (2-3 test prompts simulating admin usage)
- It will run the test cases and let you evaluate the results
- It will optimize the description for better triggering

**Step 1: Invoke skill-creator**

```
/skill-creator
```

**Step 2: Provide the context above**

Tell skill-creator you're modifying an existing skill and provide the details.

**Step 3: Review the draft SKILL.md changes**

Verify:
- [ ] `simulate` appears in Quick Reference table
- [ ] Description frontmatter includes simulate trigger words
- [ ] The simulate section is between `approve-nda` and `Read Operations`
- [ ] All 11 execution steps are present
- [ ] Reference file loading instructions are correct
- [ ] SKILL.md total stays under 500 lines (skill-creator's recommended limit)

**Step 4: Run test cases**

skill-creator will propose 2-3 test prompts. Good test prompts for this skill:
- `"我需要生成一个企业悬赏活动的模拟数据，slug 是 ai-quality-challenge-2026"`
- `"simulate a youth-league hackathon with large scale, theme is AI前沿知识推广"`
- `"/synnovator-admin simulate"` (bare command, should show parameter prompts)

**Step 5: Iterate based on test results**

Follow skill-creator's eval loop until the simulate section works correctly.

**Step 6: Optimize description triggering**

Use skill-creator's description optimization (Step 3 in its "Description Optimization" section) to ensure simulate-related prompts reliably trigger the skill.

**Step 7: Commit the final SKILL.md**

```bash
git add .claude/skills/synnovator-admin/SKILL.md
git commit -m "feat(skills): add simulate subcommand to synnovator-admin"
```

---

### Task 3: Verify end-to-end with a dry run

**Step 1: Invoke the updated skill**

```
/synnovator-admin simulate
```

**Step 2: Walk through the guided parameter collection**

Provide test parameters:
- slug: `sim-test-2026`
- organizer_type: `enterprise`
- challenge_theme: "AI 智能质检挑战赛"
- participant_scale: `small`
- All other params: defaults

**Step 3: Verify generated files**

Check that these files were created:
```bash
ls -R hackathons/sim-test-2026/
ls profiles/ | grep -c ".yml"  # Should be 5-8 for small scale
```

Expected structure:
```
hackathons/sim-test-2026/
├── hackathon.yml
├── simulation-archive.md
└── submissions/
    ├── team-*/project.yml (3-5 teams)
```

**Step 4: Validate hackathon.yml**

```bash
bash scripts/validate-hackathon.sh hackathons/sim-test-2026/hackathon.yml
```

Expected: validation passes.

**Step 5: Spot-check data quality**

Read a few generated files and verify:
- [ ] hackathon.yml has correct `type: enterprise` with NDA/IP sections filled
- [ ] Profile YAML files have natural Chinese names and valid schema
- [ ] Submission project.yml files reference team members that exist in profiles/
- [ ] simulation-archive.md has all 7 chapters with ≥12 post samples and ≥5 risk scenarios

**Step 6: Clean up test data**

```bash
git checkout -- hackathons/ profiles/
# or if on a test branch:
git branch -D feat/simulate-sim-test-2026
```

**Step 7: Final commit (if any fixes were needed)**

```bash
git add .claude/skills/synnovator-admin/
git commit -m "fix(skills): refine simulate subcommand after dry run"
```

---

### Task 4: Final commit and PR

**Step 1: Review all changes**

```bash
git log --oneline main..HEAD
git diff main --stat
```

**Step 2: Push and create PR**

```bash
git push -u origin HEAD
gh pr create \
  --title "feat(skills): add simulate subcommand to synnovator-admin" \
  --body "$(cat <<'EOF'
## Summary
- Add `simulate` subcommand to synnovator-admin skill
- Copy 4 reference files from challenge-scenario-forge (output-template, risk-playbook, example-a, example-b)
- Generate full hackathon simulation data: hackathon.yml + profiles + submissions + Markdown archive
- Supports enterprise and youth-league organizer personas
- Uses skill-creator for SKILL.md drafting, testing, and description optimization

## Design
See `docs/plans/2026-03-05-simulate-subcommand-design.md`

## Test plan
- [ ] Invoke `/synnovator-admin simulate` with enterprise type
- [ ] Invoke `/synnovator-admin simulate` with youth-league type
- [ ] Verify hackathon.yml passes `validate-hackathon.sh`
- [ ] Verify profiles and submissions conform to schema-v2
- [ ] Verify simulation-archive.md has all 7 chapters

Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
