# Icon Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate 31 custom Synnovator SVG icons via vite-plugin-svgr, replace existing inline SVGs, and add branded icons to key UI locations.

**Architecture:** Raw SVG files in `site/src/assets/icons/`, transformed to React components at build time via `vite-plugin-svgr` with `?react` import suffix. Barrel file re-exports all icons with a `withSize` wrapper providing a `size` prop (default 24). Keep lucide-react for shadcn/ui form controls.

**Tech Stack:** Astro 5.5 + React 19 + vite-plugin-svgr + @svgr/plugin-svgo + @svgr/plugin-jsx

---

### Task 1: Extract SVG files into site assets

**Files:**
- Create: `site/src/assets/icons/` directory with 31 `.svg` files

**Step 1: Create the icons directory and extract SVGs**

```bash
cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/upload-icon
mkdir -p site/src/assets/icons
unzip -o synnovator-icon.zip -d site/src/assets/icons/
```

**Step 2: Verify all 31 files are present**

```bash
ls site/src/assets/icons/*.svg | wc -l
# Expected: 31
```

**Step 3: Commit**

```bash
git add site/src/assets/icons/
git commit -m "feat(site): add 31 custom Synnovator SVG icons"
```

---

### Task 2: Install vite-plugin-svgr and dependencies

**Files:**
- Modify: `site/package.json`

**Step 1: Install the SVGR Vite plugin and its sub-plugins**

```bash
cd site
pnpm add -D vite-plugin-svgr @svgr/plugin-svgo @svgr/plugin-jsx
```

**Step 2: Verify installation**

```bash
cat site/package.json | grep -E "vite-plugin-svgr|@svgr"
# Expected: three devDependencies lines
```

**Step 3: Commit**

```bash
git add site/package.json site/pnpm-lock.yaml
git commit -m "feat(site): add vite-plugin-svgr and SVGR plugins"
```

---

### Task 3: Configure Astro to use vite-plugin-svgr

**Files:**
- Modify: `site/astro.config.mjs` (add svgr import + plugin to vite.plugins array)

**Step 1: Add svgr import and plugin to astro.config.mjs**

The current `site/astro.config.mjs` has this structure:

```js
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import yaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  site: 'https://home.synnovator.space',
  integrations: [react()],
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  vite: {
    plugins: [tailwindcss(), yaml()],
    // ...
  },
});
```

Add `import svgr from 'vite-plugin-svgr';` after the yaml import, and add `svgr(...)` to the `vite.plugins` array:

```js
import svgr from 'vite-plugin-svgr';
```

Update plugins array to:

```js
plugins: [
  tailwindcss(),
  yaml(),
  svgr({
    include: '**/*.svg?react',
    svgrOptions: {
      plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
      svgoConfig: {
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                removeViewBox: false,
              },
            },
          },
        ],
      },
    },
  }),
],
```

> **Important:** We override `removeViewBox: false` in SVGO's preset-default so SVGs scale correctly when `width`/`height` are changed via the `size` prop.

**Step 2: Verify the build still works**

```bash
cd site && pnpm run build
# Expected: Build succeeds (no icon imports yet, so no functional change)
```

**Step 3: Commit**

```bash
git add site/astro.config.mjs
git commit -m "feat(site): configure vite-plugin-svgr for SVG React components"
```

---

### Task 4: Add TypeScript declaration for *.svg?react imports

**Files:**
- Modify: `site/src/env.d.ts` (add `*.svg?react` module declaration)

**Step 1: Add the SVG module declaration to env.d.ts**

Append the following to the bottom of `site/src/env.d.ts` (after the existing `App` namespace block at line 23):

```ts
declare module '*.svg?react' {
  import type { FunctionComponent, ComponentProps } from 'react';
  const ReactComponent: FunctionComponent<
    ComponentProps<'svg'> & { title?: string }
  >;
  export default ReactComponent;
}
```

**Step 2: Verify TypeScript still passes**

```bash
cd site && pnpm exec astro check
# Expected: No new errors
```

**Step 3: Commit**

```bash
git add site/src/env.d.ts
git commit -m "feat(site): add TypeScript declaration for SVG React imports"
```

---

### Task 5: Create barrel file with withSize wrapper

**Files:**
- Create: `site/src/components/icons/index.ts`

**Step 1: Create the barrel file**

Create `site/src/components/icons/index.ts` with the following content. Each SVG is imported via `?react` and wrapped with `withSize` to provide a `size` prop (default 24):

