# MDX Editor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add MDX rich-text editing with image/PDF upload for hackathons, proposals, and profiles.

**Architecture:** Editor SDK in `packages/ui` (CodeMirror 6 + split-pane preview), 11 custom MDX components reusing existing UI primitives, DataProvider abstraction unifying data access, and scene pages under `(auth)/edit/` route group. Files upload to R2 temp bucket for preview, then commit to Git via multi-file PR (Git Tree API).

**Tech Stack:** CodeMirror 6 (`@uiw/react-codemirror`), `@mdx-js/mdx` (compile + run), `remark-gfm`, `rehype-highlight`, Cloudflare R2, GitHub App (Octokit Git Tree API)

**Spec:** `docs/specs/2026-03-13-mdx-editor-design.md`

---

## Dependency Graph

```
Layer 0 (Foundation) ── no deps, all parallel
  Task 1: Dependencies
  Task 2: Types & DataProvider interface
  Task 3: i18n translations
  Task 4: Template files

Layer 1 (Components & APIs) ── depends on Layer 0, all parallel within layer
  Task 5:  MDX Components — Common (Callout, ImageGallery, Video)
  Task 6:  MDX Components — Hackathon (Timeline, PrizeTable, SponsorGrid)
  Task 7:  MDX Components — Proposal (TechStack, DemoEmbed, TeamRoles)
  Task 8:  MDX Components — Profile (ProjectShowcase, SkillBadges)
  Task 9:  API /api/r2/upload
  Task 10: API /api/r2/download (rename presign)
  Task 11: API /api/submit-pr refactor (Git Tree API)

Layer 2 (Editor SDK) ── depends on Tasks 5-8 (MDX components)
  Task 12: Editor SDK — core components

Layer 3 (Integration) ── depends on Layer 2
  Task 13: Build pipeline — generate-static-data.mjs + DataProvider impls
  Task 14: Scene page — hackathon editor
  Task 15: Scene page — proposal editor
  Task 16: Scene page — profile editor
  Task 17: Detail page edit buttons

Layer 4 (Finalization) ── depends on Layer 3
  Task 18: Form extensions (create forms generate templates)
  Task 19: CI workflows (validate-mdx, upload-assets expansion, r2-cleanup)
```

**Parallel execution strategy:** Launch Tasks 1-4 together. Once done, launch Tasks 5-11 together (7 parallel agents). Then Task 12. Then Tasks 13-17 (5 parallel). Finally Tasks 18-19.

---

## File Structure

### New files to create

```
# DataProvider & types
packages/shared/src/data/provider.ts              # DataProvider interface + SerializedMDX type
packages/shared/src/data/static-provider.ts        # StaticDataProvider implementation
packages/shared/src/data/fs-provider.ts            # FsDataProvider implementation

# MDX custom components (packages/ui)
packages/ui/src/components/mdx-components/index.ts
packages/ui/src/components/mdx-components/common/Callout.tsx
packages/ui/src/components/mdx-components/common/ImageGallery.tsx
packages/ui/src/components/mdx-components/common/Video.tsx
packages/ui/src/components/mdx-components/hackathon/Timeline.tsx
packages/ui/src/components/mdx-components/hackathon/PrizeTable.tsx
packages/ui/src/components/mdx-components/hackathon/SponsorGrid.tsx
packages/ui/src/components/mdx-components/proposal/TechStack.tsx
packages/ui/src/components/mdx-components/proposal/DemoEmbed.tsx
packages/ui/src/components/mdx-components/proposal/TeamRoles.tsx
packages/ui/src/components/mdx-components/profile/ProjectShowcase.tsx
packages/ui/src/components/mdx-components/profile/SkillBadges.tsx

# Editor SDK (packages/ui)
packages/ui/src/components/editor/types.ts
packages/ui/src/components/editor/EditorPane.tsx
packages/ui/src/components/editor/PreviewPane.tsx
packages/ui/src/components/editor/EditorToolbar.tsx
packages/ui/src/components/editor/ImageUploader.tsx
packages/ui/src/components/editor/ComponentInserter.tsx
packages/ui/src/components/editor/MdxEditor.tsx

# API routes
apps/web/app/api/r2/upload/route.ts
apps/web/app/api/r2/download/route.ts             # moved from api/presign

# Scene pages
apps/web/app/(auth)/edit/layout.tsx
apps/web/app/(auth)/edit/hackathon/[slug]/page.tsx
apps/web/app/(auth)/edit/proposal/[hackathon]/[team]/page.tsx
apps/web/app/(auth)/edit/profile/[username]/page.tsx

# Templates
config/templates/hackathon/description.mdx
config/templates/hackathon/description.zh.mdx
config/templates/hackathon/track.mdx
config/templates/hackathon/track.zh.mdx
config/templates/hackathon/stage.mdx
config/templates/hackathon/stage.zh.mdx
config/templates/proposal/README.mdx
config/templates/proposal/README.zh.mdx
config/templates/profile/bio.mdx
config/templates/profile/bio.zh.mdx

# CI
.github/workflows/validate-mdx.yml
.github/workflows/r2-cleanup.yml
scripts/validate-mdx.mjs

# Data provider entry point
apps/web/lib/data.ts
```

### Existing files to modify

```
packages/ui/package.json                           # add @mdx-js/mdx, codemirror deps
packages/shared/package.json                       # add @mdx-js/mdx
packages/shared/src/i18n/zh.json                   # add editor.* keys
packages/shared/src/i18n/en.json                   # add editor.* keys
packages/shared/src/data/index.ts                  # export DataProvider
apps/web/package.json                              # add codemirror deps
apps/web/scripts/generate-static-data.mjs          # add MDX compilation
apps/web/app/_generated/data.ts                    # mark @deprecated
apps/web/app/api/submit-pr/route.ts                # Git Tree API refactor
apps/web/app/(public)/hackathons/[slug]/page.tsx   # add edit button
apps/web/app/(public)/projects/[hackathon]/[team]/page.tsx  # update edit button
apps/web/app/(public)/hackers/[id]/page.tsx        # add edit button
apps/web/components/EditProjectButton.tsx           # refactor to in-app link
apps/web/components/forms/CreateHackathonForm.tsx   # add template files to PR
apps/web/components/forms/CreateProposalForm.tsx    # add template files to PR
apps/web/components/forms/ProfileCreateForm.tsx     # add template files to PR
.github/workflows/upload-assets.yml                # expand trigger paths
```

---

## Chunk 1: Foundation

### Task 1: Install Dependencies

**Files:**
- Modify: `packages/ui/package.json`
- Modify: `packages/shared/package.json`
- Modify: `apps/web/package.json`

- [ ] **Step 1: Add dependencies to packages/ui**

```bash
cd packages/ui && pnpm add @mdx-js/mdx remark-gfm rehype-highlight @uiw/react-codemirror @codemirror/lang-markdown @codemirror/lang-javascript
```

- [ ] **Step 2: Add dependencies to packages/shared**

```bash
cd packages/shared && pnpm add @mdx-js/mdx
```

- [ ] **Step 3: Install from root**

```bash
pnpm install
```

