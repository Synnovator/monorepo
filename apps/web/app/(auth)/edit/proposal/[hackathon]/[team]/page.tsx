import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decrypt, type Session } from '@synnovator/shared/auth';
import { listSubmissions } from '@/app/_generated/data';
import { ProposalEditorClient } from './ProposalEditorClient';

export default async function ProposalEditorPage({
  params,
}: {
  params: Promise<{ hackathon: string; team: string }>;
}) {
  const { hackathon, team } = await params;

  // Auth
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) redirect(`/login?returnTo=/edit/proposal/${hackathon}/${team}`);

  const session = await decrypt(sessionCookie, process.env.AUTH_SECRET!) as Session | null;
  if (!session) redirect(`/login?returnTo=/edit/proposal/${hackathon}/${team}`);

  // Load submission data
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

  // Authorization: dev-token users can edit everything; otherwise check team membership
  const isDevUser = session.access_token === 'dev-token';
  const isTeamMember = isDevUser || entry.project.team.some(
    (member) => member.github === session.login,
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProposalEditorClient
        hackathonSlug={hackathon}
        teamSlug={team}
        projectName={entry.project.name}
        projectNameZh={entry.project.name_zh}
        login={session.login}
      />
    </div>
  );
}
