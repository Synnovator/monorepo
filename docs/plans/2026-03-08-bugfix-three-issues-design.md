# Design: Fix Three Platform Issues

Date: 2026-03-08

## Issues

### Issue 1: Registration button doesn't navigate

**Symptom**: Clicking "立即报名" on hackathon detail page does nothing.

**Root cause**: `apps/web/app/(public)/hackathons/[slug]/page.tsx` has `<a href="#register-section">` in the hero, but the RegisterForm section (`<section id="register-section">`) was dropped during the Next.js migration. The anchor link points to a non-existent element. Same issue affects `#appeal-section` and `#team-formation-section`.

**Fix**: Add back the stage-conditional form sections (RegisterForm, TeamFormationForm, AppealForm) with their anchor IDs. Also fix `HackathonTabs` to handle non-tab hash anchors by ensuring the correct panel is visible and scrolling to the element.

### Issue 2: Admin page always shows "Access Denied"

**Symptom**: All authenticated users see "Access Denied — You need admin or maintain permission on the repository."

**Root cause**: `apps/web/app/(admin)/admin/layout.tsx` calls `checkRepoPermission()` which uses `octokit.rest.repos.getCollaboratorPermissionLevel()`. This GitHub API endpoint requires the caller to have admin access to the repo. The OAuth scope is only `read:user` — insufficient. The API call fails, catch block returns `'none'`, triggering the Access Denied path.

**Fix**: Change `checkRepoPermission` in `packages/shared/src/data/writers/github-client.ts` to use `octokit.rest.repos.get()` instead, which returns `permissions` object for authenticated users without needing elevated scopes. Also use i18n `t()` for the hardcoded "Access Denied" strings (keys `admin.access_denied` and `admin.access_denied_desc` already exist).

### Issue 3: Proposals page ignores `?lang=en`

**Symptom**: `https://home.synnovator.space/proposals?lang=en` still shows Chinese text.

**Root cause**: `apps/web/app/(public)/proposals/page.tsx` has `export const dynamic = 'force-static'`. With `force-static`, `searchParams` resolves to empty object at build time, so `lang` defaults to `'zh'`.

**Additional i18n issues found**:
- `hackathons/[slug]/page.tsx`: Hardcoded "Team size:", "(solo allowed)", "License:", "IP:"
- `hackers/[id]/page.tsx`: Hardcoded "Seeking:", "Team size:", "Style:", "Identity", "View project"
- `admin/layout.tsx`: Hardcoded "Access Denied" instead of using existing i18n keys

**Fix**: Remove `force-static` from proposals page (let Next.js auto-detect as dynamic since it reads `searchParams`). Add missing i18n keys to `packages/shared/src/i18n/{en,zh}.json`. Replace all hardcoded strings with `t()` calls. Audit all pages with `force-static` + `searchParams` for the same issue.

## Files to Modify

| File | Changes |
|------|---------|
| `apps/web/app/(public)/hackathons/[slug]/page.tsx` | Add RegisterForm/AppealForm/TeamFormation sections, fix hardcoded strings |
| `apps/web/components/HackathonTabs.tsx` | Handle non-tab hash anchors (scroll + panel switch) |
| `packages/shared/src/data/writers/github-client.ts` | Fix `checkRepoPermission` to use `repos.get()` |
| `apps/web/app/(admin)/admin/layout.tsx` | Use i18n `t()` for Access Denied strings |
| `apps/web/app/(public)/proposals/page.tsx` | Remove `force-static` |
| `apps/web/app/(public)/hackers/[id]/page.tsx` | Replace hardcoded strings with `t()` |
| `packages/shared/src/i18n/en.json` | Add missing i18n keys |
| `packages/shared/src/i18n/zh.json` | Add missing i18n keys |
