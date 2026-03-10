'use client';

import { useAuth } from '@/hooks/useAuth';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { ExternalLinkIcon } from '@/components/icons';

interface EditProfileButtonProps {
  profileUsername: string;
  lang: Lang;
}

export function EditProfileButton({ profileUsername, lang }: EditProfileButtonProps) {
  const { user, loading } = useAuth();

  if (loading || !user || user.login !== profileUsername) {
    return null;
  }

  return (
    <a
      href={`https://github.com/Synnovator/monorepo/edit/main/profiles/${profileUsername}.yml`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-xs text-muted hover:text-lime-primary transition-colors"
    >
      {t(lang, 'profile.edit')}
      <ExternalLinkIcon size={12} aria-hidden="true" />
    </a>
  );
}
