'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface LeaveTeamButtonProps {
  teamSlug: string;
  teamYamlContent: string;
  lang: Lang;
}

export function LeaveTeamButton({ teamSlug, teamYamlContent, lang }: LeaveTeamButtonProps) {
  const { user, isLoggedIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLeave() {
    if (!user || !isLoggedIn || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
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

      const res = await fetch('/api/submit-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'team-leave',
          slug: teamSlug,
          files: [{ path: `teams/${teamSlug}/team.yml`, content: filtered.join('\n') }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
      window.open(data.pr_url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave team');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isLoggedIn) return null;

  return (
    <div>
      <button
        onClick={handleLeave}
        disabled={submitting}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? t(lang, 'form.common.submitting') : t(lang, 'team.leave')}
      </button>
      {error && <p className="text-destructive text-sm mt-2">{error}</p>}
    </div>
  );
}
