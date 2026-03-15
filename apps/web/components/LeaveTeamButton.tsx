'use client';

import { useAuth } from '@/hooks/useAuth';
import { buildPRUrl, openGitHubUrl } from '@/lib/github-url';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface LeaveTeamButtonProps {
  teamSlug: string;
  teamYamlContent: string;
  lang: Lang;
}

export function LeaveTeamButton({ teamSlug, teamYamlContent, lang }: LeaveTeamButtonProps) {
  const { user, isLoggedIn } = useAuth();

  function handleLeave() {
    if (!user || !isLoggedIn) return;

    const lines = teamYamlContent.split('\n');
    const filtered: string[] = [];
    let skipMember = false;

    for (const line of lines) {
      if (line.match(/^\s+-\s+github:\s+"/) && line.includes(user.login)) {
        skipMember = true;
        continue;
      }
      if (skipMember && line.match(/^\s+\w+:/)) {
        if (line.match(/^\s+-\s+github:/)) {
          skipMember = false;
        } else {
          continue;
        }
      }
      if (skipMember && (line.match(/^\S/) || line.trim() === '')) {
        skipMember = false;
      }
      if (!skipMember) {
        filtered.push(line);
      }
    }

    const url = buildPRUrl({
      title: `[Team] ${user.login} leaves ${teamSlug}`,
      branch: `data/team-leave-${teamSlug}-${user.login}`,
      files: [{ path: `teams/${teamSlug}/team.yml`, content: filtered.join('\n') }],
    });
    openGitHubUrl(url);
  }

  if (!isLoggedIn) return null;

  return (
    <button
      onClick={handleLeave}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
    >
      {t(lang, 'team.leave')}
    </button>
  );
}
