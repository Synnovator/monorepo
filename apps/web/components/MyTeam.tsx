'use client';

import { TeamCard } from '@/components/TeamCard';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface TeamData {
  _slug: string;
  name: string;
  name_zh?: string;
  status: string;
  leader: string;
  members: { github: string; role: string; joined_at: string }[];
  looking_for?: { roles?: string[]; description?: string };
}

interface MyTeamProps {
  teamSlug: string | undefined;
  teams: TeamData[];
  lang: Lang;
}

export function MyTeam({ teamSlug, teams, lang }: MyTeamProps) {
  if (!teamSlug) {
    return (
      <div className="p-6 rounded-xl border border-dashed border-border text-center">
        <p className="text-muted-foreground text-sm">{t(lang, 'team.not_in_team')}</p>
        <a
          href="/teams"
          className="mt-3 inline-block text-primary text-sm hover:underline"
        >
          {t(lang, 'team.browse_teams')}
        </a>
      </div>
    );
  }

  const team = teams.find(t => t._slug === teamSlug);
  if (!team) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">{t(lang, 'team.my_team')}</h3>
      <TeamCard
        slug={team._slug}
        name={team.name}
        nameZh={team.name_zh}
        status={team.status}
        leader={team.leader}
        memberCount={team.members.length}
        lookingFor={team.looking_for}
        lang={lang}
      />
    </div>
  );
}
