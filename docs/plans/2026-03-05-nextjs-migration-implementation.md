# Next.js Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate site/ from Astro to Next.js App Router with Turborepo monorepo, add admin module, establish GitHub API data write layer.

**Architecture:** Single Next.js app (`apps/web`) with Route Groups for public/admin separation. Shared packages for UI components (`packages/ui`) and business logic (`packages/shared`). Data stays in repo YAML files — reads via filesystem, writes via GitHub API creating PRs.

**Tech Stack:** Next.js (App Router), React 19, Tailwind CSS v4, shadcn/ui, Turborepo, pnpm, @opennextjs/cloudflare, Octokit, Zod, NextAuth.js

**Design Doc:** `docs/plans/2026-03-05-nextjs-migration-design.md`

---

## Stage 0: Monorepo Scaffolding

### Task 1: Initialize root workspace

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.npmrc`

**Step 1: Create root package.json**

```json
{
  "name": "synnovator",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "clean": "turbo clean"
  },
  "devDependencies": {
    "turbo": "^2"
  },
  "packageManager": "pnpm@10.12.1"
}
```

**Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "package.json", "tsconfig.json"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

**Step 4: Create .npmrc**

```
auto-install-peers=true
```

**Step 5: Install turbo and verify**

Run: `pnpm install`
Run: `pnpm turbo --version`
Expected: Turbo version output

**Step 6: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json .npmrc pnpm-lock.yaml
git commit -m "chore: initialize Turborepo monorepo workspace"
```

---

