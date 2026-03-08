'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getLangFromSearchParams, t } from '@synnovator/shared/i18n';
import { GitHubIcon } from './icons';

export function OAuthButton() {
  const { user, loading, isLoggedIn } = useAuth();
  const searchParams = useSearchParams();
  const lang = getLangFromSearchParams(searchParams);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

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
    return <div className="w-8 h-8 rounded-full bg-secondary-bg animate-pulse" />;
  }

  if (!isLoggedIn) {
    return (
      <a href="/login" className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors">
        <GitHubIcon size={16} />
        <span className="hidden sm:inline">{t(lang, 'auth.login')}</span>
      </a>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 cursor-pointer" aria-label="User menu">
        <img src={user!.avatar_url} alt="" className="w-8 h-8 rounded-full border border-secondary-bg" />
        <span className="hidden sm:inline text-sm text-light-gray">{user!.login}</span>
      </button>
      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-secondary-bg bg-dark-bg shadow-xl py-1 z-50">
          {user!.isGitHub ? (
            <button
              onClick={handleMyProfile}
              disabled={navigating}
              className="block w-full text-left px-4 py-2 text-sm text-light-gray hover:bg-secondary-bg hover:text-white transition-colors disabled:opacity-50"
            >
              {navigating ? t(lang, 'auth.loading') : t(lang, 'auth.my_profile')}
            </button>
          ) : (
            <a
              href={`/api/auth/login?returnTo=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`}
              className="block px-4 py-2 text-sm text-light-gray hover:bg-secondary-bg hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <GitHubIcon size={16} />
                {t(lang, 'auth.link_github')}
              </span>
              <span className="text-xs text-muted block mt-0.5">{t(lang, 'auth.link_github_hint')}</span>
            </a>
          )}
          <a href="/api/auth/logout" className="block px-4 py-2 text-sm text-light-gray hover:bg-secondary-bg hover:text-white transition-colors">
            {t(lang, 'auth.logout')}
          </a>
        </div>
      )}
    </div>
  );
}
