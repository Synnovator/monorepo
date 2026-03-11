# Theme System Restructuring — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the single-global-theme system into named platform themes with optional per-hackathon variants, redesign the selector UI with `@synnovator/ui` components, add an "Activate Theme" action, and bundle 7 preset themes.

**Architecture:** Two-tier theme hierarchy: Platform Themes (`config/themes/{name}.yml`) as the primary concept, Hackathon Variants (`hackathons/{slug}/themes/{theme-name}.yml`) as partial overrides scoped under a platform theme. Active theme tracked in `config/themes/.active`. CSS generated with `[data-theme]` selectors for non-active themes and `[data-hackathon]` for variants.

**Tech Stack:** TypeScript, Zod, Next.js App Router, OKLCH CSS custom properties, `@synnovator/ui` (Select, Button, Dialog), `js-yaml`, `@octokit/rest`

---

## Phase 1: Schema + File Migration

### Task 1: Extend Zod Schemas

**Files:**
- Modify: `packages/shared/src/schemas/theme.ts`

**Step 1: Add `platformThemeSchema` and `platformThemeSubmissionSchema`**

Add after the existing `themeConfigSchema` (line 91):

```typescript
// === Platform Theme Schema (full theme + metadata) ===

export const platformThemeSchema = z.object({
  name: z.string().min(1),
  name_zh: z.string().optional(),
  description: z.string().optional(),
  light: fullTokenMapSchema,
  dark: fullTokenMapSchema,
  fonts: z
    .object({
      heading: z.string().optional(),
      sans: z.string().optional(),
      code: z.string().optional(),
      zh: z.string().optional(),
    })
    .optional(),
  radius: z.string().optional(),
});

export type PlatformTheme = z.infer<typeof platformThemeSchema>;

// === Platform Theme Meta (for listing) ===

export const platformThemeMetaSchema = z.object({
  id: z.string(),
  name: z.string(),
  name_zh: z.string().optional(),
  active: z.boolean(),
});

export type PlatformThemeMeta = z.infer<typeof platformThemeMetaSchema>;
```

Replace `themeSubmissionSchema` (lines 106-120) with:

```typescript
// === Theme Submission Schema (POST body) ===

export const themeSubmissionSchema = z.object({
  type: z.enum(['platform', 'hackathon-variant', 'activate']),
  themeName: z.string().min(1),
  hackathonSlug: z.string().optional(),
  name: z.string().optional(),
  name_zh: z.string().optional(),
  description: z.string().optional(),
  light: tokenMapSchema.optional(),
  dark: tokenMapSchema.optional(),
  fonts: z
    .object({
      heading: z.string().optional(),
      sans: z.string().optional(),
      code: z.string().optional(),
      zh: z.string().optional(),
    })
    .optional(),
  radius: z.string().optional(),
  message: z.string().optional(),
});

export type ThemeSubmission = z.infer<typeof themeSubmissionSchema>;
```

**Step 2: Verify types compile**

Run: `pnpm exec tsc --noEmit --project packages/shared/tsconfig.json`
Expected: no errors

**Step 3: Commit**

```bash
git add packages/shared/src/schemas/theme.ts
git commit -m "feat(shared): add platformThemeSchema and update themeSubmissionSchema"
```

---

### Task 2: Create `config/themes/` Directory and Migrate warm-orange

**Files:**
- Create: `config/themes/.active`
- Create: `config/themes/warm-orange.yml`

**Step 1: Create `.active` file**

Contents: `warm-orange` (just the slug, no newline at end)

**Step 2: Create `warm-orange.yml` from existing `config/theme.yml`**

Add metadata fields at the top, keep all existing light/dark/fonts/radius data:

```yaml
name: "Warm Orange"
name_zh: "暖橙"
description: "Synnovator default theme with warm orange brand"

light:
  background: "oklch(0.98 0.005 80)"
  foreground: "oklch(0.15 0.01 70)"
  card: "oklch(1 0.003 80)"
  card-foreground: "oklch(0.15 0.01 70)"
  popover: "oklch(1 0.003 80)"
  popover-foreground: "oklch(0.15 0.01 70)"
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
  border: "oklch(0.92 0.005 75)"
  input: "oklch(0.92 0.005 75)"
  ring: "oklch(0.55 0.2 35)"
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

**Step 3: Commit**

```bash
git add config/themes/.active config/themes/warm-orange.yml
git commit -m "feat: create config/themes/ with warm-orange migrated from config/theme.yml"
```

---

### Task 3: Migrate Hackathon Theme Overrides

**Files:**
- Create: `hackathons/enterprise-fintech-risk-2025/themes/warm-orange.yml`
- Create: `hackathons/test-youth-hackathon/themes/warm-orange.yml`
- Delete: `hackathons/enterprise-fintech-risk-2025/theme.yml` (after migration)
- Delete: `hackathons/test-youth-hackathon/theme.yml` (after migration)

**Step 1: Create hackathon variant files**

`hackathons/enterprise-fintech-risk-2025/themes/warm-orange.yml`:
```yaml
light:
  brand: "oklch(0.48 0.2 270)"
  brand-foreground: "oklch(0.98 0.005 80)"

dark:
  brand: "oklch(0.58 0.18 270)"
  brand-foreground: "oklch(0.16 0.008 60)"
```

`hackathons/test-youth-hackathon/themes/warm-orange.yml`:
```yaml
light:
  brand: "oklch(0.75 0.2 128)"
  brand-foreground: "oklch(0.15 0.01 70)"

dark:
  brand: "oklch(0.88 0.25 125)"
  brand-foreground: "oklch(0.16 0.008 60)"
```

**Step 2: Delete old theme files**

```bash
rm hackathons/enterprise-fintech-risk-2025/theme.yml
rm hackathons/test-youth-hackathon/theme.yml
```

**Step 3: Commit**

```bash
git add hackathons/enterprise-fintech-risk-2025/themes/warm-orange.yml \
        hackathons/test-youth-hackathon/themes/warm-orange.yml \
        hackathons/enterprise-fintech-risk-2025/theme.yml \
        hackathons/test-youth-hackathon/theme.yml