### Task 2: Create packages/ui skeleton

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/index.ts`
- Create: `packages/ui/src/lib/utils.ts`

**Step 1: Create package.json**

```json
{
  "name": "@synnovator/ui",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./styles": "./src/styles/global.css",
    "./lib/utils": "./src/lib/utils.ts",
    "./components/*": "./src/components/*.tsx"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.576.0",
    "radix-ui": "^1.4.3",
    "tailwind-merge": "^3.5.0"
  },
  "peerDependencies": {
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "typescript": "^5.9.3"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

**Step 3: Create src/lib/utils.ts**

Copy from `site/src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 4: Create src/index.ts**

```typescript
export { cn } from './lib/utils';
```

**Step 5: Install and verify**

Run: `pnpm install`
Run: `pnpm --filter @synnovator/ui exec tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add packages/ui/
git commit -m "chore: create packages/ui skeleton"
```

---

### Task 3: Migrate shadcn/ui components to packages/ui

**Files:**
- Copy: `site/src/components/ui/*.tsx` → `packages/ui/src/components/`
- Create: `packages/ui/src/components/index.ts`

**Step 1: Copy all 13 shadcn components**

Copy these files from `site/src/components/ui/` to `packages/ui/src/components/`:
- `button.tsx`, `input.tsx`, `textarea.tsx`, `label.tsx`
- `select.tsx`, `checkbox.tsx`, `tabs.tsx`
- `accordion.tsx`, `alert.tsx`, `badge.tsx`
- `dropdown-menu.tsx`, `slider.tsx`

In each file, update the import path:
- `from "@/lib/utils"` → `from "../lib/utils"`

**Step 2: Create barrel export**

```typescript
// packages/ui/src/components/index.ts
export { Button, buttonVariants } from './button';
export { Input } from './input';
export { Textarea } from './textarea';
export { Label } from './label';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
export { Checkbox } from './checkbox';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';
export { Alert, AlertDescription, AlertTitle } from './alert';
export { Badge, badgeVariants } from './badge';
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';
export { Slider } from './slider';
```

Update `src/index.ts`:
```typescript
export { cn } from './lib/utils';
export * from './components';
```

**Step 3: Verify TypeScript**

Run: `pnpm --filter @synnovator/ui exec tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/ui/
git commit -m "feat(ui): migrate shadcn/ui components from site"
```

---

### Task 4: Migrate styles with CSS token fixes

**Files:**
- Copy: `site/src/styles/global.css` → `packages/ui/src/styles/global.css`
- Modify: `packages/ui/src/styles/global.css` (fix #2: add --color-white)

**Step 1: Copy global.css**

Copy `site/src/styles/global.css` to `packages/ui/src/styles/global.css`.

**Step 2: Fix #2 — Add --color-white token**

In the `@theme` block, add after the Text Colors section:

```css
  --color-white: #FFFFFF;
```

Then replace hardcoded `white` values in `:root`:
- Line 56: `--secondary-foreground: white;` → `--secondary-foreground: var(--color-white);`
- Line 60: `--accent-foreground: white;` → `--accent-foreground: var(--color-white);`
- Line 62: `--destructive-foreground: white;` → `--destructive-foreground: var(--color-white);`

And in base styles:
- Line 78: `color: white;` → `color: var(--color-white);`
- Line 96: `color: white;` → `color: var(--color-white);`

**Step 3: Verify CSS is valid**

Run: `head -50 packages/ui/src/styles/global.css`
Expected: See `--color-white: #FFFFFF;` in @theme block

**Step 4: Commit**

```bash
git add packages/ui/src/styles/
git commit -m "feat(ui): migrate global.css with --color-white token fix (#2)"
```

---

### Task 5: Migrate icons component

**Files:**
- Copy: `site/src/components/icons/index.tsx` → `packages/ui/src/icons/index.tsx`

**Step 1: Copy icons**

Copy `site/src/components/icons/index.tsx` to `packages/ui/src/icons/index.tsx`.

**Step 2: Update packages/ui/src/index.ts**

Add:
```typescript
export * from './icons';
```

**Step 3: Commit**

```bash
git add packages/ui/src/icons/
git commit -m "feat(ui): migrate icon components"
```

---

### Task 6: Create packages/shared skeleton

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`

**Step 1: Create package.json**

```json
{
  "name": "@synnovator/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./schemas": "./src/schemas/index.ts",
    "./schemas/*": "./src/schemas/*.ts",
    "./data": "./src/data/index.ts",
    "./data/*": "./src/data/*.ts",
    "./i18n": "./src/i18n/index.ts",
    "./auth": "./src/auth/index.ts",
    "./types": "./src/types/index.ts"
  },
  "dependencies": {
    "js-yaml": "^4.1.1",
    "octokit": "^4",
    "zod": "^3"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^25.3.3",
    "typescript": "^5.9.3",
    "vitest": "^3"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

**Step 3: Create src/index.ts**

```typescript
export * from './schemas';
export * from './types';
```

**Step 4: Install and verify**

Run: `pnpm install`

**Step 5: Commit**

```bash
git add packages/shared/
git commit -m "chore: create packages/shared skeleton"
```

---

### Task 7: Extract Zod schemas from content.config.ts (with fix #1)

**Files:**
- Create: `packages/shared/src/schemas/hackathon.ts`
- Create: `packages/shared/src/schemas/profile.ts`
- Create: `packages/shared/src/schemas/submission.ts`
- Create: `packages/shared/src/schemas/result.ts`
- Create: `packages/shared/src/schemas/index.ts`
- Create: `packages/shared/src/schemas/__tests__/hackathon.test.ts`

**Step 1: Write failing test for weight validation (fix #1)**

```typescript
// packages/shared/src/schemas/__tests__/hackathon.test.ts
import { describe, it, expect } from 'vitest';
import { criterionSchema, HackathonSchema } from '../hackathon';

describe('criterionSchema', () => {
  it('accepts decimal weight 0-1', () => {
    const result = criterionSchema.safeParse({
      name: 'Innovation',
      weight: 0.35,
    });
    expect(result.success).toBe(true);
  });

  it('rejects weight > 1', () => {
    const result = criterionSchema.safeParse({
      name: 'Innovation',
      weight: 35,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative weight', () => {
    const result = criterionSchema.safeParse({
      name: 'Innovation',
      weight: -0.1,
    });
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @synnovator/shared test -- --run`
Expected: FAIL — module not found

**Step 3: Create hackathon.ts schema**

Extract from `site/src/content.config.ts` (lines 6-180), converting to standalone Zod:

```typescript
// packages/shared/src/schemas/hackathon.ts
import { z } from 'zod';

export const timeRangeSchema = z.object({
  start: z.string(),
  end: z.string(),
});

export const rewardSchema = z.object({
  type: z.string(),
  rank: z.string().optional(),
  amount: z.string().optional(),
  description: z.string().optional(),
  count: z.number().optional(),
});

// FIX #1: weight constrained to 0-1 decimal range
export const criterionSchema = z.object({
  name: z.string(),
  name_zh: z.string().optional(),
  weight: z.number().min(0).max(1),
  description: z.string().optional(),
  score_range: z.array(z.number()).optional(),
  hard_constraint: z.boolean().optional(),
  constraint_rule: z.string().optional(),
});

export const deliverableItemSchema = z.object({
  type: z.string(),
  format: z.string().optional(),
  description: z.string().optional(),
});

export const trackSchema = z.object({
  name: z.string(),
  name_zh: z.string().optional(),
  slug: z.string(),
  description: z.string().optional(),
  description_zh: z.string().optional(),
  rewards: z.array(rewardSchema).optional(),
  judging: z.object({
    mode: z.string(),
    vote_weight: z.number().optional(),
    criteria: z.array(criterionSchema).optional(),
  }).optional(),
  deliverables: z.object({
    required: z.array(deliverableItemSchema).optional(),
    optional: z.array(deliverableItemSchema).optional(),
  }).optional(),
});

export const judgeSchema = z.object({
  github: z.string(),
  name: z.string(),
  name_zh: z.string().optional(),
  title: z.string().optional(),
  affiliation: z.string().optional(),
  expertise: z.string().optional(),
  conflict_declaration: z.string().optional(),
});

export const eventSchema = z.object({
  name: z.string(),
  name_zh: z.string().optional(),
  type: z.string(),
  datetime: z.string(),
  duration_minutes: z.number().optional(),
  url: z.string().optional(),
  location: z.string().optional(),
  capacity: z.number().optional(),
  description: z.string().optional(),
});

export const faqSchema = z.object({
  q: z.string(),
  q_en: z.string().optional(),
  a: z.string(),
  a_en: z.string().optional(),
});

export const datasetSchema = z.object({
  name: z.string(),
  name_zh: z.string().optional(),
  version: z.string().optional(),
  description: z.string().optional(),
  access_control: z.string().optional(),
  format: z.string().optional(),
  size: z.string().optional(),
  download_url: z.string().optional(),
});

export const HackathonSchema = z.object({
  synnovator_version: z.string(),
  hackathon: z.object({
    name: z.string(),
    name_zh: z.string().optional(),
    slug: z.string(),
    tagline: z.string().optional(),
    tagline_zh: z.string().optional(),
    type: z.enum(['community', 'enterprise', 'youth-league', 'open-source']),
    description: z.string().optional(),
    description_zh: z.string().optional(),
    organizers: z.array(z.object({
      name: z.string().optional(),
      name_zh: z.string().optional(),
      github: z.string().optional(),
      logo: z.string().optional(),
      website: z.string().optional(),
      role: z.string().optional(),
    })).optional(),
    sponsors: z.array(z.object({
      name: z.string().optional(),
      name_zh: z.string().optional(),
      logo: z.string().optional(),
      tier: z.string().optional(),
    })).optional(),
    partners: z.array(z.object({
      name: z.string().optional(),
      name_zh: z.string().optional(),
      role: z.string().optional(),
    })).optional(),
    eligibility: z.object({
      open_to: z.string().optional(),
      restrictions: z.array(z.string()).optional(),
      blacklist: z.array(z.string()).optional(),
      team_size: z.object({
        min: z.number(),
        max: z.number(),
      }).optional(),
      allow_solo: z.boolean().optional(),
      mentor_rules: z.object({
        allowed: z.boolean().optional(),
        max_contribution_pct: z.number().optional(),
        count_in_team: z.boolean().optional(),
        count_in_award: z.boolean().optional(),
      }).optional(),
    }).optional(),
    legal: z.object({
      license: z.string().optional(),
      ip_ownership: z.string().optional(),
      nda: z.object({
        required: z.boolean().optional(),
        document_url: z.string().optional(),
        summary: z.string().optional(),
      }).optional(),
      compliance_notes: z.array(z.string()).optional(),
      data_policy: z.string().optional(),
    }).optional(),
    timeline: z.object({
      draft: timeRangeSchema.optional(),
      registration: timeRangeSchema.optional(),
      development: timeRangeSchema.optional(),
      submission: timeRangeSchema.optional(),
      judging: timeRangeSchema.optional(),
      announcement: timeRangeSchema.optional(),
      award: timeRangeSchema.optional(),
    }).optional(),
    events: z.array(eventSchema).optional(),
    tracks: z.array(trackSchema).optional(),
    judges: z.array(judgeSchema).optional(),
    datasets: z.array(datasetSchema).optional(),
    faq: z.array(faqSchema).optional(),
    settings: z.object({
      allow_multi_track: z.boolean().optional(),
      multi_track_rule: z.string().optional(),
      language: z.array(z.string()).optional(),
      ai_review: z.boolean().optional(),
      ai_team_matching: z.boolean().optional(),
      public_vote: z.string().optional(),
      vote_emoji: z.string().optional(),
    }).optional(),
  }),
});

export type Hackathon = z.infer<typeof HackathonSchema>;
export type HackathonData = Hackathon['hackathon'];
export type Track = z.infer<typeof trackSchema>;
export type Criterion = z.infer<typeof criterionSchema>;
export type TimeRange = z.infer<typeof timeRangeSchema>;
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @synnovator/shared test -- --run`
Expected: PASS — weight validation works

**Step 5: Create remaining schema files**

Create `profile.ts`, `submission.ts`, `result.ts` by extracting from `site/src/content.config.ts` (lines 182-316). Same pattern — standalone Zod, no Astro imports.

Create `packages/shared/src/schemas/index.ts`:
```typescript
export * from './hackathon';
export * from './profile';
export * from './submission';
export * from './result';
```

**Step 6: Commit**

```bash
git add packages/shared/src/schemas/
git commit -m "feat(shared): extract Zod schemas with weight validation fix (#1)"
```

---

### Task 8: Implement data readers

**Files:**
- Create: `packages/shared/src/data/readers/hackathons.ts`
- Create: `packages/shared/src/data/readers/profiles.ts`
- Create: `packages/shared/src/data/readers/submissions.ts`
- Create: `packages/shared/src/data/readers/results.ts`
- Create: `packages/shared/src/data/readers/index.ts`
- Create: `packages/shared/src/data/index.ts`
- Create: `packages/shared/src/data/readers/__tests__/hackathons.test.ts`

**Step 1: Write failing test**

```typescript
// packages/shared/src/data/readers/__tests__/hackathons.test.ts
import { describe, it, expect } from 'vitest';
import { listHackathons, getHackathon } from '../hackathons';
import path from 'node:path';

// Point to actual repo data for integration test
const DATA_ROOT = path.resolve(__dirname, '../../../../../../..');

describe('hackathon readers', () => {
  it('listHackathons returns parsed hackathons', async () => {
    const hackathons = await listHackathons(DATA_ROOT);
    expect(hackathons.length).toBeGreaterThan(0);
    expect(hackathons[0].hackathon.slug).toBeDefined();
  });

  it('getHackathon returns null for missing slug', async () => {
    const result = await getHackathon('nonexistent-slug', DATA_ROOT);
    expect(result).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @synnovator/shared test -- --run`
Expected: FAIL — module not found

**Step 3: Implement hackathons reader**

```typescript
// packages/shared/src/data/readers/hackathons.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { HackathonSchema, type Hackathon } from '../../schemas/hackathon';

export async function listHackathons(dataRoot: string): Promise<Hackathon[]> {
  const hackathonsDir = path.join(dataRoot, 'hackathons');
  const entries = await fs.readdir(hackathonsDir, { withFileTypes: true });
  const dirs = entries.filter(e => e.isDirectory());

  const results: Hackathon[] = [];
  for (const dir of dirs) {
    const filePath = path.join(hackathonsDir, dir.name, 'hackathon.yml');
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = yaml.load(content);
      const parsed = HackathonSchema.parse(data);
      results.push(parsed);
    } catch {
      // Skip invalid entries
    }
  }
  return results;
}

export async function getHackathon(slug: string, dataRoot: string): Promise<Hackathon | null> {
  const hackathons = await listHackathons(dataRoot);
  return hackathons.find(h => h.hackathon.slug === slug) ?? null;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @synnovator/shared test -- --run`
Expected: PASS

**Step 5: Implement remaining readers**

Create `profiles.ts`, `submissions.ts`, `results.ts` following the same pattern.

Create `packages/shared/src/data/readers/index.ts`:
```typescript
export { listHackathons, getHackathon } from './hackathons';
export { listProfiles, getProfile } from './profiles';
export { listSubmissions, getSubmissionsByHackathon } from './submissions';
export { getResults } from './results';
```

Create `packages/shared/src/data/index.ts`:
```typescript
export * from './readers';
```

**Step 6: Commit**

```bash
git add packages/shared/src/data/
git commit -m "feat(shared): implement YAML data readers with Zod validation"
```

---

### Task 9: Implement GitHub API writers

**Files:**
- Create: `packages/shared/src/data/writers/github-client.ts`
- Create: `packages/shared/src/data/writers/hackathons.ts`
- Create: `packages/shared/src/data/writers/pending.ts`
- Create: `packages/shared/src/data/writers/index.ts`

**Step 1: Implement GitHub client**

```typescript
// packages/shared/src/data/writers/github-client.ts
import { Octokit } from 'octokit';

export interface CreatePROpts {
  branch: string;
  files: { path: string; content: string }[];
  title: string;
  body: string;
  labels?: string[];
  baseBranch?: string;
}

export function createGitHubClient(token: string) {
  const octokit = new Octokit({ auth: token });

  return {
    async createPR(owner: string, repo: string, opts: CreatePROpts) {
      const { branch, files, title, body, labels, baseBranch = 'main' } = opts;

      // Get base branch SHA
      const { data: ref } = await octokit.rest.git.getRef({
        owner, repo, ref: `heads/${baseBranch}`,
      });
      const baseSha = ref.object.sha;

      // Create branch
      await octokit.rest.git.createRef({
        owner, repo, ref: `refs/heads/${branch}`, sha: baseSha,
      });

      // Create/update files
      for (const file of files) {
        let sha: string | undefined;
        try {
          const { data } = await octokit.rest.repos.getContent({
            owner, repo, path: file.path, ref: branch,
          });
          if (!Array.isArray(data)) sha = data.sha;
        } catch { /* new file */ }

        await octokit.rest.repos.createOrUpdateFileContents({
          owner, repo, path: file.path, branch,
          message: title,
          content: Buffer.from(file.content).toString('base64'),
          ...(sha ? { sha } : {}),
        });
      }

      // Create PR
      const { data: pr } = await octokit.rest.pulls.create({
        owner, repo, title, body, head: branch, base: baseBranch,
      });

      // Add labels
      if (labels?.length) {
        await octokit.rest.issues.addLabels({
          owner, repo, issue_number: pr.number, labels,
        });
      }

      return { number: pr.number, url: pr.html_url };
    },

    async mergePR(owner: string, repo: string, prNumber: number) {
      await octokit.rest.pulls.merge({ owner, repo, pull_number: prNumber });
    },

    async closePR(owner: string, repo: string, prNumber: number, comment?: string) {
      if (comment) {
        await octokit.rest.issues.createComment({
          owner, repo, issue_number: prNumber, body: comment,
        });
      }
      await octokit.rest.pulls.update({
        owner, repo, pull_number: prNumber, state: 'closed',
      });
    },

    async listOpenPRs(owner: string, repo: string, labels?: string[]) {
      const { data } = await octokit.rest.pulls.list({
        owner, repo, state: 'open',
        ...(labels ? {} : {}),
      });
      if (labels?.length) {
        return data.filter(pr =>
          labels.every(label =>
            pr.labels.some(l => l.name === label)
          )
        );
      }
      return data;
    },

    async checkRepoPermission(owner: string, repo: string, username: string) {
      try {
        const { data } = await octokit.rest.repos.getCollaboratorPermissionLevel({
          owner, repo, username,
        });
        return data.permission; // 'admin' | 'write' | 'read' | 'none'
      } catch {
        return 'none';
      }
    },
  };
}
```

**Step 2: Create pending reviews reader**

```typescript
// packages/shared/src/data/writers/pending.ts
import type { createGitHubClient } from './github-client';

