'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@synnovator/ui';

interface HackathonTabsProps {
  detailsLabel: string;
  submissionsLabel: string;
  leaderboardLabel: string;
}

const TAB_IDS = ['details', 'submissions', 'leaderboard'] as const;
type TabId = typeof TAB_IDS[number];

function getInitialTab(): TabId {
  if (typeof window === 'undefined') return 'details';
  const hash = window.location.hash.replace('#', '');
  if (TAB_IDS.includes(hash as TabId)) return hash as TabId;
  return 'details';
}

export function HackathonTabs({ detailsLabel, submissionsLabel, leaderboardLabel }: HackathonTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab);

  const labels: Record<TabId, string> = {
    details: detailsLabel,
    submissions: submissionsLabel,
    leaderboard: leaderboardLabel,
  };

  const syncPanels = useCallback((tab: TabId) => {
    document.querySelectorAll<HTMLElement>('[data-tab-panel]').forEach(panel => {
      panel.style.display = panel.dataset.tabPanel === tab ? '' : 'none';
    });
  }, []);

  useEffect(() => {
    syncPanels(activeTab);
  }, [activeTab, syncPanels]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (TAB_IDS.includes(hash as TabId)) {
        setActiveTab(hash as TabId);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  function handleTabClick(tab: TabId) {
    setActiveTab(tab);
    window.history.replaceState(null, '', `#${tab}`);
  }

  return (
    <div className="inline-flex h-10 items-center gap-1 rounded-lg bg-secondary-bg/50 p-1">
      {TAB_IDS.map(tab => (
        <button
          key={tab}
          onClick={() => handleTabClick(tab)}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            "hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-primary/50",
            activeTab === tab
              ? "bg-surface text-lime-primary shadow-sm"
              : "text-muted"
          )}
        >
          {labels[tab]}
        </button>
      ))}
    </div>
  );
}
