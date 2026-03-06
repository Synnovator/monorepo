import { cookies } from 'next/headers';
import { decrypt, type Session } from '@synnovator/shared/auth';
import { createGitHubClient, listPendingReviews } from '@synnovator/shared/data';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { ReviewList } from '@/components/admin/ReviewList';

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
    process.env.AUTH_SECRET || 'dev-secret-key-min-32-chars-long!!',
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

  return (
    <div>
      <h1 className="text-2xl font-heading text-white mb-8">{t(lang, 'admin.hackathons')}</h1>
      <ReviewList items={items} lang={lang} type="hackathon" />
    </div>
  );
}
