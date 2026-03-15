# Editor Content Loading Fix — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three editor content loading bugs by establishing MDX files as the canonical content source, with YAML as the metadata index.

**Architecture:** Extend `generate-static-data.mjs` to collect raw MDX source into `editor-mdx.json`. Create `editor-content.ts` with unified loaders (server-only) and `bilingual.ts` with `BilingualContent` type + `resolveBilingual()` (client-safe). Migrate existing data to include MDX files. Wire edit buttons to pass `lang` via query params.

**Tech Stack:** Next.js 15, TypeScript, Vitest, shell scripts (bash), js-yaml

**Spec:** `docs/specs/2026-03-15-editor-content-loading-fix.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `scripts/migrate-mdx.sh` | Create | One-time migration: generate missing MDX files from YAML descriptions |
| `scripts/create-hackathon.sh` | Modify | Add MDX template generation alongside YAML |
| `scripts/submit-project.sh` | Modify | Add README.mdx template generation alongside YAML |
| `apps/web/scripts/generate-static-data.mjs` | Modify | Add `collectEditorMdx()` → output `editor-mdx.json` |
| `apps/web/app/_generated/editor-mdx.json` | Auto-generated | Raw MDX source keyed by `{type}:{slug}:{content}` |
| `apps/web/lib/bilingual.ts` | Create | `BilingualContent` type + `resolveBilingual()` — client-safe, zero heavy imports |
| `apps/web/lib/editor-content.ts` | Create | `loadMdx()`, `getHackathonEditorData()`, `getProposalEditorData()` — server-only |
| `apps/web/lib/__tests__/bilingual.test.ts` | Create | Unit tests for `resolveBilingual()` |
| `apps/web/components/EditHackathonButton.tsx` | Modify | Append `?lang=${lang}` to link href |
| `apps/web/components/EditProjectButton.tsx` | Modify | Append `?lang=${lang}` to link href |
| `apps/web/app/(auth)/edit/hackathon/[slug]/page.tsx` | Modify | Use `getHackathonEditorData()`, read `searchParams.lang` |
| `apps/web/app/(auth)/edit/hackathon/[slug]/HackathonEditorClient.tsx` | Modify | Accept `BilingualContent` props + `lang`, use `resolveBilingual()` |
| `apps/web/app/(auth)/edit/proposal/[hackathon]/[team]/page.tsx` | Modify | Use `getProposalEditorData()`, read `searchParams.lang` |
| `apps/web/app/(auth)/edit/proposal/[hackathon]/[team]/ProposalEditorClient.tsx` | Modify | Accept `BilingualContent` props + `lang`, use `resolveBilingual()` |

## Dependency Graph

```
Task 1 (migrate-mdx.sh)
  ↓
Task 2 (generate-static-data.mjs + regenerate)
  ↓
Task 3 (bilingual.ts + editor-content.ts + tests)
  ↓
Task 4 (EditHackathonButton + EditProjectButton)     ← independent of Task 5-6
Task 5 (hackathon editor page + client)              ← depends on Task 3
Task 6 (proposal editor page + client)               ← depends on Task 3
  ↓
