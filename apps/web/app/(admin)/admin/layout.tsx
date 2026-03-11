import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decrypt, type Session } from '@synnovator/shared/auth';
import { createGitHubClient } from '@synnovator/shared/data';
import { t } from '@synnovator/shared/i18n';
import { AppShell } from '@/components/AppShell';
import { Footer } from '@/components/Footer';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) redirect('/login?returnTo=/admin');

  const session = await decrypt(sessionCookie, process.env.AUTH_SECRET!) as Session | null;
  if (!session) redirect('/login?returnTo=/admin');

  // Skip GitHub permission check for dev login
  let permission = 'admin';
  if (session.access_token !== 'dev-token') {
    const client = createGitHubClient(session.access_token);
    permission = await client.checkRepoPermission(
      process.env.GITHUB_OWNER || 'Synnovator',
      process.env.GITHUB_REPO || 'monorepo',
      session.login,
    );
  }

  if (!['admin', 'maintain', 'write'].includes(permission)) {
    return (
      <Suspense>
        <AppShell>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-heading text-destructive mb-2">{t('zh', 'admin.access_denied')}</h1>
              <p className="text-muted-foreground">{t('zh', 'admin.access_denied_desc')}</p>
              <p className="text-muted-foreground text-sm mt-1">{t('en', 'admin.access_denied_desc')}</p>
            </div>
          </div>
          <Suspense><Footer /></Suspense>
        </AppShell>
      </Suspense>
    );
  }

  return (
    <Suspense>
      <AppShell showAdmin>
        <div className="p-8">{children}</div>
        <Suspense><Footer /></Suspense>
      </AppShell>
    </Suspense>
  );
}
