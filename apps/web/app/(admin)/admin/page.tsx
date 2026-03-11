import { cookies } from 'next/headers';
import { decrypt, type Session } from '@synnovator/shared/auth';
import { createGitHubClient, listPendingReviews } from '@synnovator/shared/data';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { Card } from '@synnovator/ui';

const cardKeys = ['hackathon', 'profile', 'submission'] as const;
const labelMap: Record<string, string> = {
  hackathon: 'admin.hackathons',
  profile: 'admin.profiles',
  submission: 'admin.submissions',
};

export default async function AdminDashboard({
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

  let counts = { hackathon: 0, profile: 0, submission: 0 };

  if (session.access_token !== 'dev-token') {
    const client = createGitHubClient(session.access_token);
    const pending = await listPendingReviews(
      client,
      process.env.GITHUB_OWNER || 'Synnovator',
      process.env.GITHUB_REPO || 'monorepo',
    );
    counts = {
      hackathon: pending.filter(p => p.type === 'hackathon').length,
      profile: pending.filter(p => p.type === 'profile').length,
      submission: pending.filter(p => p.type === 'submission').length,
    };
  }

  return (
    <div>
      <h1 className="text-2xl font-heading text-foreground mb-8">{t(lang, 'admin.dashboard')}</h1>
      <div className="grid grid-cols-3 gap-6">
        {cardKeys.map(type => (
          <Card key={type} className="p-6">
            <p className="text-muted-foreground text-sm">{t(lang, labelMap[type])} — {t(lang, 'admin.pending')}</p>
            <p className="text-3xl font-heading text-primary mt-2">{counts[type]}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
