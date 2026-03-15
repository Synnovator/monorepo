import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface NDASignFormProps {
  ndaDocumentUrl?: string;
  ndaSummary?: string;
  lang: Lang;
}

export function NDASignForm({ ndaDocumentUrl, ndaSummary, lang }: NDASignFormProps) {
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

      <p className="text-xs text-muted-foreground">
        {t(lang, 'form.nda.contact_organizer')}
      </p>
    </div>
  );
}

export default NDASignForm;
