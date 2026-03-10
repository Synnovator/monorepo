# Tweakable Theme — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an admin theme editor at `/admin/theme` that lets administrators visually edit OKLCH design tokens and publish changes via PR.

**Architecture:** Theme-as-YAML — `config/theme.yml` is the single source of truth for global tokens, `hackathons/<slug>/theme.yml` for per-hackathon overrides. A prebuild script (`generate-theme-css.mjs`) compiles YAML → CSS custom properties. The admin editor provides OKLCH color wheel/sliders with real-time preview and PR-based publishing.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, OKLCH color space, Zod validation, js-yaml, @octokit/rest (GitHub App), Vitest

**Design Doc:** `docs/plans/2026-03-10-tweakable-theme-design.md`

---

## Phase 1: Data Foundation

### Task 1: ThemeSchema (Zod)

**Files:**
- Create: `packages/shared/src/schemas/theme.ts`
- Modify: `packages/shared/src/schemas/index.ts`

**Step 1: Create the theme schema**

```typescript
// packages/shared/src/schemas/theme.ts
import { z } from 'zod';

/** Valid OKLCH color value: oklch(L C H) or oklch(L C H / alpha%) */
const oklchValue = z.string().regex(
  /^oklch\(\s*[\d.]+\s+[\d.]+\s+[\d.]+\s*(?:\/\s*[\d.]+%?\s*)?\)$/,
  'Must be a valid oklch() value'
);

/** All allowed token names */
const TOKEN_NAMES = [
  'background', 'foreground',
  'card', 'card-foreground',
  'popover', 'popover-foreground',
  'primary', 'primary-foreground',
  'secondary', 'secondary-foreground',
  'muted', 'muted-foreground',
  'accent', 'accent-foreground',
  'destructive', 'destructive-foreground',
  'border', 'input', 'ring',
  'brand', 'brand-foreground',
  'highlight', 'highlight-foreground',
  'info', 'info-foreground',
] as const;

export type TokenName = typeof TOKEN_NAMES[number];

/** A partial map of token name → oklch value (for overrides) */
const tokenMapSchema = z.record(
  z.enum(TOKEN_NAMES),
  oklchValue,
).optional();

/** Full theme config as stored in config/theme.yml */
export const themeConfigSchema = z.object({
  light: z.record(z.enum(TOKEN_NAMES), oklchValue),
  dark: z.record(z.enum(TOKEN_NAMES), oklchValue),
  fonts: z.object({
    heading: z.string(),
    sans: z.string(),
    code: z.string(),
    zh: z.string(),
  }).optional(),
  radius: z.string().optional(),
});

/** Partial theme for hackathon overrides */
export const hackathonThemeSchema = z.object({
  light: z.record(z.enum(TOKEN_NAMES), oklchValue).optional(),
  dark: z.record(z.enum(TOKEN_NAMES), oklchValue).optional(),
});

/** POST body for /api/admin/theme */
export const themeSubmissionSchema = z.object({
  target: z.string().min(1),
  light: z.record(z.enum(TOKEN_NAMES), oklchValue),
  dark: z.record(z.enum(TOKEN_NAMES), oklchValue),
  fonts: z.object({
    heading: z.string(),
    sans: z.string(),
    code: z.string(),
    zh: z.string(),
  }).optional(),
  radius: z.string().optional(),
  message: z.string().optional(),
});

export type ThemeConfig = z.infer<typeof themeConfigSchema>;
export type HackathonTheme = z.infer<typeof hackathonThemeSchema>;
export type ThemeSubmission = z.infer<typeof themeSubmissionSchema>;
export { TOKEN_NAMES };
```

**Step 2: Export from barrel**

Add to `packages/shared/src/schemas/index.ts`:
```typescript
export * from './theme';
```

**Step 3: Verify compilation**

Run: `cd packages/shared && pnpm tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add packages/shared/src/schemas/theme.ts packages/shared/src/schemas/index.ts
git commit -m "feat(shared): add ThemeSchema for OKLCH token validation"
```

---

### Task 2: Extract CSS to `config/theme.yml`

**Files:**
- Create: `config/theme.yml`

**Step 1: Create the YAML file**

Extract all token values from `packages/ui/src/styles/global.css` lines 40-97 into YAML. This is a direct extraction — values must match the CSS exactly.

```yaml
# config/theme.yml — Single source of truth for platform theme
# Edit via /admin/theme editor or directly in this file.
# Compiled to CSS by scripts/generate-theme-css.mjs during prebuild.

light:
  # Surfaces — warm white system
  background: "oklch(0.98 0.005 80)"
  foreground: "oklch(0.15 0.01 70)"
  card: "oklch(1 0.003 80)"
  card-foreground: "oklch(0.15 0.01 70)"
  popover: "oklch(1 0.003 80)"
  popover-foreground: "oklch(0.15 0.01 70)"
  # Actions
  primary: "oklch(0.55 0.2 35)"
  primary-foreground: "oklch(0.98 0.005 80)"
  secondary: "oklch(0.95 0.005 75)"
  secondary-foreground: "oklch(0.15 0.01 70)"
  muted: "oklch(0.95 0.005 75)"
  muted-foreground: "oklch(0.52 0.015 60)"
  accent: "oklch(0.95 0.005 75)"
  accent-foreground: "oklch(0.15 0.01 70)"
  destructive: "oklch(0.55 0.22 25)"
  destructive-foreground: "oklch(0.98 0.005 80)"
  # Borders & Focus
  border: "oklch(0.92 0.005 75)"
  input: "oklch(0.92 0.005 75)"
  ring: "oklch(0.55 0.2 35)"
  # Brand extensions
  brand: "oklch(0.55 0.2 35)"
  brand-foreground: "oklch(0.98 0.005 80)"
  highlight: "oklch(0.75 0.2 128)"
  highlight-foreground: "oklch(0.40 0.12 128)"
  info: "oklch(0.48 0.2 270)"
  info-foreground: "oklch(0.35 0.15 270)"

dark:
  background: "oklch(0.16 0.008 60)"
  foreground: "oklch(0.94 0.005 70)"
  card: "oklch(0.20 0.008 60)"
  card-foreground: "oklch(0.94 0.005 70)"
  popover: "oklch(0.20 0.008 60)"
  popover-foreground: "oklch(0.94 0.005 70)"
  primary: "oklch(0.68 0.19 38)"
  primary-foreground: "oklch(0.16 0.008 60)"
  secondary: "oklch(0.24 0.008 55)"
  secondary-foreground: "oklch(0.94 0.005 70)"
  muted: "oklch(0.24 0.008 55)"
  muted-foreground: "oklch(0.60 0.01 60)"
  accent: "oklch(0.24 0.008 55)"
  accent-foreground: "oklch(0.94 0.005 70)"
  destructive: "oklch(0.58 0.2 22)"
  destructive-foreground: "oklch(0.98 0.005 80)"
  border: "oklch(1 0 0 / 10%)"
  input: "oklch(1 0 0 / 15%)"
  ring: "oklch(0.68 0.19 38)"
  brand: "oklch(0.68 0.19 38)"
  brand-foreground: "oklch(0.16 0.008 60)"
  highlight: "oklch(0.88 0.25 125)"
  highlight-foreground: "oklch(0.16 0.008 60)"
  info: "oklch(0.58 0.18 270)"
  info-foreground: "oklch(0.94 0.005 70)"

fonts:
  heading: "Space Grotesk"
  sans: "Inter"
  code: "Poppins"
  zh: "Noto Sans SC"

radius: "0.75rem"
```