Task 7 (creation scripts)                            ← independent, can run anytime
Task 8 (integration test)                            ← depends on all above
```

Tasks 4, 5, 6 can run in parallel after Task 3. Task 7 is independent.

---

## Chunk 1: Data Foundation

### Task 1: Create MDX Migration Script and Generate Missing MDX Files

**Files:**
- Create: `scripts/migrate-mdx.sh`
- Generated: `hackathons/*/description.mdx`, `hackathons/*/description.zh.mdx`
- Generated: `hackathons/*/tracks/*.mdx`, `hackathons/*/tracks/*.zh.mdx`
- Generated: `hackathons/*/submissions/*/README.mdx` (where missing)
- Generated: `hackathons/*/submissions/*/README.zh.mdx` (where missing)

**Context:**
- Multiple hackathon directories exist. The migration script loops over all of them.
- Some submissions lack English `README.mdx` (e.g., `enterprise-fintech-risk-2025` teams). The script must generate both `README.mdx` AND `README.zh.mdx` when missing, not just Chinese.
- Uses Node.js with `js-yaml` (already a project dependency) to extract YAML fields.
- Safe to run multiple times — skips files that already exist.

- [ ] **Step 1: Create the migration script**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/migrate-mdx.sh
# One-time migration: generates missing MDX files from YAML description fields.
# Safe to run multiple times — skips files that already exist.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "[migrate-mdx] Scanning hackathons..."

for hackathon_dir in "$REPO_ROOT"/hackathons/*/; do
  [ -f "${hackathon_dir}hackathon.yml" ] || continue
  slug=$(basename "$hackathon_dir")
  echo "  Processing: $slug"

  # Extract all hackathon metadata in one node call
  hackathon_json=$(node -e "
    const yaml = require('js-yaml');
    const fs = require('fs');
    const data = yaml.load(fs.readFileSync('${hackathon_dir}hackathon.yml', 'utf-8'));
    const h = data.hackathon;
    console.log(JSON.stringify({
      name: h.name || '',
      name_zh: h.name_zh || h.name || '',
      desc: h.description || '',
      desc_zh: h.description_zh || '',
      tracks: (h.tracks || []).map(t => ({
        slug: t.slug, name: t.name, name_zh: t.name_zh || t.name,
        desc: t.description || '', desc_zh: t.description_zh || ''
      }))
    }));
  ")

  # --- Hackathon description MDX ---
  if [ ! -f "${hackathon_dir}description.mdx" ]; then
    echo "$hackathon_json" | node -e "
      const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8'));
      require('fs').writeFileSync('${hackathon_dir}description.mdx', '# ' + d.name + '\n\n' + d.desc + '\n');
    "
    echo "    Created: description.mdx"
  fi
  if [ ! -f "${hackathon_dir}description.zh.mdx" ]; then
    echo "$hackathon_json" | node -e "
      const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8'));
      require('fs').writeFileSync('${hackathon_dir}description.zh.mdx', '# ' + d.name_zh + '\n\n' + d.desc_zh + '\n');
    "
    echo "    Created: description.zh.mdx"
  fi

  # --- Track MDX ---
  mkdir -p "${hackathon_dir}tracks"
  echo "$hackathon_json" | node -e "
    const fs = require('fs');
    const path = require('path');
    const d = JSON.parse(fs.readFileSync('/dev/stdin','utf-8'));
    const dir = '${hackathon_dir}tracks';
    for (const t of d.tracks) {
      const enFile = path.join(dir, t.slug + '.mdx');
      if (!fs.existsSync(enFile)) {
        fs.writeFileSync(enFile, '# ' + t.name + '\n\n' + t.desc + '\n');
        console.log('    Created: tracks/' + t.slug + '.mdx');
      }
      const zhFile = path.join(dir, t.slug + '.zh.mdx');
      if (!fs.existsSync(zhFile)) {
        fs.writeFileSync(zhFile, '# ' + t.name_zh + '\n\n' + t.desc_zh + '\n');
        console.log('    Created: tracks/' + t.slug + '.zh.mdx');
      }
    }
  "

  # --- Submission README MDX (both en and zh) ---
  if [ -d "${hackathon_dir}submissions" ]; then
    for team_dir in "${hackathon_dir}"submissions/*/; do
      [ -d "$team_dir" ] || continue
      team_slug=$(basename "$team_dir")
      [ -f "${team_dir}project.yml" ] || continue

      sub_json=$(node -e "
        const yaml = require('js-yaml');
        const fs = require('fs');
        const data = yaml.load(fs.readFileSync('${team_dir}project.yml', 'utf-8'));
        const p = data.project;
        console.log(JSON.stringify({
          name: p.name || '', name_zh: p.name_zh || p.name || '',
          desc: p.description || '', desc_zh: p.description_zh || p.description || ''
        }));
      ")

      if [ ! -f "${team_dir}README.mdx" ]; then
        echo "$sub_json" | node -e "
          const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8'));
          require('fs').writeFileSync('${team_dir}README.mdx', '# ' + d.name + '\n\n' + d.desc + '\n');
        "
        echo "    Created: submissions/${team_slug}/README.mdx"
      fi
      if [ ! -f "${team_dir}README.zh.mdx" ]; then
        echo "$sub_json" | node -e "
          const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf-8'));
          require('fs').writeFileSync('${team_dir}README.zh.mdx', '# ' + d.name_zh + '\n\n' + d.desc_zh + '\n');
        "
        echo "    Created: submissions/${team_slug}/README.zh.mdx"
      fi
    done
  fi
done

echo "[migrate-mdx] Done."
```

- [ ] **Step 2: Run the migration script**

Run:
```bash
chmod +x scripts/migrate-mdx.sh
bash scripts/migrate-mdx.sh
```

Expected: Script reports created files for each hackathon. Existing `README.mdx` files are skipped.

- [ ] **Step 3: Verify generated files exist**

Run:
```bash
find hackathons -name "*.mdx" | sort
```

Expected: At minimum, each hackathon directory has `description.mdx`, `description.zh.mdx`, track MDX files, and each submission has both `README.mdx` and `README.zh.mdx`.

- [ ] **Step 4: Commit migration script and generated files**

```bash
git add scripts/migrate-mdx.sh
git add hackathons/
git commit -m "feat: add MDX migration script and generate missing MDX files

Create migrate-mdx.sh that extracts YAML description fields into MDX
files for editor consumption. Generated files include hackathon
descriptions, track descriptions, and submission READMEs (both en/zh)."
```

---

### Task 2: Extend generate-static-data.mjs to Collect Raw MDX Source

**Files:**
- Modify: `apps/web/scripts/generate-static-data.mjs` (add function before `normaliseWeights`, update `main()`)
- Modify: `.gitignore` (add `editor-mdx.json` entry)
- Generated: `apps/web/app/_generated/editor-mdx.json`

**Context:**
- The script already has `collectMdx()` (lines 223-344) that **compiles** MDX to function-body JS. We need a separate function that reads **raw source** (no compilation).
- Key format: `"hackathon:{slug}:description"`, `"track:{slug}:{trackSlug}"`, `"submission:{slug}:{teamSlug}"` (with `.zh` suffix variants).
- `.gitignore` uses individual entries for generated files (not a directory wildcard). Must add `editor-mdx.json` explicitly.

- [ ] **Step 1: Add `collectEditorMdx` function**

Add after line 343 (after `collectMdx` closes), before `normaliseWeights` (line 346):

```javascript
async function collectEditorMdx(dataRoot) {
  const result = {};
  const hackathonsDir = path.join(dataRoot, 'hackathons');

  let hackathonEntries;
  try {
    hackathonEntries = await fs.readdir(hackathonsDir, { withFileTypes: true });
  } catch {
    return result;
  }

  const hackathonDirs = hackathonEntries.filter(e => e.isDirectory());

  for (const dir of hackathonDirs) {
    const slug = dir.name;
    const hackathonPath = path.join(hackathonsDir, slug);

    // Hackathon description MDX (raw source)
    for (const suffix of ['', '.zh']) {
      const file = path.join(hackathonPath, `description${suffix}.mdx`);
      try {
        result[`hackathon:${slug}:description${suffix}`] =
          await fs.readFile(file, 'utf-8');
      } catch { /* file does not exist */ }
    }

    // Track MDX (raw source)
    const tracksDir = path.join(hackathonPath, 'tracks');
    try {
      const trackFiles = await fs.readdir(tracksDir);
      for (const tf of trackFiles.filter(f => f.endsWith('.mdx'))) {
        const key = tf.replace('.mdx', '');
        result[`track:${slug}:${key}`] =
          await fs.readFile(path.join(tracksDir, tf), 'utf-8');
      }
    } catch { /* no tracks directory */ }

    // Submission MDX (raw source)
    const submissionsDir = path.join(hackathonPath, 'submissions');
    try {
      const teamEntries = await fs.readdir(submissionsDir, { withFileTypes: true });
      const teamDirs = teamEntries.filter(e => e.isDirectory());

      for (const teamDir of teamDirs) {
        const teamSlug = teamDir.name;
        for (const variant of ['README.mdx', 'README.zh.mdx']) {
          const file = path.join(submissionsDir, teamSlug, variant);
          const suffix = variant === 'README.zh.mdx' ? '.zh' : '';
          try {
            result[`submission:${slug}:${teamSlug}${suffix}`] =
              await fs.readFile(file, 'utf-8');
          } catch { /* file does not exist */ }
        }
      }
    } catch { /* no submissions directory */ }
  }

  return result;
}
```

- [ ] **Step 2: Wire `collectEditorMdx` into `main()`**

Replace `main()` (lines 364-395):

```javascript
async function main() {
  console.log('[generate-static-data] Reading YAML data...');

  const [hackathons, profiles, submissions, teams, results, themeData, mdxCount, editorMdx] = await Promise.all([
    collectHackathons(),
    collectProfiles(),
    collectSubmissions(),
    collectTeams(),
    collectResults(),
    collectThemes(),
    collectMdx(DATA_ROOT),
    collectEditorMdx(DATA_ROOT),
  ]);

  const data = { hackathons, profiles, submissions, teams, results, themes: themeData };

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(data, null, 2));

  // Write raw MDX source for editor consumption
  const editorMdxFile = path.resolve(__dirname, '../app/_generated/editor-mdx.json');
  await fs.writeFile(editorMdxFile, JSON.stringify(editorMdx));

  console.log(`[generate-static-data] Written to ${path.relative(process.cwd(), OUT_FILE)}`);
  console.log(`  hackathons: ${hackathons.length}`);
  console.log(`  profiles: ${profiles.length}`);
  console.log(`  submissions: ${submissions.length}`);
  console.log(`  teams: ${teams.length}`);
  console.log(`  results: ${Object.keys(results).length} hackathons with results`);
  console.log(`  themes: ${themeData.themes.length} (active: ${themeData.activeTheme || 'none'}, variants: ${Object.keys(themeData.variants).length})`);
  console.log(`  mdx files: ${mdxCount}`);
  console.log(`  editor mdx entries: ${Object.keys(editorMdx).length}`);
}
```

- [ ] **Step 3: Add `editor-mdx.json` to `.gitignore`**

The root `.gitignore` uses individual entries for generated files. Add:

```
apps/web/app/_generated/editor-mdx.json
```

alongside the existing entries for `static-data.json` and `static-mdx/`.

- [ ] **Step 4: Run the generate script**

Run:
```bash
cd apps/web && node scripts/generate-static-data.mjs
```

Expected: Script completes with `editor mdx entries: N` in the output (N depends on total hackathons × content types).

- [ ] **Step 5: Verify `editor-mdx.json` exists and has correct keys**

Run:
```bash
node -e "const d = require('./apps/web/app/_generated/editor-mdx.json'); const keys = Object.keys(d).sort(); console.log('Total entries:', keys.length); keys.forEach(k => console.log(' ', k))"
```

Expected: Keys follow the pattern `hackathon:{slug}:description[.zh]`, `track:{slug}:{trackSlug}[.zh]`, `submission:{slug}:{teamSlug}[.zh]`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/scripts/generate-static-data.mjs .gitignore
git commit -m "feat: extend generate-static-data to collect raw MDX source

Add collectEditorMdx() that reads raw MDX file content (not compiled)
and writes to editor-mdx.json. Add .gitignore entry for the generated
file. This provides editor pages with the original MDX source."
```