- [ ] **Step 4: Verify build still works**

Run: `pnpm build`
Expected: Build succeeds with no errors

- [ ] **Step 5: Commit**

```bash
git add packages/ui/package.json packages/shared/package.json pnpm-lock.yaml
git commit -m "chore: add MDX editor dependencies"
```

---

### Task 2: Types & DataProvider Interface

**Files:**
- Create: `packages/shared/src/data/provider.ts`
- Modify: `packages/shared/src/data/index.ts`

- [ ] **Step 1: Create DataProvider interface**

Create `packages/shared/src/data/provider.ts`:

```typescript
import type { Hackathon } from '../schemas/hackathon';
import type { Profile } from '../schemas/profile';
import type { Lang } from '../i18n';

/**
 * MDX 编译后的序列化格式。
 * 使用 @mdx-js/mdx compile() 的 outputFormat: 'function-body' 输出。
 * 可通过 @mdx-js/mdx 的 run() 执行为 React 组件。
 */
export type SerializedMDX = string;

export interface SubmissionWithMeta {
  _hackathonSlug: string;
  _teamSlug: string;
  synnovator_submission: string;
  project: {
    name: string;
    name_zh?: string;
    tagline?: string;
    tagline_zh?: string;
    track: string;
    team: Array<{ github: string; role?: string }>;
    deliverables?: Record<string, unknown>;
    tech_stack?: string[];
    description?: string;
    description_zh?: string;
    likes?: number;
  };
}

/**
 * Unified data access interface.
 * Two implementations: StaticDataProvider (Cloudflare Workers) and FsDataProvider (Node.js).
 */
export interface DataProvider {
  // YAML data
  listHackathons(): Hackathon[];
  getHackathon(slug: string): Hackathon | null;
  listProfiles(): Profile[];
  getProfile(github: string): Profile | null;
  getProfileByFilestem(filestem: string): Profile | null;
  listSubmissions(): SubmissionWithMeta[];
  getResults(hackathonSlug: string): unknown[];

  // MDX content
  getHackathonMdx(slug: string, lang: Lang): SerializedMDX | null;
  getTrackMdx(hackathonSlug: string, trackSlug: string, lang: Lang): SerializedMDX | null;
  getStageMdx(hackathonSlug: string, stageKey: string, lang: Lang): SerializedMDX | null;
  getSubmissionMdx(hackathonSlug: string, teamSlug: string, lang: Lang): SerializedMDX | null;
  getProfileMdx(filestem: string, lang: Lang): SerializedMDX | null;
}
```

- [ ] **Step 2: Export from data index**

Add to `packages/shared/src/data/index.ts`:

```typescript
export type { DataProvider, SerializedMDX, SubmissionWithMeta } from './provider';
```

- [ ] **Step 3: Verify build**

Run: `pnpm --filter @synnovator/shared build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/data/provider.ts packages/shared/src/data/index.ts
git commit -m "feat(shared): add DataProvider interface and SerializedMDX type"
```

---

### Task 3: i18n Translations

**Files:**
- Modify: `packages/shared/src/i18n/zh.json`
- Modify: `packages/shared/src/i18n/en.json`

- [ ] **Step 1: Add editor keys to zh.json**

Add the `editor` object to the existing JSON (preserve all existing keys):

```json
{
  "editor": {
    "save": "提交更改",
    "preview": "预览",
    "insertComponent": "插入组件",
    "uploadImage": "上传图片",
    "uploadPdf": "上传 PDF",
    "switchLang": "切换语言",
    "unsavedChanges": "有未保存的更改，确定离开？",
    "imageExceedsLimit": "图片大小不能超过 5MB",
    "pdfExceedsLimit": "PDF 大小不能超过 20MB",
    "submitPr": "提交 PR",
    "prCreated": "PR 已创建",
    "editContent": "编辑内容",
    "autoSaved": "已自动保存",
    "draftDetected": "检测到未提交的草稿，是否恢复？",
    "restore": "恢复",
    "discard": "放弃",
    "compileError": "MDX 编译错误",
    "noPermission": "你没有编辑此内容的权限",
    "uploading": "上传中...",
    "submitSuccess": "PR 已创建，等待审核",
    "description": "活动描述",
    "trackDescription": "赛道描述",
    "stageDescription": "阶段描述"
  }
}
```

- [ ] **Step 2: Add editor keys to en.json**

```json
{
  "editor": {
    "save": "Submit Changes",
    "preview": "Preview",
    "insertComponent": "Insert Component",
    "uploadImage": "Upload Image",
    "uploadPdf": "Upload PDF",
    "switchLang": "Switch Language",
    "unsavedChanges": "You have unsaved changes. Are you sure you want to leave?",
    "imageExceedsLimit": "Image size cannot exceed 5MB",
    "pdfExceedsLimit": "PDF size cannot exceed 20MB",
    "submitPr": "Submit PR",
    "prCreated": "PR Created",
    "editContent": "Edit Content",
    "autoSaved": "Auto-saved",
    "draftDetected": "Unsaved draft detected. Restore it?",
    "restore": "Restore",
    "discard": "Discard",
    "compileError": "MDX Compile Error",
    "noPermission": "You do not have permission to edit this content",
    "uploading": "Uploading...",
    "submitSuccess": "PR created, awaiting review",
    "description": "Description",
    "trackDescription": "Track Description",
    "stageDescription": "Stage Description"
  }
}
```

- [ ] **Step 3: Verify i18n loads**

Run: `pnpm --filter @synnovator/shared test`
Expected: All existing tests pass (i18n tests should still work)

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/i18n/zh.json packages/shared/src/i18n/en.json
git commit -m "feat(i18n): add editor translation keys (zh + en)"
```

---

### Task 4: Template Files

**Files:**
- Create: `config/templates/hackathon/description.mdx`
- Create: `config/templates/hackathon/description.zh.mdx`
- Create: `config/templates/hackathon/track.mdx`
- Create: `config/templates/hackathon/track.zh.mdx`
- Create: `config/templates/hackathon/stage.mdx`
- Create: `config/templates/hackathon/stage.zh.mdx`
- Create: `config/templates/proposal/README.mdx`
- Create: `config/templates/proposal/README.zh.mdx`
- Create: `config/templates/profile/bio.mdx`
- Create: `config/templates/profile/bio.zh.mdx`

- [ ] **Step 1: Create hackathon description template (en)**

Create `config/templates/hackathon/description.mdx`:

```mdx
# About {hackathon-name}

{/* Describe the hackathon's background, goals, and highlights */}

## Participation Guide

{/* Eligibility, rules, and requirements */}

## Prizes

<PrizeTable
  prizes={[
    { rank: "1st Place", reward: "TBD", count: 1 },
    { rank: "2nd Place", reward: "TBD", count: 2 },
  ]}
/>

## Sponsors

<SponsorGrid
  sponsors={[
    { name: "TBD", logo: "", tier: "gold" },
  ]}
/>
```

- [ ] **Step 2: Create hackathon description template (zh)**

Create `config/templates/hackathon/description.zh.mdx`:

```mdx
# 关于 {hackathon-name}

