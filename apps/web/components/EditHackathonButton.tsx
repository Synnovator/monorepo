'use client';

import { useAuth } from '@/hooks/useAuth';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import Link from 'next/link';
import { PencilIcon } from '@/components/icons';

interface EditHackathonButtonProps {
  slug: string;
  managedBy: string[];
  lang: Lang;
}

export function EditHackathonButton({ slug, managedBy, lang }: EditHackathonButtonProps) {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  const login = user.login.toLowerCase();
  const canEdit =
    user.role === 'admin' ||
    managedBy.some(m => m.toLowerCase() === login);

  if (!canEdit) return null;

  return (
    <Link
      href={`/edit/hackathon/${slug}?lang=${lang}`}
      className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
    >
      {t(lang, 'hackathon.edit')}
      <PencilIcon size={12} aria-hidden="true" />
    </Link>
  );
}