**Step 2: Commit**

```bash
git add config/theme.yml
git commit -m "feat: extract design tokens to config/theme.yml"
```

---

### Task 3: Create `generate-theme-css.mjs`

**Files:**
- Create: `scripts/generate-theme-css.mjs`

**Step 1: Write the script**

Reference `scripts/generate-static-data.mjs` for patterns (it uses `import { readFileSync }`, `import yaml from 'js-yaml'`, `import { resolve, dirname }` etc.).

```javascript
// scripts/generate-theme-css.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT = resolve(ROOT, 'packages/ui/src/styles/generated-themes.css');

function loadYaml(path) {
  if (!existsSync(path)) return null;
  return yaml.load(readFileSync(path, 'utf8'));
}

function renderBlock(selector, tokens) {
  const entries = Object.entries(tokens);
  if (entries.length === 0) return '';
  const props = entries.map(([k, v]) => `  --${k}: ${v};`).join('\n');
  return `${selector} {\n${props}\n}\n`;
}

function main() {
  console.log('[generate-theme-css] Reading theme YAML...');

  // 1. Global theme
  const globalTheme = loadYaml(resolve(ROOT, 'config/theme.yml'));
  if (!globalTheme) {
    console.error('[generate-theme-css] ERROR: config/theme.yml not found');
    process.exit(1);
  }

  const parts = [];

  // :root block (light + radius)
  const rootTokens = { ...globalTheme.light };
  if (globalTheme.radius) rootTokens['radius'] = globalTheme.radius;
  parts.push(renderBlock(':root', rootTokens));

  // .dark block
  parts.push(renderBlock('.dark', globalTheme.dark));

  // 2. Per-hackathon overrides
  const hackathonsDir = resolve(ROOT, 'hackathons');
  if (existsSync(hackathonsDir)) {
    const slugs = readdirSync(hackathonsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort();

    let hackathonCount = 0;
    for (const slug of slugs) {
      const themePath = resolve(hackathonsDir, slug, 'theme.yml');
      const theme = loadYaml(themePath);
      if (!theme) continue;

      hackathonCount++;
      if (theme.light) {
        parts.push(renderBlock(`[data-hackathon="${slug}"]`, theme.light));
      }
      if (theme.dark) {
        parts.push(renderBlock(`.dark [data-hackathon="${slug}"]`, theme.dark));
      }
    }
    console.log(`[generate-theme-css]   hackathon themes: ${hackathonCount}`);
  }

  // 3. Write output
  const header = '/* AUTO-GENERATED by scripts/generate-theme-css.mjs — DO NOT EDIT */\n\n';
  writeFileSync(OUTPUT, header + parts.join('\n'), 'utf8');
  console.log(`[generate-theme-css] Written to ${OUTPUT}`);
}

main();
```

**Step 2: Run the script**

Run: `node scripts/generate-theme-css.mjs`
Expected: Output file created at `packages/ui/src/styles/generated-themes.css` with `:root { ... }` and `.dark { ... }` blocks matching current CSS values.

**Step 3: Verify output matches current CSS**

Visually compare `generated-themes.css` `:root` block with `global.css` lines 40-69. All token values must be identical.

**Step 4: Commit**

```bash
git add scripts/generate-theme-css.mjs packages/ui/src/styles/generated-themes.css
git commit -m "feat: add generate-theme-css.mjs YAML-to-CSS compiler"
```

---

### Task 4: Migrate `global.css` to use generated CSS

**Files:**
- Modify: `packages/ui/src/styles/global.css` (lines 40-115 → delete, add @import)

**Step 1: Replace hardcoded tokens with @import**

The new `global.css` should be:

```css
@import "./generated-themes.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* shadcn standard semantic tokens */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  /* Synnovator brand extensions */
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  --color-highlight: var(--highlight);
  --color-highlight-foreground: var(--highlight-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);

  /* Radius */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: var(--secondary);
}
::-webkit-scrollbar-thumb {
  background: var(--muted-foreground);
  border-radius: 50px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--foreground);
}

/* Selection */
::selection {
  background-color: oklch(from var(--primary) l c h / 0.3);
  color: var(--foreground);
}
```

Key changes:
- Line 1: Added `@import "./generated-themes.css";`
- Deleted: `:root { ... }` block (lines 40-69)
- Deleted: `.dark { ... }` block (lines 71-97)
- Deleted: `[data-hackathon-type="..."]` blocks (lines 99-115)
- Everything else stays the same

**Step 2: Update prebuild in `apps/web/package.json`**

Change the `prebuild` script (line 7) from:
```json
"prebuild": "node scripts/generate-static-data.mjs"
```
to:
```json
"prebuild": "node scripts/generate-static-data.mjs && node ../../scripts/generate-theme-css.mjs"
```

Note: The generate-theme-css.mjs is at repo root `scripts/`, while generate-static-data.mjs is at `apps/web/scripts/`. The `../../` path is relative to `apps/web/`.

**Step 3: Verify the dev server still works**

Run: `pnpm dev` (it triggers prebuild which runs both scripts)
Expected: Dev server starts, pages render with same colors as before.

