'use client';

import { useAuth } from '@/hooks/useAuth';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import Link from 'next/link';
import { PencilIcon } from '@/components/icons';

interface EditProjectButtonProps {
  hackathonSlug: string;
  teamSlug: string;
  managedBy: string[];
  teamMembers: string[];
  lang: Lang;
}

export function EditProjectButton({ hackathonSlug, teamSlug, managedBy, teamMembers, lang }: EditProjectButtonProps) {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  const login = user.login.toLowerCase();
  const canEdit =
    user.role === 'admin' ||
    managedBy.some(m => m.toLowerCase() === login) ||
    teamMembers.some(member => member.toLowerCase() === login);

  if (!canEdit) return null;

  return (
    <Link
      href={`/edit/proposal/${hackathonSlug}/${teamSlug}?lang=${lang}`}
      className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
    >
      {t(lang, 'project.edit')}
      <PencilIcon size={12} aria-hidden="true" />
    </Link>
  );
}
