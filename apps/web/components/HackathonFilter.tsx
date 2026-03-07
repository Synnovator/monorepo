'use client';

import { useState } from 'react';
import { getCurrentStage, t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { HackathonCard } from './HackathonCard';
import { SearchIcon } from './icons';

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

function getSearchText(h: HackathonData['hackathon']): string {
  return `${h.name} ${h.name_zh || ''} ${h.tagline || ''} ${h.tagline_zh || ''} ${h.type}`.toLowerCase();
}

const filterKeys: FilterStatus[] = ['all', 'active', 'upcoming', 'ended'];
const filterI18nKeys: Record<FilterStatus, string> = {
  all: 'home.filter_all',
  active: 'home.filter_active',
  upcoming: 'home.filter_upcoming',
  ended: 'home.filter_ended',
};

export function HackathonFilter({ hackathons, lang }: HackathonFilterProps) {
  const [query, setQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState<FilterStatus>('all');

  const filtered = hackathons.filter((entry) => {
    const status = getFilterStatus(entry.hackathon);
    const matchesFilter = currentFilter === 'all' || status === currentFilter;
    const matchesSearch = !query || getSearchText(entry.hackathon).includes(query.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      {/* Search + Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-md">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(lang, 'home.search_placeholder')}
            className="w-full bg-dark-bg border border-secondary-bg rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-muted focus:border-lime-primary focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {filterKeys.map((filter) => (
            <button
              key={filter}
              onClick={() => setCurrentFilter(filter)}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors cursor-pointer ${
                currentFilter === filter
                  ? 'border-lime-primary bg-lime-primary/20 text-lime-primary'
                  : 'border-secondary-bg text-muted hover:border-lime-primary hover:text-white'
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
          <p className="text-muted text-lg">{t(lang, 'home.no_matching')}</p>
        </div>
      ) : (
        <div className="text-center py-24">
          <p className="text-muted text-lg mb-4">{t(lang, 'home.empty')}</p>
          <a href="/guides/organizer" className="text-lime-primary hover:underline">
            {t(lang, 'home.empty_cta')}
          </a>
        </div>
      )}
    </>
  );
}
