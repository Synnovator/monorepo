import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface HackathonTabsProps {
  detailsLabel: string;
  submissionsLabel: string;
  leaderboardLabel: string;
  children: React.ReactNode;
}

const TAB_IDS = ['details', 'submissions', 'leaderboard'] as const;
type TabId = typeof TAB_IDS[number];

function getInitialTab(): TabId {
  if (typeof window === 'undefined') return 'details';
  const hash = window.location.hash.replace('#', '');
  if (TAB_IDS.includes(hash as TabId)) return hash as TabId;
  return 'details';
}

export function HackathonTabs({
  detailsLabel,
  submissionsLabel,
  leaderboardLabel,
  children,
}: HackathonTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab);

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

  function handleTabChange(value: string) {
    const tab = value as TabId;
    setActiveTab(tab);
    window.history.replaceState(null, '', `#${tab}`);
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="details">{detailsLabel}</TabsTrigger>
        <TabsTrigger value="submissions">{submissionsLabel}</TabsTrigger>
        <TabsTrigger value="leaderboard">{leaderboardLabel}</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}

export { TabsContent };
export default HackathonTabs;
