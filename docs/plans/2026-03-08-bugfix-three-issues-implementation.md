# Fix Three Platform Issues — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix three bugs: broken registration anchor link, admin Access Denied for all users, and proposals page ignoring `?lang=en`.

**Architecture:** All changes are in the Next.js app (`apps/web/`) and shared packages (`packages/shared/`). Issue 1 adds back form sections dropped during migration. Issue 2 fixes a GitHub API call that requires elevated scopes. Issue 3 removes `force-static` so `searchParams` works, and replaces hardcoded strings with i18n `t()` calls.

**Tech Stack:** Next.js 15 App Router, TypeScript, Octokit, `@synnovator/shared` i18n

---

## Task 1: Remove legacy site/ directory

The platform has migrated to Next.js (`apps/web/`). The legacy Astro site (`site/`) is no longer deployed and should be removed. It is NOT part of the pnpm workspace (`pnpm-workspace.yaml` only includes `apps/*` and `packages/*`), and no config files reference it.

**Files:**
- Delete: `site/` (entire directory)
- Modify: `CONTRIBUTING.md` — update any `site` scope references to `web`
- Modify: `docs/CLAUDE.md` — remove `site/CLAUDE.md` reference if present

**Step 1: Remove the site/ directory**

```bash
git rm -r site/
```

Note: `site/node_modules/` and `site/dist/` are gitignored, so `git rm -r` only removes tracked files. Clean up untracked leftovers:

```bash
rm -rf site/
```

**Step 2: Update CONTRIBUTING.md if it references site scope**

Check for `scope` references to `site` and update to `web`.

**Step 3: Update docs/CLAUDE.md if it references site/CLAUDE.md**

Remove or update the `site/CLAUDE.md` reference in the design-system note.

**Step 4: Commit**

```bash
git add -A site/ CONTRIBUTING.md docs/CLAUDE.md
git commit -m "chore: remove legacy site/ directory — platform migrated to apps/web/"
```

---

## Task 2: Add i18n keys for hardcoded strings

**Files:**
- Modify: `packages/shared/src/i18n/en.json`
- Modify: `packages/shared/src/i18n/zh.json`

**Step 1: Add missing keys to en.json**

Add these keys inside the existing sections:

In `"hackathon"` section, add:
```json
"team_size_label": "Team size",
"solo_allowed": "(solo allowed)",
"license_label": "License",
"ip_label": "IP"
```

In `"profile"` section, add:
```json
"seeking": "Seeking",
"team_size": "Team size",
"collab_style": "Style",
"identity": "Identity",
"view_project": "View project"
```

**Step 2: Add missing keys to zh.json**

In `"hackathon"` section, add:
```json
"team_size_label": "团队规模",
"solo_allowed": "（允许个人参赛）",
"license_label": "许可证",
"ip_label": "知识产权"
```

In `"profile"` section, add:
```json
"seeking": "正在寻找",
"team_size": "团队规模",
"collab_style": "协作方式",
"identity": "身份",
"view_project": "查看项目"
```

**Step 3: Commit**

```bash
git add packages/shared/src/i18n/en.json packages/shared/src/i18n/zh.json
git commit -m "feat(i18n): add missing translation keys for hackathon and profile pages"
```

---

## Task 3: Fix hackathon detail page — add back form sections + replace hardcoded strings

**Files:**
- Modify: `apps/web/app/(public)/hackathons/[slug]/page.tsx`

**Step 1: Add form component imports**

At the top of the file, after the existing imports (line 15), add:

```typescript
import { RegisterForm } from '@/components/forms/RegisterForm';
import { NDASignForm } from '@/components/forms/NDASignForm';
import { AppealForm } from '@/components/forms/AppealForm';
import { TeamFormationForm } from '@/components/forms/TeamFormationForm';
```

**Step 2: Add `formTracks` data prep**

After the `githubToProfile` map build (after line 63), add:

