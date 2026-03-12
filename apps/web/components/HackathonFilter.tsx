'use client';

import { useState } from 'react';
import { getCurrentStage, t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { HackathonCard } from './HackathonCard';
import { SketchDoodle } from '@/components/sketch';

interface HackathonData {
  hackathon: {
    name: string;
    name_zh?: string;
    slug: string;
    tagline?: string;
    tagline_zh?: string;
    type: string;
    timeline?: Record<string, { start: string; end: string }>;
  };
}

interface HackathonFilterProps {
  hackathons: HackathonData[];
  lang: Lang;
}

type FilterStatus = 'all' | 'active' | 'upcoming' | 'ended';

function getFilterStatus(hackathon: HackathonData['hackathon']): FilterStatus {
  const stage = hackathon.timeline ? getCurrentStage(hackathon.timeline) : 'draft';
  const upcomingStages = ['draft'];
  const endedStages = ['ended', 'announcement', 'award'];
  if (upcomingStages.includes(stage)) return 'upcoming';
  if (endedStages.includes(stage)) return 'ended';
  return 'active';
}

const filterKeys: FilterStatus[] = ['all', 'active', 'upcoming', 'ended'];
const filterI18nKeys: Record<FilterStatus, string> = {
  all: 'home.filter_all',
  active: 'home.filter_active',
  upcoming: 'home.filter_upcoming',
  ended: 'home.filter_ended',
};

export function HackathonFilter({ hackathons, lang }: HackathonFilterProps) {
  const [currentFilter, setCurrentFilter] = useState<FilterStatus>('all');

  const filtered = hackathons.filter((entry) => {
    const status = getFilterStatus(entry.hackathon);
    return currentFilter === 'all' || status === currentFilter;
  });

  return (
    <>
      {/* Status filters */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {filterKeys.map((filter) => (
            <button
              key={filter}
              onClick={() => setCurrentFilter(filter)}
              aria-pressed={currentFilter === filter}
              className={`text-sm px-4 py-1.5 min-h-11 rounded-full border transition-colors cursor-pointer ${
                currentFilter === filter
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
              }`}
            >
              {t(lang, filterI18nKeys[filter])}
            </button>
          ))}
        </div>
      </div>


      {/* Hackathon grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((entry) => (
            <HackathonCard key={entry.hackathon.slug} hackathon={entry.hackathon} lang={lang} />
          ))}
        </div>
      ) : hackathons.length > 0 ? (
        <div className="text-center py-24">
          <SketchDoodle variant="lightbulb" className="mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">{t(lang, 'home.no_matching')}</p>
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="text-muted-foreground text-lg mb-4">{t(lang, 'home.empty')}</p>
          <a href="/guides/organizer" className="text-primary hover:underline">
            {t(lang, 'home.empty_cta')}
          </a>
        </div>
      )}
    </>
  );
}
