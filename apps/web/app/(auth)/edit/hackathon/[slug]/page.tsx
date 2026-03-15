import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decrypt, type Session } from '@synnovator/shared/auth';
import type { Lang } from '@synnovator/shared/i18n';
import { getHackathon } from '@/app/_generated/data';
import { getHackathonEditorData } from '@/lib/editor-content';
import { HackathonEditorClient } from './HackathonEditorClient';

export default async function HackathonEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;

  // Auth
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect(`/login?returnTo=/edit/hackathon/${slug}`);

  const session = await decrypt(sessionCookie, process.env.AUTH_SECRET!) as Session | null;
  if (!session) redirect('/login');

  // Authorization: check organizer access using raw hackathon data
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

  // Load editor data (MDX content + metadata)
  const editorData = getHackathonEditorData(slug);

  // Read lang from searchParams
  const sp = await searchParams;
  const langRaw = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  const lang: Lang = langRaw === 'en' ? 'en' : 'zh';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <HackathonEditorClient
        slug={editorData.slug}
        name={editorData.name}
        description={editorData.description}
        tracks={editorData.tracks}
        login={session.login}
        lang={lang}
      />
    </div>
  );
}