export interface PendingReview {
  id: number;
  title: string;
  submitter: string;
  createdAt: string;
  labels: string[];
  url: string;
  type: 'hackathon' | 'profile' | 'submission' | 'unknown';
}

export function parsePRType(labels: string[]): PendingReview['type'] {
  if (labels.includes('hackathon')) return 'hackathon';
  if (labels.includes('profile')) return 'profile';
  if (labels.includes('submission')) return 'submission';
  return 'unknown';
}

export async function listPendingReviews(
  client: ReturnType<typeof createGitHubClient>,
  owner: string,
  repo: string,
  type?: 'hackathon' | 'profile' | 'submission',
): Promise<PendingReview[]> {
  const labels = ['pending-review'];
  if (type) labels.push(type);

  const prs = await client.listOpenPRs(owner, repo, labels);

  return prs.map(pr => ({
    id: pr.number,
    title: pr.title,
    submitter: pr.user?.login ?? 'unknown',
    createdAt: pr.created_at,
    labels: pr.labels.map(l => typeof l === 'string' ? l : l.name ?? ''),
    url: pr.html_url,
    type: parsePRType(pr.labels.map(l => typeof l === 'string' ? l : l.name ?? '')),
  }));
}
```

**Step 3: Create writers index**

```typescript
// packages/shared/src/data/writers/index.ts
export { createGitHubClient, type CreatePROpts } from './github-client';
export { listPendingReviews, type PendingReview } from './pending';
```

Update `packages/shared/src/data/index.ts`:
```typescript
export * from './readers';
export { createGitHubClient, listPendingReviews } from './writers';
export type { CreatePROpts, PendingReview } from './writers';
```

**Step 4: Commit**

```bash
git add packages/shared/src/data/writers/
git commit -m "feat(shared): implement GitHub API writers and pending reviews"
```

---

### Task 10: Migrate i18n to packages/shared

**Files:**
- Copy: `site/src/i18n/zh.yml` → `packages/shared/src/i18n/zh.yml`
- Copy: `site/src/i18n/en.yml` → `packages/shared/src/i18n/en.yml`
- Create: `packages/shared/src/i18n/index.ts`

**Step 1: Copy translation files**

Copy `site/src/i18n/zh.yml` and `site/src/i18n/en.yml` to `packages/shared/src/i18n/`.

**Step 2: Create i18n module**

Adapt from `site/src/lib/i18n.ts` — remove Astro-specific URL handling, make framework-agnostic:

```typescript
// packages/shared/src/i18n/index.ts
import zhData from './zh.yml';
import enData from './en.yml';