```typescript
  // Prepare tracks data for form components
  const formTracks = (h.tracks ?? []).map((tr: any) => ({
    slug: tr.slug,
    name: tr.name,
    name_zh: tr.name_zh,
  }));
```

**Step 3: Replace hardcoded eligibility strings (lines 167-170)**

Replace:
```tsx
                      <p className="text-sm text-light-gray">
                        Team size: {h.eligibility.team_size.min}–{h.eligibility.team_size.max}
                        {h.eligibility.allow_solo && ' (solo allowed)'}
                      </p>
```

With:
```tsx
                      <p className="text-sm text-light-gray">
                        {t(lang, 'hackathon.team_size_label')}: {h.eligibility.team_size.min}–{h.eligibility.team_size.max}
                        {h.eligibility.allow_solo && ` ${t(lang, 'hackathon.solo_allowed')}`}
                      </p>
```

**Step 4: Replace hardcoded legal strings (lines 193-194)**

Replace:
```tsx
                    {h.legal.license && <p className="text-sm text-light-gray">License: {h.legal.license}</p>}
                    {h.legal.ip_ownership && <p className="text-sm text-light-gray">IP: {h.legal.ip_ownership}</p>}
```

With:
```tsx
                    {h.legal.license && <p className="text-sm text-light-gray">{t(lang, 'hackathon.license_label')}: {h.legal.license}</p>}
                    {h.legal.ip_ownership && <p className="text-sm text-light-gray">{t(lang, 'hackathon.ip_label')}: {h.legal.ip_ownership}</p>}
```

**Step 5: Add form sections after the FAQ section (after line 207, before the closing `</div>` of the details tab)**

Insert before the `{stage === 'judging' ...}` block (before line 209):

```tsx
              {/* NDA Sign Form */}
              {h.legal?.nda?.required && (
                <section>
                  <h2 className="text-xl font-heading font-bold text-white mb-4">
                    {t(lang, 'hackathon.nda_sign')}
                  </h2>
                  <NDASignForm
                    hackathonSlug={h.slug}
                    ndaDocumentUrl={h.legal.nda.document_url}
                    ndaSummary={h.legal.nda.summary}
                    lang={lang}
                  />
                </section>
              )}

              {/* Register Form (during registration stage) */}
              {stage === 'registration' && (
                <section id="register-section">
                  <h2 className="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.register')}</h2>
                  <RegisterForm
                    hackathonSlug={h.slug}
                    hackathonName={localize(lang, h.name, h.name_zh)}
                    tracks={formTracks}
                    ndaRequired={!!h.legal?.nda?.required}
                    lang={lang}
                  />
                </section>
              )}

              {/* Team Formation (during registration/development stages) */}
              {(['registration', 'development'].includes(stage)) && (
                <section id="team-formation-section">
                  <h2 className="text-xl font-heading font-bold text-white mb-4">
                    {t(lang, 'hackathon.team_formation')}
                  </h2>
                  <TeamFormationForm
                    hackathonSlug={h.slug}
                    tracks={formTracks}
                    lang={lang}
                  />
                </section>
              )}

              {/* Appeal Form (during announcement stage) */}
              {stage === 'announcement' && (
                <section id="appeal-section">
                  <h2 className="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.appeal')}</h2>
                  <AppealForm
                    hackathonSlug={h.slug}
                    tracks={formTracks}
                    teams={[]}
                    lang={lang}
                  />
                </section>
              )}
```

**Step 6: Commit**

```bash
git add apps/web/app/\(public\)/hackathons/\[slug\]/page.tsx
git commit -m "fix(web): add back form sections and replace hardcoded i18n strings on hackathon page"
```

---

## Task 4: Fix HackathonTabs to handle non-tab hash anchors

**Files:**
- Modify: `apps/web/components/HackathonTabs.tsx`

**Step 1: Update the hashchange handler to scroll to non-tab anchors**