**Step 4: Verify build**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add packages/ui/src/styles/global.css apps/web/package.json
git commit -m "refactor(ui): migrate hardcoded CSS tokens to generated-themes.css"
```

---

### Task 5: Create hackathon theme.yml files

**Files:**
- Create: `hackathons/enterprise-fintech-risk-2025/theme.yml`
- Create: `hackathons/test-youth-hackathon/theme.yml`

**Step 1: Create enterprise hackathon theme**

Extract from the old `[data-hackathon-type="enterprise"]` CSS:

```yaml
# hackathons/enterprise-fintech-risk-2025/theme.yml
light:
  brand: "oklch(0.48 0.2 270)"
  brand-foreground: "oklch(0.98 0.005 80)"

dark:
  brand: "oklch(0.58 0.18 270)"
  brand-foreground: "oklch(0.16 0.008 60)"
```

**Step 2: Create youth-league hackathon theme**

Extract from old `[data-hackathon-type="youth-league"]` CSS:

```yaml
# hackathons/test-youth-hackathon/theme.yml
light:
  brand: "oklch(0.75 0.2 128)"
  brand-foreground: "oklch(0.15 0.01 70)"

dark:
  brand: "oklch(0.88 0.25 125)"
  brand-foreground: "oklch(0.16 0.008 60)"
```

**Step 3: Regenerate CSS and verify**

Run: `node scripts/generate-theme-css.mjs`
Expected: Output includes `[data-hackathon="enterprise-fintech-risk-2025"]` and `[data-hackathon="test-youth-hackathon"]` blocks.

**Step 4: Commit**

```bash
git add hackathons/enterprise-fintech-risk-2025/theme.yml hackathons/test-youth-hackathon/theme.yml
git commit -m "feat: add per-hackathon theme.yml for enterprise and youth-league"
```

---

### Task 6: Migrate `data-hackathon-type` → `data-hackathon`

**Files:**
- Modify: `apps/web/components/HackathonCard.tsx` (line 40)
- Modify: `apps/web/app/(public)/hackathons/[slug]/page.tsx` (line 78)

**Step 1: Update HackathonCard**

In `apps/web/components/HackathonCard.tsx` line 40, change:
```tsx
data-hackathon-type={hackathon.type}
```
to:
```tsx
data-hackathon={hackathon.slug}
```

**Step 2: Update hackathon detail page**

In `apps/web/app/(public)/hackathons/[slug]/page.tsx` line 78, change:
```tsx
data-hackathon-type={h.type}
```
to:
```tsx
data-hackathon={h.slug}
```

**Step 3: Search for any other usages**

Run: `grep -r "data-hackathon-type" apps/web/`
Expected: No matches (all migrated).

**Step 4: Verify in browser**

Open `http://localhost:3000/hackathons`. Enterprise and youth-league hackathon cards should display correct brand colors.

**Step 5: Commit**

```bash
git add apps/web/components/HackathonCard.tsx apps/web/app/\(public\)/hackathons/\[slug\]/page.tsx
git commit -m "refactor(web): migrate data-hackathon-type to data-hackathon for per-slug theming"
```

---

### Task 7: Update token-audit test

**Files:**
- Modify: `apps/web/__tests__/token-audit.test.ts`

**Step 1: Update the test**

The test at `apps/web/__tests__/token-audit.test.ts` should:
1. Keep existing deprecated token checks
2. Add check: `global.css` should NOT contain hardcoded `:root {` with oklch values (they belong in generated-themes.css now)
3. Add check: `data-hackathon-type` should not appear in app/ or components/ (migrated to `data-hackathon`)

Add to the `DEPRECATED_TOKENS` array:
```typescript
'data-hackathon-type',
```

**Step 2: Run the test**

Run: `pnpm --filter @synnovator/web test` (or however tests are run — check if vitest config exists in apps/web)

If no test runner in apps/web, run from shared: `pnpm --filter @synnovator/shared test`

Note: The token-audit test uses `grep -r` shell commands, so it runs anywhere.

**Step 3: Commit**

```bash
git add apps/web/__tests__/token-audit.test.ts
git commit -m "test(web): add data-hackathon-type to deprecated token audit"
```

---

### Task 8: Add i18n keys

**Files:**
- Modify: `packages/shared/src/i18n/zh.yml`
- Modify: `packages/shared/src/i18n/en.yml`

**Step 1: Add admin.theme keys**

In `zh.yml`, add in the `admin` section:
```yaml
admin.theme: "主题编辑"
admin.theme_global: "全局主题"
admin.theme_publish: "发布 PR"
admin.theme_publish_success: "PR 已创建"
admin.theme_inherited: "继承自全局"
admin.theme_override: "覆盖"
admin.theme_reset: "重置为继承"
admin.theme_colors: "颜色"
admin.theme_typography: "字体"
admin.theme_radius: "圆角"
admin.theme_preview_components: "组件预览"
admin.theme_preview_page: "页面预览"
admin.theme_contrast: "对比度"
admin.theme_contrast_pass: "通过 AA"
admin.theme_contrast_fail: "未达 AA"
```

In `en.yml`, add:
```yaml
admin.theme: "Theme Editor"
admin.theme_global: "Global Theme"
admin.theme_publish: "Publish PR"
admin.theme_publish_success: "PR Created"
admin.theme_inherited: "Inherited from global"
admin.theme_override: "Override"
admin.theme_reset: "Reset to inherited"
admin.theme_colors: "Colors"
admin.theme_typography: "Typography"
admin.theme_radius: "Radius"
admin.theme_preview_components: "Component Preview"
admin.theme_preview_page: "Page Preview"
admin.theme_contrast: "Contrast"
admin.theme_contrast_pass: "Passes AA"
admin.theme_contrast_fail: "Fails AA"
```

**Step 2: Regenerate i18n JSON** (if the project uses a yml-to-json step)

Check if there's a script. The i18n module at `packages/shared/src/i18n/index.ts` may read YAML or JSON directly. Verify.

**Step 3: Commit**

```bash
git add packages/shared/src/i18n/zh.yml packages/shared/src/i18n/en.yml
git commit -m "feat(shared): add i18n keys for theme editor"
```

---

## Phase 2: API

### Task 9: Theme API Route — GET

**Files:**
- Create: `apps/web/app/api/admin/theme/route.ts`

**Step 1: Create the GET handler**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import { getSession } from '@/lib/auth-helpers';