export type Lang = 'zh' | 'en';

const translations: Record<Lang, Record<string, unknown>> = {
  zh: zhData as Record<string, unknown>,
  en: enData as Record<string, unknown>,
};

export function getLangFromSearchParams(searchParams: URLSearchParams): Lang {
  return searchParams.get('lang') === 'en' ? 'en' : 'zh';
}

export function t(lang: Lang, key: string): string {
  const keys = key.split('.');
  let result: unknown = translations[lang];
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      let fallback: unknown = translations['zh'];
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = (fallback as Record<string, unknown>)[fk];
        } else {
          return key;
        }
      }
      return typeof fallback === 'string' ? fallback : key;
    }
  }
  return typeof result === 'string' ? result : key;
}

export function localize(lang: Lang, en?: string, zh?: string): string {
  if (lang === 'zh') return zh || en || '';
  return en || zh || '';
}

export function getCurrentStage(timeline: Record<string, { start: string; end: string } | undefined>): string {
  const now = new Date();
  const stages = ['draft', 'registration', 'development', 'submission', 'judging', 'announcement', 'award'] as const;
  for (const stage of stages) {
    const range = timeline[stage];
    if (!range) continue;
    const start = new Date(range.start);
    const end = new Date(range.end);
    if (now >= start && now <= end) return stage;
  }
  const lastStage = timeline['award'];
  if (lastStage && now > new Date(lastStage.end)) return 'ended';
  return 'draft';
}
```

**Step 3: Commit**

```bash
git add packages/shared/src/i18n/
git commit -m "feat(shared): migrate i18n translations and utilities"
```

---

### Task 11: Create auth utilities in packages/shared

**Files:**
- Create: `packages/shared/src/auth/index.ts`
- Copy + adapt: `site/src/lib/auth.ts` → `packages/shared/src/auth/session.ts`

**Step 1: Copy session management**

Copy `site/src/lib/auth.ts` to `packages/shared/src/auth/session.ts`.
No changes needed — it already uses standard Web Crypto API.

**Step 2: Create auth index with permission check**

```typescript
// packages/shared/src/auth/index.ts
export { encrypt, decrypt, setSessionCookie, clearSessionCookie, getSessionCookie, getSession } from './session';
export type { Session } from './session';
```

**Step 3: Commit**

```bash
git add packages/shared/src/auth/
git commit -m "feat(shared): migrate auth session management"
```

---

### Task 12: Create types package

**Files:**
- Create: `packages/shared/src/types/index.ts`

**Step 1: Create types**

```typescript
// packages/shared/src/types/index.ts
export type { Hackathon, HackathonData, Track, Criterion, TimeRange } from '../schemas/hackathon';
export type { Profile, ProfileData } from '../schemas/profile';
export type { Submission, SubmissionData } from '../schemas/submission';
export type { Result } from '../schemas/result';
export type { Lang } from '../i18n';
export type { Session } from '../auth';
export type { PendingReview, CreatePROpts } from '../data/writers';
```

**Step 2: Commit**

```bash
git add packages/shared/src/types/
git commit -m "feat(shared): create unified type exports"
```

---

### Task 13: Initialize Next.js app

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/wrangler.toml`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/(public)/page.tsx` (minimal hello world)

**Step 1: Create package.json**

```json
{
  "name": "@synnovator/web",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "deploy": "wrangler deploy",
    "deploy:preview": "wrangler versions upload"
  },
  "dependencies": {
    "@opennextjs/cloudflare": "^1",
    "@synnovator/shared": "workspace:*",
    "@synnovator/ui": "workspace:*",
    "@aws-sdk/client-s3": "^3.1000.0",
    "@aws-sdk/s3-request-presigner": "^3.1000.0",
    "next": "^15",
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.0",
    "@types/node": "^25.3.3",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.9.3",
    "wrangler": "^4.69.0"
  }
}
```

**Step 2: Create next.config.ts**

```typescript
// apps/web/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@synnovator/ui', '@synnovator/shared'],
  images: {
    unoptimized: true, // Cloudflare Workers doesn't support Image Optimization
  },
};

