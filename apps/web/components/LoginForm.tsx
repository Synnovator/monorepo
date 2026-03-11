'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getLangFromSearchParams, t } from '@synnovator/shared/i18n';
import { Card } from '@synnovator/ui';
import { GitHubIcon } from './icons';

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
      <Card className="w-full max-w-sm p-8">
        <h1 className="text-2xl font-heading text-foreground mb-6 text-center">
          {t(lang, 'auth.login')}
        </h1>

        <div role="tablist" className="flex mb-6 border-b border-border">
          <button
            type="button"
            role="tab"
            id="login-tab-password"
            aria-selected={tab === 'password'}
            aria-controls="login-panel-password"
            onClick={() => setTab('password')}
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${
              tab === 'password'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(lang, 'auth.login_password')}
          </button>
          <button
            type="button"
            role="tab"
            id="login-tab-github"
            aria-selected={tab === 'github'}
            aria-controls="login-panel-github"
            onClick={() => setTab('github')}
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${
              tab === 'github'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(lang, 'auth.login_github')}
          </button>
        </div>

        {tab === 'password' ? (
          <div role="tabpanel" id="login-panel-password" aria-labelledby="login-tab-password">
            <form onSubmit={handlePasswordLogin} className="space-y-4" aria-describedby={error ? 'login-error' : undefined}>
              <div>
                <label htmlFor="username" className="block text-sm text-muted-foreground mb-1">
                  {t(lang, 'auth.username')}
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  aria-required="true"
                  aria-invalid={!!error}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm focus:outline-none focus:border-ring"
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm text-muted-foreground mb-1">
                  {t(lang, 'auth.password')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  aria-required="true"
                  aria-invalid={!!error}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground text-sm focus:outline-none focus:border-ring"
                  autoComplete="current-password"
                />
              </div>

              {error && <p id="login-error" role="alert" className="text-destructive text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? t(lang, 'auth.signing_in') : t(lang, 'auth.sign_in')}
              </button>
            </form>

            <p className="text-muted-foreground text-xs text-center mt-4">
              admin / 12345
            </p>
          </div>
        ) : (
          <div role="tabpanel" id="login-panel-github" aria-labelledby="login-tab-github" className="space-y-4">
            <p className="text-muted-foreground text-sm text-center">
              {t(lang, 'auth.sign_in_with_github')}
            </p>
            <button
              type="button"
              onClick={handleGitHubLogin}
              className="w-full py-2 px-4 bg-muted text-foreground font-medium rounded-md hover:bg-card transition-colors text-sm flex items-center justify-center gap-2"
            >
              <GitHubIcon size={20} aria-hidden="true" />
              GitHub
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
