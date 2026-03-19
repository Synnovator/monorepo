'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface JoinTeamButtonProps {
  teamSlug: string;
  teamYamlContent: string;
  lang: Lang;
}

export function JoinTeamButton({ teamSlug, teamYamlContent, lang }: JoinTeamButtonProps) {
  const { user, isLoggedIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    if (!user || !isLoggedIn || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const memberEntry = `  - github: "${user.login}"\n    role: developer\n    joined_at: "${today}"\n`;
      const updatedContent = teamYamlContent.replace(
        /^(members:.*$)/m,
        `$1\n${memberEntry}`
      );

      const res = await fetch('/api/submit-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'team-join',
          slug: teamSlug,
          files: [{ path: `teams/${teamSlug}/team.yml`, content: updatedContent }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
      window.open(data.pr_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join team');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isLoggedIn) return null;

  return (
    <div>
      <button
        onClick={handleJoin}
        disabled={submitting}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? t(lang, 'form.common.submitting') : t(lang, 'team.join')}
      </button>
      {error && <p className="text-destructive text-sm mt-2">{error}</p>}
    </div>
  );
}