export default nextConfig;
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@synnovator/ui/*": ["../../packages/ui/src/*"],
      "@synnovator/shared/*": ["../../packages/shared/src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 4: Create wrangler.toml**

```toml
name = "synnovator"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[assets]
binding = "ASSETS"
directory = ".open-next/assets"

[vars]
SITE_URL = "https://home.synnovator.space"
GITHUB_CLIENT_ID = "Iv23liQaa34mwXMU912V"
GITHUB_OWNER = "Synnovator"
GITHUB_REPO = "monorepo"
```

**Step 5: Create postcss.config.mjs**

```javascript
// apps/web/postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

**Step 6: Create app/globals.css**

```css
@import "@synnovator/ui/styles";
```

**Step 7: Create minimal root layout**

```tsx
// apps/web/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Synnovator',
  description: 'AI Hackathon Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Noto+Sans+SC:wght@400;500&family=Poppins:wght@500&family=Space+Grotesk:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface text-light-gray">
        {children}
      </body>
    </html>
  );
}
```

**Step 8: Create minimal home page**

```tsx
// apps/web/app/(public)/page.tsx
export default function HomePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-heading font-bold text-white">Synnovator</h1>
      <p className="text-muted mt-4">Migration smoke test</p>
    </main>
  );
}
```

**Step 9: Install and verify local dev**

Run: `pnpm install && pnpm --filter @synnovator/web dev`
Expected: Next.js dev server starts, page renders at localhost:3000

**Step 10: Commit**

```bash
git add apps/web/
git commit -m "feat(web): initialize Next.js app with OpenNext Cloudflare adapter"
```

---

### Task 14: Smoke test — deploy to Cloudflare

**Step 1: Build for Cloudflare**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds, `.open-next/` directory created

**Step 2: Deploy preview**

Run: `pnpm --filter @synnovator/web deploy:preview`
Expected: Preview URL returned, page renders correctly

**Step 3: Verify in browser**

Check:
- [ ] Page loads without errors
- [ ] Tailwind styles applied (dark background, correct fonts)
- [ ] No console errors

**Step 4: Document smoke test result**

If PASS: Continue to Stage 2.
If FAIL: Document issues, evaluate fallback plan (see design doc §6).

**Step 5: Commit any config adjustments**

```bash
git add -A
git commit -m "chore(web): smoke test config adjustments"
```

---

## Stage 2: Frontend Page Migration

### Task 15: Migrate layout, NavBar, Footer

**Files:**
- Modify: `apps/web/app/layout.tsx`
- Create: `apps/web/app/(public)/layout.tsx`
- Create: `apps/web/components/NavBar.tsx`
- Create: `apps/web/components/Footer.tsx`
- Move: `site/src/hooks/useAuth.ts` → `apps/web/hooks/useAuth.ts`
- Move: `site/src/components/OAuthButton.tsx` → `apps/web/components/OAuthButton.tsx`

**Step 1: Migrate NavBar**

Convert `site/src/components/NavBar.astro` (89 lines) to React Server Component.
Key changes:
- `class` → `className`
- `Astro.props` → function props
- `{lang}` prop passed from layout
- OAuthButton remains `'use client'`

**Step 2: Migrate Footer**

Convert `site/src/components/Footer.astro` (66 lines) to React Server Component.
Same pattern as NavBar.

**Step 3: Create public layout**

```tsx
// apps/web/app/(public)/layout.tsx
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main className="pt-16">{children}</main>
      <Footer />
    </>
  );
}
```

**Step 4: Migrate useAuth hook and OAuthButton**

Copy with no changes (already React):
- `site/src/hooks/useAuth.ts` → `apps/web/hooks/useAuth.ts`
- `site/src/components/OAuthButton.tsx` → `apps/web/components/OAuthButton.tsx`

Update imports to use `@synnovator/ui` components.

**Step 5: Verify dev server**

Run: `pnpm --filter @synnovator/web dev`
Expected: Layout renders with NavBar and Footer

**Step 6: Commit**

```bash
git add apps/web/
git commit -m "feat(web): migrate layout, NavBar, Footer"
```

---

### Task 16: Migrate home page (Batch 1)

**Files:**
- Modify: `apps/web/app/(public)/page.tsx`
- Create: `apps/web/components/HackathonCard.tsx`
- Create: `apps/web/components/HackathonFilter.tsx` (client component for search/filter)

**Step 1: Migrate HackathonCard**

Convert `site/src/components/HackathonCard.astro` to React Server Component.

**Step 2: Create client-side filter component**

Extract the `<script>` filter logic from `site/src/pages/index.astro` (lines 134-177) into a `'use client'` React component `HackathonFilter.tsx`.

**Step 3: Migrate home page**

Replace Astro data fetching with shared reader:

```tsx
// apps/web/app/(public)/page.tsx
import { listHackathons } from '@synnovator/shared/data';
import { getCurrentStage, getLangFromSearchParams, t } from '@synnovator/shared/i18n';
import { HackathonCard } from '@/components/HackathonCard';
import { HackathonFilter } from '@/components/HackathonFilter';
import path from 'node:path';

const DATA_ROOT = path.resolve(process.cwd(), '../..');

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const lang = getLangFromSearchParams(new URLSearchParams(params as Record<string, string>));
  const hackathons = await listHackathons(DATA_ROOT);

  // Sort by registration start date descending
  hackathons.sort((a, b) => {
    const aStart = a.hackathon.timeline?.registration?.start || '';
    const bStart = b.hackathon.timeline?.registration?.start || '';
    return bStart.localeCompare(aStart);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
          {t(lang, 'home.title')}
        </h1>
        <p className="text-lg text-muted max-w-2xl">
          {t(lang, 'home.subtitle')}
        </p>
      </div>
      <HackathonFilter
        hackathons={hackathons}
        lang={lang}
      />
    </div>
  );
}
```

**Step 4: Verify**

Run: `pnpm --filter @synnovator/web dev`
Expected: Home page shows hackathon cards with working search/filter

**Step 5: Commit**

```bash
git add apps/web/
git commit -m "feat(web): migrate home page with hackathon listing"
```

---

### Task 17: Migrate not-found page

**Files:**
- Create: `apps/web/app/not-found.tsx`

**Step 1: Convert 404.astro to not-found.tsx**

```tsx
// apps/web/app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-heading font-bold text-lime-primary mb-4">404</h1>
        <p className="text-muted text-lg mb-8">Page not found</p>
        <Link href="/" className="text-lime-primary hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/app/not-found.tsx
git commit -m "feat(web): add 404 page"
```

---

### Task 18: Migrate dynamic routes (Batch 2)

**Files:**
- Create: `apps/web/app/(public)/hackathons/[slug]/page.tsx`
- Create: `apps/web/app/(public)/hackers/[id]/page.tsx`
- Create: `apps/web/app/(public)/projects/[hackathon]/[team]/page.tsx`
- Create: `apps/web/app/(public)/results/[slug]/page.tsx`
- Migrate: all display components used by these pages

**Step 1: Migrate hackathon detail page**

This is the most complex page (474 lines in Astro). Key migration points:
- `getCollection('hackathons')` → `getHackathon(slug, DATA_ROOT)` from shared
- `getCollection('submissions')` → `getSubmissionsByHackathon(slug, DATA_ROOT)`
- `getCollection('results')` → `getResults(slug, DATA_ROOT)`
- `Astro.params.slug` → `params.slug` (Next.js dynamic route)
- `HackathonTabs`, `ScoreCard`, `FAQAccordion` — already React, update imports only
- `Timeline.astro`, `TrackSection.astro`, `JudgeCard.astro`, `EventCalendar.astro` — convert to .tsx

**Step 2: Migrate dependent Astro components**

Convert these to React Server Components:
- `Timeline.astro` → `Timeline.tsx`
- `TrackSection.astro` → `TrackSection.tsx`
- `JudgeCard.astro` → `JudgeCard.tsx`
- `EventCalendar.astro` → `EventCalendar.tsx`
- `SkillBadge.astro` → `SkillBadge.tsx`
- `ProjectCard.astro` → `ProjectCard.tsx`

**Step 3: Migrate hacker profile, project detail, results pages**

Same pattern: replace `getCollection` with shared readers.

**Step 4: Verify all dynamic routes**

Run: `pnpm --filter @synnovator/web dev`
Visit: `/hackathons/<existing-slug>`, `/hackers/<existing-id>`, `/results/<existing-slug>`
Expected: Pages render with correct data

**Step 5: Commit**

```bash
git add apps/web/
git commit -m "feat(web): migrate dynamic routes (hackathons, hackers, projects, results)"
```

---

### Task 19: Migrate form pages (Batch 3)

**Files:**
- Create: `apps/web/app/(public)/create-hackathon/page.tsx`
- Create: `apps/web/app/(public)/create-profile/page.tsx`
- Create: `apps/web/app/(public)/create-proposal/page.tsx`
- Create: `apps/web/app/(public)/proposals/page.tsx`
- Migrate: form components (already React — update imports)

**Step 1: Migrate form components**

Copy existing React form components from `site/src/components/forms/`:
- `CreateHackathonForm.tsx`
- `ProfileCreateForm.tsx`
- `CreateProposalForm.tsx`
- `RegisterForm.tsx`
- `TeamFormationForm.tsx`
- `AppealForm.tsx`
- `NDASignForm.tsx`
- `TimelineEditor.tsx`
- `form-utils.ts`

Update imports:
- `from "@/components/ui/*"` → `from "@synnovator/ui/components/*"`
- `from "@/lib/i18n"` → `from "@synnovator/shared/i18n"`

**Step 2: Create page wrappers**

Each create-* page is a Server Component that passes lang and renders the client form:

```tsx
// apps/web/app/(public)/create-hackathon/page.tsx
import { getLangFromSearchParams } from '@synnovator/shared/i18n';
import { CreateHackathonForm } from '@/components/forms/CreateHackathonForm';

export default async function CreateHackathonPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const lang = getLangFromSearchParams(new URLSearchParams(params as Record<string, string>));
  return <CreateHackathonForm lang={lang} />;
}
```

**Step 3: Verify**

Run: `pnpm --filter @synnovator/web dev`
Visit: `/create-hackathon`, `/create-profile`, `/create-proposal`
Expected: Forms render with all fields

**Step 4: Commit**

```bash
git add apps/web/
git commit -m "feat(web): migrate form pages and components"
```

---

### Task 20: Migrate auth and API routes (Batch 4)

**Files:**
- Create: `apps/web/app/api/auth/login/route.ts`
- Create: `apps/web/app/api/auth/callback/route.ts`
- Create: `apps/web/app/api/auth/me/route.ts`
- Create: `apps/web/app/api/auth/logout/route.ts`
- Create: `apps/web/app/api/presign/route.ts`
- Create: `apps/web/app/api/check-profile/route.ts`

**Step 1: Migrate login route**

```typescript
// apps/web/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID!;
  const siteUrl = process.env.SITE_URL || 'https://home.synnovator.space';

  const returnTo = request.nextUrl.searchParams.get('returnTo')
    || request.headers.get('Referer')
    || '/';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${siteUrl}/api/auth/callback`,
    scope: 'read:user',
    state: returnTo,
  });

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`);
}
```

**Step 2: Migrate callback route**

Convert `site/src/pages/api/auth/callback.ts`:
- `locals.runtime.env` → `process.env`
- `import type { APIRoute } from 'astro'` → remove
- `export const GET: APIRoute = async ({ request, locals })` → `export async function GET(request: NextRequest)`
- Use `encrypt` and `setSessionCookie` from `@synnovator/shared/auth`

**Step 3: Migrate me, logout, presign, check-profile routes**

Same conversion pattern for each.

**Step 4: Verify auth flow**

Run: `pnpm --filter @synnovator/web dev`
Test: Click login → GitHub OAuth → callback → /api/auth/me returns user
Expected: Full auth flow works

**Step 5: Commit**

```bash
git add apps/web/app/api/
git commit -m "feat(web): migrate auth and API routes"
```

---

### Task 21: Migrate guides pages (Batch 4 continued)

**Files:**
- Create: `apps/web/app/(public)/guides/page.tsx`
- Create: `apps/web/app/(public)/guides/hacker/page.tsx`
- Create: `apps/web/app/(public)/guides/judge/page.tsx`
- Create: `apps/web/app/(public)/guides/organizer/page.tsx`
- Migrate: `GuideTabBar.astro` → `GuideTabBar.tsx`

**Step 1: Convert guides pages**

These are mostly static content pages. Convert Astro frontmatter to Server Component data fetching.

**Step 2: Migrate GuideTabBar**

Convert `GuideTabBar.astro` to React Server Component.

**Step 3: Verify**

Run: `pnpm --filter @synnovator/web dev`
Visit: `/guides`, `/guides/hacker`, `/guides/judge`, `/guides/organizer`

**Step 4: Commit**

```bash
git add apps/web/app/\(public\)/guides/
git commit -m "feat(web): migrate guides pages"
```

---

### Task 22: Add middleware

**Files:**
- Create: `apps/web/middleware.ts`

**Step 1: Create middleware**

```typescript
// apps/web/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@synnovator/shared/auth';

export async function middleware(request: NextRequest) {
  // Admin route protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      const loginUrl = new URL('/api/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Session decryption requires AUTH_SECRET — delegate full permission check to layout
    // Middleware does basic cookie presence check; layout does GitHub API permission check
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

**Step 2: Commit**

```bash
git add apps/web/middleware.ts
git commit -m "feat(web): add middleware for admin route protection"
```

---

## Stage 3: Admin Module

### Task 23: Admin layout and dashboard

**Files:**
- Create: `apps/web/app/(admin)/admin/layout.tsx`
- Create: `apps/web/app/(admin)/admin/page.tsx`
- Create: `apps/web/components/admin/AdminSidebar.tsx`

**Step 1: Create admin layout with permission check**

```tsx
// apps/web/app/(admin)/admin/layout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession, type Session } from '@synnovator/shared/auth';
import { createGitHubClient } from '@synnovator/shared/data';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) redirect('/api/auth/login?returnTo=/admin');

  const session = await (await import('@synnovator/shared/auth')).decrypt(
    sessionCookie,
    process.env.AUTH_SECRET!,
  ) as Session | null;

  if (!session) redirect('/api/auth/login?returnTo=/admin');

  // Check GitHub repo permission
  const client = createGitHubClient(session.access_token);
  const permission = await client.checkRepoPermission(
    process.env.GITHUB_OWNER!,
    process.env.GITHUB_REPO!,
    session.login,
  );

  if (!['admin', 'maintain', 'write'].includes(permission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading text-error mb-2">Access Denied</h1>
          <p className="text-muted">You need admin or maintain permission on the repository.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar user={session} />
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
```

**Step 2: Create admin sidebar**

```tsx
// apps/web/components/admin/AdminSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Session } from '@synnovator/shared/auth';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/hackathons', label: 'Hackathons', icon: '🏆' },
  { href: '/admin/profiles', label: 'Profiles', icon: '👤' },
  { href: '/admin/submissions', label: 'Submissions', icon: '📦' },
];

export function AdminSidebar({ user }: { user: Session }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-dark-bg border-r border-secondary-bg p-4">
      <div className="mb-8">
        <h2 className="text-lime-primary font-heading text-lg">Admin</h2>
        <p className="text-muted text-sm">@{user.login}</p>
      </div>
      <nav className="space-y-1">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded-md text-sm transition-colors ${
              pathname === item.href
                ? 'bg-secondary-bg text-lime-primary'
                : 'text-muted hover:text-light-gray hover:bg-secondary-bg/50'
            }`}
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

**Step 3: Create dashboard page**

```tsx
// apps/web/app/(admin)/admin/page.tsx
import { cookies } from 'next/headers';
import { decrypt, type Session } from '@synnovator/shared/auth';
import { createGitHubClient, listPendingReviews } from '@synnovator/shared/data';

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const session = await decrypt(
    cookieStore.get('session')!.value,
    process.env.AUTH_SECRET!,
  ) as Session;

  const client = createGitHubClient(session.access_token);
  const pending = await listPendingReviews(
    client,
    process.env.GITHUB_OWNER!,
    process.env.GITHUB_REPO!,
  );

  const counts = {
    hackathon: pending.filter(p => p.type === 'hackathon').length,
    profile: pending.filter(p => p.type === 'profile').length,
    submission: pending.filter(p => p.type === 'submission').length,
  };

  return (
    <div>
      <h1 className="text-2xl font-heading text-white mb-8">Dashboard</h1>
      <div className="grid grid-cols-3 gap-6">
        {Object.entries(counts).map(([type, count]) => (
          <div key={type} className="bg-dark-bg border border-secondary-bg rounded-lg p-6">
            <p className="text-muted text-sm capitalize">{type}s pending</p>
            <p className="text-3xl font-heading text-lime-primary mt-2">{count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 4: Verify**

Run: `pnpm --filter @synnovator/web dev`
Visit: `/admin` (must be logged in with repo access)
Expected: Dashboard renders with pending review counts

**Step 5: Commit**

```bash
git add apps/web/app/\(admin\)/ apps/web/components/admin/
git commit -m "feat(web): add admin layout, sidebar, and dashboard"
```

---

### Task 24: Admin review pages

**Files:**
- Create: `apps/web/app/(admin)/admin/hackathons/page.tsx`
- Create: `apps/web/app/(admin)/admin/profiles/page.tsx`
- Create: `apps/web/app/(admin)/admin/submissions/page.tsx`
- Create: `apps/web/components/admin/ReviewList.tsx`
- Create: `apps/web/components/admin/ReviewActions.tsx`

**Step 1: Create ReviewList component**

Shared component for listing pending PRs, used by all three admin pages.

**Step 2: Create ReviewActions component**

Client component with Approve / Reject / Request Changes buttons.
Each action calls a Server Action that uses `createGitHubClient`:
- Approve → `mergePR()`
- Reject → `closePR(comment)`
- Request Changes → comment via GitHub API

**Step 3: Create admin pages**

Each page fetches pending reviews filtered by type and renders ReviewList.

**Step 4: Verify**

Test: Create a test PR with `pending-review` label, verify it appears in admin.
Test: Approve/reject from admin UI, verify PR is merged/closed on GitHub.

**Step 5: Commit**

```bash
git add apps/web/app/\(admin\)/admin/ apps/web/components/admin/
git commit -m "feat(web): add admin review pages for hackathons, profiles, submissions"
```

---

## Stage 4: Cleanup, Data & Doc Fixes

### Task 25: Fix hackathon YAML weight data (fix #1)

**Files:**
- Modify: `hackathons/enterprise-fintech-risk-2025/hackathon.yml`

**Step 1: Convert integer weights to decimal 0-1**

In `hackathons/enterprise-fintech-risk-2025/hackathon.yml`, find all `weight:` fields in criteria sections and convert:
- `weight: 35` → `weight: 0.35`
- `weight: 25` → `weight: 0.25`
- `weight: 15` → `weight: 0.15`
- etc.

Ensure all weights in each track sum to 1.0.

**Step 2: Validate with Zod**

Run: `pnpm --filter @synnovator/shared test -- --run`
Expected: All hackathon data passes validation with new weight constraint

**Step 3: Commit**

```bash
git add hackathons/
git commit -m "fix(data): normalize weight fields to decimal 0-1 format (#1)"
```

---

### Task 26: Fix documentation (fixes #1, #3, #4, #5, #6)

**Files:**
- Modify: `docs/specs/synnovator-prd.md` (fixes #1, #4, #5)
- Modify: `docs/plans/2026-03-03-architecture-design.md` (fix #3)
- Modify: `docs/README.md` (fix #6)

**Step 1: Fix PRD weight examples (fix #1)**

In `synnovator-prd.md`, find all weight examples showing integers (30, 35, 25, etc.) and convert to decimal (0.30, 0.35, 0.25).

**Step 2: Fix PRD Profile schema (fix #4)**

In §6.2, add documentation for:
- `judge_profile: { available, expertise[], conflict_declaration }`
- `nda_signed: [{ hackathon, signed_at }]`
- `registrations: [{ hackathon, track, role, team?, registered_at }]`

**Step 3: Fix role enums (fix #5)**

Add explicit role enum documentation:
- Organizer role: `host | co-host | sponsor | partner`
- Submission team member role: `leader | developer | designer | researcher | mentor`
- Registration role: `participant | mentor | observer`

**Step 4: Fix architecture-design.md (fix #3)**

Update component list: replace `.astro` references with `.tsx` for migrated components.
Fix route path: `projects/[team].astro` → `projects/[hackathon]/[team]/page.tsx`.

**Step 5: Fix README.md plans listing (fix #6)**

Update `docs/README.md` to include all plan files in `docs/plans/`.

**Step 6: Commit**

```bash
git add docs/
git commit -m "docs: fix PRD weights, profile schema, role enums, architecture refs (#1,#3,#4,#5,#6)"
```

---

### Task 27: Update project config files

**Files:**
- Modify: `CLAUDE.md` (root)
- Modify: `CONTRIBUTING.md`
- Create: `apps/web/CLAUDE.md`

**Step 1: Update root CLAUDE.md**

Update directory navigation table:
- `site/` → `apps/web/` with new description
- Add `packages/ui/` and `packages/shared/` entries
- Update data flow diagram
- Update development workflow

**Step 2: Update CONTRIBUTING.md**

Update:
- Directory structure
- Development commands (`pnpm dev` from root uses Turbo)
- Commit scopes: `site` → `web`, add `ui`, `shared`

**Step 3: Create apps/web/CLAUDE.md**

New CLAUDE.md for the Next.js app, replacing `site/CLAUDE.md`.

**Step 4: Commit**

```bash
git add CLAUDE.md CONTRIBUTING.md apps/web/CLAUDE.md
git commit -m "docs: update CLAUDE.md and CONTRIBUTING.md for new monorepo structure"
```

---

### Task 28: Remove old site/ and final verification

**Step 1: Verify build**

Run: `pnpm build`
Expected: Both `packages/ui`, `packages/shared`, and `apps/web` build successfully

**Step 2: Run all tests**

Run: `pnpm --filter @synnovator/shared test -- --run`
Expected: All tests pass

**Step 3: Deploy preview**

Run: `pnpm --filter @synnovator/web deploy:preview`
Expected: Full site renders on preview URL

**Step 4: Remove site/ directory**

Run: `rm -rf site/`

**Step 5: Update CI workflows**

Update any `.github/workflows/` files that reference `site/` to point to `apps/web/`.

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore: remove old site/ directory, migration complete"
```

---

## Summary

| Stage | Tasks | Key Deliverables |
|-------|-------|------------------|
| 0 | 1-6 | Turborepo workspace, packages/ui, packages/shared skeletons |
| 1 | 7-14 | Zod schemas (with fix #1), data readers/writers, i18n, auth, Next.js app, smoke test |
| 2 | 15-22 | All 20 pages migrated, middleware, auth flow |
| 3 | 23-24 | Admin layout, dashboard, review pages |
| 4 | 25-28 | Data fixes, doc fixes (#1-#6), cleanup, deploy |

**Total: 28 tasks**
