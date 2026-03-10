'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildIssueUrl, openGitHubUrl } from '@/lib/github-url';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface NDASignFormProps {
  hackathonSlug: string;
  ndaDocumentUrl?: string;
  ndaSummary?: string;
  lang: Lang;
}

export function NDASignForm({ hackathonSlug, ndaDocumentUrl, ndaSummary, lang }: NDASignFormProps) {
  const { user, loading, isLoggedIn } = useAuth();
  const [checks, setChecks] = useState([false, false, false]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const allChecked = checks.every(Boolean);

  function toggleCheck(idx: number) {
    setChecks(prev => { const next = [...prev]; next[idx] = !next[idx]; return next; });
  }

  async function handleSubmit() {
    if (!user || !allChecked || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      // Check profile exists
      const res = await fetch(`/api/check-profile?username=${encodeURIComponent(user.login)}`);
      const profileCheck = await res.json();

      if (!profileCheck.exists || !profileCheck.slug) {
        setError(t(lang, 'form.nda.create_profile_first'));
        setSubmitting(false);
        return;
      }

      const url = buildIssueUrl({
        template: 'nda-sign.yml',
        title: `[NDA] ${user.login} — ${hackathonSlug}`,
        labels: ['nda-sign'],
        fields: {
          hackathon: hackathonSlug,
          github: user.login,
        },
      });
      openGitHubUrl(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t(lang, 'form.nda.operation_failed');
      setError(msg);
    }
    setSubmitting(false);
  }

  const checkboxLabels = [
    t(lang, 'form.nda.terms_1'),
    t(lang, 'form.nda.terms_2'),
    t(lang, 'form.nda.terms_3'),
  ];

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 p-6 space-y-4">
      <p className="text-sm text-warning font-medium">
        {t(lang, 'form.nda.requires_nda')}
      </p>

      {ndaSummary && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">{t(lang, 'form.nda.nda_summary')}</p>
          <p className="text-sm text-foreground">{ndaSummary}</p>
        </div>
      )}

      {ndaDocumentUrl && (
        <a
          href={ndaDocumentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors"
        >
          {t(lang, 'form.nda.download_nda')}
        </a>
      )}

      {!loading && !isLoggedIn && (
        <div className="p-3 rounded-lg bg-muted text-muted-foreground text-sm">
          {t(lang, 'form.nda.sign_in_to_sign')}
        </div>
      )}

      {error && (
        <div id="nda-submit-error" role="alert" className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
          {error.includes('Profile') && (
            <a href="/create-profile" className="ml-2 text-primary hover:underline">
              {t(lang, 'form.nda.create_profile')}
            </a>
          )}
        </div>
      )}

      <fieldset disabled={!isLoggedIn || loading} className="space-y-3">
        <p className="text-xs text-muted-foreground">{t(lang, 'form.nda.signer')}: {loading ? '...' : (user?.login ?? '—')}</p>

        {checkboxLabels.map((label, idx) => (
          <label key={idx} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checks[idx]}
              onChange={() => toggleCheck(idx)}
              className="mt-0.5 accent-primary"
            />
            <span className="text-sm text-foreground">{label}</span>
          </label>
        ))}

        <button
          onClick={handleSubmit}
          disabled={!allChecked || submitting}
          aria-describedby={error ? 'nda-submit-error' : undefined}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary text-sm hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? t(lang, 'form.nda.processing')
            : t(lang, 'form.nda.sign_and_pr')} →
        </button>
      </fieldset>
    </div>
  );
}

export default NDASignForm;
