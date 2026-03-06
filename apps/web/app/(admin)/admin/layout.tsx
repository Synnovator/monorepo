import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decrypt, type Session } from '@synnovator/shared/auth';
import { createGitHubClient } from '@synnovator/shared/data';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) redirect('/login?returnTo=/admin');

  const session = await decrypt(sessionCookie, process.env.AUTH_SECRET || 'dev-secret-key-min-32-chars-long!!') as Session | null;
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
            <h1 className="text-2xl font-heading text-error mb-2">Access Denied</h1>
            <p className="text-muted">You need admin or maintain permission on the repository.</p>
          </div>
        </div>
        <Suspense><Footer /></Suspense>
      </>
    );
  }

  return (
    <>
      <Suspense><NavBar /></Suspense>
      <div className="flex min-h-screen pt-16">
        <Suspense>
          <AdminSidebar user={session} />
        </Suspense>
        <div className="flex-1 p-8">{children}</div>
      </div>
      <Suspense><Footer /></Suspense>
    </>
  );
}