Replace the entire `hashchange` useEffect (lines 41-50):

```typescript
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;

      // If it's a tab ID, switch to that tab
      if (TAB_IDS.includes(hash as TabId)) {
        setActiveTab(hash as TabId);
        return;
      }

      // For non-tab anchors (e.g. #register-section), find the element
      // and ensure its parent tab panel is visible, then scroll to it
      const target = document.getElementById(hash);
      if (!target) return;

      const panel = target.closest<HTMLElement>('[data-tab-panel]');
      if (panel?.dataset.tabPanel) {
        const panelTab = panel.dataset.tabPanel as TabId;
        if (TAB_IDS.includes(panelTab)) {
          setActiveTab(panelTab);
        }
      }

      // Scroll after a tick so the panel is visible
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'smooth' });
      });
    };
    window.addEventListener('hashchange', onHashChange);

    // Also handle initial hash on mount (e.g. direct link with #register-section)
    if (window.location.hash) {
      onHashChange();
    }

    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
```

**Step 2: Commit**

```bash
git add apps/web/components/HackathonTabs.tsx
git commit -m "fix(web): handle non-tab hash anchors in HackathonTabs (scroll to #register-section etc)"
```

---

## Task 5: Fix admin checkRepoPermission to use repos.get() API

**Files:**
- Modify: `packages/shared/src/data/writers/github-client.ts`

**Step 1: Replace `checkRepoPermission` method (lines 122-133)**

Replace the current `checkRepoPermission` method:

```typescript
    async checkRepoPermission(owner: string, repo: string, username: string) {
      try {
        const { data } = await octokit.rest.repos.getCollaboratorPermissionLevel({
          owner,
          repo,
          username,
        });
        return data.permission;
      } catch {
        return 'none';
      }
    },
```

With:

```typescript
    async checkRepoPermission(owner: string, repo: string, _username: string) {
      try {
        // Use repos.get() which returns permissions for the authenticated user
        // without requiring elevated OAuth scopes (read:user is sufficient)
        const { data } = await octokit.rest.repos.get({ owner, repo });
        const perms = data.permissions;
        if (!perms) return 'none';
        if (perms.admin) return 'admin';
        if (perms.maintain) return 'maintain';
        if (perms.push) return 'write';
        if (perms.triage) return 'triage';
        if (perms.pull) return 'read';
        return 'none';
      } catch {
        return 'none';
      }
    },
```

**Step 2: Commit**

```bash
git add packages/shared/src/data/writers/github-client.ts
git commit -m "fix(shared): use repos.get() for permission check — works with read:user scope"
```

---

## Task 6: Fix admin layout to use i18n for Access Denied message

**Files:**
- Modify: `apps/web/app/(admin)/admin/layout.tsx`

**Step 1: Add i18n imports**

After the existing imports (after line 8), add:

```typescript
import { t, getLangFromSearchParams } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
```

**Step 2: Update the function signature to accept searchParams**

This is a layout — layouts don't receive `searchParams` in Next.js App Router. Instead, read the `lang` cookie or default to 'zh'. The simplest approach: since the admin layout is a server component and doesn't have access to searchParams, use a hardcoded fallback approach with both languages.

Actually, since this is a layout, keep it simple — use the i18n keys with a default language. Replace the Access Denied block (lines 31-42):

Replace:
```tsx
  if (!['admin', 'maintain', 'write'].includes(permission)) {
    return (
      <>
        <Suspense><NavBar /></Suspense>
        <div className="min-h-screen pt-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-heading text-error mb-2">Access Denied</h1>
            <p className="text-muted">You need admin or maintain permission on the repository.</p>
          </div>
        </div>
        <Suspense><Footer /></Suspense>
      </>
    );
  }
```

