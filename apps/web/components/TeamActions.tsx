'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { PencilIcon } from '@/components/icons';

interface TeamActionsProps {
  teamSlug: string;
  leader: string;
  members: string[];
  status: string;
  teamYamlContent: string;
  lang: Lang;
}

export function TeamActions({
  teamSlug,
  leader,
  members,
  status,
  teamYamlContent,
  lang,
}: TeamActionsProps) {
  const { user, loading, isLoggedIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !isLoggedIn || !user) return null;

  const login = user.login;
  const isLeader = login === leader;
  const isMember = members.includes(login);

  async function handleJoin() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const memberEntry = `  - github: "${login}"\n    role: developer\n    joined_at: "${today}"\n`;
      const updatedContent = teamYamlContent.replace(
        /^(members:.*$)/m,
        `$1\n${memberEntry}`,
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

  async function handleLeave() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const lines = teamYamlContent.split('\n');
      const filtered: string[] = [];
      let skipMember = false;

      for (const line of lines) {
        if (line.match(/^\s+-\s+github:\s+"/) && line.includes(login)) {
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

  // Leader: show edit button
  if (isLeader) {
    const editUrl = `https://github.com/Synnovator/monorepo/edit/main/teams/${teamSlug}/team.yml`;
    return (
      <a
        href={editUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
      >
        <PencilIcon size={14} />
        {t(lang, 'team.edit')}
      </a>
    );
  }

  // Member: show leave button
  if (isMember) {
    return (
      <div>
        <button
          onClick={handleLeave}
          disabled={submitting}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t(lang, 'form.common.submitting') : t(lang, 'team.leave')}
        </button>
        {error && <p className="text-destructive text-sm mt-2">{error}</p>}
      </div>
    );
  }

  // Non-member + team is recruiting: show join button
  if (status === 'recruiting') {
    return (
      <div>
        <button
          onClick={handleJoin}
          disabled={submitting}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t(lang, 'form.common.submitting') : t(lang, 'team.join')}
        </button>
        {error && <p className="text-destructive text-sm mt-2">{error}</p>}
      </div>
    );
  }

  return null;
}