---

### Task 3: Create `bilingual.ts` and `editor-content.ts` with Loader Functions

**Files:**
- Create: `apps/web/lib/bilingual.ts`
- Create: `apps/web/lib/editor-content.ts`
- Create: `apps/web/lib/__tests__/bilingual.test.ts`

**Context:**
- `BilingualContent` and `resolveBilingual()` are separated into `bilingual.ts` because they are imported by `'use client'` components. If they lived in `editor-content.ts` alongside `import editorMdxData from '@/app/_generated/editor-mdx.json'`, the entire JSON would be bundled into the client JS bundle.
- `editor-content.ts` contains the server-only loader functions that import heavy data.
- `@synnovator/shared/i18n` exports `type Lang = 'zh' | 'en'`.
- Tests live in `apps/web/lib/__tests__/` — apps/web has no Vitest config, but can borrow shared's config.

- [ ] **Step 1: Create `bilingual.ts` — client-safe module**

```typescript
// apps/web/lib/bilingual.ts

import type { Lang } from '@synnovator/shared/i18n';

/** Bilingual content pair: raw MDX source for en and zh */
export interface BilingualContent {
  en: string;
  zh: string;
}

/**
 * Maps BilingualContent to MdxEditor's initialContent / initialContentAlt.
 *
 * MdxEditor internals (MdxEditor.tsx:54-66):
 *   contentEn = (lang === 'en') ? initialContent : initialContentAlt
 *   contentZh = (lang === 'zh') ? initialContent : initialContentAlt
 *
 * So initialContent always maps to the current lang, initialContentAlt to the other.
 */
export function resolveBilingual(
  content: BilingualContent,
  lang: Lang,
): { primary: string; alt: string } {
  return lang === 'zh'
    ? { primary: content.zh, alt: content.en }
    : { primary: content.en, alt: content.zh };
}
```

