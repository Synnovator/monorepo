'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { getLangFromSearchParams, t } from '@synnovator/shared/i18n';
import { Card } from '@synnovator/ui';
import { GitHubIcon } from './icons';
import { SketchUnderline, SketchDoodle } from './sketch';

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
    <div className="flex w-full">
      {/* Brand Panel — hidden on mobile */}
      <div className="hidden lg:flex w-[55%] bg-muted relative overflow-hidden flex-col items-center justify-center px-12 xl:px-16">
        {/* Logo with light/dark variants */}
        <div className="mb-8">
          <Image
            src="/logo-dark.svg"
            alt="Synnovator"
            width={120}
            height={60}
            className="dark:hidden"
            priority
          />
          <Image
            src="/logo-light.svg"
            alt="Synnovator"
            width={120}
            height={60}
            className="hidden dark:block"
            priority
          />
        </div>

        {/* Tagline */}
        <h2 className="text-3xl xl:text-4xl font-heading font-bold text-foreground text-center mb-4">
          {t(lang, 'auth.brand_tagline')}
        </h2>

        {/* Sketch underline decoration */}
        <SketchUnderline width={200} delay={300} />

        {/* Highlights */}
        <ul className="mt-10 space-y-4 text-muted-foreground text-sm xl:text-base">
          <li className="flex items-center gap-3">
            <span className="text-primary">&#9670;</span>
            {t(lang, 'auth.brand_highlight_1')}
          </li>
          <li className="flex items-center gap-3">
            <span className="text-primary">&#9670;</span>
            {t(lang, 'auth.brand_highlight_2')}
          </li>
          <li className="flex items-center gap-3">
            <span className="text-primary">&#9670;</span>
            {t(lang, 'auth.brand_highlight_3')}
          </li>
        </ul>

        {/* Rocket doodle in bottom-right corner */}
        <SketchDoodle
          variant="rocket"
          className="absolute bottom-12 right-12 opacity-40"
          delay={600}
        />
      </div>

      {/* Login Form Panel */}
      <div className="w-full lg:w-[45%] bg-background flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile-only tagline */}
        <p className="lg:hidden text-lg font-heading font-bold text-foreground text-center mb-8">
          {t(lang, 'auth.brand_tagline')}
        </p>

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

        {/* No account hint */}
        <p className="text-muted-foreground text-xs text-center mt-6 max-w-sm">
          {t(lang, 'auth.no_account_hint')}
        </p>
      </div>
    </div>
  );
}
