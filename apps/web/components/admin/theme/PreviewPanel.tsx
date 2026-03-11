'use client';

import { useState } from 'react';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { ComponentPreview } from './ComponentPreview';
import { PagePreview } from './PagePreview';

type PreviewTab = 'components' | 'page';

interface PreviewPanelProps {
  hackathonSlug?: string | null;
  lang: Lang;
}

export function PreviewPanel({ hackathonSlug, lang }: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>('components');

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div role="tablist" aria-label="Preview mode" className="flex border-b border-border mb-4">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'components'}
          aria-controls="panel-components"
          id="tab-components"
          onClick={() => setActiveTab('components')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'components'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t(lang, 'admin.theme_preview_components')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'page'}
          aria-controls="panel-page"
          id="tab-page"
          onClick={() => setActiveTab('page')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'page'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t(lang, 'admin.theme_preview_page')}
        </button>
      </div>

      {/* Tab content */}
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="flex-1 overflow-y-auto"
      >
        {activeTab === 'components' ? (
          <ComponentPreview lang={lang} />
        ) : (
          <PagePreview hackathonSlug={hackathonSlug ?? undefined} />
        )}
      </div>
    </div>
  );
}