- [ ] **Step 2: Create `editor-content.ts` — server-only loaders**

```typescript
// apps/web/lib/editor-content.ts

import type { Lang } from '@synnovator/shared/i18n';
import { getHackathon, listSubmissions } from '@/app/_generated/data';
import editorMdxData from '@/app/_generated/editor-mdx.json';
import type { BilingualContent } from './bilingual';

// Re-export for convenience (server-side callers can import from either)
export type { BilingualContent } from './bilingual';
export { resolveBilingual } from './bilingual';

// Cast JSON import to typed record
const editorMdx = editorMdxData as Record<string, string>;

// ---------------------------------------------------------------------------
// MDX source loader — fail-fast on missing files
// ---------------------------------------------------------------------------

/**
 * Load raw MDX source from pre-generated editor-mdx.json.
 * Throws if the key is missing — MDX files must exist.
 */
function loadMdx(key: string): string {
  const content = editorMdx[key];
  if (content === undefined) {
    throw new Error(
      `Missing MDX: "${key}". ` +
      `Ensure the .mdx file exists and run \`pnpm --filter @synnovator/web prebuild\` to regenerate.`,
    );
  }
  return content;
}

/** Load bilingual MDX pair. Both en and zh must exist. */
function loadBilingualMdx(keyBase: string): BilingualContent {
  return {
    en: loadMdx(keyBase),
    zh: loadMdx(`${keyBase}.zh`),
  };
}

// ---------------------------------------------------------------------------
// Hackathon editor data
// ---------------------------------------------------------------------------

export interface HackathonEditorData {
  slug: string;
  name: BilingualContent;
  description: BilingualContent;
  tracks: Array<{
    slug: string;
    name: BilingualContent;
    description: BilingualContent;
  }>;
}

export function getHackathonEditorData(slug: string): HackathonEditorData {
  const entry = getHackathon(slug);
  if (!entry) throw new Error(`Hackathon not found: ${slug}`);
  const h = entry.hackathon;

  return {
    slug: h.slug,
    name: { en: h.name, zh: h.name_zh ?? h.name },
    description: loadBilingualMdx(`hackathon:${slug}:description`),
    tracks: (h.tracks ?? []).map((tr) => ({
      slug: tr.slug,
      name: { en: tr.name, zh: tr.name_zh ?? tr.name },
      description: loadBilingualMdx(`track:${slug}:${tr.slug}`),
    })),
  };
}

// ---------------------------------------------------------------------------
// Proposal editor data
// ---------------------------------------------------------------------------

export interface ProposalEditorData {
  hackathonSlug: string;
  teamSlug: string;
  projectName: BilingualContent;
  description: BilingualContent;
}

