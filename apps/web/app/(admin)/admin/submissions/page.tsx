import { cookies } from 'next/headers';
import { decrypt, type Session } from '@synnovator/shared/auth';
import { createGitHubClient, listPendingReviews } from '@synnovator/shared/data';
import { t, localize } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { ReviewList } from '@/components/admin/ReviewList';
import { listHackathons, listSubmissions } from '@/app/_generated/data';
import { VisibilitySection } from '@/components/admin/VisibilitySection';

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = sp.lang === 'en' ? 'en' : 'zh';

  const cookieStore = await cookies();
  const session = await decrypt(
    cookieStore.get('session')!.value,
    process.env.AUTH_SECRET!,
  ) as Session;

  let items: Awaited<ReturnType<typeof listPendingReviews>> = [];

  if (session.access_token !== 'dev-token') {
    const client = createGitHubClient(session.access_token);
    const all = await listPendingReviews(
      client,
      process.env.GITHUB_OWNER || 'Synnovator',
      process.env.GITHUB_REPO || 'monorepo',
    );
    items = all.filter(p => p.type === 'submission');
  }

  const allSubmissions = listSubmissions();
  const allHackathons = listHackathons();
  const privateHackathonSlugs =
    allHackathons.filter(h => h.hackathon.visibility === 'private').map(h => h.hackathon.slug);
  const visibilityItems = allSubmissions.map(s => ({
    name: localize(lang, s.project.name, s.project.name_zh),
    slug: `${s._hackathonSlug}/${s._teamSlug}`,
    visibility: s.project.visibility ?? 'public',
  }));

  return (
    <div>
      <h1 className="text-2xl font-heading text-foreground mb-8">{t(lang, 'admin.submissions')}</h1>
      <ReviewList items={items} lang={lang} type="submission" />
      <VisibilitySection
        items={visibilityItems}
        type="submission"
        lang={lang}
        translations={{
          title: t(lang, 'admin.visibility'),
          publish: t(lang, 'admin.publish'),
          unpublish: t(lang, 'admin.unpublish'),
          private: t(lang, 'admin.visibility_private'),
          public: t(lang, 'admin.visibility_public'),
          success: t(lang, 'admin.publish_success'),
          error: t(lang, 'admin.publish_error'),
          warningParentPrivate: t(lang, 'admin.visibility_warning_parent_private'),
        }}
        privateHackathonSlugs={privateHackathonSlugs}
      />
    </div>
  );
}
