'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildIssueUrl } from '@/lib/github-url';
import { t, localize } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface Dataset {
  name: string;
  name_zh?: string;
  version?: string;
  description?: string;
  access_control?: string;
  format?: string;
  size?: string;
  download_url?: string;
}

interface DatasetSectionProps {
  datasets: Dataset[];
  hackathonSlug: string;
  lang: Lang;
}

export function DatasetSection({ datasets, hackathonSlug, lang }: DatasetSectionProps) {
  if (!datasets || datasets.length === 0) return null;

  return (
    <div className="space-y-4">
      {datasets.map((ds, idx) => (
        <DatasetItem key={idx} dataset={ds} hackathonSlug={hackathonSlug} lang={lang} />
      ))}
    </div>
  );
}

function DatasetItem({ dataset: ds, hackathonSlug, lang }: { dataset: Dataset; hackathonSlug: string; lang: Lang }) {
  const { isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ndaUrl, setNdaUrl] = useState<string | null>(null);
  const isNdaRequired = ds.access_control === 'nda-required' || ds.access_control === 'nda';
  const isPublic = ds.access_control === 'public' || (!ds.access_control && !isNdaRequired);

  async function handlePresign() {
    setLoading(true);
    setError(null);
    setNdaUrl(null);
    if (!isLoggedIn) {
      window.location.href = `/api/auth/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    try {
      const res = await fetch('/api/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: `hackathons/${hackathonSlug}/datasets/${ds.name}` }),
      });
      if (!res.ok) {
        const err = await res.json();
        if (err.error === 'nda_required') {
          setNdaUrl(buildIssueUrl({ template: 'nda-sign.yml', title: `[NDA] --- — ${hackathonSlug}`, labels: ['nda-sign'] }));
          setError(err.message || t(lang, 'dataset.nda_first'));
        } else {
          setError(err.error || 'Failed to get download link');
        }
        return;
      }
      const { url } = await res.json();
      window.open(url, '_blank');
    } catch {
      setError(t(lang, 'dataset.network_error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-foreground font-medium text-sm">{localize(lang, ds.name, ds.name_zh)}</p>
        {ds.version && <span className="text-xs text-muted-foreground">v{ds.version}</span>}
      </div>
      {ds.description && <p className="text-muted-foreground text-sm mt-1">{ds.description}</p>}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
        {ds.format && (
          <span className="px-2 py-0.5 rounded bg-muted text-foreground font-code">
            {ds.format.toUpperCase()}
          </span>
        )}
        {ds.size && <span>{ds.size}</span>}
        {ds.access_control && (
          <span className={isNdaRequired ? 'px-2 py-0.5 rounded bg-warning/20 text-warning' : 'px-2 py-0.5 rounded bg-primary/20 text-primary'}>
            {isNdaRequired ? t(lang, 'dataset.nda_required') : t(lang, 'dataset.public')}
          </span>
        )}
      </div>

      {/* Public datasets: direct download link */}
      {isPublic && ds.download_url && (
        <a href={ds.download_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors">
          {t(lang, 'dataset.download')}
        </a>
      )}

      {/* NDA-required datasets: presign flow */}
      {isNdaRequired && (
        <button onClick={handlePresign} disabled={loading}
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-primary/20 text-primary text-sm hover:bg-primary/30 transition-colors cursor-pointer disabled:opacity-50">
          {loading ? '...' : t(lang, 'dataset.get_download_link')}
        </button>
      )}

      {error && (
        <div className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm">
          {error}
          {ndaUrl && <a href={ndaUrl} target="_blank" rel="noopener" className="underline ml-2 font-medium hover:text-foreground">{t(lang, 'dataset.sign_nda_link')}</a>}
        </div>
      )}
    </div>
  );
}
