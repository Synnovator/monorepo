import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildIssueUrl } from '@/lib/github-url';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';

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

interface DatasetDownloadProps {
  datasets: Dataset[];
  hackathonSlug: string;
  lang: Lang;
}

function loc(lang: 'zh' | 'en', en?: string, zh?: string): string {
  if (lang === 'zh') return zh || en || '';
  return en || zh || '';
}

export function DatasetDownload({ datasets, hackathonSlug, lang }: DatasetDownloadProps) {
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
    <div className="rounded-lg border border-secondary-bg bg-dark-bg p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-white font-medium text-sm">{loc(lang, ds.name, ds.name_zh)}</p>
        {ds.version && <span className="text-xs text-muted">v{ds.version}</span>}
      </div>
      {ds.description && <p className="text-muted text-sm mt-1">{ds.description}</p>}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted">
        {ds.format && <span>Format: {ds.format}</span>}
        {ds.size && <span>Size: {ds.size}</span>}
        {ds.access_control && (
          <span className={isNdaRequired ? 'px-2 py-0.5 rounded bg-warning/20 text-warning' : 'px-2 py-0.5 rounded bg-lime-primary/20 text-lime-primary'}>
            {isNdaRequired ? t(lang, 'dataset.nda_required') : t(lang, 'dataset.public')}
          </span>
        )}
      </div>
      {ds.download_url ? (
        <a href={ds.download_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-secondary-bg text-white text-sm hover:bg-secondary-bg/80 transition-colors">
          {t(lang, 'dataset.download')}
        </a>
      ) : isNdaRequired ? (
        <button onClick={handlePresign} disabled={loading}
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-lime-primary/20 text-lime-primary text-sm hover:bg-lime-primary/30 transition-colors cursor-pointer disabled:opacity-50">
          {loading ? '...' : t(lang, 'dataset.get_download_link')}
        </button>
      ) : null}
      {error && (
        <div className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm">
          {error}
          {ndaUrl && <a href={ndaUrl} target="_blank" rel="noopener" className="underline ml-2 font-medium hover:text-white">{t(lang, 'dataset.sign_nda_link')}</a>}
        </div>
      )}
    </div>
  );
}

export default DatasetDownload;