export function getProposalEditorData(
  hackathonSlug: string,
  teamSlug: string,
): ProposalEditorData {
  const all = listSubmissions();
  const entry = all.find(
    (s) => s._hackathonSlug === hackathonSlug && s._teamSlug === teamSlug,
  );
  if (!entry) throw new Error(`Submission not found: ${hackathonSlug}/${teamSlug}`);

  return {
    hackathonSlug,
    teamSlug,
    projectName: {
      en: entry.project.name,
      zh: entry.project.name_zh ?? entry.project.name,
    },
    description: loadBilingualMdx(`submission:${hackathonSlug}:${teamSlug}`),
  };
}
```

- [ ] **Step 3: Create unit tests for `bilingual.ts`**

```typescript
// apps/web/lib/__tests__/bilingual.test.ts

import { describe, it, expect } from 'vitest';
import { resolveBilingual } from '../bilingual';

describe('resolveBilingual', () => {
  const content = { en: 'Hello', zh: '你好' };

  it('returns zh as primary when lang is zh', () => {
    const result = resolveBilingual(content, 'zh');
    expect(result).toEqual({ primary: '你好', alt: 'Hello' });
  });

  it('returns en as primary when lang is en', () => {
    const result = resolveBilingual(content, 'en');
    expect(result).toEqual({ primary: 'Hello', alt: '你好' });
  });

  it('handles empty strings', () => {
    const empty = { en: '', zh: '' };
    const result = resolveBilingual(empty, 'zh');
    expect(result).toEqual({ primary: '', alt: '' });
  });
});
```

- [ ] **Step 4: Run the test**

Run:
```bash
cd apps/web && npx vitest run lib/__tests__/bilingual.test.ts
```

If `apps/web` lacks a vitest config, create a minimal one or run from repo root:
```bash
npx vitest run apps/web/lib/__tests__/bilingual.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/bilingual.ts apps/web/lib/editor-content.ts apps/web/lib/__tests__/bilingual.test.ts
git commit -m "feat: add bilingual content module and editor MDX loaders

- bilingual.ts: BilingualContent type + resolveBilingual() (client-safe)
- editor-content.ts: loadMdx() with fail-fast on missing MDX,
  getHackathonEditorData() and getProposalEditorData() loaders
- Unit tests for resolveBilingual()"
```

---

## Chunk 2: Editor Wiring

### Task 4: Wire Edit Buttons to Pass `lang` Query Parameter

**Files:**
- Modify: `apps/web/components/EditHackathonButton.tsx:25`
- Modify: `apps/web/components/EditProjectButton.tsx:26`

- [ ] **Step 1: Update EditHackathonButton href**

In `apps/web/components/EditHackathonButton.tsx`, change line 25:

From:
```typescript
      href={`/edit/hackathon/${slug}`}
```
To:
```typescript
      href={`/edit/hackathon/${slug}?lang=${lang}`}
```

- [ ] **Step 2: Update EditProjectButton href**

In `apps/web/components/EditProjectButton.tsx`, change line 26:

From:
```typescript
      href={`/edit/proposal/${hackathonSlug}/${teamSlug}`}
```
To:
```typescript
      href={`/edit/proposal/${hackathonSlug}/${teamSlug}?lang=${lang}`}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/EditHackathonButton.tsx apps/web/components/EditProjectButton.tsx
git commit -m "fix: pass lang query parameter in edit button links

Both buttons already had the lang prop but did not include it in
the URL. Editor pages will now receive the user's language context."
```

---

### Task 5: Update Hackathon Editor Page and Client Component

**Files:**
- Modify: `apps/web/app/(auth)/edit/hackathon/[slug]/page.tsx`
- Modify: `apps/web/app/(auth)/edit/hackathon/[slug]/HackathonEditorClient.tsx`

**Context:**
- `page.tsx` needs `searchParams` (Next.js 15: `Promise<Record<string, string | string[] | undefined>>`).
- `HackathonEditorClient` is `'use client'` — imports `BilingualContent` and `resolveBilingual` from `@/lib/bilingual` (not `editor-content`) to avoid bundling server data.
- Avoid IIFEs inside JSX — extract `resolveBilingual()` calls before the return statement.
- Guard `name.zh` display against empty strings.

- [ ] **Step 1: Rewrite hackathon editor `page.tsx`**

Replace the full content of `apps/web/app/(auth)/edit/hackathon/[slug]/page.tsx`:

```typescript
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decrypt, type Session } from '@synnovator/shared/auth';
import type { Lang } from '@synnovator/shared/i18n';
import { getHackathon } from '@/app/_generated/data';
import { getHackathonEditorData } from '@/lib/editor-content';
import { HackathonEditorClient } from './HackathonEditorClient';

