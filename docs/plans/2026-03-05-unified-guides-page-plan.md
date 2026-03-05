# Unified Guides Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/guides` index page with 3 role cards and a shared tab bar on each guide subpage, so all guides are discoverable from the nav.

**Architecture:** Pure static Astro pages, zero client-side JS. New `GuideTabBar.astro` component renders `<a>` links styled as tabs. New `index.astro` renders 3 feature cards. NavBar updated to link to `/guides`.

**Tech Stack:** Astro, Tailwind CSS (Neon Forge design system), i18n via `site/src/lib/i18n`

---

### Task 1: Add i18n keys for index page

**Files:**
- Modify: `site/src/i18n/zh.yml:124-132`
- Modify: `site/src/i18n/en.yml:124-132`

**Step 1: Add keys to zh.yml**

In the `guide:` section (after `back_to_guides`), add:

```yaml
guide:
  # ... existing keys ...
  back_to_guides: "返回指南"
  index_title: "指南"
  index_subtitle: "选择你的角色，了解完整流程"
  hacker_bullets: "注册 Profile|浏览并报名活动|组建团队|提交项目"
  organizer_bullets: "创建活动仓库|配置赛道与时间线|管理报名与提交|配置评委与评审"
  judge_bullets: "设置评委 Profile|查看提交作品|使用评分卡评分|声明利益冲突"
```

**Step 2: Add keys to en.yml**

```yaml
guide:
  # ... existing keys ...
  back_to_guides: "Back to Guides"
  index_title: "Guides"
  index_subtitle: "Choose your role and learn the complete workflow"
  hacker_bullets: "Register your Profile|Browse & join events|Form a team|Submit your project"
  organizer_bullets: "Create event repo|Configure tracks & timeline|Manage registrations|Set up judges & review"
  judge_bullets: "Set up Judge Profile|Review submissions|Score with Score Card|Declare conflicts of interest"
```

**Step 3: Commit**

```bash
git add site/src/i18n/zh.yml site/src/i18n/en.yml
git commit -m "feat(site): add i18n keys for guides index page"
```

---

### Task 2: Create GuideTabBar component

**Files:**
- Create: `site/src/components/GuideTabBar.astro`

**Step 1: Create the component**

```astro
---
import { t } from '../lib/i18n';
import type { Lang } from '../lib/i18n';

interface Props {
  activeRole: 'hacker' | 'organizer' | 'judge';
  lang?: Lang;
}

const { activeRole, lang = 'zh' } = Astro.props;

const tabs = [
  { role: 'hacker' as const, href: '/guides/hacker', labelKey: 'guide.hacker_title' },
  { role: 'organizer' as const, href: '/guides/organizer', labelKey: 'guide.organizer_title' },
  { role: 'judge' as const, href: '/guides/judge', labelKey: 'guide.judge_title' },
];
---

<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
  <nav class="flex gap-6 border-b border-secondary-bg" aria-label="Guide tabs">
    {tabs.map((tab) => (
      <a
        href={tab.href}
        class:list={[
          'pb-3 text-sm transition-colors',
          activeRole === tab.role
            ? 'border-b-2 border-lime-primary text-lime-primary font-medium'
            : 'text-muted hover:text-white',
        ]}
        aria-current={activeRole === tab.role ? 'page' : undefined}
      >
        {t(lang, tab.labelKey)}
      </a>
    ))}
  </nav>
</div>
```

**Step 2: Verify build**

```bash
cd site && pnpm run build
```

Expected: Build succeeds (component not yet imported anywhere).

**Step 3: Commit**

```bash
git add site/src/components/GuideTabBar.astro
git commit -m "feat(site): add GuideTabBar component"
```

---

### Task 3: Add GuideTabBar to existing guide pages

**Files:**
- Modify: `site/src/pages/guides/hacker.astro:2,42-43`
- Modify: `site/src/pages/guides/organizer.astro:2,42-43`
- Modify: `site/src/pages/guides/judge.astro:2,42-43`

**Step 1: Update hacker.astro**

Add import after line 2:
```astro
import GuideTabBar from '../../components/GuideTabBar.astro';
```

Replace the template (line 42 onward) with:
```astro
<BaseLayout title={t(lang, 'guide.hacker_title')}>
  <GuideTabBar activeRole="hacker" lang={lang} />
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <!-- existing content unchanged from <div class="mb-10"> onward -->
```