git commit -m "feat: migrate hackathon theme overrides to themes/{theme-name}.yml structure"
```

---

## Phase 2: CSS Generation

### Task 4: Rewrite `scripts/generate-theme-css.mjs`

**Files:**
- Modify: `scripts/generate-theme-css.mjs`

**Step 1: Rewrite the script**

Complete replacement:

```javascript
#!/usr/bin/env node
/**
 * generate-theme-css.mjs
 *
 * Reads config/themes/*.yml (platform themes) and hackathons/<slug>/themes/*.yml
 * (per-hackathon variants), then generates packages/ui/src/styles/generated-themes.css
 * with multi-theme CSS using [data-theme] selectors.
 *
 * Run: node scripts/generate-theme-css.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const THEMES_DIR = path.join(ROOT, 'config/themes');
const ACTIVE_FILE = path.join(THEMES_DIR, '.active');
const HACKATHONS_DIR = path.join(ROOT, 'hackathons');
const OUT_FILE = path.join(ROOT, 'packages/ui/src/styles/generated-themes.css');

// Metadata fields to strip from YAML when generating CSS
const META_FIELDS = ['name', 'name_zh', 'description'];

function renderTokens(tokens, indent = '  ') {
  return Object.entries(tokens)
    .map(([key, value]) => `${indent}--${key}: ${value};`)
    .join('\n');
}

function readYamlFile(filePath) {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, 'utf-8');
  return yaml.load(content);
}

function main() {
  console.log('[generate-theme-css] Reading theme configs...');

  // 1. Read active theme slug
  if (!existsSync(ACTIVE_FILE)) {
    console.error(`[generate-theme-css] ERROR: ${ACTIVE_FILE} not found`);
    process.exit(1);
  }
  const activeTheme = readFileSync(ACTIVE_FILE, 'utf-8').trim();
  console.log(`  active theme: ${activeTheme}`);

  // 2. Scan platform themes
  const themeFiles = readdirSync(THEMES_DIR)
    .filter((f) => f.endsWith('.yml'))
    .sort();

  if (themeFiles.length === 0) {
    console.error('[generate-theme-css] ERROR: No theme files found in config/themes/');
    process.exit(1);
  }

  const themes = new Map();
  for (const file of themeFiles) {
    const slug = file.replace(/\.yml$/, '');
    const data = readYamlFile(path.join(THEMES_DIR, file));
    if (data) {
      // Strip metadata fields
      for (const field of META_FIELDS) delete data[field];
      themes.set(slug, data);
    }
  }

  console.log(`  platform themes: ${[...themes.keys()].join(', ')}`);

  const lines = [];
  lines.push('/* AUTO-GENERATED — DO NOT EDIT */');
  lines.push('/* Generated by scripts/generate-theme-css.mjs from config/themes/ */');
  lines.push('');

  // 3. Generate CSS for active theme → :root / .dark
  const activeData = themes.get(activeTheme);
  if (!activeData) {
    console.error(`[generate-theme-css] ERROR: Active theme "${activeTheme}" not found`);
    process.exit(1);
  }

  lines.push(`/* === Active Theme: ${activeTheme} === */`);
  lines.push(':root {');
  if (activeData.radius) {
    lines.push(`  --radius: ${activeData.radius};`);
  }
  if (activeData.fonts) {
    for (const [key, value] of Object.entries(activeData.fonts)) {
      lines.push(`  --font-${key}: ${value};`);
    }
  }
  if (activeData.light) {
    lines.push('');
    lines.push(renderTokens(activeData.light));
  }
  lines.push('}');
  lines.push('');

  if (activeData.dark) {
    lines.push('.dark {');
    lines.push(renderTokens(activeData.dark));
    lines.push('}');
    lines.push('');
  }

  // 4. Generate CSS for other platform themes → [data-theme="slug"]
  for (const [slug, data] of themes) {
    if (slug === activeTheme) continue;

    lines.push(`/* === Platform Theme: ${slug} === */`);
    if (data.light) {
      lines.push(`[data-theme="${slug}"] {`);
      if (data.radius) {
        lines.push(`  --radius: ${data.radius};`);
      }
      if (data.fonts) {
        for (const [key, value] of Object.entries(data.fonts)) {
          lines.push(`  --font-${key}: ${value};`);
        }
      }
      lines.push(renderTokens(data.light));
      lines.push('}');
    }
    if (data.dark) {
      lines.push(`.dark[data-theme="${slug}"] {`);
      lines.push(renderTokens(data.dark));
      lines.push('}');
    }
    lines.push('');
  }

  // 5. Scan hackathon variants
  let variantCount = 0;
  if (existsSync(HACKATHONS_DIR)) {
    const hackathonDirs = readdirSync(HACKATHONS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    for (const hackathonSlug of hackathonDirs) {
      const variantsDir = path.join(HACKATHONS_DIR, hackathonSlug, 'themes');
      if (!existsSync(variantsDir)) continue;

      const variantFiles = readdirSync(variantsDir)
        .filter((f) => f.endsWith('.yml'))
        .sort();

      for (const file of variantFiles) {
        const themeName = file.replace(/\.yml$/, '');
        const variantData = readYamlFile(path.join(variantsDir, file));
        if (!variantData) continue;

        variantCount++;
        const isActiveTheme = themeName === activeTheme;

        lines.push(`/* === Hackathon Variant: ${hackathonSlug} (${themeName}) === */`);

        if (variantData.light) {
          if (isActiveTheme) {
            // Active theme variant: just [data-hackathon="slug"]
            lines.push(`[data-hackathon="${hackathonSlug}"] {`);
          } else {
            // Other theme variant: [data-theme="name"] [data-hackathon="slug"]
            lines.push(`[data-theme="${themeName}"] [data-hackathon="${hackathonSlug}"] {`);
          }
          lines.push(renderTokens(variantData.light));
          lines.push('}');
        }

        if (variantData.dark) {
          if (isActiveTheme) {
            lines.push(`.dark [data-hackathon="${hackathonSlug}"] {`);
          } else {
            lines.push(`.dark[data-theme="${themeName}"] [data-hackathon="${hackathonSlug}"] {`);
          }
          lines.push(renderTokens(variantData.dark));
          lines.push('}');
        }
        lines.push('');
      }
    }
  }

  // 6. Write output
  const outDir = path.dirname(OUT_FILE);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const output = lines.join('\n');
  writeFileSync(OUT_FILE, output);

  console.log(`[generate-theme-css] Written to ${path.relative(process.cwd(), OUT_FILE)}`);
  console.log(`  platform themes: ${themes.size}`);
  console.log(`  hackathon variants: ${variantCount}`);
}

