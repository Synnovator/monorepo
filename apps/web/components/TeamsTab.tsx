'use client';

import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { ExternalLinkIcon } from '@/components/icons';

interface TeamsTabProps {
  hackathonSlug: string;
  stage: string;
  lang: Lang;
}

export function TeamsTab({ hackathonSlug, stage, lang }: TeamsTabProps) {
  const isActive = ['registration', 'development'].includes(stage);

  if (!isActive) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-muted-foreground text-lg">{t(lang, 'hackathon.teams_not_available')}</p>
      </div>
    );
  }

  const browseUrl = `https://github.com/Synnovator/monorepo/issues?q=label:team-formation+label:hackathon:${hackathonSlug}+is:open`;

  return (
    <div className="space-y-6">
      <p className="text-foreground text-sm">{t(lang, 'hackathon.teams_browse')}</p>

      <div className="flex flex-wrap gap-3">
        <a
          href={browseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
        >
          {t(lang, 'hackathon.teams_browse_link')}
          <ExternalLinkIcon size={14} aria-hidden="true" />
        </a>

        <a
          href="#team-formation-section"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors"
        >
          {t(lang, 'hackathon.teams_post')}
        </a>
      </div>
    </div>
  );
}