{/* 请在此介绍活动的背景、目标和亮点 */}

## 参赛须知

{/* 参赛资格、规则等 */}

## 奖项设置

<PrizeTable
  prizes={[
    { rank: "🥇 一等奖", reward: "待填写", count: 1 },
    { rank: "🥈 二等奖", reward: "待填写", count: 2 },
  ]}
/>

## 赞助伙伴

<SponsorGrid
  sponsors={[
    { name: "待填写", logo: "", tier: "gold" },
  ]}
/>
```

- [ ] **Step 3: Create track templates**

Create `config/templates/hackathon/track.mdx`:

```mdx
# {track-name}

{/* Describe this track's theme, goals, and evaluation criteria */}

## What We're Looking For

{/* Key areas of focus for submissions in this track */}

## Resources

{/* Helpful links, datasets, APIs, or documentation for participants */}
```

Create `config/templates/hackathon/track.zh.mdx`:

```mdx
# {track-name}

{/* 描述此赛道的主题、目标和评审标准 */}

## 我们期待的作品

{/* 此赛道提交作品的重点关注领域 */}

## 资源

{/* 参赛者可使用的链接、数据集、API 或文档 */}
```

- [ ] **Step 4: Create stage templates**

Create `config/templates/hackathon/stage.mdx`:

```mdx
# {stage-name}

{/* Describe what happens during this stage */}

## Key Dates

<Timeline
  items={[
    { date: "{start-date}", label: "Start", status: "upcoming" },
    { date: "{end-date}", label: "End", status: "upcoming" },
  ]}
/>

## What to Prepare

{/* Instructions for participants during this stage */}
```

Create `config/templates/hackathon/stage.zh.mdx`:

```mdx
# {stage-name}

{/* 描述此阶段的活动内容 */}

## 关键日期

<Timeline
  items={[
    { date: "{start-date}", label: "开始", status: "upcoming" },
    { date: "{end-date}", label: "结束", status: "upcoming" },
  ]}
/>

## 准备事项

{/* 参赛者在此阶段需要准备的内容 */}
```

- [ ] **Step 5: Create proposal templates**

Create `config/templates/proposal/README.mdx`:

```mdx
# {project-name}

{/* Describe your project: what problem it solves, how it works */}

## Demo

<DemoEmbed url="" height={400} title="Live Demo" />

## Tech Stack

<TechStack items={[]} />

## Team

<TeamRoles
  members={[
    { github: "{leader-github}", role: "leader", contribution: "" },
  ]}
/>

## Screenshots

<ImageGallery
  images={[]}
  columns={2}
/>
```

Create `config/templates/proposal/README.zh.mdx`:

```mdx
# {project-name}

{/* 描述你的项目：解决什么问题、如何工作 */}

## 演示

<DemoEmbed url="" height={400} title="在线演示" />

## 技术栈

<TechStack items={[]} />

## 团队

<TeamRoles
  members={[
    { github: "{leader-github}", role: "leader", contribution: "" },
  ]}
/>

## 截图

<ImageGallery
  images={[]}
  columns={2}
/>
```

- [ ] **Step 6: Create profile templates**

Create `config/templates/profile/bio.mdx`:

```mdx
# About Me

{/* Introduce yourself: background, interests, what you're working on */}

## Skills

<SkillBadges
  skills={[
    { name: "JavaScript", level: "intermediate" },
  ]}
/>

## Projects

<ProjectShowcase
  projects={[]}
/>
```

Create `config/templates/profile/bio.zh.mdx`:

```mdx
# 关于我

{/* 介绍你自己：背景、兴趣、正在做什么 */}

## 技能

<SkillBadges
  skills={[
    { name: "JavaScript", level: "intermediate" },
  ]}
/>

## 项目

<ProjectShowcase
  projects={[]}
/>
```

- [ ] **Step 7: Commit**

```bash
git add config/templates/
git commit -m "feat: add MDX template files for hackathon, proposal, and profile"
```

---

## Chunk 2: MDX Custom Components

> All 4 tasks in this chunk can be executed in parallel by separate subagents.

### Task 5: MDX Components — Common (Callout, ImageGallery, Video)

**Files:**
- Create: `packages/ui/src/components/mdx-components/common/Callout.tsx`
- Create: `packages/ui/src/components/mdx-components/common/ImageGallery.tsx`
- Create: `packages/ui/src/components/mdx-components/common/Video.tsx`

**Reference files to read first:**
- `packages/ui/src/components/alert.tsx` — Alert component to wrap for Callout
- `packages/ui/src/components/dialog.tsx` — Dialog for ImageGallery lightbox
- `packages/ui/src/components/card.tsx` — Card for Video container
- `docs/specs/design-system.md` — OKLCH tokens, spacing, interaction patterns

- [ ] **Step 1: Create Callout component**

Create `packages/ui/src/components/mdx-components/common/Callout.tsx`:

```tsx
import * as React from 'react'
import { Alert, AlertTitle, AlertDescription } from '../../alert'
import { cn } from '../../../lib/utils'

// Lucide icons inlined to avoid dependency on lucide-react in this package
const icons = {
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
  ),
  tip: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" />
    </svg>
  ),
}

const variantMap = {
  info: 'default',
  warning: 'destructive',
  tip: 'default',
} as const

