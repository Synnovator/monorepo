import { TeamCard } from '@/components/TeamCard';
import { listTeams } from '@/app/_generated/data';
import { getLangFromSearchParams, t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

export const metadata = { title: 'Teams — Synnovator' };

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = getLangFromSearchParams(new URLSearchParams(sp as Record<string, string>));
  const teams = listTeams();

  const statusOrder = { recruiting: 0, formed: 1, disbanded: 2 };
  const sortedTeams = [...teams].sort(
    (a, b) => (statusOrder[a.status as keyof typeof statusOrder] ?? 3) - (statusOrder[b.status as keyof typeof statusOrder] ?? 3)
  );

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground">
          {t(lang, 'team.list_title')}
        </h1>
        <a
          href="/teams/create"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors"
        >
          + {t(lang, 'team.create')}
        </a>
      </div>

      {sortedTeams.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">{t(lang, 'team.no_teams_yet')}</p>
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
    </main>
  );
}
