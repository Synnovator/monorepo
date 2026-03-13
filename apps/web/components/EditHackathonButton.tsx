'use client';

import { useAuth } from '@/hooks/useAuth';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import Link from 'next/link';
import { PencilIcon } from '@/components/icons';

interface EditHackathonButtonProps {
  slug: string;
  organizers: string[];
  lang: Lang;
}

export function EditHackathonButton({ slug, organizers, lang }: EditHackathonButtonProps) {
  const { user, loading } = useAuth();

  // Dev users (non-GitHub) can edit all pages; GitHub users must be organizers
  if (loading || !user || (user.isGitHub && !organizers.includes(user.login))) {
    return null;
  }

  return (
    <Link
      href={`/edit/hackathon/${slug}`}
      className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
    >
      {t(lang, 'hackathon.edit')}
      <PencilIcon size={12} aria-hidden="true" />
    </Link>
  );
}