```ts
import type { ComponentProps, FC } from 'react';

// Raw SVG imports (transformed to React components by vite-plugin-svgr)
import ActivitySvg from '@/assets/icons/activity.svg?react';
import BellSvg from '@/assets/icons/bell.svg?react';
import ClipboardListSvg from '@/assets/icons/clipboard-list.svg?react';
import CopySvg from '@/assets/icons/copy.svg?react';
import CpuSvg from '@/assets/icons/cpu.svg?react';
import CrownSvg from '@/assets/icons/crown.svg?react';
import FilePostSvg from '@/assets/icons/file-post.svg?react';
import FileTextSvg from '@/assets/icons/file-text.svg?react';
import FolderSvg from '@/assets/icons/folder.svg?react';
import GlobeSvg from '@/assets/icons/globe.svg?react';
import HeadsetSvg from '@/assets/icons/headset.svg?react';
import HeartDiamondSvg from '@/assets/icons/heart-diamond.svg?react';
import HexagonTriangleSvg from '@/assets/icons/hexagon-triangle.svg?react';
import ImageSvg from '@/assets/icons/image.svg?react';
import LightbulbSvg from '@/assets/icons/lightbulb.svg?react';
import LogOutSvg from '@/assets/icons/log-out.svg?react';
import LogoDarkSvg from '@/assets/icons/logo-dark.svg?react';
import LogoLightSvg from '@/assets/icons/logo-light.svg?react';
import MapPinSvg from '@/assets/icons/map-pin.svg?react';
import MessageSquareSvg from '@/assets/icons/message-square.svg?react';
import MonitorPlaySvg from '@/assets/icons/monitor-play.svg?react';
import OrbitSvg from '@/assets/icons/orbit.svg?react';
import RocketSvg from '@/assets/icons/rocket.svg?react';
import ShieldCheckSvg from '@/assets/icons/shield-check.svg?react';
import SparklesSvg from '@/assets/icons/sparkles.svg?react';
import TrashSvg from '@/assets/icons/trash.svg?react';
import TrophySvg from '@/assets/icons/trophy.svg?react';
import UfoSvg from '@/assets/icons/ufo.svg?react';
import UserCrownTransferSvg from '@/assets/icons/user-crown-transfer.svg?react';
import UserSwitchSvg from '@/assets/icons/user-switch.svg?react';
import VideoSvg from '@/assets/icons/video.svg?react';

export type IconProps = ComponentProps<'svg'> & { size?: number };

function withSize(SvgComponent: FC<ComponentProps<'svg'>>): FC<IconProps> {
  const Wrapped: FC<IconProps> = ({ size = 24, ...props }) => (
    <SvgComponent width={size} height={size} {...props} />
  );
  Wrapped.displayName = SvgComponent.displayName || SvgComponent.name;
  return Wrapped;
}

export const ActivityIcon = withSize(ActivitySvg);
export const BellIcon = withSize(BellSvg);
export const ClipboardListIcon = withSize(ClipboardListSvg);
export const CopyIcon = withSize(CopySvg);
export const CpuIcon = withSize(CpuSvg);
export const CrownIcon = withSize(CrownSvg);
export const FilePostIcon = withSize(FilePostSvg);
export const FileTextIcon = withSize(FileTextSvg);
export const FolderIcon = withSize(FolderSvg);
export const GlobeIcon = withSize(GlobeSvg);
export const HeadsetIcon = withSize(HeadsetSvg);
export const HeartDiamondIcon = withSize(HeartDiamondSvg);
export const HexagonTriangleIcon = withSize(HexagonTriangleSvg);
export const ImageIcon = withSize(ImageSvg);
export const LightbulbIcon = withSize(LightbulbSvg);
export const LogOutIcon = withSize(LogOutSvg);
export const LogoDark = withSize(LogoDarkSvg);
export const LogoLight = withSize(LogoLightSvg);
export const MapPinIcon = withSize(MapPinSvg);
export const MessageSquareIcon = withSize(MessageSquareSvg);
export const MonitorPlayIcon = withSize(MonitorPlaySvg);
export const OrbitIcon = withSize(OrbitSvg);
export const RocketIcon = withSize(RocketSvg);
export const ShieldCheckIcon = withSize(ShieldCheckSvg);
export const SparklesIcon = withSize(SparklesSvg);
export const TrashIcon = withSize(TrashSvg);
export const TrophyIcon = withSize(TrophySvg);
export const UfoIcon = withSize(UfoSvg);
export const UserCrownTransferIcon = withSize(UserCrownTransferSvg);
export const UserSwitchIcon = withSize(UserSwitchSvg);
export const VideoIcon = withSize(VideoSvg);
```

