import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTeam, listTeams } from '@/app/_generated/data';
import { getLangFromSearchParams, t, localize } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { Card, Badge, Avatar, AvatarImage, AvatarFallback } from '@synnovator/ui';
import { GitHubIcon, ExternalLinkIcon } from '@/components/icons';
import { TeamActions } from '@/components/TeamActions';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return listTeams().map(t => ({ team: t._slug }));
}

/** Reconstruct YAML from team data for PR-based edit operations */
function buildTeamYaml(team: ReturnType<typeof getTeam> & {}) {
  let yaml = `synnovator_team: "${team.synnovator_team}"\n`;
  yaml += `name: "${team.name}"\n`;
  if (team.name_zh) yaml += `name_zh: "${team.name_zh}"\n`;
  if (team.description) yaml += `description: "${team.description}"\n`;
  if (team.description_zh) yaml += `description_zh: "${team.description_zh}"\n`;
  if (team.github_url) yaml += `github_url: "${team.github_url}"\n`;
  yaml += `status: ${team.status}\n`;
  yaml += `leader: "${team.leader}"\n`;
  if (team.members.length === 0) {
    yaml += `members: []\n`;
  } else {
    yaml += `members:\n`;
    for (const m of team.members) {
      yaml += `  - github: "${m.github}"\n`;
      yaml += `    role: ${m.role}\n`;
      yaml += `    joined_at: "${m.joined_at}"\n`;
    }
  }
  if (team.looking_for) {
    yaml += `looking_for:\n`;
    if (team.looking_for.roles?.length) {
      yaml += `  roles:\n`;
      for (const r of team.looking_for.roles) yaml += `    - ${r}\n`;
    }
    if (team.looking_for.description) yaml += `  description: "${team.looking_for.description}"\n`;
  }
  if (team.hackathons?.length) {
    yaml += `hackathons:\n`;
    for (const h of team.hackathons) {
      yaml += `  - hackathon: "${h.hackathon}"\n`;
      yaml += `    track: "${h.track}"\n`;
      yaml += `    registered_at: "${h.registered_at}"\n`;
    }
  }
  yaml += `created_at: "${team.created_at}"\n`;
  return yaml;
}

export default async function TeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ team: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { team: teamSlug } = await params;
  const sp = await searchParams;
  const lang: Lang = getLangFromSearchParams(new URLSearchParams(sp as Record<string, string>));

  const team = getTeam(teamSlug);
  if (!team) notFound();

  const displayName = localize(lang, team.name, team.name_zh);
  const displayDescription = team.description
    ? localize(lang, team.description, team.description_zh)
    : null;

  const STATUS_COLORS: Record<string, string> = {
    recruiting: 'bg-green-500/10 text-green-600 border-green-500/30',
    formed: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    disbanded: 'bg-muted text-muted-foreground border-border',
  };

  const memberGithubs = team.members.map(m => m.github);
  const teamYaml = buildTeamYaml(team);

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/teams" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
        &larr; {t(lang, 'team.list_title')}
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-heading font-bold text-foreground">{displayName}</h1>
          <Badge className={`text-xs border ${STATUS_COLORS[team.status] ?? ''}`}>
            {t(lang, `team.status_${team.status}`)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {t(lang, 'team.created_at')}: {team.created_at}
        </p>
        <TeamActions
          teamSlug={teamSlug}
          leader={team.leader}
          members={memberGithubs}
          status={team.status}
          teamYamlContent={teamYaml}
          lang={lang}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          {displayDescription && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">{t(lang, 'team.description')}</h2>
              <p className="text-foreground text-sm leading-relaxed">{displayDescription}</p>
            </section>
          )}

          {/* GitHub Link */}
          {team.github_url && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">{t(lang, 'team.github_repo')}</h2>
              <a
                href={team.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border hover:border-primary/40 transition-colors text-sm text-foreground"
              >
                <GitHubIcon size={18} />
                <span>{team.github_url.replace('https://github.com/', '')}</span>
                <ExternalLinkIcon size={14} className="text-muted-foreground" />
              </a>
            </section>
          )}

          {/* Leader */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">{t(lang, 'team.leader')}</h2>
            <Link href={`/hackers/${team.leader}`} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 transition-colors">
              <Avatar className="h-10 w-10">
                <AvatarImage src={`https://github.com/${team.leader}.png?size=40`} alt={team.leader} />
                <AvatarFallback>{team.leader[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-foreground font-medium">@{team.leader}</p>
                <p className="text-xs text-muted-foreground">{t(lang, 'team.leader')}</p>
              </div>
            </Link>
          </section>

          {/* Members */}
          {team.members.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                {t(lang, 'team.members_count')} ({team.members.length})
              </h2>
              <div className="space-y-2">
                {team.members.map(member => (
                  <Link key={member.github} href={`/hackers/${member.github}`} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://github.com/${member.github}.png?size=40`} alt={member.github} />
                      <AvatarFallback>{member.github[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-foreground text-sm">@{member.github}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Hackathon Participation */}
          {team.hackathons && team.hackathons.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">{t(lang, 'team.hackathons')}</h2>
              <div className="space-y-2">
                {team.hackathons.map(h => (
                  <Link key={`${h.hackathon}-${h.track}`} href={`/hackathons/${h.hackathon}`} className="block p-3 rounded-lg border border-border hover:border-primary/40 transition-colors">
                    <p className="text-foreground text-sm font-medium">{h.hackathon}</p>
                    <p className="text-xs text-muted-foreground">Track: {h.track}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {team.status === 'recruiting' && team.looking_for && (
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{t(lang, 'team.looking_for_roles')}</h3>
              {team.looking_for.roles && team.looking_for.roles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {team.looking_for.roles.map(role => (
                    <span key={role} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                      {role}
                    </span>
                  ))}
                </div>
              )}
              {team.looking_for.description && (
                <p className="text-sm text-muted-foreground">{team.looking_for.description}</p>
              )}
            </Card>
          )}
        </aside>
      </div>
    </main>
  );
}
