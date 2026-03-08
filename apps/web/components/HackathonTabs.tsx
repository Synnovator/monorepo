'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@synnovator/ui';

interface HackathonTabsProps {
  detailsLabel: string;
  submissionsLabel: string;
  leaderboardLabel: string;
  teamsLabel: string;
}

const TAB_IDS = ['details', 'submissions', 'leaderboard', 'teams'] as const;
type TabId = typeof TAB_IDS[number];

function getInitialTab(): TabId {
  if (typeof window === 'undefined') return 'details';
  const hash = window.location.hash.replace('#', '');
  if (TAB_IDS.includes(hash as TabId)) return hash as TabId;
  return 'details';
}

export function HackathonTabs({ detailsLabel, submissionsLabel, leaderboardLabel, teamsLabel }: HackathonTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab);

  const labels: Record<TabId, string> = {
    details: detailsLabel,
    submissions: submissionsLabel,
    leaderboard: leaderboardLabel,
    teams: teamsLabel,
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
      if (!hash) return;

      // If it's a tab ID, switch to that tab
      if (TAB_IDS.includes(hash as TabId)) {
        setActiveTab(hash as TabId);
        return;
      }

      // For non-tab anchors (e.g. #register-section), find the element
      // and ensure its parent tab panel is visible, then scroll to it
      const target = document.getElementById(hash);
      if (!target) return;

      const panel = target.closest<HTMLElement>('[data-tab-panel]');
      if (panel?.dataset.tabPanel) {
        const panelTab = panel.dataset.tabPanel as TabId;
        if (TAB_IDS.includes(panelTab)) {
          setActiveTab(panelTab);
        }
      }

      // Scroll after a tick so the panel is visible
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'smooth' });
      });
    };
    window.addEventListener('hashchange', onHashChange);

    // Also handle initial hash on mount (e.g. direct link with #register-section)
    if (window.location.hash) {
      onHashChange();
    }

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
