# Named Platform Themes + Hackathon Variants — Design

## Goal

Restructure the single-global-theme system into named platform themes (warm-orange, neon-forge, claude, etc.) with optional per-hackathon variants. Replace the native `<select>` with a `@synnovator/ui` Select component + "Create Theme" button. Bundle 7 preset themes.

## Architecture

### Two-Tier Theme Hierarchy

| Tier | Storage | Purpose |
|------|---------|---------|
| **Platform Theme** | `config/themes/{name}.yml` | Full 26-token light/dark + fonts + radius + metadata |
| **Hackathon Variant** | `hackathons/{slug}/themes/{theme-name}.yml` | Partial token overrides scoped to one hackathon under one platform theme |

### File Structure

```
config/themes/
  .active                 # Active theme slug: "warm-orange"
  warm-orange.yml         # Current default (migrated from config/theme.yml)
  neon-forge.yml          # Dark cyber/neon aesthetic
  claude.yml              # tweakcn built-in preset (H39)
  sunset-horizon.yml      # tweakcn built-in preset (H35)
  tangerine.yml           # tweakcn built-in preset (orange + blue)
  solar-dusk.yml          # tweakcn built-in preset (H49)
  nature.yml              # tweakcn built-in preset (H144 green)

hackathons/enterprise-fintech-risk-2025/themes/
  warm-orange.yml         # Brand indigo overrides for warm-orange theme

hackathons/test-youth-hackathon/themes/
  warm-orange.yml         # Brand lime overrides for warm-orange theme
```

### Platform Theme YAML Format

```yaml
name: "Warm Orange"
name_zh: "暖橙"
description: "Synnovator default with warm orange brand"
light:
  background: "oklch(0.98 0.005 80)"
  foreground: "oklch(0.15 0.01 70)"
  # ... all 26 tokens
dark:
  background: "oklch(0.16 0.008 60)"
  # ... all 26 tokens
fonts:
  heading: "Space Grotesk"
  sans: "Inter"
  code: "Poppins"
  zh: "Noto Sans SC"
radius: "0.75rem"
```

### CSS Selector Strategy

| Scope | Light | Dark |
|-------|-------|------|
| Active platform theme | `:root` | `.dark` |
| Other platform theme | `[data-theme="name"]` | `.dark[data-theme="name"]` |
| Hackathon variant (active) | `[data-hackathon="slug"]` | `.dark [data-hackathon="slug"]` |
| Hackathon variant (other) | `[data-theme="name"] [data-hackathon="slug"]` | `.dark[data-theme="name"] [data-hackathon="slug"]` |

## Preset Themes

| Theme | Source | Primary Hue | Character |
|-------|--------|-------------|-----------|
| warm-orange | Current default | H35 | Warm orange brand, cream neutrals |
| neon-forge | New (reconstructed) | H128 lime | Dark cyber/neon, lime green primary |
| claude | tweakcn `/r/themes/claude.json` | H39 | Warm orange on cream, similar to warm-orange |
| sunset-horizon | tweakcn `/r/themes/sunset-horizon.json` | H35 | Orange-peach, warm neutrals |
| tangerine | tweakcn `/r/themes/tangerine.json` | H36 | Orange primary, blue-tinted neutrals |
| solar-dusk | tweakcn `/r/themes/solar-dusk.json` | H49 | Golden orange, warm dark mode |
| nature | tweakcn `/r/themes/nature.json` | H144 | Green primary, earthy neutrals |

tweakcn themes have ~40 tokens but we only use 26. Missing tokens (`brand`, `highlight`, `info`) are derived from each theme's primary hue.

## Editor UI

### ThemeSelector

- Replace native `<select>` with `Select` / `SelectTrigger` / `SelectContent` from `@synnovator/ui`
- Two `SelectGroup`s: "Platform Themes" (all platform themes, active one marked) + "Hackathon Variants" (when a platform theme is selected, show hackathons with variants)
- "Create Theme" `Button` next to the selector

### ThemeEditorPage State

- `selectedTheme: string` — platform theme slug (replaces `target`)
- `selectedVariant: string | null` — hackathon slug or null for platform-level editing
- `themes: PlatformThemeMeta[]` — fetched from API on mount

### Hackathon Variant Preview

When editing a hackathon variant, the Page preview tab loads actual hackathon data (name, type, tracks) via `getHackathon()` instead of mock content.

## API Changes

### GET `/api/admin/theme`

- `?action=list` → `{ themes: [{ id, name, name_zh, active }] }`
- `?theme={name}` → full platform theme data
- `?theme={name}&hackathon={slug}` → `{ base: {...}, overrides: {...} }`

### POST `/api/admin/theme`

Body: `{ type: 'platform' | 'hackathon-variant', themeName, hackathonSlug?, name?, name_zh?, description?, light, dark, fonts?, radius? }`

## Schema Changes

```typescript
// New
platformThemeSchema = z.object({
  name: z.string().min(1),
  name_zh: z.string().optional(),
  description: z.string().optional(),
  light: fullTokenMapSchema,
  dark: fullTokenMapSchema,
  fonts: fontsSchema.optional(),
  radius: z.string().optional(),
});

// Updated submission
platformThemeSubmissionSchema = z.object({
  type: z.enum(['platform', 'hackathon-variant']),
  themeName: z.string().min(1),
  hackathonSlug: z.string().optional(),
  name: z.string().optional(),
  name_zh: z.string().optional(),
  description: z.string().optional(),
  light: tokenMapSchema,
  dark: tokenMapSchema,
  fonts: fontsSchema.optional(),
  radius: z.string().optional(),
  message: z.string().optional(),
});
```

## Migration

1. Create `config/themes/warm-orange.yml` from `config/theme.yml` + metadata
2. Move `hackathons/*/theme.yml` → `hackathons/*/themes/warm-orange.yml`
3. Delete old files after `generate-theme-css.mjs` is updated
4. Backward compatibility: CSS script checks new paths first, falls back to old
