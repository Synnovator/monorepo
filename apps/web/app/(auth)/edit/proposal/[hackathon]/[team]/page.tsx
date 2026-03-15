import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decrypt, type Session } from '@synnovator/shared/auth';
import type { Lang } from '@synnovator/shared/i18n';
import { listSubmissions, getTeam } from '@/app/_generated/data';
import { getProposalEditorData } from '@/lib/editor-content';
import { ProposalEditorClient } from './ProposalEditorClient';

export default async function ProposalEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ hackathon: string; team: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { hackathon, team } = await params;

  // Auth
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect(`/login?returnTo=/edit/proposal/${hackathon}/${team}`);

  const session = await decrypt(sessionCookie, process.env.AUTH_SECRET!) as Session | null;
  if (!session) redirect(`/login?returnTo=/edit/proposal/${hackathon}/${team}`);

  // Authorization: check team membership using raw submission data
  const allSubmissions = listSubmissions();
  const entry = allSubmissions.find(
    (s) => s._hackathonSlug === hackathon && s._teamSlug === team,
  );

  if (!entry) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold text-destructive mb-2">
            Submission not found
          </h1>
          <p className="text-muted-foreground">
            No submission for team &quot;{team}&quot; in hackathon &quot;{hackathon}&quot;.
          </p>
        </div>
      </div>
    );
  }

  const isDevUser = session.access_token === 'dev-token';
  const teamData = entry.project.team_ref ? getTeam(entry.project.team_ref) : null;
  const isTeamMember = isDevUser || (
    teamData
      ? teamData.leader === session.login || teamData.members.some(m => m.github === session.login)
      : false
  );

  if (!isTeamMember) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold text-destructive mb-2">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You must be a team member to edit this proposal.
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Logged in as: {session.login}
          </p>
        </div>
      </div>
    );
  }

  // Load editor data (MDX content + metadata)
  const editorData = getProposalEditorData(hackathon, team);

  // Read lang from searchParams
  const sp = await searchParams;
  const langRaw = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
  const lang: Lang = langRaw === 'en' ? 'en' : 'zh';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProposalEditorClient
        hackathonSlug={editorData.hackathonSlug}
        teamSlug={editorData.teamSlug}
        projectName={editorData.projectName}
        description={editorData.description}
        login={session.login}
        lang={lang}
      />
    </div>
  );
}
