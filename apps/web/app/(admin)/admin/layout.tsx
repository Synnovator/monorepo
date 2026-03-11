import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decrypt, type Session } from '@synnovator/shared/auth';
import { createGitHubClient } from '@synnovator/shared/data';
import { t } from '@synnovator/shared/i18n';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@synnovator/ui';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

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
      <>
        <Suspense><NavBar /></Suspense>
        <div className="min-h-screen pt-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-heading text-destructive mb-2">{t('zh', 'admin.access_denied')}</h1>
            <p className="text-muted-foreground">{t('zh', 'admin.access_denied_desc')}</p>
            <p className="text-muted-foreground text-sm mt-1">{t('en', 'admin.access_denied_desc')}</p>
          </div>
        </div>
        <Suspense><Footer /></Suspense>
      </>
    );
  }

  return (
    <>
      <Suspense><NavBar /></Suspense>
      <div className="pt-16">
        <SidebarProvider className="min-h-[calc(100svh-4rem)]">
          <Suspense>
            <AdminSidebar user={session} />
          </Suspense>
          <SidebarInset>
            <header className="flex items-center gap-2 px-4 py-2 md:hidden">
              <SidebarTrigger />
            </header>
            <div className="p-8">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </div>
      <Suspense><Footer /></Suspense>
    </>
  );
}
