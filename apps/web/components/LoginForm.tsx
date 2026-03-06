'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getLangFromSearchParams, t } from '@synnovator/shared/i18n';

export function LoginForm() {
  const searchParams = useSearchParams();
  const lang = getLangFromSearchParams(searchParams);
  const returnTo = searchParams.get('returnTo') || '/';

  const [tab, setTab] = useState<'password' | 'github'>('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        await res.json();
        setError(t(lang, 'auth.invalid_credentials'));
        return;
      }

      window.location.href = returnTo;
    } catch {
      setError(t(lang, 'auth.network_error'));
    } finally {
      setLoading(false);
    }
  }

  function handleGitHubLogin() {
    window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm bg-dark-bg border border-secondary-bg rounded-lg p-8">
        <h1 className="text-2xl font-heading text-white mb-6 text-center">
          {t(lang, 'auth.login')}
        </h1>

        <div className="flex mb-6 border-b border-secondary-bg">
          <button
            type="button"
            onClick={() => setTab('password')}
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${
              tab === 'password'
                ? 'text-lime-primary border-b-2 border-lime-primary'
                : 'text-muted hover:text-white'
            }`}
          >
            {t(lang, 'auth.login_password')}
          </button>
          <button
            type="button"
            onClick={() => setTab('github')}
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${
              tab === 'github'
                ? 'text-lime-primary border-b-2 border-lime-primary'
                : 'text-muted hover:text-white'
            }`}
          >
            {t(lang, 'auth.login_github')}
          </button>
        </div>

        {tab === 'password' ? (
          <>
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm text-muted mb-1">
                  {t(lang, 'auth.username')}
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-near-black border border-secondary-bg rounded-md text-white text-sm focus:outline-none focus:border-lime-primary"
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm text-muted mb-1">
                  {t(lang, 'auth.password')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-near-black border border-secondary-bg rounded-md text-white text-sm focus:outline-none focus:border-lime-primary"
                  autoComplete="current-password"
                />
              </div>

              {error && <p className="text-error text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-lime-primary text-near-black font-medium rounded-md hover:bg-lime-primary/90 transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? t(lang, 'auth.signing_in') : t(lang, 'auth.sign_in')}
              </button>
            </form>

            <p className="text-muted text-xs text-center mt-4">
              admin / 12345
            </p>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-muted text-sm text-center">
              {t(lang, 'auth.sign_in_with_github')}
            </p>
            <button
              type="button"
              onClick={handleGitHubLogin}
              className="w-full py-2 px-4 bg-[#24292f] text-white font-medium rounded-md hover:bg-[#32383f] transition-colors text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
