'use client';

import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { Card } from '@synnovator/ui';
import { TeamCard } from '@/components/TeamCard';

interface TeamData {
  _slug: string;
  name: string;
  name_zh?: string;
  status: string;
  leader: string;
  members: { github: string; role: string; joined_at: string }[];
  looking_for?: { roles?: string[]; description?: string };
}

interface TeamsTabProps {
  hackathonSlug: string;
  stage: string;
  lang: Lang;
  teams: TeamData[];
}

export function TeamsTab({ hackathonSlug, stage, lang, teams }: TeamsTabProps) {
  const isActive = ['registration', 'development'].includes(stage);

  if (!isActive) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground text-lg">{t(lang, 'hackathon.teams_not_available')}</p>
      </Card>
    );
  }

  const statusOrder = { recruiting: 0, formed: 1, disbanded: 2 };
  const sortedTeams = [...teams].sort(
    (a, b) => (statusOrder[a.status as keyof typeof statusOrder] ?? 3) - (statusOrder[b.status as keyof typeof statusOrder] ?? 3)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-foreground text-sm">
          {t(lang, 'hackathon.teams_browse')}
        </p>
        <a
          href="/teams/create"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors"
        >
          {t(lang, 'team.create')}
        </a>
      </div>

      {sortedTeams.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">{t(lang, 'team.no_teams_yet')}</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTeams.map(team => (
            <TeamCard
              key={team._slug}
              slug={team._slug}
              name={team.name}
              nameZh={team.name_zh}
              status={team.status}
              leader={team.leader}
              memberCount={team.members.length}
              lookingFor={team.looking_for}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
}