// Repo root (relative to apps/web at runtime — adjust if needed)
function repoRoot() {
  // In dev: cwd is monorepo root (turbo runs from root)
  // In build: data is pre-generated, this route only runs in dev
  return process.cwd();
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const target = request.nextUrl.searchParams.get('target') || 'global';
  const root = repoRoot();

  if (target === 'global') {
    const path = resolve(root, 'config/theme.yml');
    if (!existsSync(path)) {
      return NextResponse.json({ error: 'config/theme.yml not found' }, { status: 404 });
    }
    const data = yaml.load(readFileSync(path, 'utf8'));
    return NextResponse.json(data);
  }

  // Per-hackathon theme
  const globalPath = resolve(root, 'config/theme.yml');
  const hackathonPath = resolve(root, `hackathons/${target}/theme.yml`);

  const globalTheme = existsSync(globalPath)
    ? yaml.load(readFileSync(globalPath, 'utf8'))
    : null;

  const hackathonTheme = existsSync(hackathonPath)
    ? yaml.load(readFileSync(hackathonPath, 'utf8'))
    : { light: {}, dark: {} };

  return NextResponse.json({
    global: globalTheme,
    overrides: hackathonTheme,
  });
}
```

Note: Check how `getSession` is imported in the existing admin code. The layout uses `decrypt` from `@synnovator/shared/auth` with `cookies()`. You may need to replicate that pattern or create a helper. Check `apps/web/app/api/submit-pr/route.ts` for how it calls `getSession()` — it imports from `@synnovator/shared/auth`.

**Step 2: Verify route works**

Open: `http://localhost:3000/api/admin/theme?target=global` (must be logged in)
Expected: JSON with light/dark/fonts/radius from config/theme.yml

**Step 3: Commit**

```bash
git add apps/web/app/api/admin/theme/route.ts
git commit -m "feat(web): add GET /api/admin/theme route"
```

---

### Task 10: Theme API Route — POST

**Files:**
- Modify: `apps/web/app/api/admin/theme/route.ts`

**Step 1: Add POST handler**

Add to the same file. Reference `apps/web/app/api/submit-pr/route.ts` for the GitHub App PR creation pattern. Key imports: `getInstallationOctokit` from `@/lib/github-app`, `@octokit/rest`.

```typescript
import { themeSubmissionSchema } from '@synnovator/shared/schemas';
import { getInstallationOctokit } from '@/lib/github-app';
import * as yaml from 'js-yaml';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = themeSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { target, light, dark, fonts, radius, message } = parsed.data;

  // Build YAML content
  const themeData: Record<string, unknown> = { light, dark };
  if (target === 'global') {
    if (fonts) themeData.fonts = fonts;
    if (radius) themeData.radius = radius;
  }
  const yamlContent = yaml.dump(themeData, { lineWidth: -1 });

  // Determine file path in repo
  const filePath = target === 'global'
    ? 'config/theme.yml'
    : `hackathons/${target}/theme.yml`;

  // Create PR via GitHub App (follow submit-pr/route.ts pattern)
  const octokit = await getInstallationOctokit();
  const owner = process.env.GITHUB_OWNER || 'Synnovator';
  const repo = process.env.GITHUB_REPO || 'monorepo';

  // Get main branch SHA
  const { data: ref } = await octokit.rest.git.getRef({ owner, repo, ref: 'heads/main' });
  const baseSha = ref.object.sha;

  // Create branch
  const timestamp = Date.now();
  const branchName = `theme/${target}-${timestamp}`;
  await octokit.rest.git.createRef({
    owner, repo,
    ref: `refs/heads/${branchName}`,
    sha: baseSha,
  });

  // Check if file exists (for create vs update)
  let existingSha: string | undefined;
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner, repo, path: filePath, ref: branchName,
    });
    if (!Array.isArray(data) && data.type === 'file') {
      existingSha = data.sha;
    }
  } catch {
    // File doesn't exist yet — will create
  }

  // Create/update file
  await octokit.rest.repos.createOrUpdateFileContents({
    owner, repo, path: filePath, branch: branchName,
    message: `theme(${target}): update theme tokens`,
    content: Buffer.from(yamlContent).toString('base64'),
    ...(existingSha ? { sha: existingSha } : {}),
  });

  // Create PR
  const prTitle = target === 'global'
    ? 'theme(global): update platform theme'
    : `theme(${target}): update hackathon theme`;

  const { data: pr } = await octokit.rest.pulls.create({
    owner, repo,
    title: prTitle,
    body: message || `Theme update submitted via admin editor by @${session.login}`,
    head: branchName,
    base: 'main',
  });

  return NextResponse.json({ url: pr.html_url, number: pr.number });
}
```

**Step 2: Test manually**

Use the dev server — this requires GitHub App credentials. If not available in dev, verify the structure compiles and test with a mock later.

**Step 3: Commit**

```bash
git add apps/web/app/api/admin/theme/route.ts
git commit -m "feat(web): add POST /api/admin/theme route for PR creation"
```

---

## Phase 3: Editor UI

### Task 11: Admin sidebar + theme page shell

**Files:**
- Modify: `apps/web/components/admin/AdminSidebar.tsx` (line 12)
- Create: `apps/web/app/(admin)/admin/theme/page.tsx`
- Create: `apps/web/components/admin/theme/ThemeEditorPage.tsx`

**Step 1: Add Theme nav item**

In `AdminSidebar.tsx`, add to `navItems` array (after submissions):
```typescript
{ href: '/admin/theme', key: 'admin.theme' },
```

**Step 2: Create the page route**

```typescript
// apps/web/app/(admin)/admin/theme/page.tsx
import { ThemeEditorPage } from '@/components/admin/theme/ThemeEditorPage';

export default function ThemePage() {
  return <ThemeEditorPage />;
}
```

**Step 3: Create ThemeEditorPage shell**

