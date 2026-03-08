'use client';

import { useAuth } from '@/hooks/useAuth';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { ExternalLinkIcon } from '@/components/icons';

interface EditProjectButtonProps {
  hackathonSlug: string;
  teamSlug: string;
  teamMembers: string[];
  lang: Lang;
}

export function EditProjectButton({ hackathonSlug, teamSlug, teamMembers, lang }: EditProjectButtonProps) {
  const { user, loading } = useAuth();

  if (loading || !user || !teamMembers.includes(user.login)) {
    return null;
  }

  const editUrl = `https://github.com/Synnovator/monorepo/edit/main/hackathons/${hackathonSlug}/submissions/${teamSlug}/project.yml`;

  return (
    <a
      href={editUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-xs text-muted hover:text-lime-primary transition-colors"
    >
      {t(lang, 'project.edit')}
      <ExternalLinkIcon size={12} />
    </a>
  );
}