interface CalloutProps {
  type?: 'info' | 'warning' | 'tip'
  title?: string
  children: React.ReactNode
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  return (
    <Alert variant={variantMap[type]} className={cn(type === 'tip' && 'border-highlight/40')}>
      {icons[type]}
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}
```

- [ ] **Step 2: Create ImageGallery component**

Create `packages/ui/src/components/mdx-components/common/ImageGallery.tsx`:

```tsx
'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../../dialog'
import { cn } from '../../../lib/utils'

interface GalleryImage {
  src: string
  alt: string
  caption?: string
}

interface ImageGalleryProps {
  images: GalleryImage[]
  columns?: 2 | 3
}

export function ImageGallery({ images, columns = 2 }: ImageGalleryProps) {
  if (!images?.length) return null

  return (
    <div className={cn('grid gap-4', columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2')}>
      {images.map((img, i) => (
        <Dialog key={i}>
          <DialogTrigger asChild>
            <button type="button" className="group relative overflow-hidden rounded-lg border border-border cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/50">
              <img src={img.src} alt={img.alt} className="w-full h-auto transition-transform duration-200 group-hover:scale-[1.02]" loading="lazy" />
              {img.caption && (
                <span className="absolute bottom-0 inset-x-0 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground">{img.caption}</span>
              )}
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <DialogTitle className="sr-only">{img.alt}</DialogTitle>
            <img src={img.src} alt={img.alt} className="w-full h-auto" />
            {img.caption && <p className="p-4 text-sm text-muted-foreground">{img.caption}</p>}
          </DialogContent>
        </Dialog>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create Video component**

Create `packages/ui/src/components/mdx-components/common/Video.tsx`:

```tsx
import * as React from 'react'
import { Card, CardContent } from '../../card'

interface VideoProps {
  url: string
  title?: string
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`

  // Bilibili
  const biliMatch = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/)
  if (biliMatch) return `https://player.bilibili.com/player.html?bvid=${biliMatch[1]}`

  // Direct video URL — render <video> instead
  return null
}

export function Video({ url, title }: VideoProps) {
  const embedUrl = getEmbedUrl(url)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={title || 'Video'}
            className="w-full aspect-video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video src={url} controls className="w-full aspect-video" title={title}>
            <track kind="captions" />
          </video>
        )}
      </CardContent>
      {title && <p className="px-4 py-2 text-sm text-muted-foreground">{title}</p>}
    </Card>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/mdx-components/common/
git commit -m "feat(ui): add common MDX components (Callout, ImageGallery, Video)"
```

---

### Task 6: MDX Components — Hackathon (Timeline, PrizeTable, SponsorGrid)

**Files:**
- Create: `packages/ui/src/components/mdx-components/hackathon/Timeline.tsx`
- Create: `packages/ui/src/components/mdx-components/hackathon/PrizeTable.tsx`
- Create: `packages/ui/src/components/mdx-components/hackathon/SponsorGrid.tsx`

**Reference files to read first:**
- `packages/ui/src/components/badge.tsx` — Badge variants (brand, highlight, info, outline)
- `packages/ui/src/components/separator.tsx` — Separator for timeline connector
- `packages/ui/src/components/avatar.tsx` — Avatar for sponsor logos
- `docs/specs/design-system.md` — Hackathon type color overrides

- [ ] **Step 1: Create Timeline component**

Create `packages/ui/src/components/mdx-components/hackathon/Timeline.tsx`:

```tsx
import * as React from 'react'
import { Badge } from '../../badge'
import { cn } from '../../../lib/utils'

interface TimelineItem {
  date: string
  label: string
  status: 'completed' | 'active' | 'upcoming'
}

interface TimelineProps {
  items: TimelineItem[]
}

const statusVariant = {
  completed: 'secondary',
  active: 'brand',
  upcoming: 'outline',
} as const

export function Timeline({ items }: TimelineProps) {
  if (!items?.length) return null

  return (
    <div className="relative space-y-6 pl-8">
      {/* Vertical line */}
      <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

      {items.map((item, i) => (
        <div key={i} className="relative flex items-start gap-4">
          {/* Dot */}
          <div className={cn(
            'absolute left-[-20px] top-1.5 h-2.5 w-2.5 rounded-full border-2',
            item.status === 'completed' && 'bg-primary border-primary',
            item.status === 'active' && 'bg-brand border-brand',
            item.status === 'upcoming' && 'bg-background border-muted-foreground',
          )} />

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
            </div>
            <time className="text-xs text-muted-foreground">{item.date}</time>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create PrizeTable component**

Create `packages/ui/src/components/mdx-components/hackathon/PrizeTable.tsx`:

```tsx
import * as React from 'react'
import { Card } from '../../card'
import { Badge } from '../../badge'

interface Prize {
  rank: string
  reward: string
  count: number
}

interface PrizeTableProps {
  prizes: Prize[]
}

export function PrizeTable({ prizes }: PrizeTableProps) {
  if (!prizes?.length) return null

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rank</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reward</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Count</th>
          </tr>
        </thead>
        <tbody>
          {prizes.map((prize, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{prize.rank}</td>
              <td className="px-4 py-3 text-foreground">{prize.reward}</td>
              <td className="px-4 py-3 text-right">
                <Badge variant="outline">{prize.count}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Create SponsorGrid component**

Create `packages/ui/src/components/mdx-components/hackathon/SponsorGrid.tsx`:

```tsx
import * as React from 'react'
import { Card } from '../../card'
import { Badge } from '../../badge'
import { cn } from '../../../lib/utils'

interface Sponsor {
  name: string
  logo: string
  tier: 'platinum' | 'gold' | 'silver'
  url?: string
}

interface SponsorGridProps {
  sponsors: Sponsor[]
}

const tierVariant = {
  platinum: 'brand',
  gold: 'highlight',
  silver: 'info',
} as const

const tierOrder = { platinum: 0, gold: 1, silver: 2 } as const

export function SponsorGrid({ sponsors }: SponsorGridProps) {
  if (!sponsors?.length) return null

  const sorted = [...sponsors].sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {sorted.map((s, i) => {
        const content = (
          <Card key={i} className={cn('flex flex-col items-center gap-3 p-4 transition-all duration-200', s.url && 'hover:border-primary/40')}>
            {s.logo ? (
              <img src={s.logo} alt={s.name} className="h-12 w-auto object-contain" loading="lazy" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-medium text-muted-foreground">
                {s.name.charAt(0)}
              </div>
            )}
            <span className="text-sm font-medium text-foreground text-center">{s.name}</span>
            <Badge variant={tierVariant[s.tier]}>{s.tier}</Badge>
          </Card>
        )

        return s.url ? <a key={i} href={s.url} target="_blank" rel="noopener noreferrer">{content}</a> : content
      })}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/mdx-components/hackathon/
git commit -m "feat(ui): add hackathon MDX components (Timeline, PrizeTable, SponsorGrid)"
```

---

### Task 7: MDX Components — Proposal (TechStack, DemoEmbed, TeamRoles)

**Files:**
- Create: `packages/ui/src/components/mdx-components/proposal/TechStack.tsx`
- Create: `packages/ui/src/components/mdx-components/proposal/DemoEmbed.tsx`
- Create: `packages/ui/src/components/mdx-components/proposal/TeamRoles.tsx`

**Reference files to read first:**
- `packages/ui/src/components/badge.tsx` — Badge for tech tags
- `packages/ui/src/components/card.tsx` — Card for DemoEmbed
- `packages/ui/src/components/avatar.tsx` — Avatar for team members
- `packages/ui/src/components/button.tsx` — Button for fallback link

- [ ] **Step 1: Create TechStack component**

Create `packages/ui/src/components/mdx-components/proposal/TechStack.tsx`:

```tsx
import * as React from 'react'
import { Badge } from '../../badge'

interface TechStackProps {
  items: string[]
}

export function TechStack({ items }: TechStackProps) {
  if (!items?.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} variant="outline">{item}</Badge>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create DemoEmbed component**

Create `packages/ui/src/components/mdx-components/proposal/DemoEmbed.tsx`:

```tsx
import * as React from 'react'
import { Card, CardContent } from '../../card'

interface DemoEmbedProps {
  url: string
  height?: number
  title?: string
}

export function DemoEmbed({ url, height = 400, title }: DemoEmbedProps) {
  if (!url) return null

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <iframe
          src={url}
          title={title || 'Demo'}
          style={{ height: `${height}px` }}
          className="w-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          loading="lazy"
        />
      </CardContent>
      {title && (
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary/80 transition-colors">
            Open in new tab
          </a>
        </div>
      )}
    </Card>
  )
}
```

- [ ] **Step 3: Create TeamRoles component**

Create `packages/ui/src/components/mdx-components/proposal/TeamRoles.tsx`:

```tsx
import * as React from 'react'
import { Card } from '../../card'
import { Badge } from '../../badge'
import { cn } from '../../../lib/utils'

interface TeamMember {
  github: string
  role: string
  contribution?: string
}

interface TeamRolesProps {
  members: TeamMember[]
}

const roleVariant = {
  leader: 'brand',
  developer: 'highlight',
  designer: 'info',
  researcher: 'info',
  mentor: 'outline',
} as const

export function TeamRoles({ members }: TeamRolesProps) {
  if (!members?.length) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {members.map((m) => (
        <Card key={m.github} className="flex items-start gap-3 p-4">
          <img
            src={`https://github.com/${m.github}.png?size=80`}
            alt={m.github}
            className="h-10 w-10 rounded-full"
            loading="lazy"
          />
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <a href={`https://github.com/${m.github}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate">
                @{m.github}
              </a>
              <Badge variant={(roleVariant as Record<string, string>)[m.role] as any || 'outline'}>{m.role}</Badge>
            </div>
            {m.contribution && <p className="text-xs text-muted-foreground">{m.contribution}</p>}
          </div>
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/components/mdx-components/proposal/
git commit -m "feat(ui): add proposal MDX components (TechStack, DemoEmbed, TeamRoles)"
```

---

### Task 8: MDX Components — Profile (ProjectShowcase, SkillBadges) + Index

**Files:**
- Create: `packages/ui/src/components/mdx-components/profile/ProjectShowcase.tsx`
- Create: `packages/ui/src/components/mdx-components/profile/SkillBadges.tsx`
- Create: `packages/ui/src/components/mdx-components/index.ts`

**Reference files to read first:**
- `packages/ui/src/components/card.tsx` — Card components for ProjectShowcase
- `packages/ui/src/components/badge.tsx` — Badge for SkillBadges

- [ ] **Step 1: Create ProjectShowcase component**

Create `packages/ui/src/components/mdx-components/profile/ProjectShowcase.tsx`:

```tsx
import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../card'

interface Project {
  name: string
  description: string
  url?: string
  image?: string
}

interface ProjectShowcaseProps {
  projects: Project[]
}

export function ProjectShowcase({ projects }: ProjectShowcaseProps) {
  if (!projects?.length) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {projects.map((p, i) => (
        <Card key={i} className="overflow-hidden transition-all duration-200 hover:border-primary/40">
          {p.image && (
            <div className="aspect-video overflow-hidden">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-base">{p.name}</CardTitle>
            <CardDescription>{p.description}</CardDescription>
          </CardHeader>
          {p.url && (
            <CardFooter>
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary/80 transition-colors">
                View Project
              </a>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create SkillBadges component**

Create `packages/ui/src/components/mdx-components/profile/SkillBadges.tsx`:

```tsx
import * as React from 'react'
import { Badge } from '../../badge'

interface Skill {
  name: string
  level: 'expert' | 'intermediate' | 'beginner'
}

interface SkillBadgesProps {
  skills: Skill[]
}

const levelVariant = {
  expert: 'brand',
  intermediate: 'highlight',
  beginner: 'outline',
} as const

export function SkillBadges({ skills }: SkillBadgesProps) {
  if (!skills?.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((s) => (
        <Badge key={s.name} variant={levelVariant[s.level]}>
          {s.name}
          <span className="ml-1 opacity-60">· {s.level}</span>
        </Badge>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create index.ts with scene-grouped exports**

Create `packages/ui/src/components/mdx-components/index.ts`:

```typescript
// Common components (available in all scenes)
export { Callout } from './common/Callout'
export { ImageGallery } from './common/ImageGallery'
export { Video } from './common/Video'

// Hackathon components
export { Timeline } from './hackathon/Timeline'
export { PrizeTable } from './hackathon/PrizeTable'
export { SponsorGrid } from './hackathon/SponsorGrid'

// Proposal components
export { TechStack } from './proposal/TechStack'
export { DemoEmbed } from './proposal/DemoEmbed'
export { TeamRoles } from './proposal/TeamRoles'

// Profile components
export { ProjectShowcase } from './profile/ProjectShowcase'
export { SkillBadges } from './profile/SkillBadges'

// Scene-grouped component maps for MDX rendering
import { Callout } from './common/Callout'
import { ImageGallery } from './common/ImageGallery'
import { Video } from './common/Video'
import { Timeline } from './hackathon/Timeline'
import { PrizeTable } from './hackathon/PrizeTable'
import { SponsorGrid } from './hackathon/SponsorGrid'
import { TechStack } from './proposal/TechStack'
import { DemoEmbed } from './proposal/DemoEmbed'
import { TeamRoles } from './proposal/TeamRoles'
import { ProjectShowcase } from './profile/ProjectShowcase'
import { SkillBadges } from './profile/SkillBadges'

export const commonComponents = { Callout, ImageGallery, Video }
export const hackathonComponents = { ...commonComponents, Timeline, PrizeTable, SponsorGrid }
export const proposalComponents = { ...commonComponents, TechStack, DemoEmbed, TeamRoles }
export const profileComponents = { ...commonComponents, ProjectShowcase, SkillBadges }
```

- [ ] **Step 4: Verify build**

Run: `pnpm --filter @synnovator/ui build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/mdx-components/
git commit -m "feat(ui): add profile MDX components and scene-grouped index exports"
```

---

## Chunk 3: API Routes

> Tasks 9, 10, and 11 can be executed in parallel.

### Task 9: API /api/r2/upload

**Files:**
- Create: `apps/web/app/api/r2/upload/route.ts`

**Reference files to read first:**
- `apps/web/app/api/presign/route.ts` — existing R2 integration pattern
- `apps/web/lib/github-app.ts` — auth pattern

- [ ] **Step 1: Create upload route**

Create `apps/web/app/api/r2/upload/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@synnovator/shared/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;  // 5MB
const MAX_PDF_SIZE = 20 * 1024 * 1024;   // 20MB

function getS3Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request, process.env.AUTH_SECRET!);
    if (!session) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const context = formData.get('context') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'missing file' }, { status: 400 });
    }
    if (!context || !['hackathon', 'proposal', 'profile'].includes(context)) {
      return NextResponse.json({ error: 'invalid context' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'unsupported file type' }, { status: 400 });
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_PDF_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json({
        error: isImage ? 'image exceeds 5MB limit' : 'PDF exceeds 20MB limit',
      }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'bin';
    const hash = crypto.randomUUID().slice(0, 8);
    const filename = `${context}/${Date.now()}-${hash}.${ext}`;

    const s3 = getS3Client();
    const buffer = await file.arrayBuffer();

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_TEMP_BUCKET || 'synnovator-temp',
      Key: filename,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
    }));

    const tempBaseUrl = process.env.R2_TEMP_PUBLIC_URL || `https://${process.env.R2_TEMP_BUCKET}.r2.dev`;
    const url = `${tempBaseUrl}/${filename}`;

    return NextResponse.json({ url, filename, size: file.size });
  } catch (err) {
    console.error('r2/upload error:', err);
    return NextResponse.json({ error: 'upload failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/api/r2/upload/
git commit -m "feat(api): add /api/r2/upload route for editor image/PDF uploads"
```

---

### Task 10: Rename /api/presign → /api/r2/download

**Files:**
- Create: `apps/web/app/api/r2/download/route.ts` (copy from presign)
- Modify: `apps/web/app/api/presign/route.ts` (redirect to new path)

**Reference files to read first:**
- `apps/web/app/api/presign/route.ts` — current implementation to move

- [ ] **Step 1: Move presign route to r2/download**

Read `apps/web/app/api/presign/route.ts` and create `apps/web/app/api/r2/download/route.ts` with identical content.

- [ ] **Step 2: Add redirect at old path**

Replace `apps/web/app/api/presign/route.ts` with a redirect:

```typescript
import { NextRequest, NextResponse } from 'next/server';

/** @deprecated Use /api/r2/download instead */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  url.pathname = '/api/r2/download';
  return NextResponse.redirect(url, 308);
}
```

- [ ] **Step 3: Update any imports referencing /api/presign**

Search codebase for `/api/presign` references and update to `/api/r2/download`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/api/r2/download/ apps/web/app/api/presign/
git commit -m "refactor(api): rename /api/presign to /api/r2/download"
```

---

### Task 11: Refactor /api/submit-pr (Git Tree API)

**Files:**
- Modify: `apps/web/app/api/submit-pr/route.ts`

**Reference files to read first:**
- `apps/web/app/api/submit-pr/route.ts` — current single-file implementation
- `apps/web/lib/github-app.ts` — Octokit setup

This is the most complex API change. The current route uses `createOrUpdateFileContents()` (single file). We need the Git Tree API (`createTree` → `createCommit` → `updateRef`) for multi-file atomic commits.

- [ ] **Step 1: Extend FILENAME_PATTERNS**

Add the new patterns for `.mdx` and asset files to the existing `FILENAME_PATTERNS` array in `route.ts`:

```typescript
const FILENAME_PATTERNS: RegExp[] = [
  // Existing YAML patterns
  /^hackathons\/[a-z0-9-]+\/hackathon\.yml$/,
  /^hackathons\/[a-z0-9-]+\/submissions\/[a-z0-9-]+\/project\.yml$/,
  /^profiles\/[a-z0-9][\w.-]*\.yml$/,
  // MDX content
  /^hackathons\/[a-z0-9-]+\/description(\.zh)?\.mdx$/,
  /^hackathons\/[a-z0-9-]+\/tracks\/[a-z0-9-]+(\.zh)?\.mdx$/,
  /^hackathons\/[a-z0-9-]+\/stages\/(draft|registration|development|submission|judging|announcement|award)(\.zh)?\.mdx$/,
  /^hackathons\/[a-z0-9-]+\/submissions\/[a-z0-9-]+\/README(\.zh)?\.mdx$/,
  /^profiles\/[a-z0-9][\w.-]*\/bio(\.zh)?\.mdx$/,
  // Assets
  /^hackathons\/[a-z0-9-]+\/assets\/[a-z0-9._-]+\.(png|jpg|jpeg|gif|webp|pdf)$/i,
  /^hackathons\/[a-z0-9-]+\/submissions\/[a-z0-9-]+\/assets\/[a-z0-9._-]+\.(png|jpg|jpeg|gif|webp|pdf)$/i,
  /^profiles\/[a-z0-9][\w.-]*\/assets\/[a-z0-9._-]+\.(png|jpg|jpeg|gif|webp|pdf)$/i,
];
```

- [ ] **Step 2: Add multi-file commit function**

Add `commitMultipleFiles()` helper using Git Tree API. See spec Section 6 for the full implementation.

- [ ] **Step 3: Update POST handler for backward compatibility**

Parse request body to support both old format (`{ filename, content }`) and new format (`{ files[] }`). Convert old format to single-element files array internally. Validate each file path against `FILENAME_PATTERNS`.

- [ ] **Step 4: Test backward compatibility**

Verify existing form submissions (hackathon, proposal, profile) still work with the old single-file format.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/submit-pr/route.ts
git commit -m "feat(api): refactor submit-pr to Git Tree API for multi-file commits"
```

---

## Chunk 4: Editor SDK

### Task 12: Editor SDK Components

**Files:**
- Create: `packages/ui/src/components/editor/types.ts`
- Create: `packages/ui/src/components/editor/EditorPane.tsx`
- Create: `packages/ui/src/components/editor/PreviewPane.tsx`
- Create: `packages/ui/src/components/editor/EditorToolbar.tsx`
- Create: `packages/ui/src/components/editor/ImageUploader.tsx`
- Create: `packages/ui/src/components/editor/ComponentInserter.tsx`
- Create: `packages/ui/src/components/editor/MdxEditor.tsx`

**Reference files to read first:**
- `packages/ui/src/components/button.tsx` — Button for toolbar
- `packages/ui/src/components/tabs.tsx` — Tabs for language switching
- `packages/ui/src/components/dropdown-menu.tsx` — DropdownMenu for component inserter
- `packages/ui/src/components/dialog.tsx` — Dialog for upload/submit confirmation
- `packages/ui/src/components/tooltip.tsx` — Tooltip for toolbar buttons
- `packages/ui/src/components/scroll-area.tsx` — ScrollArea for editor/preview
- `packages/ui/src/components/alert.tsx` — Alert for compile errors
- `docs/specs/design-system.md` — OKLCH tokens for CodeMirror theme

- [ ] **Step 1: Create types.ts**

Create `packages/ui/src/components/editor/types.ts`:

```typescript
import type { LucideIcon } from 'lucide-react'

export interface MdxEditorProps {
  /** Initial MDX source content */
  initialContent: string
  /** Initial content for the other language tab */
  initialContentAlt?: string
  /** Available custom components for this scene */
  availableComponents: ComponentDefinition[]
  /** Called when user submits (both languages + assets) */
  onSave: (content: string, contentAlt: string, assets: Asset[]) => Promise<void>
  /** Current language */
  lang: 'en' | 'zh'
  /** Template content to use when initialContent is empty */
  templateContent?: string
  templateContentAlt?: string
  /** Upload handler — POST file to /api/r2/upload */
  onUpload: (file: File, context: string) => Promise<{ url: string; filename: string }>
  /** Draft storage key for localStorage autosave */
  draftKey?: string
}

export interface ComponentDefinition {
  name: string
  category: 'common' | 'hackathon' | 'proposal' | 'profile'
  snippet: string
  description: string
  descriptionZh: string
  icon: LucideIcon
}

export interface Asset {
  filename: string
  blob: Blob
  tempUrl: string
}
```

- [ ] **Step 2: Create EditorPane (CodeMirror wrapper)**

Create `packages/ui/src/components/editor/EditorPane.tsx`. Key points:
- Wrap `@uiw/react-codemirror` with markdown + javascript language extensions
- Create light/dark themes from OKLCH CSS custom properties using `EditorView.theme()`
- Listen to `useTheme()` to switch CodeMirror theme
- Handle drag-and-drop/paste events for image upload
- Expose `insertText(text, position)` via `useImperativeHandle`

- [ ] **Step 3: Create PreviewPane (MDX renderer)**

Create `packages/ui/src/components/editor/PreviewPane.tsx`. Key points:
- Accept MDX source string + component map
- Use `@mdx-js/mdx` `evaluate()` with `remarkGfm` and `recma` plugin to strip imports
- Debounce compilation (300ms)
- Show compilation errors in `Alert` component
- Apply custom prose styles (font-heading for h1-h3, font-sans for body, etc.)

- [ ] **Step 4: Create EditorToolbar**

Create `packages/ui/src/components/editor/EditorToolbar.tsx`. Key points:
- Toolbar buttons using `Button variant="ghost" size="icon"` + `Tooltip`
- Groups: formatting (B, I, S, H1-H3), code/link, upload, component inserter, language tabs, save
- Each button calls `insertText()` on EditorPane ref with appropriate markdown syntax
- Language switcher uses `Tabs` component

- [ ] **Step 5: Create ImageUploader**

Create `packages/ui/src/components/editor/ImageUploader.tsx`. Key points:
- Hidden file input triggered by toolbar button
- Also handles drag-and-drop and paste events from EditorPane
- Validates file type and size
- Calls `onUpload` prop → gets temp URL → inserts `![alt](url)` via EditorPane ref
- Maintains `Asset[]` list for submission-time URL rewriting

- [ ] **Step 6: Create ComponentInserter**

Create `packages/ui/src/components/editor/ComponentInserter.tsx`. Key points:
- `DropdownMenu` with available components filtered by category
- Each item shows icon + name + description
- On click, inserts component snippet at cursor position in EditorPane

- [ ] **Step 7: Create MdxEditor (top-level container)**

Create `packages/ui/src/components/editor/MdxEditor.tsx`. Key points:
- Split-pane layout (50/50, resizable optional)
- Manages state: content (en), content (zh), current language, assets
- `beforeunload` handler for unsaved changes
- localStorage autosave (every 30s + on tab switch)
- Draft detection on mount
- Save handler: scan R2 temp URLs → download blobs → replace with `./assets/` paths → call `onSave`

- [ ] **Step 8: Verify build**

Run: `pnpm --filter @synnovator/ui build`
Expected: Build succeeds

- [ ] **Step 9: Commit**

```bash
git add packages/ui/src/components/editor/
git commit -m "feat(ui): add MdxEditor SDK (CodeMirror + split-pane preview)"
```

---

## Chunk 5: Build Pipeline & DataProvider Implementations

### Task 13: Build Pipeline + DataProvider

**Files:**
- Modify: `apps/web/scripts/generate-static-data.mjs`
- Create: `packages/shared/src/data/static-provider.ts`
- Create: `packages/shared/src/data/fs-provider.ts`
- Create: `apps/web/lib/data.ts`
- Modify: `apps/web/app/_generated/data.ts` (mark deprecated)
- Modify: `packages/shared/src/data/index.ts`

**Reference files to read first:**
- `apps/web/scripts/generate-static-data.mjs` — current build script (full content)
- `apps/web/app/_generated/data.ts` — current static data accessor
- `packages/shared/src/data/readers/hackathons.ts` — reader pattern
- `packages/shared/src/data/readers/profiles.ts` — profile reader pattern

- [ ] **Step 1: Add MDX compilation to generate-static-data.mjs**

Extend `generate-static-data.mjs` with a new `collectMdx()` function:

```javascript
import { compile } from '@mdx-js/mdx';
import remarkGfm from 'remark-gfm';

async function tryCompileMdx(filePath) {
  try {
    const source = await fs.readFile(filePath, 'utf-8');
    const compiled = await compile(source, {
      outputFormat: 'function-body',
      development: false,
      remarkPlugins: [remarkGfm],
    });
    return String(compiled);
  } catch {
    return null;
  }
}

async function collectMdx(dataRoot) {
  const mdxData = {};
  // For each hackathon, collect description + track + stage MDX
  // For each submission, collect README MDX
  // For each profile, collect bio MDX
  // Write to separate static-mdx/{slug}.json files
  return mdxData;
}
```

Output separate `apps/web/app/_generated/static-mdx/` directory with per-hackathon JSON files to avoid bloating the main `static-data.json`.

- [ ] **Step 2: Create StaticDataProvider**

Create `packages/shared/src/data/static-provider.ts` implementing `DataProvider` interface. Reads from the generated JSON files.

- [ ] **Step 3: Create FsDataProvider**

Create `packages/shared/src/data/fs-provider.ts` implementing `DataProvider` interface. Wraps existing readers + adds MDX compilation via `@mdx-js/mdx`.

- [ ] **Step 4: Create unified entry point**

Create `apps/web/lib/data.ts`:

```typescript
import { StaticDataProvider } from './static-provider';
import type { DataProvider } from '@synnovator/shared/data';

export const data: DataProvider = new StaticDataProvider();
```

- [ ] **Step 5: Mark _generated/data.ts as deprecated**

Add `@deprecated` JSDoc to all functions in `apps/web/app/_generated/data.ts`.

- [ ] **Step 6: Verify build pipeline**

Run: `pnpm build`
Expected: Build succeeds, `static-mdx/` directory created (may be empty if no .mdx files exist yet)

- [ ] **Step 7: Commit**

```bash
git add apps/web/scripts/generate-static-data.mjs packages/shared/src/data/ apps/web/lib/data.ts apps/web/app/_generated/
git commit -m "feat: add MDX build pipeline and DataProvider abstraction"
```

---

## Chunk 6: Scene Pages & Edit Buttons

> Tasks 14-17 can be executed in parallel.

### Task 14: Hackathon Editor Page

**Files:**
- Create: `apps/web/app/(auth)/edit/layout.tsx`
- Create: `apps/web/app/(auth)/edit/hackathon/[slug]/page.tsx`

**Reference files to read first:**
- `apps/web/app/(public)/hackathons/[slug]/page.tsx` — hackathon detail page pattern
- `apps/web/app/_generated/data.ts` — data loading pattern
- `packages/shared/src/schemas/hackathon.ts` — hackathon schema (tracks, timeline)

- [ ] **Step 1: Create (auth)/edit/layout.tsx**

```tsx
import { redirect } from 'next/navigation';
import { getSession } from '@synnovator/shared/auth';
import { headers } from 'next/headers';

export default async function EditLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const request = new Request('https://placeholder', { headers: headersList });
  const session = await getSession(request, process.env.AUTH_SECRET!);

  if (!session) {
    // Redirect to login — the callback will return to the edit page
    redirect('/api/auth/login');
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Create hackathon editor page**

Create `apps/web/app/(auth)/edit/hackathon/[slug]/page.tsx`. Key points:
- Server Component: load hackathon data, verify user is in `organizers[]`
- Pass data to Client Component `HackathonEditorClient`
- Client Component: render `Tabs` (description + tracks + stages) with `MdxEditor` in each tab
- On save: collect all modified MDX files + assets → POST to `/api/submit-pr` with multi-file format
- Use `hackathonComponents` from MDX components index

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/\(auth\)/edit/
git commit -m "feat(web): add hackathon editor page with tab-based MDX editing"
```

---

### Task 15: Proposal Editor Page

**Files:**
- Create: `apps/web/app/(auth)/edit/proposal/[hackathon]/[team]/page.tsx`

**Reference files to read first:**
- `apps/web/app/(public)/projects/[hackathon]/[team]/page.tsx` — project detail page
- `packages/shared/src/schemas/submission.ts` — submission schema (team[])

- [ ] **Step 1: Create proposal editor page**

Key points:
- Server Component: load submission data, verify user github is in `project.team[]`
- Single `MdxEditor` (no tabs — just README.mdx + README.zh.mdx)
- Use `proposalComponents` from MDX components index
- On save: POST to `/api/submit-pr` with README.mdx + README.zh.mdx + assets

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(auth\)/edit/proposal/
git commit -m "feat(web): add proposal editor page"
```

---

### Task 16: Profile Editor Page

**Files:**
- Create: `apps/web/app/(auth)/edit/profile/[username]/page.tsx`

**Reference files to read first:**
- `apps/web/app/(public)/hackers/[id]/page.tsx` — profile detail page

- [ ] **Step 1: Create profile editor page**

Key points:
- Server Component: load profile, verify `hacker.github` matches session user
- Single `MdxEditor` (bio.mdx + bio.zh.mdx)
- Use `profileComponents` from MDX components index
- Determine filestem from profile data for file paths

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(auth\)/edit/profile/
git commit -m "feat(web): add profile editor page"
```

---

### Task 17: Detail Page Edit Buttons

**Files:**
- Modify: `apps/web/components/EditProjectButton.tsx`
- Modify: `apps/web/app/(public)/hackathons/[slug]/page.tsx`
- Modify: `apps/web/app/(public)/projects/[hackathon]/[team]/page.tsx`
- Modify: `apps/web/app/(public)/hackers/[id]/page.tsx`

**Reference files to read first:**
- `apps/web/components/EditProjectButton.tsx` — current edit button (links to GitHub)

- [ ] **Step 1: Update EditProjectButton to link to in-app editor**

Change the edit URL from GitHub web editor to `/edit/proposal/{hackathon}/{team}`.

- [ ] **Step 2: Add edit button to hackathon detail page**

Add conditional `EditButton` for organizers linking to `/edit/hackathon/{slug}`.

- [ ] **Step 3: Add edit button to profile detail page**

Add conditional `EditButton` for profile owner linking to `/edit/profile/{username}`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/EditProjectButton.tsx apps/web/app/\(public\)/
git commit -m "feat(web): add edit buttons to hackathon, proposal, and profile detail pages"
```

---

## Chunk 7: Finalization

### Task 18: Form Extensions (Template Generation)

**Files:**
- Modify: `apps/web/components/forms/CreateHackathonForm.tsx`
- Modify: `apps/web/components/forms/CreateProposalForm.tsx`
- Modify: `apps/web/components/forms/ProfileCreateForm.tsx`

**Reference files to read first:**
- `apps/web/components/forms/CreateHackathonForm.tsx` — current hackathon form
- `apps/web/components/forms/CreateProposalForm.tsx` — current proposal form
- `apps/web/components/forms/ProfileCreateForm.tsx` — current profile form
- `config/templates/` — template files created in Task 4

- [ ] **Step 1: Update CreateHackathonForm to include template files**

When submitting the PR, read templates from `config/templates/hackathon/`, perform variable replacement (`{hackathon-name}`, `{track-name}`, etc.), and include MDX files in the multi-file submit-pr request alongside `hackathon.yml`.

Files to include per hackathon:
- `description.mdx` + `description.zh.mdx`
- For each track: `tracks/{slug}.mdx` + `tracks/{slug}.zh.mdx`
- For each defined timeline stage: `stages/{key}.mdx` + `stages/{key}.zh.mdx`

- [ ] **Step 2: Update CreateProposalForm to include template files**

Include `README.mdx` + `README.zh.mdx` from `config/templates/proposal/` with variable replacement.

- [ ] **Step 3: Update ProfileCreateForm to include template files**

Include `bio.mdx` + `bio.zh.mdx` from `config/templates/profile/` with variable replacement. Create the `{filestem}/` directory structure.

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/forms/
git commit -m "feat(forms): generate MDX template files when creating hackathon/proposal/profile"
```

---

### Task 19: CI Workflows

**Files:**
- Modify: `.github/workflows/upload-assets.yml`
- Create: `.github/workflows/validate-mdx.yml`
- Create: `.github/workflows/r2-cleanup.yml`
- Create: `scripts/validate-mdx.mjs`

- [ ] **Step 1: Expand upload-assets.yml trigger paths**

Add `hackathons/**/assets/**` and `profiles/**/assets/**` to the trigger paths. Update the internal path detection logic to handle three contexts (hackathon-level, submission-level, profile-level).

- [ ] **Step 2: Create validate-mdx.yml**

```yaml
name: Validate MDX
on:
  pull_request:
    paths: ['**/*.mdx']

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: node scripts/validate-mdx.mjs
```

- [ ] **Step 3: Create scripts/validate-mdx.mjs**

Script that finds all `.mdx` files changed in the PR (via `git diff`), attempts to compile each with `@mdx-js/mdx`, and reports errors.

- [ ] **Step 4: Create r2-cleanup.yml**

```yaml
name: R2 Temp Cleanup
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at UTC midnight

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Clean R2 temp bucket
        env:
          R2_ENDPOINT: ${{ secrets.R2_ENDPOINT }}
          R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
        run: |
          # List and delete objects older than 24 hours from synnovator-temp bucket
          pip install boto3
          python3 -c "
          import boto3, datetime, os
          s3 = boto3.client('s3',
            endpoint_url=os.environ['R2_ENDPOINT'],
            aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'])
          cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=24)
          resp = s3.list_objects_v2(Bucket='synnovator-temp')
          for obj in resp.get('Contents', []):
            if obj['LastModified'] < cutoff:
              s3.delete_object(Bucket='synnovator-temp', Key=obj['Key'])
              print(f'Deleted: {obj[\"Key\"]}')
          "
```

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ scripts/validate-mdx.mjs
git commit -m "feat(ci): add MDX validation, upload-assets expansion, and R2 temp cleanup"
```

---

## Verification Checklist

After all tasks are complete, verify end-to-end:

- [ ] `pnpm install` — no dependency errors
- [ ] `pnpm build` — builds successfully with MDX compilation
- [ ] `pnpm --filter @synnovator/shared test` — all tests pass
- [ ] Create a test `.mdx` file in `hackathons/` directory → verify `generate-static-data.mjs` compiles it
- [ ] Open hackathon detail page → edit button visible for organizers
- [ ] Click edit → editor loads with CodeMirror + preview
- [ ] Drag image into editor → uploads to R2 temp → preview shows image
- [ ] Switch EN/ZH tabs → content preserved
- [ ] Submit → PR created with .mdx files + assets
- [ ] CI: `validate-mdx.yml` triggers on .mdx PR
- [ ] CI: `upload-assets.yml` triggers on assets in new paths
