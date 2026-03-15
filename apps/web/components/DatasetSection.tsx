'use client';

import { t, localize } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { Card } from '@synnovator/ui';

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
  lang: Lang;
}

export function DatasetSection({ datasets, lang }: DatasetSectionProps) {
  if (!datasets || datasets.length === 0) return null;

  return (
    <div className="space-y-4">
      {datasets.map((ds, idx) => (
        <DatasetItem key={idx} dataset={ds} lang={lang} />
      ))}
    </div>
  );
}

function DatasetItem({ dataset: ds, lang }: { dataset: Dataset; lang: Lang }) {
  const isNdaRequired = ds.access_control === 'nda-required' || ds.access_control === 'nda';
  const hasLink = !!ds.download_url;

  return (
    <Card className="p-6">
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

      {/* NDA warning — access controlled by the data provider */}
      {isNdaRequired && (
        <p className="mt-3 text-xs text-warning">
          {t(lang, 'hackathon.nda_required_download')}
        </p>
      )}

      {/* Download link — external URL provided by organizer */}
      {hasLink && (
        <a
          href={ds.download_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors"
        >
          {t(lang, 'dataset.download')}
        </a>
      )}

      {/* No link provided yet */}
      {!hasLink && (
        <p className="mt-3 text-xs text-muted-foreground italic">
          {t(lang, 'dataset.link_pending')}
        </p>
      )}
    </Card>
  );
}