main();
```

**Step 2: Run the script to verify**

Run: `node scripts/generate-theme-css.mjs`
Expected: Output mentions `active theme: warm-orange`, `platform themes: 1`, `hackathon variants: 2`

**Step 3: Verify the generated CSS**

Run: `head -20 packages/ui/src/styles/generated-themes.css`
Expected: Comment header + `:root { ... }` block with warm-orange light tokens

**Step 4: Delete old `config/theme.yml`**

```bash
rm config/theme.yml
```

**Step 5: Commit**

```bash
git add scripts/generate-theme-css.mjs config/theme.yml packages/ui/src/styles/generated-themes.css
git commit -m "feat: rewrite generate-theme-css for multi-theme support with data-theme selectors"
```

---

## Phase 3: API Route

### Task 5: Rewrite GET Handler

**Files:**
- Modify: `apps/web/app/api/admin/theme/route.ts`

**Step 1: Rewrite the GET handler**

Replace the entire GET function:

```typescript
export async function GET(request: NextRequest) {
  try {
    const authSecret = process.env.AUTH_SECRET || 'dev-secret-key-min-32-chars-long!!';
    const session = await getSession(request, authSecret);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const themeName = searchParams.get('theme');
    const hackathonSlug = searchParams.get('hackathon');

    const themesDir = path.join(REPO_ROOT, 'config', 'themes');
    const activeFile = path.join(themesDir, '.active');

    // Action: list all platform themes
    if (action === 'list') {
      const activeTheme = fs.existsSync(activeFile)
        ? fs.readFileSync(activeFile, 'utf-8').trim()
        : '';

      const files = fs.readdirSync(themesDir).filter((f) => f.endsWith('.yml'));
      const themes = files.map((f) => {
        const id = f.replace(/\.yml$/, '');
        const data = readYamlFile(path.join(themesDir, f));
        return {
          id,
          name: (data?.name as string) || id,
          name_zh: (data?.name_zh as string) || undefined,
          active: id === activeTheme,
        };
      });

      return NextResponse.json({ themes, activeTheme });
    }

    // Get specific platform theme
    if (themeName) {
      const themeFile = path.join(themesDir, `${themeName}.yml`);
      const themeData = readYamlFile(themeFile);
      if (!themeData) {
        return NextResponse.json({ error: `Theme "${themeName}" not found` }, { status: 404 });
      }

      // With hackathon variant
      if (hackathonSlug) {
        const variantFile = path.join(
          REPO_ROOT, 'hackathons', hackathonSlug, 'themes', `${themeName}.yml`
        );
        const overrides = readYamlFile(variantFile) ?? {};
        return NextResponse.json({ base: themeData, overrides });
      }

      return NextResponse.json(themeData);
    }

    // Fallback: legacy ?target= support
    const target = searchParams.get('target');
    if (target === 'global') {
      const activeTheme = fs.existsSync(activeFile)
        ? fs.readFileSync(activeFile, 'utf-8').trim()
        : 'warm-orange';
      const themeFile = path.join(themesDir, `${activeTheme}.yml`);
      const themeData = readYamlFile(themeFile);
      if (!themeData) {
        return NextResponse.json({ error: 'Active theme not found' }, { status: 404 });
      }
      return NextResponse.json(themeData);
    }
    if (target) {
      const activeTheme = fs.existsSync(activeFile)
        ? fs.readFileSync(activeFile, 'utf-8').trim()
        : 'warm-orange';
      const themeFile = path.join(themesDir, `${activeTheme}.yml`);
      const themeData = readYamlFile(themeFile);
      const variantFile = path.join(REPO_ROOT, 'hackathons', target, 'themes', `${activeTheme}.yml`);
      const overrides = readYamlFile(variantFile) ?? {};
      return NextResponse.json({ global: themeData, overrides });
    }

    return NextResponse.json({ error: 'Missing query parameters' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to read theme';
    console.error('GET /api/admin/theme error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit --project apps/web/tsconfig.json`
Expected: no errors

**Step 3: Commit**

```bash
git add apps/web/app/api/admin/theme/route.ts
git commit -m "feat(web): rewrite GET /api/admin/theme for multi-theme listing and activation"
```

---

### Task 6: Rewrite POST Handler

**Files:**
- Modify: `apps/web/app/api/admin/theme/route.ts`

**Step 1: Update the POST handler**

Replace the POST function to use the new `themeSubmissionSchema`:

```typescript
export async function POST(request: NextRequest) {
  try {
    const authSecret = process.env.AUTH_SECRET || 'dev-secret-key-min-32-chars-long!!';
    const session = await getSession(request, authSecret);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = themeSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { type, themeName, hackathonSlug, name, name_zh, description, light, dark, fonts, radius, message } = parsed.data;

    // Check required env vars (common to all types)
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
    const missing = [
      !appId && 'GITHUB_APP_ID',
      !privateKey && 'GITHUB_APP_PRIVATE_KEY',
      !installationId && 'GITHUB_APP_INSTALLATION_ID',
    ].filter(Boolean);
    if (missing.length) {
      return NextResponse.json(
        { error: `Server configuration error: missing ${missing.join(', ')}` },
        { status: 500 },
      );
    }

    const octokit = getInstallationOctokit({
      GITHUB_APP_ID: appId!,
      GITHUB_APP_PRIVATE_KEY: privateKey!,
      GITHUB_APP_INSTALLATION_ID: installationId!,
    });

    // Get main branch SHA (common to all types)
    const { data: ref } = await octokit.git.getRef({
      owner: OWNER, repo: REPO, ref: 'heads/main',
    });
    const mainSha = ref.object.sha;

    const timestamp = Math.floor(Date.now() / 1000);

    // --- Activate theme: create PR that updates config/themes/.active ---
    if (type === 'activate') {
      const branchName = `theme/activate-${themeName}-${timestamp}`;
      await octokit.git.createRef({
        owner: OWNER, repo: REPO,
        ref: `refs/heads/${branchName}`, sha: mainSha,
      });

      const commitMsg = `theme: activate ${themeName} as default platform theme`;
      await octokit.repos.createOrUpdateFileContents({
        owner: OWNER, repo: REPO,
        path: 'config/themes/.active',
        message: commitMsg,
        content: toBase64(themeName),
        branch: branchName,
      });

      const { data: pr } = await octokit.pulls.create({
        owner: OWNER, repo: REPO,
        title: commitMsg,
        body: [
          `Submitted by @${session.login}`,
          '',
          `**Action:** Activate platform theme \`${themeName}\``,
          `**File:** \`config/themes/.active\``,
          '',
          'After merging, the platform will rebuild with this theme as the default.',
          '',
          '---',
          '> Auto-created via [Synnovator Theme Editor](https://home.synnovator.space/admin/theme)',
        ].join('\n'),
        head: branchName,
        base: 'main',
      });

      return NextResponse.json({ url: pr.html_url, number: pr.number });
    }

    // --- Platform or hackathon-variant: create PR with theme YAML ---

    // Build YAML content
    const themeData: Record<string, unknown> = {};
    if (type === 'platform') {
      if (name) themeData.name = name;
      if (name_zh) themeData.name_zh = name_zh;
      if (description) themeData.description = description;
    }
    themeData.light = light;
    themeData.dark = dark;
    if (fonts) themeData.fonts = fonts;
    if (radius) themeData.radius = radius;

    const yamlContent = yaml.dump(themeData, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: true,
    });

    // Determine file path
    const filePath = type === 'platform'
      ? `config/themes/${themeName}.yml`
      : `hackathons/${hackathonSlug}/themes/${themeName}.yml`;

    let branchName = `theme/${themeName}-${timestamp}`;
    try {
      await octokit.git.createRef({
        owner: OWNER, repo: REPO,
        ref: `refs/heads/${branchName}`, sha: mainSha,
      });
    } catch (err: unknown) {
      if ((err as { status?: number }).status === 422) {
        branchName = `${branchName}-${Math.floor(Math.random() * 10000)}`;
        await octokit.git.createRef({
          owner: OWNER, repo: REPO,
          ref: `refs/heads/${branchName}`, sha: mainSha,
        });
      } else throw err;
    }

    const commitMsg = message || `theme(${themeName}): update ${type === 'platform' ? 'platform theme' : `variant for ${hackathonSlug}`}`;

    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER, repo: REPO,
      path: filePath,
      message: commitMsg,
      content: toBase64(yamlContent),
      branch: branchName,
    });

    const { data: pr } = await octokit.pulls.create({
      owner: OWNER, repo: REPO,
      title: commitMsg,
      body: [
        `Submitted by @${session.login}`,
        '',
        `**Type:** ${type}`,
        `**Theme:** \`${themeName}\``,
        type === 'hackathon-variant' ? `**Hackathon:** \`${hackathonSlug}\`` : '',
        `**File:** \`${filePath}\``,
        '',
        '---',
        '> Auto-created via [Synnovator Theme Editor](https://home.synnovator.space/admin/theme)',
      ].filter(Boolean).join('\n'),
      head: branchName,
      base: 'main',
    });

    return NextResponse.json({ url: pr.html_url, number: pr.number });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create theme PR';
    console.error('POST /api/admin/theme error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit --project apps/web/tsconfig.json`
Expected: no errors

**Step 3: Commit**

```bash
git add apps/web/app/api/admin/theme/route.ts
git commit -m "feat(web): rewrite POST /api/admin/theme for platform theme + variant submissions"
```

---

## Phase 4: Editor UI

### Task 7: Add i18n Keys

**Files:**
- Modify: `packages/shared/src/i18n/en.json`
- Modify: `packages/shared/src/i18n/zh.json`

**Step 1: Add theme-related i18n keys**

Add to `admin` section in `en.json`:
```json
"theme_platform_themes": "Platform Themes",
"theme_hackathon_variants": "Hackathon Variants",
"theme_create": "Create Theme",
"theme_create_title": "New Theme",
"theme_name": "Theme Name",
"theme_name_zh": "Theme Name (Chinese)",
"theme_description": "Description",
"theme_active": "Active",
"theme_activate": "Activate",
"theme_activating": "Activating...",
"theme_activate_success": "Activate PR Created",
"theme_no_variant": "No variant",
"theme_create_variant": "Create Variant",
"theme_select_theme": "Select theme",
"theme_select_variant": "Select variant"
```

Add to `admin` section in `zh.json`:
```json
"theme_platform_themes": "平台主题",
"theme_hackathon_variants": "活动主题变体",
"theme_create": "创建主题",
"theme_create_title": "新主题",
"theme_name": "主题名称",
"theme_name_zh": "主题名称（中文）",
"theme_description": "描述",
"theme_active": "当前激活",
"theme_activate": "激活",
"theme_activating": "激活中...",
"theme_activate_success": "激活 PR 已创建",
"theme_no_variant": "无变体",
"theme_create_variant": "创建变体",
"theme_select_theme": "选择主题",
"theme_select_variant": "选择变体"
```

**Step 2: Commit**

```bash
git add packages/shared/src/i18n/en.json packages/shared/src/i18n/zh.json
git commit -m "feat(shared): add i18n keys for theme platform/variant selector and activation"
```

---

### Task 8: Redesign ThemeSelector

**Files:**
- Rewrite: `apps/web/components/admin/theme/ThemeSelector.tsx`

**Step 1: Rewrite ThemeSelector with `@synnovator/ui` Select**

```tsx
'use client';

import { useMemo } from 'react';
import { Button } from '@synnovator/ui';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@synnovator/ui';
import { listHackathons } from '@/app/_generated/data';
import { t, localize } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import type { PlatformThemeMeta } from '@synnovator/shared/schemas/theme';

interface ThemeSelectorProps {
  themes: PlatformThemeMeta[];
  selectedTheme: string;
  selectedVariant: string | null;
  onThemeChange: (themeId: string) => void;
  onVariantChange: (hackathonSlug: string | null) => void;
  onCreate: () => void;
  lang: Lang;
}

export function ThemeSelector({
  themes,
  selectedTheme,
  selectedVariant,
  onThemeChange,
  onVariantChange,
  onCreate,
  lang,
}: ThemeSelectorProps) {
  const hackathons = useMemo(() => {
    try {
      return listHackathons();
    } catch {
      return [];
    }
  }, []);

  // Build composite value for the variant selector
  const variantValue = selectedVariant ?? '__none__';

  return (
    <div className="flex items-center gap-2">
      {/* Platform theme selector */}
      <Select value={selectedTheme} onValueChange={onThemeChange}>
        <SelectTrigger className="w-48" aria-label={t(lang, 'admin.theme_select_theme')}>
          <SelectValue placeholder={t(lang, 'admin.theme_select_theme')} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{t(lang, 'admin.theme_platform_themes')}</SelectLabel>
            {themes.map((theme) => (
              <SelectItem key={theme.id} value={theme.id}>
                {localize(lang, theme.name, theme.name_zh)}
                {theme.active ? ` ✦` : ''}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Hackathon variant selector */}
      <Select value={variantValue} onValueChange={(v) => onVariantChange(v === '__none__' ? null : v)}>
        <SelectTrigger className="w-48" aria-label={t(lang, 'admin.theme_select_variant')}>
          <SelectValue placeholder={t(lang, 'admin.theme_select_variant')} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{t(lang, 'admin.theme_hackathon_variants')}</SelectLabel>
            <SelectItem value="__none__">
              {t(lang, 'admin.theme_no_variant')}
            </SelectItem>
            {hackathons.map((h) => (
              <SelectItem key={h.hackathon.slug} value={h.hackathon.slug}>
                {localize(lang, h.hackathon.name, h.hackathon.name_zh)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Create Theme button */}
      <Button variant="outline" size="sm" onClick={onCreate}>
        {t(lang, 'admin.theme_create')}
      </Button>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit --project apps/web/tsconfig.json`
Expected: Likely errors due to ThemeEditorPage not yet updated — OK, will fix in Task 9.

**Step 3: Commit**

```bash
git add apps/web/components/admin/theme/ThemeSelector.tsx
git commit -m "feat(web): redesign ThemeSelector with @synnovator/ui Select and variant picker"
```

---

### Task 9: Rewrite ThemeEditorPage

**Files:**
- Rewrite: `apps/web/components/admin/theme/ThemeEditorPage.tsx`

**Step 1: Complete rewrite with new state model**

The key changes:
- State: `selectedTheme` + `selectedVariant` replaces `target`
- Fetch theme list on mount
- Fetch theme data when selection changes
- Create theme dialog (inline form)
- "Activate Theme" button
- Pass `hackathonSlug` to PreviewPanel

```tsx
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@synnovator/ui';
import { Input } from '@synnovator/ui';
import { Label } from '@synnovator/ui';
import { t, getLangFromSearchParams } from '@synnovator/shared/i18n';
import { TOKEN_NAMES, type TokenName, type PlatformThemeMeta } from '@synnovator/shared/schemas/theme';
import type { ThemeConfig, HackathonTheme } from '@synnovator/shared/schemas/theme';
import { ThemeSelector } from './ThemeSelector';
import { TokenGroup, TOKEN_GROUPS } from './TokenGroup';
import { PreviewPanel } from './PreviewPanel';
import { ContrastChecker } from './ContrastChecker';
import { PublishButton } from './PublishButton';

export type ThemeMode = 'light' | 'dark';

export interface TokenEntry {
  name: TokenName;
  value: string;
  inherited: boolean;
}

export function ThemeEditorPage() {
  const searchParams = useSearchParams();
  const lang = getLangFromSearchParams(searchParams);

  // Theme list state
  const [themes, setThemes] = useState<PlatformThemeMeta[]>([]);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  // Editor state
  const [mode, setMode] = useState<ThemeMode>('light');
  const [themeData, setThemeData] = useState<ThemeConfig | null>(null);
  const [overrides, setOverrides] = useState<HackathonTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const injectedPropsRef = useRef<string[]>([]);

  // Create theme state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNameZh, setNewNameZh] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Activate theme state
  const [activating, setActivating] = useState(false);

  // Fetch theme list on mount
  useEffect(() => {
    fetch('/api/admin/theme?action=list')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { themes: PlatformThemeMeta[]; activeTheme: string }) => {
        setThemes(data.themes);
        // Select active theme by default
        const active = data.themes.find((t) => t.active);
        setSelectedTheme(active?.id || data.themes[0]?.id || '');
      })
      .catch((err) => {
        console.error('Failed to load theme list:', err);
        setError(err instanceof Error ? err.message : 'Failed to load themes');
        setLoading(false);
      });
  }, []);

  // Fetch theme data when selection changes
  useEffect(() => {
    if (!selectedTheme) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ theme: selectedTheme });
    if (selectedVariant) params.set('hackathon', selectedVariant);

    fetch(`/api/admin/theme?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (selectedVariant) {
          setThemeData(data.base as ThemeConfig);
          setOverrides(data.overrides as HackathonTheme);
        } else {
          setThemeData(data as ThemeConfig);
          setOverrides(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load theme:', err);
        setError(err instanceof Error ? err.message : 'Failed to load theme');
      })
      .finally(() => setLoading(false));
  }, [selectedTheme, selectedVariant]);

  // Apply CSS variable preview
  const applyPreview = useCallback((tokenList: TokenEntry[]) => {
    const style = document.documentElement.style;
    for (const prop of injectedPropsRef.current) {
      style.removeProperty(prop);
    }
    const injected: string[] = [];
    for (const token of tokenList) {
      const prop = `--${token.name}`;
      style.setProperty(prop, token.value);
      injected.push(prop);
    }
    injectedPropsRef.current = injected;
  }, []);

  // Cleanup injected styles on unmount
  useEffect(() => {
    return () => {
      const style = document.documentElement.style;
      for (const prop of injectedPropsRef.current) {
        style.removeProperty(prop);
      }
    };
  }, []);

  // Build token list
  const tokens: TokenEntry[] = useMemo(() => {
    if (!themeData) return [];
    const modeData = themeData[mode];
    if (!modeData) return [];

    if (!selectedVariant) {
      return TOKEN_NAMES.map((name) => ({
        name,
        value: modeData[name] ?? '',
        inherited: false,
      }));
    }

    const modeOverrides = overrides?.[mode] ?? {};
    return TOKEN_NAMES.map((name) => {
      const overrideVal = (modeOverrides as Record<string, string | undefined>)[name];
      return {
        name,
        value: overrideVal ?? modeData[name] ?? '',
        inherited: !overrideVal,
      };
    });
  }, [themeData, overrides, selectedVariant, mode]);

  const valuesMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const tok of tokens) m[tok.name] = tok.value;
    return m;
  }, [tokens]);

  const inheritedMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const tok of tokens) m[tok.name] = tok.inherited;
    return m;
  }, [tokens]);

  // Apply preview whenever tokens change
  useEffect(() => {
    if (tokens.length > 0) applyPreview(tokens);
  }, [tokens, applyPreview]);

  // Handle token value change
  const handleTokenChange = useCallback(
    (name: string, value: string) => {
      if (!selectedVariant) {
        setThemeData((prev) => {
          if (!prev) return prev;
          return { ...prev, [mode]: { ...prev[mode], [name]: value } };
        });
      } else {
        setOverrides((prev) => {
          const current = prev ?? {};
          const currentMode = (current[mode] ?? {}) as Record<string, string | undefined>;
          return { ...current, [mode]: { ...currentMode, [name]: value } } as HackathonTheme;
        });
      }
    },
    [selectedVariant, mode],
  );

  const handleOverride = useCallback(
    (name: string) => {
      if (!selectedVariant) return;
      const currentValue = valuesMap[name];
      if (!currentValue) return;
      setOverrides((prev) => {
        const current = prev ?? {};
        const currentMode = (current[mode] ?? {}) as Record<string, string | undefined>;
        return { ...current, [mode]: { ...currentMode, [name]: currentValue } } as HackathonTheme;
      });
    },
    [selectedVariant, mode, valuesMap],
  );

  const handleReset = useCallback(
    (name: string) => {
      if (!selectedVariant) return;
      setOverrides((prev) => {
        if (!prev) return prev;
        const currentMode = { ...((prev[mode] ?? {}) as Record<string, string | undefined>) };
        delete currentMode[name];
        return { ...prev, [mode]: currentMode } as HackathonTheme;
      });
    },
    [selectedVariant, mode],
  );

  // Build publish data
  const publishLight = useMemo(() => {
    if (!themeData) return {};
    if (!selectedVariant) {
      const m: Record<string, string> = {};
      for (const name of TOKEN_NAMES) {
        const v = themeData.light?.[name];
        if (v) m[name] = v;
      }
      return m;
    }
    const ov = overrides?.light ?? {};
    const m: Record<string, string> = {};
    for (const [k, v] of Object.entries(ov)) {
      if (v) m[k] = v;
    }
    return m;
  }, [themeData, overrides, selectedVariant]);

  const publishDark = useMemo(() => {
    if (!themeData) return {};
    if (!selectedVariant) {
      const m: Record<string, string> = {};
      for (const name of TOKEN_NAMES) {
        const v = themeData.dark?.[name];
        if (v) m[name] = v;
      }
      return m;
    }
    const ov = overrides?.dark ?? {};
    const m: Record<string, string> = {};
    for (const [k, v] of Object.entries(ov)) {
      if (v) m[k] = v;
    }
    return m;
  }, [themeData, overrides, selectedVariant]);

  const toggleMode = () => {
    const next: ThemeMode = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  // Create theme handler
  const handleCreate = () => {
    if (!newName.trim()) return;
    const slug = newName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    // Copy current active theme data as starting point
    const activeTheme = themes.find((t) => t.active);
    if (!activeTheme) return;

    // Navigate to new theme — the publish will create it
    setSelectedTheme(slug);
    setSelectedVariant(null);
    setShowCreate(false);
    setNewName('');
    setNewNameZh('');
    setNewDescription('');

    // Add to local list optimistically
    setThemes((prev) => [
      ...prev,
      { id: slug, name: newName.trim(), name_zh: newNameZh.trim() || undefined, active: false },
    ]);
  };

  // Activate theme handler — creates a PR to change config/themes/.active
  const [activatePrUrl, setActivatePrUrl] = useState<string | null>(null);
  const handleActivate = async () => {
    if (!selectedTheme) return;
    const current = themes.find((t) => t.active);
    if (current?.id === selectedTheme) return; // Already active

    setActivating(true);
    setActivatePrUrl(null);
    try {
      const res = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'activate', themeName: selectedTheme }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { url: string; number: number };
      setActivatePrUrl(data.url);
    } catch (err) {
      console.error('Failed to create activate PR:', err);
    } finally {
      setActivating(false);
    }
  };

  const isActiveTheme = themes.find((t) => t.id === selectedTheme)?.active ?? false;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-4 pb-4 border-b border-border mb-4 flex-wrap">
        <h1 className="text-xl font-heading text-foreground">
          {t(lang, 'admin.theme')}
        </h1>
        <ThemeSelector
          themes={themes}
          selectedTheme={selectedTheme}
          selectedVariant={selectedVariant}
          onThemeChange={(id) => { setSelectedTheme(id); setSelectedVariant(null); }}
          onVariantChange={setSelectedVariant}
          onCreate={() => setShowCreate(true)}
          lang={lang}
        />
        <div className="flex-1" />
        {/* Activate button — only show when not the active theme, creates a PR */}
        {!isActiveTheme && selectedTheme && !selectedVariant && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleActivate}
              disabled={activating}
            >
              {activating
                ? t(lang, 'admin.theme_activating')
                : t(lang, 'admin.theme_activate')}
            </Button>
            {activatePrUrl && (
              <a
                href={activatePrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline hover:text-primary/80"
              >
                {t(lang, 'admin.theme_activate_success')}
              </a>
            )}
          </div>
        )}
        {isActiveTheme && !selectedVariant && (
          <span className="text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted">
            {t(lang, 'admin.theme_active')}
          </span>
        )}
        <button
          type="button"
          onClick={toggleMode}
          className="px-3 py-1.5 text-sm rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors"
        >
          {mode === 'light' ? 'Light' : 'Dark'}
        </button>
        <PublishButton
          type={selectedVariant ? 'hackathon-variant' : 'platform'}
          themeName={selectedTheme}
          hackathonSlug={selectedVariant ?? undefined}
          name={themeData?.name as string | undefined}
          nameZh={themeData?.name_zh as string | undefined}
          description={themeData?.description as string | undefined}
          light={publishLight}
          dark={publishDark}
          fonts={themeData?.fonts as Record<string, string> | undefined}
          radius={themeData?.radius}
          lang={lang}
        />
      </div>

      {/* Create theme dialog (inline form) */}
      {showCreate && (
        <div className="border border-border rounded-lg bg-card p-4 mb-4 max-w-md">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {t(lang, 'admin.theme_create_title')}
          </h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-theme-name">{t(lang, 'admin.theme_name')}</Label>
              <Input
                id="new-theme-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Ocean Breeze"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-theme-name-zh">{t(lang, 'admin.theme_name_zh')}</Label>
              <Input
                id="new-theme-name-zh"
                value={newNameZh}
                onChange={(e) => setNewNameZh(e.target.value)}
                placeholder="例如 海风"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-theme-desc">{t(lang, 'admin.theme_description')}</Label>
              <Input
                id="new-theme-desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="A brief description"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
                {t(lang, 'admin.theme_create')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          {/* Left: editor panel */}
          <div className="w-full lg:w-80 shrink-0 overflow-y-auto pr-2">
            {TOKEN_GROUPS.map((group) => (
              <TokenGroup
                key={group.label}
                group={group}
                values={valuesMap}
                inherited={inheritedMap}
                onChange={handleTokenChange}
                onOverride={handleOverride}
                onReset={handleReset}
              />
            ))}
            <ContrastChecker tokens={valuesMap} />
          </div>
          {/* Right: preview panel */}
          <div className="flex-1 overflow-y-auto border border-border rounded-lg p-4 bg-background">
            <PreviewPanel hackathonSlug={selectedVariant} />
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit --project apps/web/tsconfig.json`
Expected: Errors related to PublishButton and PreviewPanel props — will fix in Tasks 10-11.

**Step 3: Commit**

```bash
git add apps/web/components/admin/theme/ThemeEditorPage.tsx
git commit -m "feat(web): rewrite ThemeEditorPage with platform theme + variant selection and activation"
```

---

### Task 10: Update PublishButton

**Files:**
- Modify: `apps/web/components/admin/theme/PublishButton.tsx`

**Step 1: Update props and POST body**

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@synnovator/ui';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

type PublishState = 'idle' | 'loading' | 'success' | 'error';

interface PublishButtonProps {
  type: 'platform' | 'hackathon-variant';
  themeName: string;
  hackathonSlug?: string;
  name?: string;
  nameZh?: string;
  description?: string;
  light: Record<string, string>;
  dark: Record<string, string>;
  fonts?: Record<string, string>;
  radius?: string;
  lang: Lang;
}

export function PublishButton({
  type,
  themeName,
  hackathonSlug,
  name,
  nameZh,
  description,
  light,
  dark,
  fonts,
  radius,
  lang,
}: PublishButtonProps) {
  const [state, setState] = useState<PublishState>('idle');
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePublish = async () => {
    setState('loading');
    setPrUrl(null);
    setErrorMsg(null);

    try {
      const body: Record<string, unknown> = { type, themeName, light, dark };
      if (hackathonSlug) body.hackathonSlug = hackathonSlug;
      if (name) body.name = name;
      if (nameZh) body.name_zh = nameZh;
      if (description) body.description = description;
      if (fonts) body.fonts = fonts;
      if (radius) body.radius = radius;

      const res = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as { url: string; number: number };
      setPrUrl(data.url);
      setState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={handlePublish}
        disabled={state === 'loading' || !themeName}
      >
        {state === 'loading'
          ? t(lang, 'admin.theme_publishing')
          : t(lang, 'admin.theme_publish')}
      </Button>
      {state === 'success' && prUrl && (
        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary underline hover:text-primary/80"
        >
          {t(lang, 'admin.theme_publish_success')}
        </a>
      )}
      {state === 'error' && errorMsg && (
        <span className="text-xs text-destructive">{errorMsg}</span>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/components/admin/theme/PublishButton.tsx
git commit -m "feat(web): update PublishButton for platform theme + variant submission format"
```

---

### Task 11: Update PreviewPanel to Accept hackathonSlug

**Files:**
- Modify: `apps/web/components/admin/theme/PreviewPanel.tsx`
- Modify: `apps/web/components/admin/theme/PagePreview.tsx`

**Step 1: Add `hackathonSlug` prop to PreviewPanel**

In `PreviewPanel.tsx`, update props and pass through:

```tsx
'use client';

import { useState } from 'react';
import { ComponentPreview } from './ComponentPreview';
import { PagePreview } from './PagePreview';

type PreviewTab = 'components' | 'page';

interface PreviewPanelProps {
  hackathonSlug?: string | null;
}

export function PreviewPanel({ hackathonSlug }: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>('components');

  return (
    <div className="flex flex-col h-full">
      <div role="tablist" aria-label="Preview mode" className="flex border-b border-border mb-4">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'components'}
          aria-controls="panel-components"
          id="tab-components"
          onClick={() => setActiveTab('components')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'components'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Components
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'page'}
          aria-controls="panel-page"
          id="tab-page"
          onClick={() => setActiveTab('page')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'page'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Page
        </button>
      </div>

      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="flex-1 overflow-y-auto"
      >
        {activeTab === 'components' ? (
          <ComponentPreview />
        ) : (
          <PagePreview hackathonSlug={hackathonSlug ?? undefined} />
        )}
      </div>
    </div>
  );
}
```

**Step 2: Update `PagePreview` to accept hackathonSlug**

Add `hackathonSlug` prop. When provided, attempt to load actual hackathon data. The existing mock content serves as fallback when no slug is provided.

In `PagePreview.tsx`, add the prop and conditionally load hackathon data:

```tsx
'use client';

import { useMemo } from 'react';
import { Button } from '@synnovator/ui';
import { Badge } from '@synnovator/ui';
import { listHackathons } from '@/app/_generated/data';

interface PagePreviewProps {
  hackathonSlug?: string;
}

export function PagePreview({ hackathonSlug }: PagePreviewProps) {
  const hackathon = useMemo(() => {
    if (!hackathonSlug) return null;
    try {
      const all = listHackathons();
      return all.find((h) => h.hackathon.slug === hackathonSlug)?.hackathon ?? null;
    } catch {
      return null;
    }
  }, [hackathonSlug]);

  // If a hackathon is selected and found, show its actual data
  if (hackathon) {
    return (
      <div className="space-y-8" data-hackathon={hackathon.slug}>
        <section className="text-center py-8">
          <Badge variant="secondary" className="mb-4">
            {hackathon.type}
          </Badge>
          <h1 className="text-2xl font-heading font-bold text-foreground mb-3">
            {hackathon.name}
          </h1>
          {hackathon.name_zh && (
            <p className="text-sm text-muted-foreground mb-2">{hackathon.name_zh}</p>
          )}
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {hackathon.tagline || 'Hackathon event preview'}
          </p>
          <div className="flex justify-center gap-3">
            <Button>Register</Button>
            <Button variant="outline">Details</Button>
          </div>
        </section>

        <hr className="border-border" />

        {hackathon.tracks && hackathon.tracks.length > 0 && (
          <section>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
              Tracks
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {hackathon.tracks.map((track: { name: string; name_zh?: string; description?: string }, i: number) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-card p-4"
                  style={{ borderTopWidth: '3px', borderTopColor: 'var(--brand)' }}
                >
                  <h3 className="text-sm font-semibold text-card-foreground mb-1">
                    {track.name}
                  </h3>
                  {track.description && (
                    <p className="text-xs text-muted-foreground">{track.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // Default mock preview (same as existing)
  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <Badge variant="secondary" className="mb-4">
          AI Hackathon Platform
        </Badge>
        <h1 className="text-2xl font-heading font-bold text-foreground mb-3">
          Build the Future with AI
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          Join thousands of developers in creating innovative AI-powered
          solutions. Register your team, submit projects, and compete for prizes.
        </p>
        <div className="flex justify-center gap-3">
          <Button>Get Started</Button>
          <Button variant="outline">Learn More</Button>
        </div>
      </section>

      <hr className="border-border" />

      <section>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
          Hackathon Events
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-xl border border-border bg-card p-4"
            style={{ borderTopWidth: '3px', borderTopColor: 'var(--brand)' }}
          >
            <Badge
              className="mb-2 text-xs"
              style={{ backgroundColor: 'oklch(from var(--brand) l c h / 0.2)', color: 'var(--brand)' }}
            >
              Community
            </Badge>
            <h3 className="text-sm font-semibold text-card-foreground mb-1">
              AI Innovation Challenge
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Open to all developers. Build creative AI applications.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>128 teams</span>
              <span>&middot;</span>
              <span>Mar 15–20</span>
            </div>
          </div>

          <div
            className="rounded-sm border border-border bg-card p-4"
            style={{ borderLeftWidth: '3px', borderLeftColor: 'var(--info)' }}
          >
            <Badge
              className="mb-2 text-xs"
              style={{ backgroundColor: 'oklch(from var(--info) l c h / 0.2)', color: 'var(--info)' }}
            >
              Enterprise
            </Badge>
            <h3 className="text-sm font-semibold text-card-foreground mb-1">
              Enterprise AI Solutions
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Corporate-sponsored hackathon for B2B AI solutions.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>64 teams</span>
              <span>&middot;</span>
              <span>Apr 1–7</span>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-border" />

      <section>
        <div className="flex gap-2 mb-3">
          <Badge variant="outline">Open</Badge>
          <Badge
            className="text-xs"
            style={{ backgroundColor: 'oklch(from var(--highlight) l c h / 0.2)', color: 'var(--highlight)' }}
          >
            Submissions Open
          </Badge>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-base font-heading font-semibold text-card-foreground mb-2">
            Project: Neural Canvas
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            An AI-powered collaborative drawing tool that transforms rough
            sketches into polished illustrations using diffusion models.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span
              className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: 'oklch(from var(--highlight) l c h / 0.15)', color: 'var(--highlight)' }}
            >
              Python
            </span>
            <span
              className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: 'oklch(from var(--info) l c h / 0.15)', color: 'var(--info)' }}
            >
              TensorFlow
            </span>
            <span
              className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: 'oklch(from var(--highlight) l c h / 0.15)', color: 'var(--highlight)' }}
            >
              React
            </span>
            <span
              className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: 'oklch(from var(--info) l c h / 0.15)', color: 'var(--info)' }}
            >
              WebSocket
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
```

**Step 3: Verify TypeScript compiles**

Run: `pnpm exec tsc --noEmit --project apps/web/tsconfig.json`
Expected: no errors

**Step 4: Commit**

```bash
git add apps/web/components/admin/theme/PreviewPanel.tsx apps/web/components/admin/theme/PagePreview.tsx
git commit -m "feat(web): pass hackathonSlug to PreviewPanel, show real hackathon data in PagePreview"
```

---

## Phase 5: Preset Themes

### Task 12: Create neon-forge.yml

**Files:**
- Create: `config/themes/neon-forge.yml`

**Step 1: Create the theme file**

neon-forge is a dark cyber aesthetic with lime green primary. It needs both light and dark modes.

```yaml
name: "Neon Forge"
name_zh: "霓虹锻造"
description: "Dark cyber/neon aesthetic with lime green primary"

light:
  background: "oklch(0.96 0.01 145)"
  foreground: "oklch(0.20 0.02 150)"
  card: "oklch(0.98 0.008 145)"
  card-foreground: "oklch(0.20 0.02 150)"
  popover: "oklch(0.98 0.008 145)"
  popover-foreground: "oklch(0.20 0.02 150)"
  primary: "oklch(0.55 0.22 128)"
  primary-foreground: "oklch(0.98 0.005 128)"
  secondary: "oklch(0.93 0.01 145)"
  secondary-foreground: "oklch(0.20 0.02 150)"
  muted: "oklch(0.93 0.01 145)"
  muted-foreground: "oklch(0.50 0.015 150)"
  accent: "oklch(0.93 0.01 145)"
  accent-foreground: "oklch(0.20 0.02 150)"
  destructive: "oklch(0.55 0.22 25)"
  destructive-foreground: "oklch(0.98 0.005 80)"
  border: "oklch(0.90 0.01 145)"
  input: "oklch(0.90 0.01 145)"
  ring: "oklch(0.55 0.22 128)"
  brand: "oklch(0.55 0.22 128)"
  brand-foreground: "oklch(0.98 0.005 128)"
  highlight: "oklch(0.65 0.18 195)"
  highlight-foreground: "oklch(0.20 0.05 195)"
  info: "oklch(0.55 0.15 250)"
  info-foreground: "oklch(0.20 0.05 250)"

dark:
  background: "oklch(0.14 0.015 150)"
  foreground: "oklch(0.92 0.02 128)"
  card: "oklch(0.18 0.015 150)"
  card-foreground: "oklch(0.92 0.02 128)"
  popover: "oklch(0.18 0.015 150)"
  popover-foreground: "oklch(0.92 0.02 128)"
  primary: "oklch(0.75 0.25 128)"
  primary-foreground: "oklch(0.14 0.015 150)"
  secondary: "oklch(0.22 0.015 150)"
  secondary-foreground: "oklch(0.92 0.02 128)"
  muted: "oklch(0.22 0.015 150)"
  muted-foreground: "oklch(0.58 0.015 150)"
  accent: "oklch(0.22 0.015 150)"
  accent-foreground: "oklch(0.92 0.02 128)"
  destructive: "oklch(0.58 0.2 22)"
  destructive-foreground: "oklch(0.98 0.005 80)"
  border: "oklch(1 0 0 / 10%)"
  input: "oklch(1 0 0 / 15%)"
  ring: "oklch(0.75 0.25 128)"
  brand: "oklch(0.75 0.25 128)"
  brand-foreground: "oklch(0.14 0.015 150)"
  highlight: "oklch(0.78 0.18 195)"
  highlight-foreground: "oklch(0.14 0.015 150)"
  info: "oklch(0.65 0.15 250)"
  info-foreground: "oklch(0.92 0.02 128)"

fonts:
  heading: "Space Grotesk"
  sans: "Inter"
  code: "JetBrains Mono"
  zh: "Noto Sans SC"

radius: "0.5rem"
```

**Step 2: Commit**

```bash
git add config/themes/neon-forge.yml
git commit -m "feat: add neon-forge preset theme (dark cyber/neon with lime green primary)"
```

---

### Task 13: Create claude.yml Preset

**Files:**
- Create: `config/themes/claude.yml`

**Step 1: Create the theme from tweakcn claude data**

Map tweakcn tokens to our 26 TOKEN_NAMES. Derive `brand`, `highlight`, `info` from primary hue H39.

```yaml
name: "Claude"
name_zh: "Claude"
description: "Warm orange on cream, inspired by tweakcn claude preset"

light:
  background: "oklch(0.98 0.005 95)"
  foreground: "oklch(0.34 0.027 96)"
  card: "oklch(0.98 0.005 95)"
  card-foreground: "oklch(0.19 0.002 107)"
  popover: "oklch(1 0 0)"
  popover-foreground: "oklch(0.27 0.02 99)"
  primary: "oklch(0.62 0.138 39)"
  primary-foreground: "oklch(1 0 0)"
  secondary: "oklch(0.92 0.014 93)"
  secondary-foreground: "oklch(0.43 0.018 99)"
  muted: "oklch(0.93 0.015 90)"
  muted-foreground: "oklch(0.61 0.008 97)"
  accent: "oklch(0.92 0.014 93)"
  accent-foreground: "oklch(0.27 0.02 99)"
  destructive: "oklch(0.55 0.22 25)"
  destructive-foreground: "oklch(1 0 0)"
  border: "oklch(0.88 0.007 97)"
  input: "oklch(0.76 0.016 98)"
  ring: "oklch(0.62 0.138 39)"
  brand: "oklch(0.62 0.138 39)"
  brand-foreground: "oklch(1 0 0)"
  highlight: "oklch(0.72 0.18 128)"
  highlight-foreground: "oklch(0.38 0.1 128)"
  info: "oklch(0.50 0.18 270)"
  info-foreground: "oklch(0.35 0.12 270)"

dark:
  background: "oklch(0.27 0.004 107)"
  foreground: "oklch(0.81 0.014 93)"
  card: "oklch(0.27 0.004 107)"
  card-foreground: "oklch(0.98 0.005 95)"
  popover: "oklch(0.31 0.004 107)"
  popover-foreground: "oklch(0.92 0.004 107)"
  primary: "oklch(0.67 0.131 39)"
  primary-foreground: "oklch(1 0 0)"
  secondary: "oklch(0.22 0.004 107)"
  secondary-foreground: "oklch(0.31 0.004 107)"
  muted: "oklch(0.22 0.004 107)"
  muted-foreground: "oklch(0.77 0.017 99)"
  accent: "oklch(0.21 0.008 95)"
  accent-foreground: "oklch(0.97 0.008 99)"
  destructive: "oklch(0.64 0.208 25)"
  destructive-foreground: "oklch(1 0 0)"
  border: "oklch(0.36 0.01 107)"
  input: "oklch(0.43 0.011 100)"
  ring: "oklch(0.67 0.131 39)"
  brand: "oklch(0.67 0.131 39)"
  brand-foreground: "oklch(0.27 0.004 107)"
  highlight: "oklch(0.82 0.2 125)"
  highlight-foreground: "oklch(0.27 0.004 107)"
  info: "oklch(0.60 0.16 270)"
  info-foreground: "oklch(0.92 0.004 107)"

fonts:
  heading: "Space Grotesk"
  sans: "Inter"
  code: "Poppins"
  zh: "Noto Sans SC"

radius: "0.5rem"
```

**Step 2: Commit**

```bash
git add config/themes/claude.yml
git commit -m "feat: add claude preset theme from tweakcn"
```

---

### Task 14: Create sunset-horizon.yml Preset

**Files:**
- Create: `config/themes/sunset-horizon.yml`

```yaml
name: "Sunset Horizon"
name_zh: "落日地平线"
description: "Orange-peach primary with warm neutrals"

light:
  background: "oklch(0.99 0.008 56)"
  foreground: "oklch(0.34 0.013 3)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.34 0.013 3)"
  popover: "oklch(1 0 0)"
  popover-foreground: "oklch(0.34 0.013 3)"
  primary: "oklch(0.74 0.164 35)"
  primary-foreground: "oklch(1 0 0)"
  secondary: "oklch(0.96 0.02 29)"
  secondary-foreground: "oklch(0.34 0.013 3)"
  muted: "oklch(0.95 0.015 56)"
  muted-foreground: "oklch(0.55 0.015 3)"
  accent: "oklch(0.83 0.113 58)"
  accent-foreground: "oklch(0.34 0.013 3)"
  destructive: "oklch(0.55 0.22 25)"
  destructive-foreground: "oklch(1 0 0)"
  border: "oklch(0.93 0.037 39)"
  input: "oklch(0.93 0.037 39)"
  ring: "oklch(0.74 0.164 35)"
  brand: "oklch(0.74 0.164 35)"
  brand-foreground: "oklch(1 0 0)"
  highlight: "oklch(0.83 0.113 58)"
  highlight-foreground: "oklch(0.34 0.013 3)"
  info: "oklch(0.50 0.18 270)"
  info-foreground: "oklch(0.35 0.12 270)"

dark:
  background: "oklch(0.26 0.017 352)"
  foreground: "oklch(0.94 0.012 51)"
  card: "oklch(0.32 0.018 341)"
  card-foreground: "oklch(0.94 0.012 51)"
  popover: "oklch(0.32 0.018 341)"
  popover-foreground: "oklch(0.94 0.012 51)"
  primary: "oklch(0.74 0.164 35)"
  primary-foreground: "oklch(1 0 0)"
  secondary: "oklch(0.30 0.015 352)"
  secondary-foreground: "oklch(0.94 0.012 51)"
  muted: "oklch(0.30 0.015 352)"
  muted-foreground: "oklch(0.65 0.01 51)"
  accent: "oklch(0.83 0.113 58)"
  accent-foreground: "oklch(0.26 0.017 352)"
  destructive: "oklch(0.58 0.2 22)"
  destructive-foreground: "oklch(0.98 0.005 80)"
  border: "oklch(0.40 0.015 352)"
  input: "oklch(0.40 0.015 352)"
  ring: "oklch(0.74 0.164 35)"
  brand: "oklch(0.74 0.164 35)"
  brand-foreground: "oklch(0.26 0.017 352)"
  highlight: "oklch(0.83 0.113 58)"
  highlight-foreground: "oklch(0.26 0.017 352)"
  info: "oklch(0.60 0.16 270)"
  info-foreground: "oklch(0.94 0.012 51)"

fonts:
  heading: "Montserrat"
  sans: "Inter"
  code: "Ubuntu Mono"
  zh: "Noto Sans SC"

radius: "0.625rem"
```

**Step 1: Commit**

```bash
git add config/themes/sunset-horizon.yml
git commit -m "feat: add sunset-horizon preset theme from tweakcn"
```

---

### Task 15: Create tangerine.yml Preset

**Files:**
- Create: `config/themes/tangerine.yml`

```yaml
name: "Tangerine"
name_zh: "柑橘"
description: "Orange primary with blue-tinted neutrals"

light:
  background: "oklch(0.94 0.004 236)"
  foreground: "oklch(0.32 0 0)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.32 0 0)"
  popover: "oklch(1 0 0)"
  popover-foreground: "oklch(0.32 0 0)"
  primary: "oklch(0.64 0.172 36)"
  primary-foreground: "oklch(1 0 0)"
  secondary: "oklch(0.97 0.003 265)"
  secondary-foreground: "oklch(0.45 0.026 257)"
  muted: "oklch(0.98 0.002 248)"
  muted-foreground: "oklch(0.55 0.023 264)"
  accent: "oklch(0.91 0.022 244)"
  accent-foreground: "oklch(0.38 0.138 266)"
  destructive: "oklch(0.64 0.208 25)"
  destructive-foreground: "oklch(1 0 0)"
  border: "oklch(0.90 0.005 248)"
  input: "oklch(0.97 0.003 265)"
  ring: "oklch(0.64 0.172 36)"
  brand: "oklch(0.64 0.172 36)"
  brand-foreground: "oklch(1 0 0)"
  highlight: "oklch(0.72 0.18 128)"
  highlight-foreground: "oklch(0.38 0.1 128)"
  info: "oklch(0.50 0.18 270)"
  info-foreground: "oklch(0.35 0.12 270)"

dark:
  background: "oklch(0.26 0.031 263)"
  foreground: "oklch(0.92 0 0)"
  card: "oklch(0.31 0.030 269)"
  card-foreground: "oklch(0.92 0 0)"
  popover: "oklch(0.31 0.030 269)"
  popover-foreground: "oklch(0.92 0 0)"
  primary: "oklch(0.64 0.172 36)"
  primary-foreground: "oklch(1 0 0)"
  secondary: "oklch(0.31 0.027 267)"
  secondary-foreground: "oklch(0.92 0 0)"
  muted: "oklch(0.31 0.027 267)"
  muted-foreground: "oklch(0.72 0 0)"
  accent: "oklch(0.34 0.059 268)"
  accent-foreground: "oklch(0.88 0.057 254)"
  destructive: "oklch(0.64 0.208 25)"
  destructive-foreground: "oklch(1 0 0)"
  border: "oklch(0.38 0.030 270)"
  input: "oklch(0.38 0.030 270)"
  ring: "oklch(0.64 0.172 36)"
  brand: "oklch(0.64 0.172 36)"
  brand-foreground: "oklch(0.26 0.031 263)"
  highlight: "oklch(0.82 0.2 125)"
  highlight-foreground: "oklch(0.26 0.031 263)"
  info: "oklch(0.60 0.16 270)"
  info-foreground: "oklch(0.92 0 0)"

fonts:
  heading: "Inter"
  sans: "Inter"
  code: "JetBrains Mono"
  zh: "Noto Sans SC"

radius: "0.75rem"
```

**Step 1: Commit**

```bash
git add config/themes/tangerine.yml
git commit -m "feat: add tangerine preset theme from tweakcn"
```

---

### Task 16: Create solar-dusk.yml Preset

**Files:**
- Create: `config/themes/solar-dusk.yml`

```yaml
name: "Solar Dusk"
name_zh: "日暮"
description: "Golden orange primary with warm dark mode"

light:
  background: "oklch(0.99 0.006 85)"
  foreground: "oklch(0.37 0.025 50)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.37 0.025 50)"
  popover: "oklch(1 0 0)"
  popover-foreground: "oklch(0.37 0.025 50)"
  primary: "oklch(0.56 0.146 49)"
  primary-foreground: "oklch(1 0 0)"
  secondary: "oklch(0.83 0.075 74)"
  secondary-foreground: "oklch(0.37 0.025 50)"
  muted: "oklch(0.94 0.022 83)"
  muted-foreground: "oklch(0.55 0.02 50)"
  accent: "oklch(0.90 0.05 75)"
  accent-foreground: "oklch(0.37 0.025 50)"
  destructive: "oklch(0.55 0.22 25)"
  destructive-foreground: "oklch(1 0 0)"
  border: "oklch(0.89 0.04 90)"
  input: "oklch(0.89 0.04 90)"
  ring: "oklch(0.56 0.146 49)"
  brand: "oklch(0.56 0.146 49)"
  brand-foreground: "oklch(1 0 0)"
  highlight: "oklch(0.72 0.18 128)"
  highlight-foreground: "oklch(0.38 0.1 128)"
  info: "oklch(0.50 0.18 270)"
  info-foreground: "oklch(0.35 0.12 270)"

dark:
  background: "oklch(0.22 0.006 56)"
  foreground: "oklch(0.97 0.001 106)"
  card: "oklch(0.27 0.006 34)"
  card-foreground: "oklch(0.97 0.001 106)"
  popover: "oklch(0.27 0.006 34)"
  popover-foreground: "oklch(0.97 0.001 106)"
  primary: "oklch(0.70 0.187 48)"
  primary-foreground: "oklch(0.22 0.006 56)"
  secondary: "oklch(0.28 0.007 56)"
  secondary-foreground: "oklch(0.97 0.001 106)"
  muted: "oklch(0.23 0.007 67)"
  muted-foreground: "oklch(0.60 0.01 67)"
  accent: "oklch(0.36 0.05 229)"
  accent-foreground: "oklch(0.97 0.001 106)"
  destructive: "oklch(0.58 0.2 22)"
  destructive-foreground: "oklch(0.98 0.005 80)"
  border: "oklch(0.37 0.009 68)"
  input: "oklch(0.37 0.009 68)"
  ring: "oklch(0.70 0.187 48)"
  brand: "oklch(0.70 0.187 48)"
  brand-foreground: "oklch(0.22 0.006 56)"
  highlight: "oklch(0.82 0.2 125)"
  highlight-foreground: "oklch(0.22 0.006 56)"
  info: "oklch(0.60 0.16 270)"
  info-foreground: "oklch(0.97 0.001 106)"

fonts:
  heading: "Oxanium"
  sans: "Inter"
  code: "Fira Code"
  zh: "Noto Sans SC"

radius: "0.3rem"
```

**Step 1: Commit**

```bash
git add config/themes/solar-dusk.yml
git commit -m "feat: add solar-dusk preset theme from tweakcn"
```

---

### Task 17: Create nature.yml Preset

**Files:**
- Create: `config/themes/nature.yml`

```yaml
name: "Nature"
name_zh: "自然"
description: "Green primary with earthy warm neutrals"

light:
  background: "oklch(0.97 0.007 81)"
  foreground: "oklch(0.30 0.036 30)"
  card: "oklch(0.99 0.005 81)"
  card-foreground: "oklch(0.30 0.036 30)"
  popover: "oklch(0.99 0.005 81)"
  popover-foreground: "oklch(0.30 0.036 30)"
  primary: "oklch(0.52 0.135 144)"
  primary-foreground: "oklch(1 0 0)"
  secondary: "oklch(0.96 0.021 148)"
  secondary-foreground: "oklch(0.30 0.036 30)"
  muted: "oklch(0.94 0.014 74)"
  muted-foreground: "oklch(0.45 0.049 39)"
  accent: "oklch(0.90 0.050 146)"
  accent-foreground: "oklch(0.30 0.036 30)"
  destructive: "oklch(0.55 0.22 25)"
  destructive-foreground: "oklch(1 0 0)"
  border: "oklch(0.88 0.021 75)"
  input: "oklch(0.88 0.021 75)"
  ring: "oklch(0.52 0.135 144)"
  brand: "oklch(0.52 0.135 144)"
  brand-foreground: "oklch(1 0 0)"
  highlight: "oklch(0.75 0.15 90)"
  highlight-foreground: "oklch(0.30 0.036 30)"
  info: "oklch(0.50 0.18 270)"
  info-foreground: "oklch(0.35 0.12 270)"

dark:
  background: "oklch(0.27 0.028 151)"
  foreground: "oklch(0.94 0.01 73)"
  card: "oklch(0.33 0.027 147)"
  card-foreground: "oklch(0.94 0.01 73)"
  popover: "oklch(0.33 0.027 147)"
  popover-foreground: "oklch(0.94 0.01 73)"
  primary: "oklch(0.67 0.162 144)"
  primary-foreground: "oklch(0.22 0.045 146)"
  secondary: "oklch(0.32 0.025 150)"
  secondary-foreground: "oklch(0.94 0.01 73)"
  muted: "oklch(0.32 0.025 150)"
  muted-foreground: "oklch(0.60 0.015 73)"
  accent: "oklch(0.58 0.145 144)"
  accent-foreground: "oklch(0.94 0.01 73)"
  destructive: "oklch(0.58 0.2 22)"
  destructive-foreground: "oklch(0.98 0.005 80)"
  border: "oklch(0.39 0.027 143)"
  input: "oklch(0.39 0.027 143)"
  ring: "oklch(0.67 0.162 144)"
  brand: "oklch(0.67 0.162 144)"
  brand-foreground: "oklch(0.27 0.028 151)"
  highlight: "oklch(0.82 0.15 90)"
  highlight-foreground: "oklch(0.27 0.028 151)"
  info: "oklch(0.60 0.16 270)"
  info-foreground: "oklch(0.94 0.01 73)"

fonts:
  heading: "Montserrat"
  sans: "Inter"
  code: "Source Code Pro"
  zh: "Noto Sans SC"

radius: "0.5rem"
```

**Step 1: Commit**

```bash
git add config/themes/nature.yml
git commit -m "feat: add nature preset theme from tweakcn"
```

---

### Task 18: Regenerate CSS and Verify Build

**Step 1: Run CSS generation**

```bash
node scripts/generate-theme-css.mjs
```

Expected: `platform themes: 7`, `hackathon variants: 2`

**Step 2: Verify generated CSS has all themes**

```bash
grep 'data-theme=' packages/ui/src/styles/generated-themes.css | head -20
```

Expected: `[data-theme="claude"]`, `[data-theme="neon-forge"]`, etc.

**Step 3: Type check**

```bash
pnpm exec tsc --noEmit --project apps/web/tsconfig.json
```

Expected: no errors

**Step 4: Build**

```bash
pnpm build
```

Expected: success

**Step 5: Commit generated CSS**

```bash
git add packages/ui/src/styles/generated-themes.css
git commit -m "feat: regenerate theme CSS with all 7 platform themes"
```

---

## Verification

1. `pnpm exec tsc --noEmit --project apps/web/tsconfig.json` — type check
2. `node scripts/generate-theme-css.mjs` — verify CSS generation with all 7 themes
3. `pnpm build` — production build succeeds
4. Manual E2E: login → /admin/theme → verify theme list → switch themes → edit tokens → preview → activate theme → create new theme → publish PR

## Critical Files

- `packages/shared/src/schemas/theme.ts` — Schema definitions
- `scripts/generate-theme-css.mjs` — YAML→CSS compiler
- `apps/web/app/api/admin/theme/route.ts` — Theme API
- `apps/web/components/admin/theme/ThemeEditorPage.tsx` — Editor state + activation
- `apps/web/components/admin/theme/ThemeSelector.tsx` — Selector UI
- `apps/web/components/admin/theme/PublishButton.tsx` — PR submission
- `apps/web/components/admin/theme/PreviewPanel.tsx` — Preview with hackathon context
- `apps/web/components/admin/theme/PagePreview.tsx` — Hackathon-aware page preview
- `config/themes/` — Platform theme YAML storage
- `config/themes/.active` — Active theme slug
