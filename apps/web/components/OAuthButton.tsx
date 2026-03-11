'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getLangFromSearchParams, t } from '@synnovator/shared/i18n';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Skeleton,
} from '@synnovator/ui';
import { GitHubIcon } from './icons';

export function OAuthButton() {
  const { user, loading, isLoggedIn } = useAuth();
  const searchParams = useSearchParams();
  const lang = getLangFromSearchParams(searchParams);
  const [navigating, setNavigating] = useState(false);

  const handleMyProfile = useCallback(async () => {
    if (!user || navigating) return;

    // Non-GitHub users: prompt to link GitHub
    if (!user.isGitHub) {
      window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setNavigating(true);
    try {
      const res = await fetch(`/api/check-profile?username=${encodeURIComponent(user.login)}`);
      const data: { exists: boolean; slug: string | null } = await res.json();
      if (data.exists && data.slug) {
        window.location.href = `/hackers/${data.slug}`;
      } else {
        window.location.href = `/create-profile?github=${encodeURIComponent(user.login)}`;
      }
    } catch {
      window.location.href = `/create-profile?github=${encodeURIComponent(user.login)}`;
    }
  }, [user, navigating]);

  if (loading) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  if (!isLoggedIn) {
    return (
      <a href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <GitHubIcon size={16} aria-hidden="true" />
        <span className="hidden sm:inline">{t(lang, 'auth.login')}</span>
      </a>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 cursor-pointer" aria-label="User menu">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={user!.avatar_url} alt={user!.login} />
            <AvatarFallback>{user!.login[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm text-foreground">{user!.login}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-lg border border-border bg-card shadow-xl">
        {user!.isGitHub ? (
          <DropdownMenuItem asChild>
            <button
              onClick={handleMyProfile}
              disabled={navigating}
              className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            >
              {navigating ? t(lang, 'auth.loading') : t(lang, 'auth.my_profile')}
            </button>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <a
              href={`/api/auth/login?returnTo=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`}
              className="block px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <GitHubIcon size={16} aria-hidden="true" />
                {t(lang, 'auth.link_github')}
              </span>
              <span className="text-xs text-muted-foreground block mt-0.5">{t(lang, 'auth.link_github_hint')}</span>
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <a href="/api/auth/logout" className="block px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground transition-colors">
            {t(lang, 'auth.logout')}
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
