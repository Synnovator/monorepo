import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decrypt, type Session } from '@synnovator/shared/auth';
import { getHackathon } from '@/app/_generated/data';
import { HackathonEditorClient } from './HackathonEditorClient';

export default async function HackathonEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Auth
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect(`/login?returnTo=/edit/hackathon/${slug}`);

  const session = await decrypt(sessionCookie, process.env.AUTH_SECRET!) as Session | null;
  if (!session) redirect('/login');

  // Load hackathon data
  const entry = getHackathon(slug);
  if (!entry) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold text-destructive mb-2">
            Hackathon not found
          </h1>
          <p className="text-muted-foreground">
            No hackathon with slug &quot;{slug}&quot; exists.
          </p>
        </div>
      </div>
    );
  }

  const h = entry.hackathon;

  // Authorization: dev-token users can edit everything; otherwise check organizer list
  const isDevUser = session.access_token === 'dev-token';
  const isOrganizer = isDevUser || h.organizers?.some(
    (o) => o.github && o.github === session.login,
  );

  if (!isOrganizer) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold text-destructive mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You must be an organizer of &quot;{h.name}&quot; to edit this hackathon.
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Logged in as: {session.login}
          </p>
        </div>
      </div>
    );
  }

  // Extract track names for tabs
  const tracks = (h.tracks ?? []).map((tr) => ({
    slug: tr.slug,
    name: tr.name,
    nameZh: tr.name_zh,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <HackathonEditorClient
        slug={slug}
        hackathonName={h.name}
        hackathonNameZh={h.name_zh}
        description={h.description ?? ''}
        descriptionZh={h.description_zh ?? ''}
        tracks={tracks}
        login={session.login}
      />
    </div>
  );
}