export default async function HackathonEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;

  // Auth
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect(`/login?returnTo=/edit/hackathon/${slug}`);

  const session = await decrypt(sessionCookie, process.env.AUTH_SECRET!) as Session | null;
  if (!session) redirect('/login');

  // Authorization: check organizer access using raw hackathon data
  const entry = getHackathon(slug);
  if (!entry) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold text-destructive mb-2">
            Hackathon not found
          </h1>
          <p className="text-muted-foreground">
            No hackathon with slug &quot;{slug}&quot; exists.
          </p>
        </div>
      </div>
    );
  }

  const h = entry.hackathon;
  const isDevUser = session.access_token === 'dev-token';
  const isOrganizer = isDevUser || h.organizers?.some(
    (o) => o.github && o.github === session.login,
  );

  if (!isOrganizer) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold text-destructive mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You must be an organizer of &quot;{h.name}&quot; to edit this hackathon.
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Logged in as: {session.login}
          </p>
        </div>
      </div>
    );
  }

  // Load editor data (MDX content + metadata)
  const editorData = getHackathonEditorData(slug);

  // Read lang from searchParams
  const sp = await searchParams;
  const langRaw = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  const lang: Lang = langRaw === 'en' ? 'en' : 'zh';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <HackathonEditorClient
        slug={editorData.slug}
        name={editorData.name}
        description={editorData.description}
        tracks={editorData.tracks}
        login={session.login}
        lang={lang}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update HackathonEditorClient**

In `apps/web/app/(auth)/edit/hackathon/[slug]/HackathonEditorClient.tsx`:

**Replace imports and interfaces** (lines 1-94). Keep existing imports for `MdxEditor`, `Tabs`, icons, etc. Add:

```typescript
import type { Lang } from '@synnovator/shared/i18n';
import type { BilingualContent } from '@/lib/bilingual';
import { resolveBilingual } from '@/lib/bilingual';
```

**Replace interfaces** (lines 80-94):

```typescript
interface TrackInfo {
  slug: string;
  name: BilingualContent;
  description: BilingualContent;
}

interface HackathonEditorClientProps {
  slug: string;
  name: BilingualContent;
  description: BilingualContent;
  tracks: TrackInfo[];
  login: string;
  lang: Lang;
}
```

**Update component destructuring** (lines 114-122):

```typescript
export function HackathonEditorClient({
  slug,
  name,
  description,
  tracks,
  login,
  lang,
}: HackathonEditorClientProps) {
```

**After the existing state declarations** (after line 127), add resolved content:

```typescript
  // Resolve bilingual content for description tab
  const { primary: descPrimary, alt: descAlt } = resolveBilingual(description, lang);
```

**Update header** (lines 197-206) — use `name` BilingualContent:

```typescript
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Edit: {name.en}
        </h1>
        {name.zh && name.zh !== name.en && (
          <p className="text-muted-foreground">{name.zh}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          Editing as <span className="font-medium text-foreground">{login}</span>
        </p>
      </div>
```

**Update tab triggers** (lines 237-240):

```typescript
          {tracks.map((track) => (
            <TabsTrigger key={track.slug} value={`track-${track.slug}`}>
              {lang === 'zh' ? track.name.zh : track.name.en}
            </TabsTrigger>
          ))}
```

**Update description tab MdxEditor** (lines 246-254) — use pre-resolved content:

```typescript
        <TabsContent value="description" className="mt-4">
          <div className="h-[70vh]">
            <MdxEditor
              initialContent={descPrimary}
              initialContentAlt={descAlt}
              availableComponents={hackathonComponentDefs}
              onSave={handleDescriptionSave}
              lang={lang}
              draftKey={`editor-hackathon-${slug}-description`}
            />
          </div>
        </TabsContent>
```

**Update track tabs** (lines 257-328) — resolve bilingual in .map(), use lang:

```typescript
        {tracks.map((track) => {
          const { primary: trackPrimary, alt: trackAlt } = resolveBilingual(track.description, lang);
          return (
            <TabsContent
              key={track.slug}
              value={`track-${track.slug}`}
              className="mt-4"
            >
              <div className="h-[70vh]">
                <MdxEditor
                  initialContent={trackPrimary}
                  initialContentAlt={trackAlt}
                  availableComponents={hackathonComponentDefs}
                  onSave={async (contentEn, contentZh, assets) => {
                    setSaveStatus('saving');
                    setErrorMessage(null);
                    setPrUrl(null);

                    try {
                      const files: Array<{
                        path: string;
                        content?: string;
                        base64Content?: string;
                      }> = [
                        {
                          path: `hackathons/${slug}/tracks/${track.slug}.mdx`,
                          content: contentEn,
                        },
                        {
                          path: `hackathons/${slug}/tracks/${track.slug}.zh.mdx`,
                          content: contentZh,
                        },
                      ];

                      for (const asset of assets) {
                        const buffer = await asset.blob.arrayBuffer();
                        const bytes = new Uint8Array(buffer);
                        let binary = '';
                        for (let i = 0; i < bytes.length; i++) {
                          binary += String.fromCharCode(bytes[i]);
                        }
                        files.push({
                          path: `hackathons/${slug}/assets/${asset.filename}`,
                          base64Content: btoa(binary),
                        });
                      }

                      const res = await fetch('/api/submit-pr', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          type: 'hackathon',
                          slug,
                          files,
                        }),
                      });

                      const data = await res.json();
                      if (!res.ok) {
                        throw new Error(data.error ?? 'Failed to create PR');
                      }

                      setPrUrl(data.pr_url);
                      setSaveStatus('success');
                    } catch (err) {
                      const message =
                        err instanceof Error ? err.message : 'Failed to save';
                      setErrorMessage(message);
                      setSaveStatus('error');
                      throw err;
                    }
                  }}
                  lang={lang}
                  draftKey={`editor-hackathon-${slug}-track-${track.slug}`}
                />
              </div>
            </TabsContent>
          );
        })}
```

