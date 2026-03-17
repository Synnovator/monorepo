'use client';

import { useAuth } from '@/hooks/useAuth';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import Link from 'next/link';
import { PencilIcon } from '@/components/icons';

interface EditProfileButtonProps {
  profileUsername: string;
  lang: Lang;
}

export function EditProfileButton({ profileUsername, lang }: EditProfileButtonProps) {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  const canEdit =
    user.role === 'admin' ||
    user.login.toLowerCase() === profileUsername.toLowerCase();

  if (!canEdit) return null;

  return (
    <Link
      href={`/edit/profile/${profileUsername}`}
      className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
    >
      {t(lang, 'profile.edit')}
      <PencilIcon size={12} aria-hidden="true" />
    </Link>
  );
}