```typescript
// apps/web/components/admin/theme/ThemeEditorPage.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TokenName } from '@synnovator/shared/schemas';

type ThemeMode = 'light' | 'dark';
type TokenMap = Partial<Record<TokenName, string>>;

interface ThemeState {
  light: TokenMap;
  dark: TokenMap;
  fonts?: { heading?: string; sans?: string; code?: string; zh?: string };
  radius?: string;
}

export function ThemeEditorPage() {
  const [target, setTarget] = useState<string>('global');
  const [mode, setMode] = useState<ThemeMode>('light');
  const [theme, setTheme] = useState<ThemeState | null>(null);
  const [globalTheme, setGlobalTheme] = useState<ThemeState | null>(null);
  const [loading, setLoading] = useState(true);

  // Load theme data
  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/theme?target=${target}`)
      .then(r => r.json())
      .then(data => {
        if (target === 'global') {
          setTheme(data);
          setGlobalTheme(data);
        } else {
          setGlobalTheme(data.global);
          setTheme(data.overrides || { light: {}, dark: {} });
        }
        setLoading(false);
      });
  }, [target]);

  // Apply preview: inject CSS variables into :root
  const applyPreview = useCallback((tokens: TokenMap) => {
    for (const [key, value] of Object.entries(tokens)) {
      if (value) document.documentElement.style.setProperty(`--${key}`, value);
    }
  }, []);

  useEffect(() => {
    if (!theme) return;
    const tokens = mode === 'light' ? theme.light : theme.dark;
    if (tokens) applyPreview(tokens);
  }, [theme, mode, applyPreview]);

  // Clean up injected styles on unmount
  useEffect(() => {
    return () => {
      const root = document.documentElement;
      for (let i = root.style.length - 1; i >= 0; i--) {
        const prop = root.style[i];
        if (prop.startsWith('--')) root.style.removeProperty(prop);
      }
    };
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 border-b border-border">
        {/* ThemeSelector, mode toggle, publish button will go here */}
        <span className="text-sm text-muted-foreground">Theme Editor — {target}</span>
      </div>

      {/* Main area: editor + preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Token editor */}
        <div className="w-80 border-r border-border overflow-y-auto p-4">
          <p className="text-sm text-muted-foreground">Editor panel (TODO)</p>
        </div>

        {/* Right: Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-muted-foreground">Preview panel (TODO)</p>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Verify in browser**

Open: `http://localhost:3000/admin/theme`
Expected: Theme Editor page loads with toolbar, left editor panel, right preview panel placeholders. AdminSidebar shows "Theme" link.

**Step 5: Commit**

```bash
git add apps/web/components/admin/AdminSidebar.tsx apps/web/app/\(admin\)/admin/theme/page.tsx apps/web/components/admin/theme/ThemeEditorPage.tsx
git commit -m "feat(web): add theme editor page shell with sidebar nav"
```

---

### Task 12: ThemeSelector component

**Files:**
- Create: `apps/web/components/admin/theme/ThemeSelector.tsx`
- Modify: `apps/web/components/admin/theme/ThemeEditorPage.tsx`

**Step 1: Create ThemeSelector**

This component needs a list of hackathon slugs. Fetch them from the static data or hardcode the API. For now, use the generated static data.

```typescript
// apps/web/components/admin/theme/ThemeSelector.tsx
'use client';

import { useEffect, useState } from 'react';

interface ThemeSelectorProps {
  value: string;
  onChange: (target: string) => void;
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const [hackathons, setHackathons] = useState<{ slug: string; name: string }[]>([]);

  useEffect(() => {
    // Load hackathon list from static data
    import('@/app/_generated/static-data.json').then(mod => {
      const data = mod.default || mod;
      setHackathons(
        (data.hackathons || []).map((h: { slug: string; name: string }) => ({
          slug: h.slug,
          name: h.name,
        }))
      );
    });
  }, []);

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
    >
      <option value="global">Global Theme</option>
      <optgroup label="Hackathons">
        {hackathons.map(h => (
          <option key={h.slug} value={h.slug}>{h.name}</option>
        ))}
      </optgroup>
    </select>
  );
}
```

**Step 2: Wire into ThemeEditorPage**

Replace the toolbar placeholder span with:
```tsx
<ThemeSelector value={target} onChange={setTarget} />
```

Import it at the top.

**Step 3: Verify in browser**

Dropdown should show "Global Theme" + all hackathon names.

**Step 4: Commit**

```bash
git add apps/web/components/admin/theme/ThemeSelector.tsx apps/web/components/admin/theme/ThemeEditorPage.tsx
git commit -m "feat(web): add ThemeSelector dropdown for global/per-hackathon"
```

---

### Task 13: OKLCH color utilities

**Files:**
- Create: `apps/web/lib/oklch.ts`

**Step 1: Create OKLCH parsing and conversion utilities**

The editor needs to parse `oklch(L C H)` strings, convert to/from hex for display, and compute WCAG contrast ratios. This is a pure utility module.

```typescript
// apps/web/lib/oklch.ts

export interface OklchColor {
  l: number; // 0-1
  c: number; // 0-0.4
  h: number; // 0-360
  alpha?: number; // 0-1
}

/** Parse "oklch(0.55 0.2 35)" → { l: 0.55, c: 0.2, h: 35 } */
export function parseOklch(str: string): OklchColor | null {
  const match = str.match(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)%?\s*)?\)/
  );
  if (!match) return null;
  const alpha = match[4] != null
    ? (match[4].endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4]))
    : undefined;
  return {
    l: parseFloat(match[1]),
    c: parseFloat(match[2]),
    h: parseFloat(match[3]),
    ...(alpha != null ? { alpha } : {}),
  };
}

/** Format OklchColor back to CSS string */
export function formatOklch(color: OklchColor): string {
  const base = `oklch(${color.l} ${color.c} ${color.h})`;
  if (color.alpha != null && color.alpha < 1) {
    return `oklch(${color.l} ${color.c} ${color.h} / ${Math.round(color.alpha * 100)}%)`;
  }
  return base;
}

/**
 * Approximate OKLCH → sRGB → relative luminance for WCAG contrast.
 * Uses the browser's CSS color parsing via a temporary canvas.
 * This runs client-side only.
 */