With:
```tsx
  if (!['admin', 'maintain', 'write'].includes(permission)) {
    return (
      <>
        <Suspense><NavBar /></Suspense>
        <div className="min-h-screen pt-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-heading text-error mb-2">{t('zh', 'admin.access_denied')}</h1>
            <p className="text-muted">{t('zh', 'admin.access_denied_desc')}</p>
            <p className="text-muted text-sm mt-1">{t('en', 'admin.access_denied_desc')}</p>
          </div>
        </div>
        <Suspense><Footer /></Suspense>
      </>
    );
  }
```

**Step 3: Commit**

```bash
git add apps/web/app/\(admin\)/admin/layout.tsx
git commit -m "fix(web): use i18n keys for admin Access Denied message"
```

---

## Task 7: Fix proposals page — remove force-static so lang works

**Files:**
- Modify: `apps/web/app/(public)/proposals/page.tsx`

**Step 1: Remove the force-static export (line 6)**

Delete this line:
```typescript
export const dynamic = 'force-static';
```

The page reads `searchParams` which makes it dynamic. Without `force-static`, Next.js will automatically detect it as dynamic, and `searchParams` will correctly contain `{ lang: 'en' }` at request time.

**Step 2: Commit**

```bash
git add apps/web/app/\(public\)/proposals/page.tsx
git commit -m "fix(web): remove force-static from proposals page so ?lang=en works"
```

---

## Task 8: Fix hacker profile page — replace hardcoded strings with i18n

**Files:**
- Modify: `apps/web/app/(public)/hackers/[id]/page.tsx`

**Step 1: Replace hardcoded "Seeking:" (line 127)**

Replace:
```tsx
                    <p className="text-xs text-muted">Seeking:</p>
```
With:
```tsx
                    <p className="text-xs text-muted">{t(lang, 'profile.seeking')}:</p>
```

**Step 2: Replace hardcoded "Team size:" (line 135)**

Replace:
```tsx
                {h.looking_for.team_size && <p className="text-xs text-muted">Team size: {h.looking_for.team_size}</p>}
```
With:
```tsx
                {h.looking_for.team_size && <p className="text-xs text-muted">{t(lang, 'profile.team_size')}: {h.looking_for.team_size}</p>}
```

**Step 3: Replace hardcoded "Style:" (line 136)**

Replace:
```tsx
                {h.looking_for.collaboration_style && <p className="text-xs text-muted">Style: {h.looking_for.collaboration_style}</p>}
```
With:
```tsx
                {h.looking_for.collaboration_style && <p className="text-xs text-muted">{t(lang, 'profile.collab_style')}: {h.looking_for.collaboration_style}</p>}
```

**Step 4: Replace hardcoded "Identity" (line 143)**

Replace:
```tsx
              <h2 className="text-sm font-heading font-bold text-white mb-3">Identity</h2>
```
With:
```tsx
              <h2 className="text-sm font-heading font-bold text-white mb-3">{t(lang, 'profile.identity')}</h2>
```

**Step 5: Replace hardcoded "View project" (line 95)**

Replace:
```tsx
                        View project
```
With:
```tsx
                        {t(lang, 'profile.view_project')}
```

**Step 6: Commit**

```bash
git add apps/web/app/\(public\)/hackers/\[id\]/page.tsx
git commit -m "fix(web): replace hardcoded English strings with i18n t() on hacker profile page"
```

---

## Task 9: Verify build

**Step 1: Install dependencies and build**

```bash
cd apps/web && pnpm install && pnpm build
```

Expected: Build succeeds with no TypeScript errors.

**Step 2: Final commit if any adjustments needed**

---

## Known Issue (out of scope)

All pages with `force-static` + `searchParams` have the same i18n issue as proposals (hackathon detail, hacker profile, home, results, projects, create-proposal). These pages generate static HTML at build time with `lang='zh'`. The `?lang=en` query param is ignored. A broader fix would involve either:
- Moving language detection to client-side components
- Making all pages dynamic (higher cost on Cloudflare)
- Using Next.js `generateStaticParams` with language variants

This is tracked as a separate issue.
