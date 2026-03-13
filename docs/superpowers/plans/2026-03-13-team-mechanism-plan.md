# Team Mechanism Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote Team to a first-class independent entity with PR-driven lifecycle management, replacing the old Issue-based team formation flow.

**Architecture:** New `teams/` top-level directory with `team.yml` files. Zod schemas + data readers in `packages/shared/`. GitHub Actions workflows for validation, sync, and approval. Frontend pages for browsing, creating, and managing teams. All team operations are PR-driven.

**Tech Stack:** TypeScript, Zod, Vitest, Next.js 15 App Router, GitHub Actions (YAML), js-yaml, `@synnovator/shared`, `@synnovator/ui`

**Spec:** `docs/superpowers/specs/2026-03-13-team-mechanism-design.md`

---

## Chunk 1: Data Layer (schemas, readers, static data)

### Task 1: Create global roles schema

**Files:**
- Create: `packages/shared/src/schemas/roles.ts`
- Modify: `packages/shared/src/schemas/index.ts`

- [ ] **Step 1: Write the test file**

Create `packages/shared/src/schemas/__tests__/roles.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  HackerRoleSchema,
  TopLevelRoleSchema,
  RegistrationRoleSchema,
} from '../roles';

describe('roles schemas', () => {
  it('HackerRoleSchema accepts valid hacker roles', () => {
    for (const role of ['developer', 'product', 'designer', 'marketing', 'researcher']) {
      expect(HackerRoleSchema.parse(role)).toBe(role);
    }
  });

  it('HackerRoleSchema rejects invalid roles', () => {
    expect(() => HackerRoleSchema.parse('leader')).toThrow();
    expect(() => HackerRoleSchema.parse('mentor')).toThrow();
  });

  it('TopLevelRoleSchema accepts all top-level roles', () => {
    for (const role of ['hacker', 'mentor', 'judge', 'observer']) {
      expect(TopLevelRoleSchema.parse(role)).toBe(role);
    }
  });

  it('RegistrationRoleSchema accepts registration roles', () => {
    for (const role of ['participant', 'mentor', 'observer']) {
      expect(RegistrationRoleSchema.parse(role)).toBe(role);
    }
  });

  it('RegistrationRoleSchema rejects team roles', () => {
    expect(() => RegistrationRoleSchema.parse('team-lead')).toThrow();
    expect(() => RegistrationRoleSchema.parse('team-member')).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @synnovator/shared test -- --run src/schemas/__tests__/roles.test.ts`
Expected: FAIL — module `../roles` not found

- [ ] **Step 3: Write the roles schema**

Create `packages/shared/src/schemas/roles.ts`:

```typescript
import { z } from 'zod';

/** Hacker sub-type roles — used in team.yml members[].role */
export const HackerRoleSchema = z.enum([
  'developer',
  'product',
  'designer',
  'marketing',
  'researcher',
]);
export type HackerRole = z.infer<typeof HackerRoleSchema>;

/** Top-level platform roles */
export const TopLevelRoleSchema = z.enum([
  'hacker',
  'mentor',
  'judge',
  'observer',
]);
export type TopLevelRole = z.infer<typeof TopLevelRoleSchema>;

/** Registration roles — used in profile registrations[].role */
export const RegistrationRoleSchema = z.enum([
  'participant',
  'mentor',
  'observer',
]);
export type RegistrationRole = z.infer<typeof RegistrationRoleSchema>;
```

- [ ] **Step 4: Export from index**

Add to `packages/shared/src/schemas/index.ts`:

```typescript
export * from './roles';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @synnovator/shared test -- --run src/schemas/__tests__/roles.test.ts`
Expected: PASS — all 5 tests pass

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/schemas/roles.ts packages/shared/src/schemas/__tests__/roles.test.ts packages/shared/src/schemas/index.ts
git commit -m "feat(shared): add global roles schema with hacker/registration/top-level enums"
```

---

### Task 2: Create team schema

**Files:**
- Create: `packages/shared/src/schemas/team.ts`
- Modify: `packages/shared/src/schemas/index.ts`

- [ ] **Step 1: Write the test file**

Create `packages/shared/src/schemas/__tests__/team.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { TeamSchema, TeamStatusSchema } from '../team';

const validTeam = {
  synnovator_team: '1.0',
  name: 'Team Awesome',
  status: 'recruiting',
  leader: 'alice-dev',
  members: [
    { github: 'bob-ai', role: 'developer', joined_at: '2026-03-10' },
  ],
  created_at: '2026-03-10',
};