**Step 2: Verify the build works with the barrel file**

```bash
cd site && pnpm run build
# Expected: Build succeeds (icons are importable but not yet used in pages)
```

**Step 3: Commit**

```bash
git add site/src/components/icons/index.ts
git commit -m "feat(site): create icon barrel file with size wrapper"
```

---

### Task 6: Replace NavBar logo text with LogoDark component

**Files:**
- Modify: `site/src/components/NavBar.astro` (line 7-9: replace text "Synnovator" with LogoDark SVG)

**Step 1: Update NavBar.astro**

In the frontmatter (`---` block), add the import:

```astro
---
import OAuthButton from './OAuthButton';
import { LogoDark } from './icons';
---
```

Replace line 7-9 (the `<a>` with text "Synnovator"):

```astro
<!-- Before -->
<a href="/" class="flex items-center gap-2 text-lime-primary font-heading font-bold text-xl hover:opacity-80 transition-opacity">
  Synnovator
</a>

<!-- After -->
<a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
  <LogoDark size={36} />
</a>
```

> Note: LogoDark has a natural aspect ratio of 72x36 (2:1). Setting `size={36}` sets height to 36px — but since `withSize` sets both width and height to the same value, and the SVG has `viewBox="0 0 72 36"`, we need to adjust. The logo SVGs are special cases — they should use explicit width/height instead of the `size` prop.

Actually, for logos with non-square aspect ratios, import the raw SVG component directly and set explicit dimensions:

```astro
---
import OAuthButton from './OAuthButton';
import LogoDarkSvg from '@/assets/icons/logo-dark.svg?react';
---
```

```astro
<a href="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
  <LogoDarkSvg width={72} height={36} />
</a>
```

**Step 2: Verify visually with dev server**

```bash
cd site && pnpm run dev
# Open http://localhost:4321 and check navbar shows the Synnovator logo SVG
```

**Step 3: Commit**

```bash
git add site/src/components/NavBar.astro
git commit -m "feat(site): replace navbar text with LogoDark SVG logo"
```

---

### Task 7: Replace JudgeCard inline check-circle SVG with ShieldCheckIcon

**Files:**
- Modify: `site/src/components/JudgeCard.astro` (lines 57-66: replace inline SVG)

**Step 1: Update JudgeCard.astro**

In the frontmatter, add:

```astro
---
import { localize } from '../lib/i18n';
import type { Lang } from '../lib/i18n';
import { ShieldCheckIcon } from './icons';

// ... rest of frontmatter
---
```

Replace lines 63-65 (the inline SVG inside the conflict declaration link):

```astro
<!-- Before -->
<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>

<!-- After -->
<ShieldCheckIcon size={14} className="shrink-0" />
```

> Note: The old icon was `w-3 h-3` (12px). Our branded icon at 14px (`size={14}`) matches well in this context since it's a bit more detailed.

**Step 2: Verify visually**

Navigate to a hackathon detail page that has judges with conflict declarations and verify the icon renders.

**Step 3: Commit**

```bash
git add site/src/components/JudgeCard.astro
git commit -m "feat(site): replace JudgeCard inline SVG with ShieldCheckIcon"
```

---

### Task 8: Add TrophyIcon and MapPinIcon to HackathonCard

**Files:**
- Modify: `site/src/components/HackathonCard.astro`

**Step 1: Update HackathonCard.astro**

In the frontmatter, add:

```astro
---
import { getCurrentStage, t, localize } from '../lib/i18n';
import type { Lang } from '../lib/i18n';
import { TrophyIcon } from './icons';

// ... rest unchanged
---
```

Add a TrophyIcon as a decorative element in the card. Insert before the title `<h3>` (after the badges div, around line 46):

```astro
<!-- Add a small trophy icon accent before the title -->
<div class="flex items-center gap-2 mb-2">
  <TrophyIcon size={20} className="shrink-0 opacity-60" />
  <h3 class="text-white font-heading font-bold text-lg group-hover:text-lime-primary transition-colors">
    {localize(lang, hackathon.name, hackathon.name_zh)}
  </h3>
</div>
```

This replaces the existing standalone `<h3>` at lines 49-51.

**Step 2: Verify visually**

```bash
cd site && pnpm run dev
# Open http://localhost:4321 and check hackathon cards show trophy icon before titles
```

