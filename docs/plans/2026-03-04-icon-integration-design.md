# Icon Integration Design

**Date:** 2026-03-04
**Status:** Approved

## Goal

Integrate 31 custom Synnovator SVG icons into the site using `vite-plugin-svgr`, replacing inline SVGs where applicable and adding branded icons to key UI locations.

## Icon Set

31 multi-color SVGs (32x32, except logos at 72x36):
- **Colors:** `#00000E` (outlines), `#BBFD3B` (lime accent), `white` (fills)
- **Special:** `activity.svg` uses `#41FAF4` (cyan), `trash.svg` uses `#FA541C` (red), `sparkles.svg` has a gradient
- **Logos:** `logo-dark.svg` (black), `logo-light.svg` (white)

Full list: activity, bell, clipboard-list, copy, cpu, crown, file-post, file-text, folder, globe, headset, heart-diamond, hexagon-triangle, image, lightbulb, log-out, logo-dark, logo-light, map-pin, message-square, monitor-play, orbit, rocket, shield-check, sparkles, trash, trophy, ufo, user-crown-transfer, user-switch, video

## Architecture

### Approach: Raw SVG Files + vite-plugin-svgr

Keep `.svg` files in `src/assets/icons/`, use `vite-plugin-svgr` to auto-generate React components at build time via `?react` import suffix.

### File Structure

```
site/
├── src/
│   ├── assets/
│   │   └── icons/           # 31 raw SVG files
│   │       ├── activity.svg
│   │       ├── bell.svg
│   │       └── ...
│   ├── components/
│   │   └── icons/
│   │       └── index.ts     # Barrel: re-exports with size wrapper
│   └── files.d.ts           # TypeScript: declare *.svg?react module
├── astro.config.mjs          # Add vite-plugin-svgr to vite.plugins
└── package.json              # +vite-plugin-svgr, @svgr/plugin-svgo, @svgr/plugin-jsx
```

### Dependencies

```
pnpm add -D vite-plugin-svgr @svgr/plugin-svgo @svgr/plugin-jsx
```

### Astro Config

```js
// astro.config.mjs
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  vite: {
    plugins: [
      svgr({
        include: '**/*.svg?react',
        svgrOptions: {
          plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
          svgoConfig: {
            plugins: ['preset-default', 'removeTitle', 'removeDesc', 'removeDoctype', 'cleanupIds'],
          },
        },
      }),
    ],
  },
});
```

### TypeScript Declaration

```ts
// src/files.d.ts
declare module '*.svg?react' {
  import * as React from 'react';
  const ReactComponent: React.FunctionComponent<
    React.ComponentProps<'svg'> & { title?: string }
  >;
  export default ReactComponent;
}
```

### Barrel File with Size Wrapper

```ts
// src/components/icons/index.ts
import type { ComponentProps, FC } from 'react';
import ActivitySvg from '@/assets/icons/activity.svg?react';
// ... all 31 imports

type IconProps = ComponentProps<'svg'> & { size?: number };

function withSize(SvgComponent: FC<ComponentProps<'svg'>>): FC<IconProps> {
  const Wrapped: FC<IconProps> = ({ size = 24, ...props }) => (
    <SvgComponent width={size} height={size} {...props} />
  );
  return Wrapped;
}

export const ActivityIcon = withSize(ActivitySvg);
// ... all 31 exports
```

### Usage

```tsx
// In .tsx React islands
import { TrophyIcon, RocketIcon } from '@/components/icons';
<TrophyIcon size={24} />
<RocketIcon size={32} className="shrink-0" />

// In .astro files (renders at build time)
import { TrophyIcon } from '@/components/icons';
<TrophyIcon size={24} />
```

## Icon Placement Map

### Replacements (existing inline SVGs)

| Location | Current | Replace With |
|----------|---------|-------------|
| `NavBar.astro` logo area | Text "Synnovator" | `LogoDark` / `LogoLight` |
| `JudgeCard.astro` (line 44) | Inline check-circle SVG | `ShieldCheckIcon` |

**Kept as-is:** GitHub logo SVGs in `NavBar.astro`, `OAuthButton.tsx` (third-party logo, not in custom set). Search magnifier in `index.astro` (not in custom set).

### New Icon Placements

| Location | Icon | Purpose |
|----------|------|---------|
| `HackathonCard.astro` | `TrophyIcon` | Visual accent on cards |
| `HackathonCard.astro` | `MapPinIcon` | Location display |
| `[...slug].astro` (hackathon detail) | `RocketIcon` | "Submit Project" section |
| `[...slug].astro` (hackathon detail) | `CrownIcon` | Prizes/winners section |
| `[...slug].astro` (hackathon detail) | `ClipboardListIcon` | Rules/requirements |
| Navigation dropdown (future) | `LogOutIcon` | Sign out action |
| Navigation dropdown (future) | `UserSwitchIcon` | Profile switch |
| `hackers/[...id].astro` (profile) | `SparklesIcon` | Achievements/badges |
| Homepage feature sections | `CpuIcon`, `GlobeIcon`, `LightbulbIcon` | Feature highlights |

## Decisions

- **Keep lucide-react** for shadcn/ui form controls (CheckIcon, ChevronDownIcon, etc.) — these are monochrome/functional icons
- **Keep GitHub inline SVGs** — third-party logo not in custom set
- **Size prop default 24px** — matches lucide-react convention
- **No currentColor** — these are multi-color branded icons, colors baked in

## References

- [vite-plugin-svgr](https://github.com/pd4d10/vite-plugin-svgr)
- [Use SVGs as React Components in Astro](https://doray.me/articles/use-svgs-as-react-components-in-astro-MNUvh/)