describe('TeamSchema', () => {
  it('parses a valid team with all fields', () => {
    const full = {
      ...validTeam,
      name_zh: '牛逼队',
      looking_for: {
        roles: ['researcher', 'designer'],
        description: 'Need ML researcher',
      },
      hackathons: [
        { hackathon: 'ai-hack-2026', track: 'nlp', registered_at: '2026-03-10' },
      ],
    };
    const result = TeamSchema.parse(full);
    expect(result.name).toBe('Team Awesome');
    expect(result.members).toHaveLength(1);
    expect(result.hackathons).toHaveLength(1);
  });

  it('parses minimal team (no optional fields)', () => {
    const result = TeamSchema.parse(validTeam);
    expect(result.leader).toBe('alice-dev');
    expect(result.looking_for).toBeUndefined();
    expect(result.hackathons).toBeUndefined();
  });

  it('rejects invalid status', () => {
    expect(() => TeamSchema.parse({ ...validTeam, status: 'active' })).toThrow();
  });

  it('rejects invalid member role', () => {
    const bad = {
      ...validTeam,
      members: [{ github: 'x', role: 'leader', joined_at: '2026-01-01' }],
    };
    expect(() => TeamSchema.parse(bad)).toThrow();
  });

  it('accepts empty members array', () => {
    const result = TeamSchema.parse({ ...validTeam, members: [] });
    expect(result.members).toEqual([]);
  });

  it('TeamStatusSchema accepts all valid statuses', () => {
    for (const s of ['recruiting', 'formed', 'disbanded']) {
      expect(TeamStatusSchema.parse(s)).toBe(s);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @synnovator/shared test -- --run src/schemas/__tests__/team.test.ts`
Expected: FAIL — module `../team` not found

- [ ] **Step 3: Write the team schema**

Create `packages/shared/src/schemas/team.ts`:

```typescript
import { z } from 'zod';
import { HackerRoleSchema } from './roles';

export const TeamStatusSchema = z.enum(['recruiting', 'formed', 'disbanded']);
export type TeamStatus = z.infer<typeof TeamStatusSchema>;

export const teamMemberSchema = z.object({
  github: z.string(),
  role: HackerRoleSchema,
  joined_at: z.string(),
});

export const teamHackathonSchema = z.object({
  hackathon: z.string(),
  track: z.string(),
  registered_at: z.string(),
});

export const TeamSchema = z.object({
  synnovator_team: z.string(),
  name: z.string(),
  name_zh: z.string().optional(),
  status: TeamStatusSchema,
  leader: z.string(),
  members: z.array(teamMemberSchema),
  looking_for: z.object({
    roles: z.array(HackerRoleSchema).optional(),
    description: z.string().optional(),
  }).optional(),
  hackathons: z.array(teamHackathonSchema).optional(),
  created_at: z.string(),
});

export type Team = z.infer<typeof TeamSchema>;
export type TeamMember = z.infer<typeof teamMemberSchema>;
```

- [ ] **Step 4: Export from index**

Add to `packages/shared/src/schemas/index.ts`:

```typescript
export * from './team';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @synnovator/shared test -- --run src/schemas/__tests__/team.test.ts`
Expected: PASS — all 6 tests pass

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/schemas/team.ts packages/shared/src/schemas/__tests__/team.test.ts packages/shared/src/schemas/index.ts
git commit -m "feat(shared): add team schema with status, members, and hackathon registration"
```

---

### Task 3: Modify submission schema — replace team[] with team_ref

**Files:**
- Modify: `packages/shared/src/schemas/submission.ts`
- Modify: `packages/shared/src/schemas/__tests__/` (add submission tests if none exist)

- [ ] **Step 1: Write the test**

Create `packages/shared/src/schemas/__tests__/submission.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { SubmissionSchema } from '../submission';

describe('SubmissionSchema (team_ref)', () => {
  it('accepts team_ref string instead of team array', () => {
    const result = SubmissionSchema.parse({
      synnovator_submission: '2.0',
      project: {
        name: 'My Project',
        track: 'nlp',
        team_ref: 'team-awesome',
      },
    });
    expect(result.project.team_ref).toBe('team-awesome');
    expect((result.project as Record<string, unknown>).team).toBeUndefined();
  });

  it('accepts submission with mentors (mentors preserved)', () => {
    const result = SubmissionSchema.parse({
      synnovator_submission: '2.0',
      project: {
        name: 'My Project',
        track: 'nlp',
        team_ref: 'team-awesome',
        mentors: [{ github: 'prof-wang', name: 'Prof Wang' }],
      },
    });
    expect(result.project.mentors).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @synnovator/shared test -- --run src/schemas/__tests__/submission.test.ts`
Expected: FAIL — `team_ref` not in schema, `team` is required

- [ ] **Step 3: Update submission.ts**

Replace the full content of `packages/shared/src/schemas/submission.ts`:

```typescript
import { z } from 'zod';

// === Submission sub-schemas ===

export const submissionMentorSchema = z.object({
  github: z.string(),
  name: z.string().optional(),
  affiliation: z.string().optional(),
});

export const submissionDeliverablesSchema = z.object({
  repo: z.string().optional(),
  demo: z.string().optional(),
  video: z.string().optional(),
  document: z.object({
    local_path: z.string().optional(),
    r2_url: z.string().optional(),
  }).optional(),
});

export const SubmissionSchema = z.object({
  synnovator_submission: z.string(),
  project: z.object({
    name: z.string(),
    name_zh: z.string().optional(),
    tagline: z.string().optional(),
    tagline_zh: z.string().optional(),
    track: z.string(),
    team_ref: z.string(),
    mentors: z.array(submissionMentorSchema).optional(),
    deliverables: submissionDeliverablesSchema.optional(),
    tech_stack: z.array(z.string()).optional(),
    description: z.string().optional(),
    description_zh: z.string().optional(),
    likes: z.number().optional(),
  }),
});

// === Type aliases ===

export type Submission = z.infer<typeof SubmissionSchema>;
export type SubmissionData = Submission['project'];
```

> **Note:** `submissionTeamMemberSchema` is removed. `project.team` replaced by `project.team_ref: z.string()`. `project.mentors[]` preserved with dedicated schema.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @synnovator/shared test -- --run src/schemas/__tests__/submission.test.ts`
Expected: PASS

- [ ] **Step 5: Fix existing submission reader test**

The existing `submissions.test.ts` may reference `project.team` which no longer exists. If test data YAML files in `hackathons/*/submissions/` still use `team:` arrays, those YAML files must also be updated to use `team_ref:`. Check and update:

Run: `pnpm --filter @synnovator/shared test -- --run src/data/readers/__tests__/submissions.test.ts`

If it fails because existing submission YAML files have `team:` instead of `team_ref:`, update each `hackathons/*/submissions/*/project.yml` to use `team_ref: "{team-slug}"` instead of `team: [...]`.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/schemas/submission.ts packages/shared/src/schemas/__tests__/submission.test.ts
# Also add any updated project.yml files
git commit -m "feat(shared): replace submission team[] with team_ref slug reference"
```

---

### Task 4: Modify profile schema — add hacker.team, remove registrations[].team

**Files:**
- Modify: `packages/shared/src/schemas/profile.ts`

- [ ] **Step 1: Write the test**

Create `packages/shared/src/schemas/__tests__/profile.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ProfileSchema } from '../profile';

const baseProfile = {
  synnovator_profile: '1.0',
  hacker: {
    github: 'alice-dev',
    name: 'Alice',
  },
};

describe('ProfileSchema (team field)', () => {
  it('accepts hacker.team as optional string', () => {
    const result = ProfileSchema.parse({
      ...baseProfile,
      hacker: { ...baseProfile.hacker, team: 'team-awesome' },
    });
    expect(result.hacker.team).toBe('team-awesome');
  });

  it('accepts profile without team', () => {
    const result = ProfileSchema.parse(baseProfile);
    expect(result.hacker.team).toBeUndefined();
  });

  it('registration no longer has team field', () => {
    const result = ProfileSchema.parse({
      ...baseProfile,
      hacker: {
        ...baseProfile.hacker,
        registrations: [{
          hackathon: 'ai-hack',
          track: 'nlp',
          role: 'participant',
          registered_at: '2026-03-08',
        }],
      },
    });
    // team field should not appear in registration
    expect((result.hacker.registrations![0] as Record<string, unknown>).team).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @synnovator/shared test -- --run src/schemas/__tests__/profile.test.ts`
Expected: FAIL — `hacker.team` not in schema

- [ ] **Step 3: Update profile.ts**

In `packages/shared/src/schemas/profile.ts`:

1. Add `team: z.string().optional(),` after line 7 (inside `hacker` object, after `github`)
2. Remove `team: z.string().optional(),` from the `registrations` item schema (line 64)

The `hacker` object should now have `team` at top level:

```typescript
hacker: z.object({
    github: z.string(),
    name: z.string(),
    team: z.string().optional(),       // ← NEW: team slug reference
    name_zh: z.string().optional(),
    // ... rest unchanged ...
    registrations: z.array(z.object({
      hackathon: z.string(),
      track: z.string(),
      role: z.string(),
      // team: removed
      registered_at: z.string(),
    })).optional(),
  }),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @synnovator/shared test -- --run src/schemas/__tests__/profile.test.ts`
Expected: PASS

- [ ] **Step 5: Run existing profile reader test**

Run: `pnpm --filter @synnovator/shared test -- --run src/data/readers/__tests__/profiles.test.ts`

If existing profile YAML files have `registrations[].team`, the parser will silently strip them (Zod strips unknown keys by default). Existing tests should still pass.

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/schemas/profile.ts packages/shared/src/schemas/__tests__/profile.test.ts
git commit -m "feat(shared): add hacker.team top-level field, remove registrations[].team"
```

---

### Task 5: Create team data reader

**Files:**
- Create: `packages/shared/src/data/readers/teams.ts`
- Modify: `packages/shared/src/data/readers/index.ts`

- [ ] **Step 1: Write the test**

Create `packages/shared/src/data/readers/__tests__/teams.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { listTeams, getTeamBySlug, getTeamsByHackathon, getTeamByMember } from '../teams';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
function findDataRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'hackathons'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('Could not find monorepo root');
}
const DATA_ROOT = findDataRoot(__dirname);
const TEAMS_DIR = path.join(DATA_ROOT, 'teams');
const TEST_SLUG = '__test-team';
const TEST_DIR = path.join(TEAMS_DIR, TEST_SLUG);

beforeAll(async () => {
  // Create a test team.yml for reader tests
  await fs.promises.mkdir(TEST_DIR, { recursive: true });
  await fs.promises.writeFile(
    path.join(TEST_DIR, 'team.yml'),
    `synnovator_team: "1.0"
name: "Test Team"
status: recruiting
leader: "test-leader"
members:
  - github: "test-member"
    role: developer
    joined_at: "2026-01-01"
hackathons:
  - hackathon: "test-hackathon"
    track: "test-track"
    registered_at: "2026-01-01"
created_at: "2026-01-01"
`
  );
  return async () => {
    // Cleanup
    await fs.promises.rm(TEST_DIR, { recursive: true, force: true });
  };
});

describe('team readers', () => {
  it('listTeams returns parsed teams', async () => {
    const teams = await listTeams(DATA_ROOT);
    expect(teams.length).toBeGreaterThan(0);
    const testTeam = teams.find(t => t._slug === TEST_SLUG);
    expect(testTeam).toBeDefined();
    expect(testTeam!.name).toBe('Test Team');
  });

  it('getTeamBySlug returns specific team', async () => {
    const team = await getTeamBySlug(TEST_SLUG, DATA_ROOT);
    expect(team).toBeDefined();
    expect(team!.leader).toBe('test-leader');
  });

  it('getTeamBySlug returns undefined for missing team', async () => {
    const team = await getTeamBySlug('nonexistent-xyz', DATA_ROOT);
    expect(team).toBeUndefined();
  });

  it('getTeamsByHackathon filters by hackathon slug', async () => {
    const teams = await getTeamsByHackathon('test-hackathon', DATA_ROOT);
    expect(teams.length).toBeGreaterThan(0);
    expect(teams.every(t => t.hackathons?.some(h => h.hackathon === 'test-hackathon'))).toBe(true);
  });

  it('getTeamByMember finds team by member github', async () => {
    const team = await getTeamByMember('test-member', DATA_ROOT);
    expect(team).toBeDefined();
    expect(team!._slug).toBe(TEST_SLUG);
  });

  it('getTeamByMember finds team by leader github', async () => {
    const team = await getTeamByMember('test-leader', DATA_ROOT);
    expect(team).toBeDefined();
    expect(team!._slug).toBe(TEST_SLUG);
  });

  it('getTeamByMember returns undefined for non-member', async () => {
    const team = await getTeamByMember('nonexistent-user', DATA_ROOT);
    expect(team).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @synnovator/shared test -- --run src/data/readers/__tests__/teams.test.ts`
Expected: FAIL — module `../teams` not found

- [ ] **Step 3: Write the reader**

Create `packages/shared/src/data/readers/teams.ts`:

```typescript
import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { TeamSchema, type Team } from '../../schemas/team';

export interface TeamWithMeta extends Team {
  /** The team directory name (slug) */
  _slug: string;
}

/**
 * List all teams from the teams/ directory.
 */
export async function listTeams(dataRoot: string): Promise<TeamWithMeta[]> {
  const teamsDir = path.join(dataRoot, 'teams');
  let entries;
  try {
    entries = await fs.readdir(teamsDir, { withFileTypes: true });
  } catch {
    return []; // No teams/ directory
  }

  const dirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('_'));
  const results: TeamWithMeta[] = [];

  for (const dir of dirs) {
    const filePath = path.join(teamsDir, dir.name, 'team.yml');
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = yaml.load(content);
      const parsed = TeamSchema.parse(data);
      results.push({ ...parsed, _slug: dir.name });
    } catch {
      // Skip invalid team files
    }
  }

  return results;
}

/**
 * Get a single team by its directory slug.
 */
export async function getTeamBySlug(
  slug: string,
  dataRoot: string,
): Promise<TeamWithMeta | undefined> {
  const filePath = path.join(dataRoot, 'teams', slug, 'team.yml');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = yaml.load(content);
    const parsed = TeamSchema.parse(data);
    return { ...parsed, _slug: slug };
  } catch {
    return undefined;
  }
}

/**
 * List teams registered for a specific hackathon.
 */
export async function getTeamsByHackathon(
  hackathonSlug: string,
  dataRoot: string,
): Promise<TeamWithMeta[]> {
  const all = await listTeams(dataRoot);
  return all.filter(t =>
    t.hackathons?.some(h => h.hackathon === hackathonSlug),
  );
}

/**
 * Find a team by a member's GitHub username (checks both leader and members).
 */
export async function getTeamByMember(
  github: string,
  dataRoot: string,
): Promise<TeamWithMeta | undefined> {
  const all = await listTeams(dataRoot);
  return all.find(
    t => t.leader === github || t.members.some(m => m.github === github),
  );
}
```

- [ ] **Step 4: Export from index**

Add to `packages/shared/src/data/readers/index.ts`:

```typescript
export { listTeams, getTeamBySlug, getTeamsByHackathon, getTeamByMember } from './teams';
export type { TeamWithMeta } from './teams';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @synnovator/shared test -- --run src/data/readers/__tests__/teams.test.ts`
Expected: PASS — all 7 tests pass

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/data/readers/teams.ts packages/shared/src/data/readers/__tests__/teams.test.ts packages/shared/src/data/readers/index.ts
git commit -m "feat(shared): add team data reader with listTeams, getTeamBySlug, getTeamsByHackathon, getTeamByMember"
```

---

### Task 6: Create teams/ directory scaffold and _schema.yml

**Files:**
- Create: `teams/_schema.yml`
- Create: `teams/.gitkeep`

- [ ] **Step 1: Create directory and schema reference**

Create `teams/_schema.yml`:

```yaml
# Team YAML Schema Reference
# Path: teams/{team-slug}/team.yml
# Zod schema: packages/shared/src/schemas/team.ts

synnovator_team: "1.0"           # Required. Schema version.

name: "Team Name"                # Required. Team display name.
name_zh: "队伍中文名"             # Optional. Chinese name.

status: recruiting               # Required. One of: recruiting | formed | disbanded

leader: "github-username"        # Required. GitHub username of the team leader (creator).

members:                         # Required (can be empty []). Does NOT include the leader.
  - github: "member-username"    # Required. GitHub username.
    role: developer              # Required. One of: developer | product | designer | marketing | researcher
    joined_at: "2026-01-15"      # Required. ISO date of joining.

looking_for:                     # Optional. Meaningful when status=recruiting.
  roles:                         # Optional. Array of HackerRole enum values.
    - researcher
    - designer
  description: "Free text..."    # Optional. Human-readable description.

hackathons:                      # Optional. Team's hackathon participation records.
  - hackathon: "hackathon-slug"  # Required. Hackathon directory slug.
    track: "track-slug"          # Required. Track slug within the hackathon.
    registered_at: "2026-03-10"  # Required. ISO date.

created_at: "2026-01-10"        # Required. ISO date of team creation.
```

- [ ] **Step 2: Create .gitkeep**

Create `teams/.gitkeep` (empty file) to ensure the directory is tracked.

- [ ] **Step 3: Commit**

```bash
git add teams/_schema.yml teams/.gitkeep
git commit -m "feat: add teams/ directory with schema reference"
```

---

### Task 7: Add collectTeams() to generate-static-data.mjs

**Files:**
- Modify: `apps/web/scripts/generate-static-data.mjs`

- [ ] **Step 1: Add collectTeams function**

In `apps/web/scripts/generate-static-data.mjs`, add after the `collectSubmissions()` function (after line 88):

```javascript
async function collectTeams() {
  const teamsDir = path.join(DATA_ROOT, 'teams');
  let entries;
  try {
    entries = await fs.readdir(teamsDir, { withFileTypes: true });
  } catch {
    return []; // No teams/ directory
  }

  const dirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('_'));
  const results = [];

  for (const dir of dirs) {
    try {
      const data = await readYaml(path.join(teamsDir, dir.name, 'team.yml'));
      results.push({ ...data, _slug: dir.name });
    } catch {
      // Skip invalid team files
    }
  }
  return results;
}
```

- [ ] **Step 2: Update main() to include teams**

Update the `main()` function's `Promise.all` call and `data` object:

```javascript
const [hackathons, profiles, submissions, results, themeData, teams] = await Promise.all([
  collectHackathons(),
  collectProfiles(),
  collectSubmissions(),
  collectResults(),
  collectThemes(),
  collectTeams(),
]);

const data = { hackathons, profiles, submissions, results, themes: themeData, teams };
```

And add a log line:

```javascript
console.log(`  teams: ${teams.length}`);
```

- [ ] **Step 3: Verify build works**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds. Log output includes `teams: 0` (no teams yet).

- [ ] **Step 4: Commit**

```bash
git add apps/web/scripts/generate-static-data.mjs
git commit -m "feat(web): add collectTeams() to static data generation"
```

---

### Task 8: Run all shared package tests

- [ ] **Step 1: Run full test suite**

Run: `pnpm --filter @synnovator/shared test -- --run`
Expected: All tests pass (roles, team, submission, profile, readers)

- [ ] **Step 2: Fix any failures**

If any pre-existing tests fail due to schema changes (e.g., submission tests expecting `team[]`), update the test fixtures and/or YAML data files accordingly.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix(shared): update test fixtures for new team schema"
```

---

## Chunk 2: GitHub Actions Workflows

### Task 9: Rewrite validate-team.yml (PR-based)

**Files:**
- Modify: `.github/workflows/validate-team.yml`

- [ ] **Step 1: Replace validate-team.yml**

Replace the entire content of `.github/workflows/validate-team.yml` with PR-based validation:

```yaml
name: Validate Team
on:
  pull_request:
    paths:
      - 'teams/**'

jobs:
  validate-team:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - name: Find changed team files
        id: changed
        run: |
          files=$(git diff --name-only ${{ github.event.pull_request.base.sha }} ${{ github.sha }} -- 'teams/*/team.yml')
          echo "files=$files" >> "$GITHUB_OUTPUT"
          if [ -z "$files" ]; then
            echo "No team.yml changes found"
            exit 0
          fi

      - uses: actions/setup-node@v4
        if: steps.changed.outputs.files != ''
        with:
          node-version: '22'

      - name: Install dependencies
        if: steps.changed.outputs.files != ''
        run: npm install js-yaml

      - name: Validate team YAML
        if: steps.changed.outputs.files != ''
        uses: actions/github-script@v7
        with:
          script: |
            const yaml = require('js-yaml');
            const fs = require('fs');
            const path = require('path');

            const files = `${{ steps.changed.outputs.files }}`.trim().split('\n').filter(Boolean);
            const errors = [];
            const prAuthor = context.payload.pull_request.user.login;

            for (const file of files) {
              try {
                const content = fs.readFileSync(file, 'utf-8');
                const team = yaml.load(content);

                // Schema version check
                if (!team.synnovator_team) {
                  errors.push(`${file}: missing synnovator_team version`);
                  continue;
                }

                // Required fields
                for (const field of ['name', 'status', 'leader', 'members', 'created_at']) {
                  if (team[field] === undefined) {
                    errors.push(`${file}: missing required field '${field}'`);
                  }
                }

                // Status enum
                if (!['recruiting', 'formed', 'disbanded'].includes(team.status)) {
                  errors.push(`${file}: invalid status '${team.status}'`);
                }

                // Member role enum
                const validRoles = ['developer', 'product', 'designer', 'marketing', 'researcher'];
                for (const member of (team.members || [])) {
                  if (!member.github || !member.role || !member.joined_at) {
                    errors.push(`${file}: member missing required fields`);
                  }
                  if (member.role && !validRoles.includes(member.role)) {
                    errors.push(`${file}: invalid member role '${member.role}'`);
                  }
                }

                // Leader profile exists
                const leaderProfile = findProfile(team.leader);
                if (!leaderProfile) {
                  errors.push(`${file}: leader '${team.leader}' has no profile`);
                }

                // Check if this is a new file (creation) vs edit
                const isNewFile = !fs.existsSync(path.join(
                  process.env.GITHUB_WORKSPACE,
                  '.git', 'refs' // heuristic: check base ref
                ));

                // For member additions: check one-person-one-team
                for (const member of (team.members || [])) {
                  const memberProfile = findProfile(member.github);
                  if (memberProfile) {
                    const profileContent = fs.readFileSync(memberProfile, 'utf-8');
                    const profile = yaml.load(profileContent);
                    if (profile?.hacker?.team && profile.hacker.team !== path.basename(path.dirname(file))) {
                      errors.push(`${file}: member '${member.github}' already in team '${profile.hacker.team}'`);
                    }
                  }
                }

                // For hackathon registrations: check hackathon exists and team size
                for (const reg of (team.hackathons || [])) {
                  const hackathonFile = `hackathons/${reg.hackathon}/hackathon.yml`;
                  if (!fs.existsSync(hackathonFile)) {
                    errors.push(`${file}: hackathon '${reg.hackathon}' not found`);
                    continue;
                  }
                  const hackathon = yaml.load(fs.readFileSync(hackathonFile, 'utf-8'));
                  const teamSize = hackathon?.hackathon?.eligibility?.team_size;
                  if (teamSize) {
                    const totalMembers = 1 + (team.members || []).length; // leader + members
                    if (teamSize.max && totalMembers > teamSize.max) {
                      errors.push(`${file}: team size ${totalMembers} exceeds max ${teamSize.max} for hackathon '${reg.hackathon}'`);
                    }
                    if (teamSize.min && totalMembers < teamSize.min) {
                      errors.push(`${file}: team size ${totalMembers} below min ${teamSize.min} for hackathon '${reg.hackathon}'`);
                    }
                  }
                }

                // Author permission check for edits
                // For member self-removal: author must match removed member
                // For leader operations: author must be leader
                // (Detailed permission logic depends on diff analysis — simplified here)

              } catch (e) {
                errors.push(`${file}: YAML parse error — ${e.message}`);
              }
            }

            function findProfile(github) {
              const profilesDir = 'profiles';
              try {
                const files = fs.readdirSync(profilesDir);
                for (const f of files) {
                  if (!f.endsWith('.yml') || f.startsWith('_')) continue;
                  try {
                    const content = fs.readFileSync(path.join(profilesDir, f), 'utf-8');
                    const profile = yaml.load(content);
                    if (profile?.hacker?.github === github) return path.join(profilesDir, f);
                  } catch {}
                }
              } catch {}
              return null;
            }

            if (errors.length > 0) {
              const body = `## ❌ Team Validation Failed\n\n${errors.map(e => `- ${e}`).join('\n')}`;
              await github.rest.issues.createComment({
                ...context.repo,
                issue_number: context.payload.pull_request.number,
                body,
              });
              core.setFailed(`Validation failed with ${errors.length} error(s)`);
            } else {
              await github.rest.issues.createComment({
                ...context.repo,
                issue_number: context.payload.pull_request.number,
                body: '## ✅ Team Validation Passed',
              });
            }
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/validate-team.yml
git commit -m "feat(ci): rewrite validate-team.yml from Issue-based to PR-based validation"
```

---

### Task 10: Create sync-team-data.yml workflow

**Files:**
- Create: `.github/workflows/sync-team-data.yml`

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/sync-team-data.yml`:

```yaml
name: Sync Team Data
on:
  push:
    branches: [main]
    paths:
      - 'teams/**'

jobs:
  sync-profiles:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - run: npm install js-yaml

      - name: Sync team data to profiles
        uses: actions/github-script@v7
        with:
          script: |
            const yaml = require('js-yaml');
            const fs = require('fs');
            const path = require('path');
            const { execSync } = require('child_process');

            // Find changed team files
            const diff = execSync('git diff HEAD~1 --name-only -- teams/*/team.yml').toString().trim();
            if (!diff) {
              console.log('No team.yml changes');
              return;
            }

            const changedFiles = diff.split('\n').filter(Boolean);
            const profileUpdates = new Map(); // github -> { team: slug | null, registrations: [...] }

            for (const file of changedFiles) {
              const teamSlug = path.basename(path.dirname(file));
              let currentTeam, previousTeam;

              // Read current version
              try {
                currentTeam = yaml.load(fs.readFileSync(file, 'utf-8'));
              } catch {
                continue; // File might be deleted
              }

              // Read previous version
              try {
                const prev = execSync(`git show HEAD~1:${file}`).toString();
                previousTeam = yaml.load(prev);
              } catch {
                previousTeam = null; // New file
              }

              // Diff members
              const currentMembers = new Set([
                currentTeam.leader,
                ...(currentTeam.members || []).map(m => m.github),
              ]);
              const previousMembers = new Set(previousTeam ? [
                previousTeam.leader,
                ...(previousTeam.members || []).map(m => m.github),
              ] : []);

              // Added members: set hacker.team
              for (const github of currentMembers) {
                if (!previousMembers.has(github)) {
                  if (!profileUpdates.has(github)) profileUpdates.set(github, {});
                  profileUpdates.get(github).team = teamSlug;
                }
              }

              // Removed members: clear hacker.team
              for (const github of previousMembers) {
                if (!currentMembers.has(github)) {
                  if (!profileUpdates.has(github)) profileUpdates.set(github, {});
                  profileUpdates.get(github).team = null;
                }
              }

              // If team disbanded: clear all members' hacker.team
              if (currentTeam.status === 'disbanded' && previousTeam?.status !== 'disbanded') {
                for (const github of currentMembers) {
                  if (!profileUpdates.has(github)) profileUpdates.set(github, {});
                  profileUpdates.get(github).team = null;
                }
              }

              // Diff hackathons (registration propagation)
              const currentHackathons = new Set((currentTeam.hackathons || []).map(h => `${h.hackathon}|${h.track}`));
              const previousHackathons = new Set((previousTeam?.hackathons || []).map(h => `${h.hackathon}|${h.track}`));

              const addedHackathons = [...currentHackathons].filter(h => !previousHackathons.has(h));
              const removedHackathons = [...previousHackathons].filter(h => !currentHackathons.has(h));

              // For added hackathons: add registration to all current members
              for (const key of addedHackathons) {
                const [hackathon, track] = key.split('|');
                for (const github of currentMembers) {
                  if (!profileUpdates.has(github)) profileUpdates.set(github, {});
                  const u = profileUpdates.get(github);
                  if (!u.addRegistrations) u.addRegistrations = [];
                  u.addRegistrations.push({ hackathon, track, registered_at: new Date().toISOString().split('T')[0] });
                }
              }
            }

            // Apply profile updates
            if (profileUpdates.size === 0) {
              console.log('No profile updates needed');
              return;
            }

            const profilesDir = 'profiles';
            let modified = false;

            for (const [github, updates] of profileUpdates) {
              // Find profile file
              const files = fs.readdirSync(profilesDir).filter(f => f.endsWith('.yml') && !f.startsWith('_'));
              let profileFile = null;
              let profileData = null;

              for (const f of files) {
                try {
                  const content = fs.readFileSync(path.join(profilesDir, f), 'utf-8');
                  const data = yaml.load(content);
                  if (data?.hacker?.github === github) {
                    profileFile = path.join(profilesDir, f);
                    profileData = data;
                    break;
                  }
                } catch {}
              }

              if (!profileFile || !profileData) {
                console.log(`Profile not found for ${github}, skipping`);
                continue;
              }

              // Update team field
              if ('team' in updates) {
                if (updates.team === null) {
                  delete profileData.hacker.team;
                } else {
                  profileData.hacker.team = updates.team;
                }
                modified = true;
              }

              // Add registrations
              if (updates.addRegistrations) {
                if (!profileData.hacker.registrations) profileData.hacker.registrations = [];
                for (const reg of updates.addRegistrations) {
                  const exists = profileData.hacker.registrations.some(
                    r => r.hackathon === reg.hackathon && r.track === reg.track
                  );
                  if (!exists) {
                    profileData.hacker.registrations.push({
                      hackathon: reg.hackathon,
                      track: reg.track,
                      role: 'participant',
                      registered_at: reg.registered_at,
                    });
                    modified = true;
                  }
                }
              }

              if (modified) {
                fs.writeFileSync(profileFile, yaml.dump(profileData, { lineWidth: -1, quotingType: '"' }));
                console.log(`Updated profile: ${profileFile}`);
              }
            }

            if (modified) {
              execSync('git config user.name "github-actions[bot]"');
              execSync('git config user.email "github-actions[bot]@users.noreply.github.com"');
              execSync('git add profiles/');
              execSync('git commit -m "chore: sync team data to member profiles"');
              execSync('git push');
            }
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/sync-team-data.yml
git commit -m "feat(ci): add sync-team-data workflow for profile synchronization"
```

---

### Task 11: Create team-join-approval.yml workflow

**Files:**
- Create: `.github/workflows/team-join-approval.yml`

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/team-join-approval.yml`:

```yaml
name: Team Join Approval
on:
  issue_comment:
    types: [created]

jobs:
  approve-join:
    if: >
      github.event.issue.pull_request &&
      contains(github.event.comment.body, '/approve')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - run: npm install js-yaml

      - name: Verify approver is team leader
        id: verify
        uses: actions/github-script@v7
        with:
          script: |
            const yaml = require('js-yaml');
            const fs = require('fs');
            const path = require('path');

            const commenter = context.payload.comment.user.login;
            const prNumber = context.payload.issue.number;

            // Get PR files
            const { data: prFiles } = await github.rest.pulls.listFiles({
              ...context.repo,
              pull_number: prNumber,
            });

            // Find team.yml changes
            const teamFiles = prFiles.filter(f => f.filename.match(/^teams\/[^/]+\/team\.yml$/));
            if (teamFiles.length === 0) {
              console.log('No team.yml changes in this PR');
              return;
            }

            // For each changed team.yml, check if commenter is the leader
            for (const file of teamFiles) {
              try {
                // Read the BASE version (before PR changes) to get the current leader
                const { data: baseContent } = await github.rest.repos.getContent({
                  ...context.repo,
                  path: file.filename,
                  ref: context.payload.issue.pull_request?.head?.sha ? undefined : 'main',
                });
                const content = Buffer.from(baseContent.content, 'base64').toString('utf-8');
                const team = yaml.load(content);

                if (team.leader !== commenter) {
                  await github.rest.issues.createComment({
                    ...context.repo,
                    issue_number: prNumber,
                    body: `❌ Only the team leader (**${team.leader}**) can approve join requests.`,
                  });
                  core.setFailed('Approver is not team leader');
                  return;
                }
              } catch (e) {
                // New team file — commenter must be the leader in the PR version
                console.log(`Could not read base version: ${e.message}`);
              }
            }

            core.setOutput('approved', 'true');

      - name: Merge PR
        if: steps.verify.outputs.approved == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.pulls.merge({
              ...context.repo,
              pull_number: context.payload.issue.number,
              merge_method: 'squash',
            });
            await github.rest.issues.createComment({
              ...context.repo,
              issue_number: context.payload.issue.number,
              body: '✅ Team join approved and merged!',
            });
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/team-join-approval.yml
git commit -m "feat(ci): add team-join-approval workflow for leader /approve merges"
```

---

### Task 12: Delete old Issue template

**Files:**
- Delete: `.github/ISSUE_TEMPLATE/team-formation.yml`

- [ ] **Step 1: Delete the file**

```bash
git rm .github/ISSUE_TEMPLATE/team-formation.yml
```

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: remove team-formation Issue template (replaced by PR-based flow)"
```

---

## Chunk 3: Frontend — Clean up old components, simplify RegisterForm

### Task 13: Simplify RegisterForm — remove team roles

**Files:**
- Modify: `apps/web/components/forms/RegisterForm.tsx`

- [ ] **Step 1: Update ROLES array**

In `apps/web/components/forms/RegisterForm.tsx`, replace the `ROLES` constant (lines 19-23):

```typescript
const ROLES = [
  { value: 'participant', label: 'Participant', zh: '参赛者', en: 'Participant' },
  { value: 'mentor', label: 'Mentor', zh: '导师', en: 'Mentor' },
  { value: 'observer', label: 'Observer', zh: '观察者', en: 'Observer' },
];
```

- [ ] **Step 2: Remove team-related state and logic**

1. Remove `teamName` state (line 29): `const [teamName, setTeamName] = useState('');`
2. Remove `isSolo` (line 35): `const isSolo = role === 'participant';`
3. Simplify `canSubmit` (line 36) — remove `(isSolo || teamName)`:
   ```typescript
   const canSubmit = isLoggedIn && track && role && termsAgreed && profileConfirmed;
   ```
4. Remove `team: isSolo ? '' : teamName,` from `fields` object (line 66)
5. Remove the team name input block (lines 148-156): the `{role && !isSolo && ( ... )}` section

- [ ] **Step 3: Verify it renders**

Run: `pnpm dev` — navigate to any hackathon registration page, verify the form shows only Participant / Mentor / Observer roles with no team name input.

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/forms/RegisterForm.tsx
git commit -m "feat(web): simplify RegisterForm — remove team roles, keep participant/mentor/observer"
```

---

### Task 14: Delete TeamFormationForm.tsx

**Files:**
- Delete: `apps/web/components/forms/TeamFormationForm.tsx`

- [ ] **Step 1: Find all imports of TeamFormationForm**

Search for imports:
```bash
grep -r "TeamFormationForm" apps/web/ --include="*.tsx" --include="*.ts" -l
```

Remove all import references and usages in the files found.

- [ ] **Step 2: Delete the file**

```bash
git rm apps/web/components/forms/TeamFormationForm.tsx
```

- [ ] **Step 3: Verify build**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds with no import errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(web): remove TeamFormationForm (replaced by CreateTeamForm)"
```

---

## Chunk 4: Frontend — New team components and pages

### Task 15: Create CreateTeamForm.tsx

**Files:**
- Create: `apps/web/components/forms/CreateTeamForm.tsx`

- [ ] **Step 1: Write the component**

Create `apps/web/components/forms/CreateTeamForm.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildPRUrl, openGitHubUrl } from '@/lib/github-url';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { Card } from '@synnovator/ui';

interface CreateTeamFormProps {
  lang: Lang;
}

const HACKER_ROLES = [
  { value: 'developer', zh: '开发者', en: 'Developer' },
  { value: 'product', zh: '产品', en: 'Product' },
  { value: 'designer', zh: '设计师', en: 'Designer' },
  { value: 'marketing', zh: '市场', en: 'Marketing' },
  { value: 'researcher', zh: '研究员', en: 'Researcher' },
];

export function CreateTeamForm({ lang }: CreateTeamFormProps) {
  const { user, loading, isLoggedIn } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [teamNameZh, setTeamNameZh] = useState('');
  const [lookingForRoles, setLookingForRoles] = useState<string[]>([]);
  const [lookingForDesc, setLookingForDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const teamSlug = teamName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const canSubmit = isLoggedIn && teamName && teamSlug;

  function toggleRole(role: string) {
    setLookingForRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  }

  function handleSubmit() {
    if (!user || !canSubmit || submitting) return;
    setSubmitting(true);

    const today = new Date().toISOString().split('T')[0];

    // Build team.yml content
    let yamlContent = `synnovator_team: "1.0"\n`;
    yamlContent += `name: "${teamName}"\n`;
    if (teamNameZh) yamlContent += `name_zh: "${teamNameZh}"\n`;
    yamlContent += `status: recruiting\n`;
    yamlContent += `leader: "${user.login}"\n`;
    yamlContent += `members: []\n`;
    if (lookingForRoles.length > 0 || lookingForDesc) {
      yamlContent += `looking_for:\n`;
      if (lookingForRoles.length > 0) {
        yamlContent += `  roles:\n`;
        for (const role of lookingForRoles) {
          yamlContent += `    - ${role}\n`;
        }
      }
      if (lookingForDesc) {
        yamlContent += `  description: "${lookingForDesc}"\n`;
      }
    }
    yamlContent += `created_at: "${today}"\n`;

    const url = buildPRUrl({
      title: `[Team] Create ${teamName}`,
      branch: `data/team-${teamSlug}`,
      files: [
        { path: `teams/${teamSlug}/team.yml`, content: yamlContent },
      ],
    });
    openGitHubUrl(url);
    setSubmitting(false);
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-heading font-bold text-foreground mb-6">
        {t(lang, 'team.create_title')}
      </h3>

      {!loading && !isLoggedIn && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
          <p className="text-warning text-sm mb-3">{t(lang, 'form.team.sign_in_first')}</p>
          <a
            href={`/api/auth/login?returnTo=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : ''}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors"
          >
            {t(lang, 'form.register.sign_in_github')}
          </a>
        </div>
      )}

      <fieldset disabled={!isLoggedIn || loading} className="space-y-5">
        <div>
          <label htmlFor="team-name" className="block text-sm text-muted-foreground mb-2">
            {t(lang, 'team.name')}
          </label>
          <input
            id="team-name" type="text" value={teamName}
            onChange={e => setTeamName(e.target.value)}
            placeholder="Team Awesome"
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none"
          />
          {teamSlug && (
            <p className="text-xs text-muted-foreground mt-1">Slug: {teamSlug}</p>
          )}
        </div>

        <div>
          <label htmlFor="team-name-zh" className="block text-sm text-muted-foreground mb-2">
            {t(lang, 'team.name_zh')} <span className="text-muted-foreground/60">({t(lang, 'form.team.optional')})</span>
          </label>
          <input
            id="team-name-zh" type="text" value={teamNameZh}
            onChange={e => setTeamNameZh(e.target.value)}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none"
          />
        </div>

        <div>
          <p className="block text-sm text-muted-foreground mb-2">{t(lang, 'team.looking_for_roles')}</p>
          <div className="flex flex-wrap gap-2">
            {HACKER_ROLES.map(role => (
              <button
                key={role.value}
                type="button"
                onClick={() => toggleRole(role.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  lookingForRoles.includes(role.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {lang === 'zh' ? role.zh : role.en}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="looking-for-desc" className="block text-sm text-muted-foreground mb-2">
            {t(lang, 'team.looking_for_description')} <span className="text-muted-foreground/60">({t(lang, 'form.team.optional')})</span>
          </label>
          <textarea
            id="looking-for-desc" value={lookingForDesc}
            onChange={e => setLookingForDesc(e.target.value)}
            rows={3}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none resize-y"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium text-sm hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t(lang, 'team.create_submit')} →
        </button>
      </fieldset>
    </Card>
  );
}
```

> **Note:** This component uses `buildPRUrl` to generate a GitHub PR URL that creates `teams/{slug}/team.yml`. The exact `buildPRUrl` API depends on the existing implementation in `@/lib/github-url` — check the current signature and adapt if needed. If `buildPRUrl` doesn't support multi-file creation, use `buildIssueUrl` as an alternative or extend `buildPRUrl`.

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/forms/CreateTeamForm.tsx
git commit -m "feat(web): add CreateTeamForm component for PR-based team creation"
```

---

### Task 16: Create TeamCard.tsx

**Files:**
- Create: `apps/web/components/TeamCard.tsx`

- [ ] **Step 1: Write the component**

Create `apps/web/components/TeamCard.tsx`:

```typescript
import Link from 'next/link';
import { Badge } from '@synnovator/ui';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface TeamCardProps {
  slug: string;
  name: string;
  nameZh?: string;
  status: string;
  leader: string;
  memberCount: number;
  lookingFor?: { roles?: string[]; description?: string };
  lang: Lang;
}

const STATUS_COLORS: Record<string, string> = {
  recruiting: 'bg-green-500/10 text-green-600 border-green-500/30',
  formed: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  disbanded: 'bg-muted text-muted-foreground border-border',
};

export function TeamCard({
  slug, name, nameZh, status, leader, memberCount, lookingFor, lang,
}: TeamCardProps) {
  const displayName = lang === 'zh' && nameZh ? nameZh : name;
  const totalMembers = memberCount + 1; // +1 for leader

  return (
    <Link href={`/teams/${slug}`}>
      <div className="group rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors">
            {displayName}
          </h3>
          <Badge className={`text-xs border ${STATUS_COLORS[status] ?? ''}`}>
            {t(lang, `team.status_${status}`)}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          {t(lang, 'team.leader')}: <span className="text-foreground">@{leader}</span>
          {' · '}
          {totalMembers} {t(lang, 'team.members_count')}
        </p>

        {status === 'recruiting' && lookingFor?.roles && lookingFor.roles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {lookingFor.roles.map(role => (
              <span key={role} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                {role}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/TeamCard.tsx
git commit -m "feat(web): add TeamCard component for team listing"
```

---

### Task 17: Rewrite TeamsTab.tsx — read teams data

**Files:**
- Modify: `apps/web/components/TeamsTab.tsx`

- [ ] **Step 1: Rewrite the component**

Replace the full content of `apps/web/components/TeamsTab.tsx`:

```typescript
'use client';

import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { Card } from '@synnovator/ui';
import { TeamCard } from '@/components/TeamCard';

interface TeamData {
  _slug: string;
  name: string;
  name_zh?: string;
  status: string;
  leader: string;
  members: { github: string; role: string; joined_at: string }[];
  looking_for?: { roles?: string[]; description?: string };
}

interface TeamsTabProps {
  hackathonSlug: string;
  stage: string;
  lang: Lang;
  teams: TeamData[];
}

export function TeamsTab({ hackathonSlug, stage, lang, teams }: TeamsTabProps) {
  const isActive = ['registration', 'development'].includes(stage);

  if (!isActive) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground text-lg">{t(lang, 'hackathon.teams_not_available')}</p>
      </Card>
    );
  }

  // Sort: recruiting first, then formed, then disbanded
  const statusOrder = { recruiting: 0, formed: 1, disbanded: 2 };
  const sortedTeams = [...teams].sort(
    (a, b) => (statusOrder[a.status as keyof typeof statusOrder] ?? 3) - (statusOrder[b.status as keyof typeof statusOrder] ?? 3)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-foreground text-sm">
          {t(lang, 'hackathon.teams_browse')}
        </p>
        <a
          href="/teams/create"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors"
        >
          {t(lang, 'team.create')}
        </a>
      </div>

      {sortedTeams.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">{t(lang, 'team.no_teams_yet')}</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTeams.map(team => (
            <TeamCard
              key={team._slug}
              slug={team._slug}
              name={team.name}
              nameZh={team.name_zh}
              status={team.status}
              leader={team.leader}
              memberCount={team.members.length}
              lookingFor={team.looking_for}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

> **Note:** The parent page component that renders `TeamsTab` must now pass a `teams` prop (filtered by hackathon). Find where `TeamsTab` is used and update the parent to load teams data from static-data.json and filter by hackathon slug.

- [ ] **Step 2: Update parent component that uses TeamsTab**

Search for where `TeamsTab` is imported and update the parent to pass the `teams` prop. The data source is `static-data.json` which now includes `teams` from `collectTeams()`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/TeamsTab.tsx
git commit -m "feat(web): rewrite TeamsTab to render team cards from teams/ data"
```

---

### Task 18: Create teams list page and detail page

**Files:**
- Create: `apps/web/app/(public)/teams/page.tsx`
- Create: `apps/web/app/(public)/teams/[team]/page.tsx`

- [ ] **Step 1: Create teams list page**

Create `apps/web/app/(public)/teams/page.tsx`:

```typescript
import { TeamCard } from '@/components/TeamCard';
import { getLang } from '@/lib/i18n-server';
import { t } from '@synnovator/shared/i18n';
import staticData from '@/app/_generated/static-data.json';

export const metadata = { title: 'Teams — Synnovator' };

export default function TeamsPage({ searchParams }: { searchParams: { lang?: string } }) {
  const lang = getLang(searchParams);
  const teams = (staticData as Record<string, unknown>).teams as Array<{
    _slug: string; name: string; name_zh?: string; status: string;
    leader: string; members: { github: string; role: string; joined_at: string }[];
    looking_for?: { roles?: string[]; description?: string };
  }> ?? [];

  const statusOrder = { recruiting: 0, formed: 1, disbanded: 2 };
  const sortedTeams = [...teams].sort(
    (a, b) => (statusOrder[a.status as keyof typeof statusOrder] ?? 3) - (statusOrder[b.status as keyof typeof statusOrder] ?? 3)
  );

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground">
          {t(lang, 'team.list_title')}
        </h1>
        <a
          href="/teams/create"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors"
        >
          + {t(lang, 'team.create')}
        </a>
      </div>

      {sortedTeams.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">{t(lang, 'team.no_teams_yet')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTeams.map(team => (
            <TeamCard
              key={team._slug}
              slug={team._slug}
              name={team.name}
              nameZh={team.name_zh}
              status={team.status}
              leader={team.leader}
              memberCount={team.members.length}
              lookingFor={team.looking_for}
              lang={lang}
            />
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Create team detail page**

Create `apps/web/app/(public)/teams/[team]/page.tsx`:

This page renders team details: name, status badge, leader info, member list with avatars, hackathon participation, and action buttons. The implementation should follow the patterns from the existing `projects/[hackathon]/[team]/page.tsx` for member rendering (avatar images, profile links) and use `staticData.teams` for data.

Key sections:
- Team header (name, status badge, created_at)
- Leader card (avatar, github link)
- Members grid (avatar, role badge, joined_at)
- Hackathons list (if any)
- Looking for section (if recruiting)
- Action buttons (Join / Leave / Manage — placeholder links to GitHub PR URLs)

> **Note:** Exact implementation depends on the existing page patterns, `getLang`, and `staticData` import patterns. Follow the same patterns as `projects/[hackathon]/[team]/page.tsx`.

- [ ] **Step 3: Verify pages render**

Run: `pnpm dev` — navigate to `/teams` and `/teams/{slug}`, verify pages render correctly.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/\(public\)/teams/
git commit -m "feat(web): add teams list page and team detail page"
```

---

### Task 19: Add i18n keys for team management

**Files:**
- Modify: `packages/shared/src/i18n/en.json`
- Modify: `packages/shared/src/i18n/zh.json`

- [ ] **Step 1: Add English keys**

Add to the `team` and `form.team` sections of `en.json`:

```json
"team": {
  "list_title": "Teams",
  "create": "Create Team",
  "create_title": "Create a Team",
  "create_submit": "Create Team on GitHub",
  "name": "Team Name",
  "name_zh": "Team Name (Chinese)",
  "leader": "Leader",
  "members_count": "members",
  "looking_for_roles": "Looking for",
  "looking_for_description": "Description",
  "no_teams_yet": "No teams yet. Be the first to create one!",
  "status_recruiting": "Recruiting",
  "status_formed": "Formed",
  "status_disbanded": "Disbanded",
  "join": "Apply to Join",
  "leave": "Leave Team",
  "manage": "Manage Team",
  "hackathons": "Hackathon Participation",
  "created_at": "Created"
}
```

Also add `form.team` keys referenced by `CreateTeamForm.tsx`:

```json
"form": {
  "team": {
    "sign_in_first": "Please sign in to create a team",
    "optional": "optional"
  }
}
```

And additional `team` keys for `MyTeam.tsx`:

```json
"team": {
  ...
  "not_in_team": "You haven't joined a team yet.",
  "browse_teams": "Browse teams",
  "my_team": "My Team"
}
```

**Remove** old keys: `hackathon.teams_browse_link`, `hackathon.teams_post`, `form.register.select_team`, `form.register.team_name`.

**Update** (not remove) `hackathon.teams_browse` to: `"Browse teams registered for this hackathon, or create your own."`

**Keep** `hackathon.teams_not_available` — still used by the rewritten `TeamsTab.tsx`.

- [ ] **Step 2: Add Chinese keys**

Add corresponding Chinese translations to `zh.json`:

```json
"team": {
  "list_title": "队伍",
  "create": "创建队伍",
  "create_title": "创建队伍",
  "create_submit": "在 GitHub 上创建队伍",
  "name": "队伍名称",
  "name_zh": "队伍中文名",
  "leader": "队长",
  "members_count": "名成员",
  "looking_for_roles": "招募角色",
  "looking_for_description": "招募说明",
  "no_teams_yet": "暂无队伍，成为第一个创建的人吧！",
  "status_recruiting": "招募中",
  "status_formed": "已组队",
  "status_disbanded": "已解散",
  "join": "申请加入",
  "leave": "退出队伍",
  "manage": "管理队伍",
  "hackathons": "参赛记录",
  "created_at": "创建于"
}
```

Also add `form.team` and additional team keys:

```json
"form": {
  "team": {
    "sign_in_first": "请先登录以创建队伍",
    "optional": "可选"
  }
}
```

```json
"team": {
  ...
  "not_in_team": "你还没有加入任何队伍",
  "browse_teams": "浏览队伍",
  "my_team": "我的队伍"
}
```

**Remove** old keys: `hackathon.teams_browse_link`, `hackathon.teams_post`, `form.register.select_team`, `form.register.team_name`.

**Update** `hackathon.teams_browse` and **keep** `hackathon.teams_not_available`.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/i18n/en.json packages/shared/src/i18n/zh.json
git commit -m "feat(shared): add team management i18n keys, remove old team-formation keys"
```

---

### Task 18b: Create /teams/create route page

**Files:**
- Create: `apps/web/app/(public)/teams/create/page.tsx`

- [ ] **Step 1: Create the page**

Create `apps/web/app/(public)/teams/create/page.tsx`:

```typescript
import { CreateTeamForm } from '@/components/forms/CreateTeamForm';
import { getLang } from '@/lib/i18n-server';

export const metadata = { title: 'Create Team — Synnovator' };

export default function CreateTeamPage({ searchParams }: { searchParams: { lang?: string } }) {
  const lang = getLang(searchParams);

  return (
    <main className="container mx-auto px-4 py-12 max-w-2xl">
      <CreateTeamForm lang={lang} />
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(public\)/teams/create/
git commit -m "feat(web): add /teams/create route page"
```

---

### Task 18c: Create JoinTeamButton, LeaveTeamButton, and MyTeam components

**Files:**
- Create: `apps/web/components/JoinTeamButton.tsx`
- Create: `apps/web/components/LeaveTeamButton.tsx`
- Create: `apps/web/components/MyTeam.tsx`

- [ ] **Step 1: Create JoinTeamButton**

Create `apps/web/components/JoinTeamButton.tsx`:

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { buildPRUrl, openGitHubUrl } from '@/lib/github-url';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface JoinTeamButtonProps {
  teamSlug: string;
  teamYamlContent: string;
  lang: Lang;
}

export function JoinTeamButton({ teamSlug, teamYamlContent, lang }: JoinTeamButtonProps) {
  const { user, isLoggedIn } = useAuth();

  function handleJoin() {
    if (!user || !isLoggedIn) return;
    const today = new Date().toISOString().split('T')[0];

    // Append user to members in team.yml content
    const memberEntry = `  - github: "${user.login}"\n    role: developer\n    joined_at: "${today}"\n`;
    const updatedContent = teamYamlContent.replace(
      /^(members:.*$)/m,
      `$1\n${memberEntry}`
    );

    const url = buildPRUrl({
      title: `[Team] ${user.login} joins ${teamSlug}`,
      branch: `data/team-join-${teamSlug}-${user.login}`,
      files: [{ path: `teams/${teamSlug}/team.yml`, content: updatedContent }],
    });
    openGitHubUrl(url);
  }

  if (!isLoggedIn) return null;

  return (
    <button
      onClick={handleJoin}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors"
    >
      {t(lang, 'team.join')}
    </button>
  );
}
```

- [ ] **Step 2: Create LeaveTeamButton**

Create `apps/web/components/LeaveTeamButton.tsx`:

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { buildPRUrl, openGitHubUrl } from '@/lib/github-url';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface LeaveTeamButtonProps {
  teamSlug: string;
  teamYamlContent: string;
  lang: Lang;
}

export function LeaveTeamButton({ teamSlug, teamYamlContent, lang }: LeaveTeamButtonProps) {
  const { user, isLoggedIn } = useAuth();

  function handleLeave() {
    if (!user || !isLoggedIn) return;

    // Remove user's member entry from team.yml content
    // This is a simplified approach — the actual YAML manipulation
    // should be more robust in production
    const lines = teamYamlContent.split('\n');
    const filtered: string[] = [];
    let skipMember = false;

    for (const line of lines) {
      if (line.match(/^\s+-\s+github:\s+"/) && line.includes(user.login)) {
        skipMember = true;
        continue;
      }
      if (skipMember && line.match(/^\s+\w+:/)) {
        if (line.match(/^\s+-\s+github:/)) {
          skipMember = false;
        } else {
          continue; // Skip role and joined_at of removed member
        }
      }
      if (skipMember && (line.match(/^\S/) || line.trim() === '')) {
        skipMember = false;
      }
      if (!skipMember) {
        filtered.push(line);
      }
    }

    const url = buildPRUrl({
      title: `[Team] ${user.login} leaves ${teamSlug}`,
      branch: `data/team-leave-${teamSlug}-${user.login}`,
      files: [{ path: `teams/${teamSlug}/team.yml`, content: filtered.join('\n') }],
    });
    openGitHubUrl(url);
  }

  if (!isLoggedIn) return null;

  return (
    <button
      onClick={handleLeave}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
    >
      {t(lang, 'team.leave')}
    </button>
  );
}
```

- [ ] **Step 3: Create MyTeam**

Create `apps/web/components/MyTeam.tsx`:

```typescript
'use client';

import { TeamCard } from '@/components/TeamCard';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface TeamData {
  _slug: string;
  name: string;
  name_zh?: string;
  status: string;
  leader: string;
  members: { github: string; role: string; joined_at: string }[];
  looking_for?: { roles?: string[]; description?: string };
}

interface MyTeamProps {
  teamSlug: string | undefined;
  teams: TeamData[];
  lang: Lang;
}

export function MyTeam({ teamSlug, teams, lang }: MyTeamProps) {
  if (!teamSlug) {
    return (
      <div className="p-6 rounded-xl border border-dashed border-border text-center">
        <p className="text-muted-foreground text-sm">{t(lang, 'team.not_in_team')}</p>
        <a
          href="/teams"
          className="mt-3 inline-block text-primary text-sm hover:underline"
        >
          {t(lang, 'team.browse_teams')}
        </a>
      </div>
    );
  }

  const team = teams.find(t => t._slug === teamSlug);
  if (!team) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">{t(lang, 'team.my_team')}</h3>
      <TeamCard
        slug={team._slug}
        name={team.name}
        nameZh={team.name_zh}
        status={team.status}
        leader={team.leader}
        memberCount={team.members.length}
        lookingFor={team.looking_for}
        lang={lang}
      />
    </div>
  );
}
```

- [ ] **Step 4: Integrate into team detail page**

In `apps/web/app/(public)/teams/[team]/page.tsx`, import and use `JoinTeamButton` and `LeaveTeamButton` in the action buttons section based on the current user's relationship to the team.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/JoinTeamButton.tsx apps/web/components/LeaveTeamButton.tsx apps/web/components/MyTeam.tsx
git commit -m "feat(web): add JoinTeamButton, LeaveTeamButton, and MyTeam components"
```

---

### Task 18d: Add "Create Team" to global "+Create" menu

**Files:**
- Modify: The global navigation/header component (find via `grep -r "create-hackathon\|create-proposal\|create-profile" apps/web/components/ -l`)

- [ ] **Step 1: Find and update the navigation component**

Search for the "+Create" dropdown/menu component and add a "Create Team" link to `/teams/create`.

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/
git commit -m "feat(web): add 'Create Team' option to global +Create menu"
```

---

## Chunk 5: Update project detail page + CreateProposalForm

### Task 20: Update project detail page to use team_ref

**Files:**
- Modify: `apps/web/app/(public)/projects/[hackathon]/[team]/page.tsx`

- [ ] **Step 1: Update member rendering**

In the project detail page, replace the section that reads `project.team.map()` (around lines 87-114) to instead:

1. Read `project.team_ref` (the team slug string)
2. Look up the team from `staticData.teams` by slug
3. Render team members from the team data (leader + members)

The key change is replacing:
```typescript
// OLD: project.team.map(member => ...)
```
with:
```typescript
// NEW: find team by team_ref slug
const teamData = staticData.teams?.find(t => t._slug === project.team_ref);
const allMembers = teamData
  ? [{ github: teamData.leader, role: 'leader' }, ...teamData.members]
  : [];
```

Then render `allMembers` instead of `project.team`.

- [ ] **Step 2: Verify project pages still render**

Run: `pnpm dev` — navigate to existing project detail pages, verify member rendering.

> **Note:** Existing project YAML files may still use `team:` instead of `team_ref:`. If so, this page needs a backwards-compatible fallback until all project files are migrated (Task 3 step 5 should have handled this).

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/\(public\)/projects/\[hackathon\]/\[team\]/page.tsx
git commit -m "feat(web): update project detail page to read members via team_ref"
```

---

### Task 21: Update CreateProposalForm — auto-fill team_ref

**Files:**
- Modify: `apps/web/components/forms/CreateProposalForm.tsx`

- [ ] **Step 1: Remove manual team member entry (Step 2)**

In `CreateProposalForm.tsx`:

1. Remove the `members` state and related logic (line 59: `members: [{github, role}]`)
2. Remove the Step 2 "Team" section that renders member input fields (around line 105-140)
3. Replace with a single read-only field showing the user's team (from auth context / profile)
4. In the YAML generation, replace `team: teamArr` with `team_ref: "{user's team slug}"`

The user's team slug can be determined by:
- Checking `staticData.teams` for a team where `leader === user.login` or `members[].github === user.login`
- Or checking the user's profile `hacker.team` field

- [ ] **Step 2: Verify the form works**

Run: `pnpm dev` — navigate to create proposal page, verify team is auto-filled.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/forms/CreateProposalForm.tsx
git commit -m "feat(web): update CreateProposalForm to use team_ref instead of inline team members"
```

---

## Chunk 6: Documentation updates

### Task 22: Update profiles/_schema.yml

**Files:**
- Modify: `profiles/_schema.yml`

- [ ] **Step 1: Add team field documentation**

Add `team` field documentation to the hacker section and remove `registrations[].team`:

```yaml
# Add after github field:
team: "team-slug"                    # Optional. Team slug reference (global one-person-one-team).
                                     # Set by sync-team-data.yml when joining a team.
                                     # Cleared when leaving or team disbands.
```

Remove any mention of `registrations[].team` from the schema doc.

- [ ] **Step 2: Commit**

```bash
git add profiles/_schema.yml
git commit -m "docs: update profile schema — add hacker.team, remove registrations[].team"
```

---

### Task 23: Update CLAUDE.md directory navigation

**Files:**
- Modify: `CLAUDE.md` (root)

- [ ] **Step 1: Add teams/ to directory table**

Add a row to the directory navigation table in `CLAUDE.md`:

```markdown
| [`teams/`](teams/) | 队伍数据（YAML） | [teams/_schema.yml](teams/_schema.yml) |
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add teams/ to CLAUDE.md directory navigation"
```

---

### Task 24: Update PRD, user flow, and acceptance docs

**Files:**
- Modify: `docs/specs/synnovator-prd.md`
- Modify: `docs/plans/2026-03-08-hackers-user-flow.md`
- Modify: `docs/acceptance/hacker.spec.md`

- [ ] **Step 1: Update PRD**

In `docs/specs/synnovator-prd.md`:

1. **H9 section**: Rewrite from "发 Issue 招募" to "提 PR 创建 `teams/{slug}/team.yml`"
2. **H10 section**: Rewrite from "Issue comment 申请" to "提 PR 编辑 `team.yml`，队长 `/approve` 确认"
3. **RegisterForm roles**: Update from `participant | team-lead | team-member` to `participant | mentor | observer`
4. **§6.4 role enums**: Remove `project.team[].role` row, add `team.yml members[].role` with Hacker subtypes
5. **目录结构**: Add `teams/` directory

- [ ] **Step 2: Update user flow doc**

In `docs/plans/2026-03-08-hackers-user-flow.md`:

1. Update H9 flow to PR-based team creation
2. Update H10 flow to PR-based join with `/approve`
3. Update registration flow — remove team role references
4. Update submission flow — `team_ref` instead of `team[]`

- [ ] **Step 3: Update acceptance spec**

In `docs/acceptance/hacker.spec.md`:

1. Update SC-H-008 (组队请求) scenarios to match PR-based flow
2. Add scenarios for: team creation, join approval, self-exit, leader removal, disbandment

- [ ] **Step 4: Commit**

```bash
git add docs/specs/synnovator-prd.md docs/plans/2026-03-08-hackers-user-flow.md docs/acceptance/hacker.spec.md
git commit -m "docs: update PRD, user flow, and acceptance specs for PR-based team mechanism"
```

---

## Chunk 7: Final verification

### Task 25: Full build and test verification

- [ ] **Step 1: Run all shared package tests**

Run: `pnpm --filter @synnovator/shared test -- --run`
Expected: All tests pass

- [ ] **Step 2: Build web app**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds

- [ ] **Step 3: Manual smoke test**

Run: `pnpm dev` and verify:
- `/teams` page renders (empty list with "Create Team" button)
- Registration form shows participant / mentor / observer (no team roles)
- `+创建` menu includes "创建队伍" option (if menu component was updated)
- Existing project pages still render correctly

- [ ] **Step 4: Final commit if any remaining fixes**

```bash
git add -A
git commit -m "fix: address final verification issues"
```

---

## Dependency Graph

```
Task 1 (roles schema)
  └─→ Task 2 (team schema) ─→ Task 5 (team reader) ─→ Task 7 (static data)

Task 3 (submission schema) — independent (no roles import)
Task 4 (profile schema) — independent (no roles import)

Task 6 (teams/ directory) — independent

Task 9  (validate-team workflow) — independent
Task 10 (sync-team-data workflow) — independent
Task 11 (team-join-approval workflow) — independent
Task 12 (delete Issue template) — independent

Task 13 (RegisterForm) — independent
Task 14 (delete TeamFormationForm) — independent
Task 15 (CreateTeamForm) — depends on i18n (Task 19)
Task 16 (TeamCard) — depends on i18n (Task 19)
Task 17 (TeamsTab rewrite) — depends on Task 16
Task 18 (teams pages) — depends on Task 16, Task 7
Task 18b (create route) — depends on Task 15
Task 18c (Join/Leave/MyTeam) — depends on Task 16, i18n (Task 19)
Task 18d (+Create menu) — independent
Task 19 (i18n keys) — independent

Task 20 (project detail page) — depends on Task 3, Task 7
Task 21 (CreateProposalForm) — depends on Task 3

Task 22 (profiles schema doc) — independent
Task 23 (CLAUDE.md) — independent
Task 24 (PRD + docs) — independent

Task 25 (verification) — depends on ALL
```

## Parallel Execution Groups

For subagent-driven development, these task groups can run in parallel:

| Group | Tasks | Description |
|-------|-------|-------------|
| **A** | 1 → 2 → 5 → 7 | Schema chain + data layer |
| **B** | 3, 4 | Schema modifications (independent, no roles import) |
| **C** | 6, 12 | Directory scaffold + cleanup |
| **D** | 9, 10, 11 | GitHub Actions workflows |
| **E** | 13, 14, 18d | Frontend cleanup + menu update |
| **F** | 19 | i18n keys (unblocks G) |
| **G** | 15, 16, 17, 18, 18b, 18c | New frontend components (after F) |
| **H** | 20, 21 | Frontend updates (after A, B complete) |
| **I** | 22, 23, 24 | Documentation |
| **J** | 8, 25 | Tests + final verification (after ALL) |
