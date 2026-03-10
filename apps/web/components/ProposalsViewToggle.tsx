'use client';

import { useState } from 'react';
import Link from 'next/link';
import { localize } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { ProjectCard } from '@/components/ProjectCard';

interface SubmissionItem {
  _hackathonSlug: string;
  _teamSlug: string;
  hackathonName: string;
  hackathonNameZh?: string;
  likes: number;
  project: {
    name: string;
    name_zh?: string;
    tagline?: string;
    tagline_zh?: string;
    track: string;
    team: Array<{ github: string; role?: string }>;
    tech_stack?: string[];
    likes?: number;
  };
}

interface ProposalsViewToggleProps {
  hotSorted: SubmissionItem[];
  grouped: Record<string, SubmissionItem[]>;
  hackathonMap: Record<string, { name: string; name_zh?: string; slug: string }>;
  lang: Lang;
  hotLabel: string;
  activityLabel: string;
}

export function ProposalsViewToggle({
  hotSorted,
  grouped,
  hackathonMap,
  lang,
  hotLabel,
  activityLabel,
}: ProposalsViewToggleProps) {
  const [view, setView] = useState<'hot' | 'activity'>('hot');

  return (
    <>
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setView('hot')}
            aria-pressed={view === 'hot'}
            className={`text-sm px-4 py-1.5 min-h-11 rounded-full border transition-colors cursor-pointer ${
              view === 'hot'
                ? 'border-lime-primary bg-lime-primary/20 text-lime-primary'
                : 'border-secondary-bg text-muted hover:border-lime-primary hover:text-white'
            }`}
          >
            {hotLabel}
          </button>
          <button
            onClick={() => setView('activity')}
            aria-pressed={view === 'activity'}
            className={`text-sm px-4 py-1.5 min-h-11 rounded-full border transition-colors cursor-pointer ${
              view === 'activity'
                ? 'border-lime-primary bg-lime-primary/20 text-lime-primary'
                : 'border-secondary-bg text-muted hover:border-lime-primary hover:text-white'
            }`}
          >
            {activityLabel}
          </button>
        </div>
      </div>

      {view === 'hot' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotSorted.map(sub => (
            <ProjectCard
              key={`${sub._hackathonSlug}/${sub._teamSlug}`}
              project={sub.project}
              hackathonSlug={sub._hackathonSlug}
              teamSlug={sub._teamSlug}
              lang={lang}
            />
          ))}
        </div>
      ) : (
        <div>
          {Object.entries(grouped).map(([slug, subs]) => {
            const hackathon = hackathonMap[slug];
            const name = hackathon ? localize(lang, hackathon.name, hackathon.name_zh) : slug;
            return (
              <div key={slug} className="mb-10">
                <h2 className="text-xl font-heading font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-1 h-6 bg-lime-primary rounded-full inline-block" />
                  <Link href={`/hackathons/${slug}`} className="hover:text-lime-primary transition-colors">
                    {name}
                  </Link>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subs.map(sub => (
                    <ProjectCard
                      key={`${sub._hackathonSlug}/${sub._teamSlug}`}
                      project={sub.project}
                      hackathonSlug={sub._hackathonSlug}
                      teamSlug={sub._teamSlug}
                      lang={lang}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
