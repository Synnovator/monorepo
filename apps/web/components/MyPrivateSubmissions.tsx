'use client';

import { useAuth } from '@/hooks/useAuth';
import { ProjectCard } from '@/components/ProjectCard';
import { UnlistedBanner } from '@/components/UnlistedBanner';
import type { Lang } from '@synnovator/shared/i18n';

interface PrivateSubmissionData {
  project: {
    name: string;
    name_zh?: string;
    tagline?: string;
    tagline_zh?: string;
    track: string;
    team_ref: string;
    tech_stack?: string[];
    likes?: number;
    visibility?: string;
  };
  _hackathonSlug: string;
  _teamSlug: string;
  /** All team member github handles (lowercase) */
  teamMembers: string[];
}

interface MyPrivateSubmissionsProps {
  /** Private submissions for this hackathon (server passes all of them) */
  privateSubmissions: PrivateSubmissionData[];
  hackathonSlug: string;
  lang: Lang;
}

/**
 * Client component that shows private submissions to their team members.
 * Uses useAuth() to check if the current user is a team member.
 * Renders nothing for unauthenticated users or non-team-members.
 */
export function MyPrivateSubmissions({ privateSubmissions, hackathonSlug, lang }: MyPrivateSubmissionsProps) {
  const { user, loading } = useAuth();

  if (loading || !user || privateSubmissions.length === 0) return null;

  const login = user.login.toLowerCase();

  // Filter to only submissions where the current user is a team member
  const mySubmissions = privateSubmissions.filter(sub =>
    sub.teamMembers.some(m => m.toLowerCase() === login),
  );

  if (mySubmissions.length === 0) return null;

  return (
    <div className="mb-6">
      <UnlistedBanner lang={lang} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mySubmissions.map(sub => (
          <ProjectCard
            key={sub._teamSlug}
            project={sub.project}
            hackathonSlug={hackathonSlug}
            teamSlug={sub._teamSlug}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
}