Also change the footer link from `href="/"` to `href="/guides"` and change `common.back_home` to `guide.back_to_guides`.

**Step 2: Update organizer.astro**

Same pattern: add import, add `<GuideTabBar activeRole="organizer" lang={lang} />`, update footer link.

**Step 3: Update judge.astro**

Same pattern: add import, add `<GuideTabBar activeRole="judge" lang={lang} />`, update footer link.

**Step 4: Verify build**

```bash
cd site && pnpm run build
```

Expected: Build succeeds, all 3 guide pages render.

**Step 5: Commit**

```bash
git add site/src/pages/guides/hacker.astro site/src/pages/guides/organizer.astro site/src/pages/guides/judge.astro
git commit -m "feat(site): add GuideTabBar to guide subpages"
```

---

### Task 4: Create guides index page

**Files:**
- Create: `site/src/pages/guides/index.astro`

**Step 1: Create the index page**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { t } from '../../lib/i18n';
import type { Lang } from '../../lib/i18n';

const lang: Lang = 'zh';

const roles = [
  {
    emoji: '🚀',
    titleKey: 'guide.hacker_title',
    subtitleKey: 'guide.hacker_subtitle',
    bulletsKey: 'guide.hacker_bullets',
    href: '/guides/hacker',
  },
  {
    emoji: '🏗️',
    titleKey: 'guide.organizer_title',
    subtitleKey: 'guide.organizer_subtitle',
    bulletsKey: 'guide.organizer_bullets',
    href: '/guides/organizer',
  },
  {
    emoji: '⚖️',
    titleKey: 'guide.judge_title',
    subtitleKey: 'guide.judge_subtitle',
    bulletsKey: 'guide.judge_bullets',
    href: '/guides/judge',
  },
];
---

<BaseLayout title={t(lang, 'guide.index_title')}>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <div class="text-center mb-12">
      <h1 class="text-3xl md:text-4xl font-heading font-bold text-white mb-3">
        {t(lang, 'guide.index_title')}
      </h1>
      <p class="text-lg text-muted">
        {t(lang, 'guide.index_subtitle')}
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {roles.map((role) => (
        <a
          href={role.href}
          class="group block rounded-lg border border-secondary-bg bg-secondary-bg/50 p-6 transition-colors hover:border-lime-primary"
        >
          <div class="text-3xl mb-3">{role.emoji}</div>
          <h2 class="text-xl font-heading font-bold text-white mb-1 group-hover:text-lime-primary transition-colors">
            {t(lang, role.titleKey)}
          </h2>
          <p class="text-sm text-muted mb-4">
            {t(lang, role.subtitleKey)}
          </p>
          <ul class="space-y-1.5">
            {t(lang, role.bulletsKey).split('|').map((bullet: string) => (
              <li class="text-sm text-light-gray flex items-start gap-2">
                <span class="text-lime-primary mt-0.5">›</span>
                {bullet}
              </li>
            ))}
          </ul>
        </a>
      ))}
    </div>
  </div>
</BaseLayout>
```

**Step 2: Verify build**

```bash
cd site && pnpm run build
```

Expected: Build succeeds, `/guides` index page renders.

**Step 3: Commit**

```bash
git add site/src/pages/guides/index.astro
git commit -m "feat(site): add guides index page with role cards"
```

---

### Task 5: Update NavBar link

**Files:**
- Modify: `site/src/components/NavBar.astro:14`

**Step 1: Change href**

On line 14, change:
```html
<a href="/guides/hacker" class="text-muted hover:text-white transition-colors text-sm">指南</a>
```
to:
```html
<a href="/guides" class="text-muted hover:text-white transition-colors text-sm">指南</a>
```

**Step 2: Verify build**

```bash
cd site && pnpm run build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add site/src/components/NavBar.astro
git commit -m "feat(site): update nav link to guides index page"
```

---

### Task 6: Visual verification

**Step 1: Start dev server**

```bash
cd site && pnpm run dev
```

**Step 2: Verify in browser**

- Visit `/guides` — should show 3 role cards with emoji, title, subtitle, bullets
- Click each card — should navigate to corresponding guide page
- On each guide page — tab bar should show 3 tabs, current role highlighted
- Click tabs — should navigate between guide pages
- NavBar "指南" link — should navigate to `/guides`
- Footer "返回指南" link — should navigate to `/guides`

**Step 3: Stop dev server and commit if any fixes needed**
