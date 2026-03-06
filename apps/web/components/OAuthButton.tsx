'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useRef, useEffect, useCallback } from 'react';

export function OAuthButton() {
  const { user, loading, isLoggedIn } = useAuth();
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
      window.location.href = `/create-profile?github=${encodeURIComponent(user!.login)}`;
    }
  }, [user, navigating]);

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-secondary-bg animate-pulse" />;
  }

  if (!isLoggedIn) {
    return (
      <a href="/login" className="flex items-center gap-2 text-sm text-muted hover:text-white transition-colors">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        <span className="hidden sm:inline">Sign In</span>
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
          <button
            onClick={handleMyProfile}
            disabled={navigating}
            className="block w-full text-left px-4 py-2 text-sm text-light-gray hover:bg-secondary-bg hover:text-white transition-colors disabled:opacity-50"
          >
            {navigating ? 'Loading...' : 'My Profile'}
          </button>
          <a href="/api/auth/logout" className="block px-4 py-2 text-sm text-light-gray hover:bg-secondary-bg hover:text-white transition-colors">Sign Out</a>
        </div>
      )}
    </div>
  );
}