**Step 3: Commit**

```bash
git add site/src/components/HackathonCard.astro
git commit -m "feat(site): add TrophyIcon to hackathon cards"
```

---

### Task 9: Add icons to hackathon detail page section headers

**Files:**
- Modify: `site/src/pages/hackathons/[...slug].astro`

**Step 1: Import icons in the frontmatter**

Add to the imports at the top of the frontmatter (after line 15):

```astro
import { RocketIcon, CrownIcon, ClipboardListIcon, ShieldCheckIcon } from '../../components/icons';
```

**Step 2: Add RocketIcon to the Submit Project button area**

Find the submission stage button (line 102-109) and add the RocketIcon inside:

```astro
{(stage === 'submission') && (
  <div class="inline-flex items-center gap-2">
    <RocketIcon size={20} className="shrink-0" />
    <GitHubRedirect
      action="submit"
      hackathonSlug={h.slug}
      label={t(lang, 'hackathon.submit')}
      class="bg-lime-primary text-near-black hover:bg-lime-primary/80"
    />
  </div>
)}
```

**Step 3: Add ClipboardListIcon to the Eligibility section header**

Find the eligibility section `<h2>` (line 177) and update:

```astro
<h2 class="text-xl font-heading font-bold text-white mb-4 flex items-center gap-2">
  <ClipboardListIcon size={22} className="shrink-0" />
  {t(lang, 'hackathon.eligibility')}
</h2>
```

**Step 4: Add ShieldCheckIcon to the Legal section header**

Find the legal section `<h2>` (line 206) and update:

```astro
<h2 class="text-xl font-heading font-bold text-white mb-4 flex items-center gap-2">
  <ShieldCheckIcon size={22} className="shrink-0" />
  {t(lang, 'hackathon.legal')}
</h2>
```

**Step 5: Verify visually**

```bash
cd site && pnpm run dev
# Navigate to a hackathon detail page and verify icons appear in section headers
```

**Step 6: Commit**

```bash
git add site/src/pages/hackathons/\\[...slug\\].astro
git commit -m "feat(site): add branded icons to hackathon detail page sections"
```

---

### Task 10: Add SparklesIcon to hacker profile page

**Files:**
- Modify: `site/src/pages/hackers/[...id].astro`

**Step 1: Import SparklesIcon in the frontmatter**

Add after the existing imports (around line 5):

```astro
import { SparklesIcon } from '../../components/icons';
```

**Step 2: Add SparklesIcon to the Skills section header**

Find the skills section `<h2>` (line 52) and update:

```astro
<h2 class="text-lg font-heading font-bold text-white mb-4 flex items-center gap-2">
  <SparklesIcon size={20} className="shrink-0" />
  {t(lang, 'profile.skills')}
</h2>
```

**Step 3: Verify visually**

```bash
cd site && pnpm run dev
# Navigate to a hacker profile page and verify the sparkles icon appears
```

**Step 4: Commit**

```bash
git add site/src/pages/hackers/\\[...id\\].astro
git commit -m "feat(site): add SparklesIcon to hacker profile skills section"
```

---

### Task 11: Build verification and cleanup

**Files:**
- Remove: `synnovator-icon.zip` from worktree root (was only needed for extraction)

**Step 1: Run full build**

```bash
cd site && pnpm run build
# Expected: Build succeeds with zero errors
```

**Step 2: Remove the zip file from worktree root**

```bash
rm synnovator-icon.zip
```

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: remove synnovator-icon.zip after extraction"
```

---

## Summary of Changes

| Task | What | Files Changed |
|------|------|---------------|
| 1 | Extract 31 SVG files | `site/src/assets/icons/*.svg` (31 new) |
| 2 | Install dependencies | `site/package.json`, `site/pnpm-lock.yaml` |
| 3 | Configure Astro/Vite | `site/astro.config.mjs` |
| 4 | TypeScript declaration | `site/src/env.d.ts` |
| 5 | Barrel file with withSize | `site/src/components/icons/index.ts` (new) |
| 6 | NavBar logo | `site/src/components/NavBar.astro` |
| 7 | JudgeCard icon | `site/src/components/JudgeCard.astro` |
| 8 | HackathonCard icon | `site/src/components/HackathonCard.astro` |
| 9 | Hackathon detail icons | `site/src/pages/hackathons/[...slug].astro` |
| 10 | Profile skills icon | `site/src/pages/hackers/[...id].astro` |
| 11 | Cleanup + verify build | Remove zip, full build check |
