'use client';

import { useAuth } from '@/hooks/useAuth';
import { buildPRUrl, openGitHubUrl } from '@/lib/github-url';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface JoinTeamButtonProps {
  teamSlug: string;
  teamYamlContent: string;
  lang: Lang;
}

export function JoinTeamButton({ teamSlug, teamYamlContent, lang }: JoinTeamButtonProps) {
  const { user, isLoggedIn } = useAuth();

  function handleJoin() {
    if (!user || !isLoggedIn) return;
    const today = new Date().toISOString().split('T')[0];

    const memberEntry = `  - github: "${user.login}"\n    role: developer\n    joined_at: "${today}"\n`;
    const updatedContent = teamYamlContent.replace(
      /^(members:.*$)/m,
      `$1\n${memberEntry}`
    );

    const url = buildPRUrl({
      title: `[Team] ${user.login} joins ${teamSlug}`,
      branch: `data/team-join-${teamSlug}-${user.login}`,
      files: [{ path: `teams/${teamSlug}/team.yml`, content: updatedContent }],
    });
    openGitHubUrl(url);
  }

  if (!isLoggedIn) return null;

  return (
    <button
      onClick={handleJoin}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors"
    >
      {t(lang, 'team.join')}
    </button>
  );
}
