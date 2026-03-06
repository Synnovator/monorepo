import { cookies } from 'next/headers';
import { decrypt, type Session } from '@synnovator/shared/auth';
import { createGitHubClient, listPendingReviews } from '@synnovator/shared/data';

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const session = await decrypt(
    cookieStore.get('session')!.value,
    process.env.AUTH_SECRET!,
  ) as Session;

  const client = createGitHubClient(session.access_token);
  const pending = await listPendingReviews(
    client,
    process.env.GITHUB_OWNER || 'Synnovator',
    process.env.GITHUB_REPO || 'monorepo',
  );

  const counts = {
    hackathon: pending.filter(p => p.type === 'hackathon').length,
    profile: pending.filter(p => p.type === 'profile').length,
    submission: pending.filter(p => p.type === 'submission').length,
  };

  return (
    <div>
      <h1 className="text-2xl font-heading text-white mb-8">Dashboard</h1>
      <div className="grid grid-cols-3 gap-6">
        {Object.entries(counts).map(([type, count]) => (
          <div key={type} className="bg-dark-bg border border-secondary-bg rounded-lg p-6">
            <p className="text-muted text-sm capitalize">{type}s pending</p>
            <p className="text-3xl font-heading text-lime-primary mt-2">{count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
