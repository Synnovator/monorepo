import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decrypt, type Session } from '@synnovator/shared/auth';
import { canEditProfile } from '@/lib/permissions';
import { getProfile } from '@/app/_generated/data';
import { ProfileEditorClient } from './ProfileEditorClient';

export default async function ProfileEditorPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // Auth
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect(`/login?returnTo=/edit/profile/${username}`);

  const session = await decrypt(sessionCookie, process.env.AUTH_SECRET!) as Session | null;
  if (!session) redirect('/login');

  // Load profile data
  const entry = getProfile(username);
  if (!entry) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold text-destructive mb-2">
            Profile not found
          </h1>
          <p className="text-muted-foreground">
            No profile for user &quot;{username}&quot; exists.
          </p>
        </div>
      </div>
    );
  }

  if (!canEditProfile(session.login, entry.hacker.github)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold text-destructive mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You can only edit your own profile.
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Logged in as: {session.login}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProfileEditorClient
        username={username}
        displayName={entry.hacker.name}
        displayNameZh={entry.hacker.name_zh}
        login={session.login}
      />
    </div>
  );
}