- [ ] **Step 3: Verify TypeScript compilation**

Run:
```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: No type errors related to editor files.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/\(auth\)/edit/hackathon/
git commit -m "fix: hackathon editor loads MDX content with correct lang

- page.tsx uses getHackathonEditorData() to load MDX source
- page.tsx reads lang from searchParams (default: zh)
- HackathonEditorClient accepts BilingualContent props and lang
- Description and track tabs use resolveBilingual() for content
- All MdxEditor instances use lang prop instead of hardcoded 'en'"
```

---

### Task 6: Update Proposal Editor Page and Client Component

**Files:**
- Modify: `apps/web/app/(auth)/edit/proposal/[hackathon]/[team]/page.tsx`
- Modify: `apps/web/app/(auth)/edit/proposal/[hackathon]/[team]/ProposalEditorClient.tsx`

**Context:**
- Same patterns as Task 5: `searchParams` for lang, `BilingualContent` props, `resolveBilingual()`.
- Import `BilingualContent` and `resolveBilingual` from `@/lib/bilingual` (client-safe).

- [ ] **Step 1: Rewrite proposal editor `page.tsx`**

Replace the full content of `apps/web/app/(auth)/edit/proposal/[hackathon]/[team]/page.tsx`:

```typescript
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decrypt, type Session } from '@synnovator/shared/auth';
import type { Lang } from '@synnovator/shared/i18n';
import { listSubmissions, getTeam } from '@/app/_generated/data';
import { getProposalEditorData } from '@/lib/editor-content';
import { ProposalEditorClient } from './ProposalEditorClient';

export default async function ProposalEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ hackathon: string; team: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { hackathon, team } = await params;

  // Auth
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect(`/login?returnTo=/edit/proposal/${hackathon}/${team}`);

  const session = await decrypt(sessionCookie, process.env.AUTH_SECRET!) as Session | null;
  if (!session) redirect(`/login?returnTo=/edit/proposal/${hackathon}/${team}`);

  // Authorization: check team membership using raw submission data
  const allSubmissions = listSubmissions();
  const entry = allSubmissions.find(
    (s) => s._hackathonSlug === hackathon && s._teamSlug === team,
  );

  if (!entry) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold text-destructive mb-2">
            Submission not found
          </h1>
          <p className="text-muted-foreground">
            No submission for team &quot;{team}&quot; in hackathon &quot;{hackathon}&quot;.
          </p>
        </div>
      </div>
    );
  }

  const isDevUser = session.access_token === 'dev-token';
  const teamData = entry.project.team_ref ? getTeam(entry.project.team_ref) : null;
  const isTeamMember = isDevUser || (
    teamData
      ? teamData.leader === session.login || teamData.members.some(m => m.github === session.login)
      : false
  );

  if (!isTeamMember) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold text-destructive mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You must be a team member to edit this proposal.
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Logged in as: {session.login}
          </p>
        </div>
      </div>
    );
  }

  // Load editor data (MDX content + metadata)
  const editorData = getProposalEditorData(hackathon, team);

  // Read lang from searchParams
  const sp = await searchParams;
  const langRaw = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  const lang: Lang = langRaw === 'en' ? 'en' : 'zh';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProposalEditorClient
        hackathonSlug={editorData.hackathonSlug}
        teamSlug={editorData.teamSlug}
        projectName={editorData.projectName}
        description={editorData.description}
        login={session.login}
        lang={lang}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update ProposalEditorClient**

In `apps/web/app/(auth)/edit/proposal/[hackathon]/[team]/ProposalEditorClient.tsx`:

**Add imports** (after line 6):

```typescript
import type { Lang } from '@synnovator/shared/i18n';
import type { BilingualContent } from '@/lib/bilingual';
import { resolveBilingual } from '@/lib/bilingual';
```

**Replace the interface** (lines 69-75):

```typescript
interface ProposalEditorClientProps {
  hackathonSlug: string;
  teamSlug: string;
  projectName: BilingualContent;
  description: BilingualContent;
  login: string;
  lang: Lang;
}
```

**Update component destructuring** (lines 77-83):

```typescript
export function ProposalEditorClient({
  hackathonSlug,
  teamSlug,
  projectName,
  description,
  login,
  lang,
}: ProposalEditorClientProps) {
```

**After state declarations**, add resolved content:

```typescript
  // Resolve bilingual content
  const { primary: descPrimary, alt: descAlt } = resolveBilingual(description, lang);
```

**Update displayName** (lines 154-156):

```typescript
  const displayName = projectName.zh && projectName.zh !== projectName.en
    ? `${projectName.en} / ${projectName.zh}`
    : projectName.en;
```

**Update MdxEditor** (lines 218-227) — use pre-resolved content:

```typescript
      <div className="min-h-0 flex-1">
        <MdxEditor
          initialContent={descPrimary}
          initialContentAlt={descAlt}
          availableComponents={proposalComponentDefs}
          onSave={handleSave}
          lang={lang}
          draftKey={`proposal-draft-${hackathonSlug}-${teamSlug}`}
        />
      </div>
```

- [ ] **Step 3: Verify TypeScript compilation**

Run:
```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -30
```

Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/\(auth\)/edit/proposal/
git commit -m "fix: proposal editor loads MDX content with correct lang

- page.tsx uses getProposalEditorData() to load README.mdx source
- page.tsx reads lang from searchParams (default: zh)
- ProposalEditorClient accepts BilingualContent props and lang
- MdxEditor receives actual MDX content instead of empty strings"
```

---

## Chunk 3: Prevention & Verification

### Task 7: Update Creation Scripts to Generate MDX Templates

**Files:**
- Modify: `scripts/create-hackathon.sh`
- Modify: `scripts/submit-project.sh`

- [ ] **Step 1: Update create-hackathon.sh**

Add after line 25 (`mkdir -p "${DIR}/assets" "${DIR}/submissions"`):

```bash
# Create MDX template files
mkdir -p "${DIR}/tracks"

cat > "${DIR}/description.mdx" << MDX
# ${NAME}

Add your hackathon description here.
MDX

cat > "${DIR}/description.zh.mdx" << MDX
# ${NAME}

在此添加活动描述。
MDX

# Default track MDX
cat > "${DIR}/tracks/default.mdx" << MDX
# Default Track

Describe this track's focus, requirements, and evaluation criteria.
MDX

cat > "${DIR}/tracks/default.zh.mdx" << 'MDX'
# 默认赛道

描述此赛道的方向、要求和评审标准。
MDX
```

Update the final echo (line 65):

```bash
echo "Created hackathon: $FILE (with MDX templates)"
echo "Next: edit $FILE and MDX files, then commit and create PR"
```

- [ ] **Step 2: Update submit-project.sh**

Add after line 25 (`mkdir -p "$DIR"`):

```bash
# Create MDX template files
cat > "${DIR}/README.mdx" << 'MDX'
# Project Name

## Overview

Describe your project here.

## Features

- Feature 1
- Feature 2

## Architecture

Describe your technical architecture.
MDX

cat > "${DIR}/README.zh.mdx" << 'MDX'
# 项目名称

## 概述

在此描述您的项目。

## 功能特点

- 功能 1
- 功能 2

## 技术架构

描述您的技术架构。
MDX
```

Update the final echo (line 54):

```bash
echo "Created submission: $FILE (with MDX templates)"
echo "Next: edit $FILE and README.mdx, then commit and create PR"
```

- [ ] **Step 3: Test create-hackathon.sh (dry run)**

Run:
```bash
bash scripts/create-hackathon.sh test-hackathon-verify community "Test Hackathon"
ls hackathons/test-hackathon-verify/
cat hackathons/test-hackathon-verify/description.mdx
```

Expected: Directory contains `hackathon.yml`, `description.mdx`, `description.zh.mdx`, `assets/`, `submissions/`, `tracks/`. Description starts with `# Test Hackathon`.

Clean up:
```bash
rm -rf hackathons/test-hackathon-verify
```

- [ ] **Step 4: Commit**

```bash
git add scripts/create-hackathon.sh scripts/submit-project.sh
git commit -m "feat: creation scripts generate MDX templates alongside YAML

- create-hackathon.sh: generates description.mdx, description.zh.mdx,
  and default track MDX files
- submit-project.sh: generates README.mdx and README.zh.mdx templates"
```

---

### Task 8: Integration Verification

**Files:** None — this task verifies the full pipeline works end-to-end.

- [ ] **Step 1: Regenerate static data**

Run:
```bash
cd apps/web && node scripts/generate-static-data.mjs
```

Expected: Output includes `editor mdx entries: N` (N > 0).

- [ ] **Step 2: Verify build compiles**

Run:
```bash
pnpm build 2>&1 | tail -20
```

Expected: Build succeeds without type errors.

- [ ] **Step 3: Manual browser verification checklist**

Start dev server (`pnpm dev`) and verify:

1. **Hackathon edit from Chinese page:**
   - Navigate to hackathon detail page with `?lang=zh`
   - Click "编辑活动" → verify URL contains `?lang=zh`
   - Verify editor shows Chinese description as primary content
   - Switch to track tabs — verify they show track content (not empty)

2. **Hackathon edit from English page:**
   - Same flow with `?lang=en` → verify English description is primary

3. **Proposal edit:**
   - Navigate to project page → click "编辑项目"
   - Verify editor shows README.mdx content (not empty)

4. **Error on missing MDX (optional):**
   - Temporarily rename a `.mdx` file, regenerate data, navigate to editor
   - Verify error message appears, not empty content
   - Restore the file
