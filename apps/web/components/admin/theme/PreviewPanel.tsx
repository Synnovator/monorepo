'use client';

import { useState } from 'react';
import { ComponentPreview } from './ComponentPreview';
import { PagePreview } from './PagePreview';

type PreviewTab = 'components' | 'page';

export function PreviewPanel() {
  const [activeTab, setActiveTab] = useState<PreviewTab>('components');

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-border mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('components')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'components'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Components
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('page')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'page'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Page
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'components' ? <ComponentPreview /> : <PagePreview />}
      </div>
    </div>
  );
}
