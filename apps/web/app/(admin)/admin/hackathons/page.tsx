import { cookies } from 'next/headers';
import { decrypt, type Session } from '@synnovator/shared/auth';
import { createGitHubClient, listPendingReviews } from '@synnovator/shared/data';
import { t, localize } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { ReviewList } from '@/components/admin/ReviewList';
import { listHackathons } from '@/app/_generated/data';
import { VisibilitySection } from '@/components/admin/VisibilitySection';

export default async function AdminHackathonsPage({
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
    items = all.filter(p => p.type === 'hackathon');
  }

  const allHackathons = listHackathons();
  const visibilityItems = allHackathons.map(h => ({
    name: localize(lang, h.hackathon.name, h.hackathon.name_zh),
    slug: h.hackathon.slug,
    visibility: h.hackathon.visibility ?? 'public',
  }));

  return (
    <div>
      <h1 className="text-2xl font-heading text-foreground mb-8">{t(lang, 'admin.hackathons')}</h1>
      <ReviewList items={items} lang={lang} type="hackathon" />
      <VisibilitySection
        items={visibilityItems}
        type="hackathon"
        lang={lang}
        translations={{
          title: t(lang, 'admin.visibility'),
          publish: t(lang, 'admin.publish'),
          unpublish: t(lang, 'admin.unpublish'),
          private: t(lang, 'admin.visibility_private'),
          public: t(lang, 'admin.visibility_public'),
          success: t(lang, 'admin.publish_success'),
          error: t(lang, 'admin.publish_error'),
        }}
      />
    </div>
  );
}
