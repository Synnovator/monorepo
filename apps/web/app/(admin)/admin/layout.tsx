import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decrypt, type Session } from '@synnovator/shared/auth';
import { createGitHubClient } from '@synnovator/shared/data';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) redirect('/api/auth/login?returnTo=/admin');

  const session = await decrypt(sessionCookie, process.env.AUTH_SECRET!) as Session | null;
  if (!session) redirect('/api/auth/login?returnTo=/admin');

  const client = createGitHubClient(session.access_token);
  const permission = await client.checkRepoPermission(
    process.env.GITHUB_OWNER || 'Synnovator',
    process.env.GITHUB_REPO || 'monorepo',
    session.login,
  );

  if (!['admin', 'maintain', 'write'].includes(permission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading text-error mb-2">Access Denied</h1>
          <p className="text-muted">You need admin or maintain permission on the repository.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar user={session} />
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