export function oklchToHex(str: string): string {
  if (typeof document === 'undefined') return '#000000';
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '#000000';
  ctx.fillStyle = str;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** Relative luminance from sRGB 0-255 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** WCAG contrast ratio between two oklch() CSS strings */
export function contrastRatio(color1: string, color2: string): number {
  if (typeof document === 'undefined') return 1;
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 1;

  ctx.fillStyle = color1;
  ctx.fillRect(0, 0, 1, 1);
  const [r1, g1, b1] = ctx.getImageData(0, 0, 1, 1).data;

  ctx.fillStyle = color2;
  ctx.fillRect(1, 0, 1, 1);
  const [r2, g2, b2] = ctx.getImageData(1, 0, 1, 1).data;

  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
```

**Step 2: Commit**

```bash
git add apps/web/lib/oklch.ts
git commit -m "feat(web): add OKLCH parsing, formatting, and contrast utilities"
```

---

### Task 14: ColorTokenEditor component

**Files:**
- Create: `apps/web/components/admin/theme/ColorTokenEditor.tsx`

**Step 1: Build the OKLCH editor**

This is the core UI component — an OKLCH color picker with L/C/H sliders and hex preview.

```typescript
// apps/web/components/admin/theme/ColorTokenEditor.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { parseOklch, formatOklch, oklchToHex, type OklchColor } from '@/lib/oklch';

interface ColorTokenEditorProps {
  name: string;
  value: string;
  inherited?: boolean;
  onChange: (name: string, value: string) => void;
  onOverride?: (name: string) => void;
  onReset?: (name: string) => void;
}

export function ColorTokenEditor({
  name,
  value,
  inherited,
  onChange,
  onOverride,
  onReset,
}: ColorTokenEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const [color, setColor] = useState<OklchColor | null>(null);
  const [hex, setHex] = useState('#000000');

  useEffect(() => {
    const parsed = parseOklch(value);
    setColor(parsed);
    setHex(oklchToHex(value));
  }, [value]);

  const handleChange = useCallback(
    (field: keyof OklchColor, val: number) => {
      if (!color) return;
      const updated = { ...color, [field]: val };
      setColor(updated);
      const css = formatOklch(updated);
      onChange(name, css);
      setHex(oklchToHex(css));
    },
    [color, name, onChange]
  );

  return (
    <div className={`border border-border rounded-md ${inherited ? 'opacity-60' : ''}`}>
      {/* Token header: swatch + name + value */}
      <button
        onClick={() => {
          if (inherited && onOverride) {
            onOverride(name);
          }
          setExpanded(!expanded);
        }}
        className="flex items-center gap-3 w-full p-3 text-left hover:bg-muted/50 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-md border border-border shrink-0"
          style={{ backgroundColor: value }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">{name}</div>
          <div className="text-xs text-muted-foreground font-mono truncate">{value}</div>
        </div>
        <div
          className="w-6 h-6 rounded border border-border shrink-0"
          style={{ backgroundColor: hex }}
          title={hex}
        />
      </button>

      {/* Expanded editor: L/C/H sliders */}
      {expanded && color && (
        <div className="p-3 pt-0 space-y-3 border-t border-border">
          {inherited && onReset && (
            <button
              onClick={() => onReset(name)}
              className="text-xs text-destructive hover:underline"
            >
              Reset to inherited
            </button>
          )}

          {/* Lightness */}
          <label className="block">
            <span className="text-xs text-muted-foreground">L (Lightness): {color.l.toFixed(3)}</span>
            <input
              type="range"
              min={0} max={1} step={0.005}
              value={color.l}
              onChange={e => handleChange('l', parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
          </label>

          {/* Chroma */}
          <label className="block">
            <span className="text-xs text-muted-foreground">C (Chroma): {color.c.toFixed(3)}</span>
            <input
              type="range"
              min={0} max={0.4} step={0.005}
              value={color.c}
              onChange={e => handleChange('c', parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
          </label>

          {/* Hue */}
          <label className="block">
            <span className="text-xs text-muted-foreground">H (Hue): {color.h.toFixed(1)}</span>
            <input
              type="range"
              min={0} max={360} step={1}
              value={color.h}
              onChange={e => handleChange('h', parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
          </label>

          {/* Hex preview */}
          <div className="text-xs text-muted-foreground font-mono">hex: {hex}</div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/admin/theme/ColorTokenEditor.tsx
git commit -m "feat(web): add ColorTokenEditor with OKLCH L/C/H sliders"
```

---

### Task 15: TokenGroup + wire editor panel

**Files:**
- Create: `apps/web/components/admin/theme/TokenGroup.tsx`
- Modify: `apps/web/components/admin/theme/ThemeEditorPage.tsx`

**Step 1: Create TokenGroup**

Groups tokens by category for the editor sidebar.

```typescript
// apps/web/components/admin/theme/TokenGroup.tsx
'use client';

import { ColorTokenEditor } from './ColorTokenEditor';

interface TokenGroupProps {
  label: string;
  tokens: { name: string; value: string; inherited?: boolean }[];
  onChange: (name: string, value: string) => void;
  onOverride?: (name: string) => void;
  onReset?: (name: string) => void;
}

const TOKEN_GROUPS: Record<string, string[]> = {
  'Surfaces': ['background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground'],
  'Primary': ['primary', 'primary-foreground', 'secondary', 'secondary-foreground'],
  'Muted': ['muted', 'muted-foreground', 'accent', 'accent-foreground'],
  'Status': ['destructive', 'destructive-foreground'],
  'Borders': ['border', 'input', 'ring'],
  'Brand': ['brand', 'brand-foreground', 'highlight', 'highlight-foreground', 'info', 'info-foreground'],
};

export { TOKEN_GROUPS };

export function TokenGroup({ label, tokens, onChange, onOverride, onReset }: TokenGroupProps) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{label}</h3>
      <div className="space-y-1">
        {tokens.map(t => (
          <ColorTokenEditor
            key={t.name}
            name={t.name}
            value={t.value}
            inherited={t.inherited}
            onChange={onChange}
            onOverride={onOverride}
            onReset={onReset}
          />
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Wire into ThemeEditorPage**

Replace the left editor panel placeholder with actual TokenGroup components. Update `ThemeEditorPage.tsx` to:
1. Import `TokenGroup` and `TOKEN_GROUPS`
2. Build token list from current theme state
3. For hackathon targets, mark inherited tokens
4. Handle `onChange` to update theme state and apply preview

This is the largest integration step — implement the full left panel with all token groups, mode toggle, and live preview wiring.

**Step 3: Verify in browser**

Navigate to `/admin/theme`. Should see token groups with color swatches. Clicking a token should expand L/C/H sliders. Moving sliders should update the preview (entire page colors change in real time).

**Step 4: Commit**

```bash
git add apps/web/components/admin/theme/TokenGroup.tsx apps/web/components/admin/theme/ThemeEditorPage.tsx
git commit -m "feat(web): wire TokenGroup editor panel with live preview"
```

---

### Task 16: ComponentPreview

**Files:**
- Create: `apps/web/components/admin/theme/ComponentPreview.tsx`

**Step 1: Build component preview**

Renders a grid of shadcn/ui components showing how tokens affect the UI.

```typescript
// apps/web/components/admin/theme/ComponentPreview.tsx
'use client';

import { Button } from '@synnovator/ui/components/button';
import { Badge } from '@synnovator/ui/components/badge';
import { Input } from '@synnovator/ui/components/input';

export function ComponentPreview() {
  return (
    <div className="space-y-8">
      {/* Buttons */}
      <section>
        <h3 className="text-sm font-medium text-foreground mb-3">Buttons</h3>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>

      {/* Badges */}
      <section>
        <h3 className="text-sm font-medium text-foreground mb-3">Badges</h3>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-brand/20 text-brand">Brand</span>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-highlight/20 text-highlight-foreground">Highlight</span>
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-info/20 text-info">Info</span>
        </div>
      </section>

      {/* Cards */}
      <section>
        <h3 className="text-sm font-medium text-foreground mb-3">Cards</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-heading text-foreground">Card Title</h4>
            <p className="text-sm text-muted-foreground mt-1">Card description with muted text.</p>
            <Button size="sm" className="mt-3">Action</Button>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-heading text-foreground">Muted Card</h4>
            <p className="text-sm text-muted-foreground mt-1">On muted background.</p>
          </div>
        </div>
      </section>

      {/* Inputs */}
      <section>
        <h3 className="text-sm font-medium text-foreground mb-3">Inputs</h3>
        <div className="space-y-3 max-w-sm">
          <Input placeholder="Text input..." />
          <Input placeholder="Disabled" disabled />
        </div>
      </section>

      {/* Color swatches */}
      <section>
        <h3 className="text-sm font-medium text-foreground mb-3">Color Palette</h3>
        <div className="grid grid-cols-6 gap-2">
          {['primary', 'brand', 'highlight', 'info', 'destructive', 'muted'].map(c => (
            <div key={c} className="text-center">
              <div className={`h-12 rounded-md bg-${c} mb-1`} />
              <span className="text-xs text-muted-foreground">{c}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

Note: The `bg-${c}` dynamic classes won't work with Tailwind's purge. Instead, use inline `style={{ backgroundColor: 'var(--primary)' }}` etc. Fix this during implementation.

**Step 2: Commit**

```bash
git add apps/web/components/admin/theme/ComponentPreview.tsx
git commit -m "feat(web): add ComponentPreview for theme editor"
```

---

### Task 17: PagePreview

**Files:**
- Create: `apps/web/components/admin/theme/PagePreview.tsx`

**Step 1: Build page preview**

Renders simplified versions of real Synnovator page sections.

```typescript
// apps/web/components/admin/theme/PagePreview.tsx
'use client';

import { Button } from '@synnovator/ui/components/button';
import { Badge } from '@synnovator/ui/components/badge';

export function PagePreview() {
  return (
    <div className="space-y-12">
      {/* Hero section mock */}
      <section className="text-center py-12">
        <Badge className="mb-4">Hackathon Platform</Badge>
        <h1 className="text-4xl font-heading text-foreground mb-4">
          Build the Future with AI
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-6">
          Join developers worldwide in creating innovative solutions.
        </p>
        <div className="flex gap-3 justify-center">
          <Button size="lg">Browse Hackathons</Button>
          <Button size="lg" variant="outline">Learn More</Button>
        </div>
      </section>

      <hr className="border-border" />

      {/* Hackathon cards mock */}
      <section>
        <h2 className="text-2xl font-heading text-foreground mb-6">Active Hackathons</h2>
        <div className="grid grid-cols-2 gap-6">
          {/* Community card */}
          <div className="bg-card border border-border rounded-xl border-t-3 border-t-brand p-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-brand/20 text-brand">Registration</Badge>
            </div>
            <h3 className="font-heading text-foreground text-lg">Community Hack 2026</h3>
            <p className="text-sm text-muted-foreground mt-1">Open innovation challenge for all.</p>
          </div>

          {/* Enterprise card */}
          <div className="bg-card border border-border rounded-sm border-l-3 border-l-info p-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-info/20 text-info">Development</Badge>
            </div>
            <h3 className="font-heading text-foreground text-lg">Enterprise FinTech 2025</h3>
            <p className="text-sm text-muted-foreground mt-1">Financial technology risk solutions.</p>
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* Detail page mock */}
      <section>
        <h2 className="text-2xl font-heading text-foreground mb-4">Hackathon Detail</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Badge>Track 1</Badge>
            <Badge variant="secondary">Track 2</Badge>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-heading text-foreground">About This Event</h3>
            <p className="text-muted-foreground mt-2">
              A detailed description paragraph showing body text styling with muted foreground color
              on a card background surface.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="text-sm bg-highlight/10 text-highlight-foreground px-2 py-1 rounded">AI/ML</span>
              <span className="text-sm bg-info/10 text-info px-2 py-1 rounded">Blockchain</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/admin/theme/PagePreview.tsx
git commit -m "feat(web): add PagePreview with Hero, HackathonCard, and Detail mocks"
```

---

### Task 18: PreviewPanel (container with tab switch)

**Files:**
- Create: `apps/web/components/admin/theme/PreviewPanel.tsx`
- Modify: `apps/web/components/admin/theme/ThemeEditorPage.tsx`

**Step 1: Create PreviewPanel**

```typescript
// apps/web/components/admin/theme/PreviewPanel.tsx
'use client';

import { useState } from 'react';
import { ComponentPreview } from './ComponentPreview';
import { PagePreview } from './PagePreview';

export function PreviewPanel() {
  const [tab, setTab] = useState<'components' | 'page'>('components');

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-border">
        <button
          onClick={() => setTab('components')}
          className={`px-4 py-2 text-sm transition-colors border-b-2 ${
            tab === 'components'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Components
        </button>
        <button
          onClick={() => setTab('page')}
          className={`px-4 py-2 text-sm transition-colors border-b-2 ${
            tab === 'page'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Page Preview
        </button>
      </div>

      {tab === 'components' ? <ComponentPreview /> : <PagePreview />}
    </div>
  );
}
```

**Step 2: Wire into ThemeEditorPage**

Replace the right preview panel placeholder with `<PreviewPanel />`.

**Step 3: Verify in browser**

Tab switching between Components and Page Preview should work. Both should respond to token changes from the editor.

**Step 4: Commit**

```bash
git add apps/web/components/admin/theme/PreviewPanel.tsx apps/web/components/admin/theme/ThemeEditorPage.tsx
git commit -m "feat(web): add PreviewPanel with component/page tab switching"
```

---

### Task 19: ContrastChecker

**Files:**
- Create: `apps/web/components/admin/theme/ContrastChecker.tsx`
- Modify: `apps/web/components/admin/theme/ThemeEditorPage.tsx`

**Step 1: Build ContrastChecker**

Displays WCAG contrast ratios for key token pairs.

```typescript
// apps/web/components/admin/theme/ContrastChecker.tsx
'use client';

import { useMemo } from 'react';
import { contrastRatio } from '@/lib/oklch';

interface ContrastCheckerProps {
  tokens: Record<string, string>;
}

const PAIRS: [string, string, string][] = [
  ['foreground', 'background', 'Text on Background'],
  ['primary-foreground', 'primary', 'Text on Primary'],
  ['card-foreground', 'card', 'Text on Card'],
  ['muted-foreground', 'background', 'Muted on Background'],
  ['brand-foreground', 'brand', 'Text on Brand'],
  ['destructive-foreground', 'destructive', 'Text on Destructive'],
];

export function ContrastChecker({ tokens }: ContrastCheckerProps) {
  const results = useMemo(() => {
    return PAIRS.map(([fg, bg, label]) => {
      const fgVal = tokens[fg];
      const bgVal = tokens[bg];
      if (!fgVal || !bgVal) return { label, ratio: 0, pass: false };
      const ratio = contrastRatio(fgVal, bgVal);
      return { label, ratio, pass: ratio >= 4.5 };
    });
  }, [tokens]);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Contrast (WCAG AA)
      </h3>
      {results.map(r => (
        <div key={r.label} className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{r.label}</span>
          <span className={r.pass ? 'text-highlight-foreground' : 'text-destructive'}>
            {r.ratio.toFixed(2)}:1 {r.pass ? '✓' : '✗'}
          </span>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Wire into ThemeEditorPage**

Add `<ContrastChecker tokens={...} />` at the bottom of the left editor panel, below the token groups.

**Step 3: Verify in browser**

Contrast ratios should update as tokens are edited. Red for failing, green for passing.

**Step 4: Commit**

```bash
git add apps/web/components/admin/theme/ContrastChecker.tsx apps/web/components/admin/theme/ThemeEditorPage.tsx
git commit -m "feat(web): add ContrastChecker with WCAG AA validation"
```

---

### Task 20: PublishButton

**Files:**
- Create: `apps/web/components/admin/theme/PublishButton.tsx`
- Modify: `apps/web/components/admin/theme/ThemeEditorPage.tsx`

**Step 1: Build PublishButton**

```typescript
// apps/web/components/admin/theme/PublishButton.tsx
'use client';

import { useState } from 'react';
import { Button } from '@synnovator/ui/components/button';

interface PublishButtonProps {
  target: string;
  theme: {
    light: Record<string, string>;
    dark: Record<string, string>;
    fonts?: Record<string, string>;
    radius?: string;
  };
}

export function PublishButton({ target, theme }: PublishButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, ...theme }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create PR');
      }
      setPrUrl(data.url);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  }

  if (status === 'success' && prUrl) {
    return (
      <a
        href={prUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary hover:underline"
      >
        PR Created →
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={handlePublish}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Creating PR...' : 'Publish PR'}
      </Button>
      {status === 'error' && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
}
```

**Step 2: Wire into ThemeEditorPage toolbar**

Add `<PublishButton target={target} theme={theme} />` in the toolbar, next to the mode toggle.

**Step 3: Verify in browser**

Button should show in toolbar. Clicking creates a PR (requires GitHub App credentials in dev). Without credentials, should show error gracefully.

**Step 4: Commit**

```bash
git add apps/web/components/admin/theme/PublishButton.tsx apps/web/components/admin/theme/ThemeEditorPage.tsx
git commit -m "feat(web): add PublishButton for PR-based theme publishing"
```

---

## Phase 4: Integration & Polish

### Task 21: Light/Dark mode toggle in editor

**Files:**
- Modify: `apps/web/components/admin/theme/ThemeEditorPage.tsx`

**Step 1: Add mode toggle to toolbar**

Add a light/dark toggle button in the toolbar that:
1. Switches between editing light vs dark token values
2. Toggles the preview panel's theme mode via `document.documentElement.classList.toggle('dark')`
3. Shows which mode is being edited

Use a simple button with sun/moon icons (or text labels).

**Step 2: Verify**

Switching modes should:
- Change the editor panel to show light/dark token values
- Toggle the preview panel between light and dark mode
- Live preview should reflect the current mode's tokens

**Step 3: Commit**

```bash
git add apps/web/components/admin/theme/ThemeEditorPage.tsx
git commit -m "feat(web): add light/dark mode toggle in theme editor"
```

---

### Task 22: Full integration test

**Step 1: Run prebuild**

Run: `node scripts/generate-theme-css.mjs`
Expected: `generated-themes.css` contains `:root`, `.dark`, and per-hackathon blocks.

**Step 2: Run dev server**

Run: `pnpm dev`
Expected: Server starts, pages render correctly.

**Step 3: Manual browser test checklist**

- [ ] `http://localhost:3000` — homepage renders with correct colors
- [ ] `http://localhost:3000/hackathons` — cards show correct brand colors per hackathon
- [ ] `http://localhost:3000/admin/theme` — editor loads, shows token groups
- [ ] Edit a token → preview updates in real time
- [ ] Switch light/dark → editor and preview toggle
- [ ] Select a hackathon → shows override vs inherited tokens
- [ ] Tab between Component Preview and Page Preview
- [ ] Contrast checker updates as tokens change

**Step 4: Run build**

Run: `pnpm --filter @synnovator/web build`
Expected: Build succeeds with no errors.

**Step 5: Run existing tests**

Run: `pnpm --filter @synnovator/shared test`
Expected: All tests pass.

**Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix(web): integration fixes for theme editor"
```

---

### Task 23: Visual audit

**Step 1: Run `/audit` skill**

Use the `/audit` skill to perform a comprehensive visual audit of `/admin/theme`, covering:
- Accessibility (WCAG AA contrast, keyboard navigation, focus visibility)
- Responsive design (editor usability at different screen sizes)
- Theme consistency (editor itself uses design tokens correctly)
- Performance (real-time preview rendering)

**Step 2: Fix audit findings**

Address any issues identified by the audit.

**Step 3: Commit fixes**

```bash
git add -A
git commit -m "fix(web): address audit findings for theme editor"
```

---

## Summary

| Phase | Tasks | Commits |
|-------|-------|---------|
| 1: Data Foundation | Tasks 1-8 | Schema, YAML, build script, CSS migration, hackathon themes, data-attr migration, tests, i18n |
| 2: API | Tasks 9-10 | GET/POST /api/admin/theme |
| 3: Editor UI | Tasks 11-20 | Page shell, selector, OKLCH utils, color editor, token groups, previews, contrast, publish, mode toggle |
| 4: Integration | Tasks 21-23 | Full test, build validation, visual audit |
