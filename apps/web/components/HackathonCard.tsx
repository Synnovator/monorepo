import Link from 'next/link';
import { getCurrentStage, t, localize } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { TrophyIcon } from './icons';

interface HackathonCardProps {
  hackathon: {
    name: string;
    name_zh?: string;
    slug: string;
    tagline?: string;
    tagline_zh?: string;
    type: string;
    timeline?: Record<string, { start: string; end: string }>;
  };
  lang: Lang;
}

const stageColors: Record<string, string> = {
  draft: 'bg-muted/20 text-muted',
  registration: 'bg-lime-primary/20 text-lime-primary',
  development: 'bg-cyan/20 text-cyan',
  submission: 'bg-orange/20 text-orange',
  judging: 'bg-neon-blue/20 text-neon-blue',
  announcement: 'bg-pink/20 text-pink',
  award: 'bg-mint/20 text-mint',
  ended: 'bg-muted/20 text-muted',
};

export function HackathonCard({ hackathon, lang }: HackathonCardProps) {
  const stage = hackathon.timeline ? getCurrentStage(hackathon.timeline) : 'draft';
  const typeKey = `hackathon.type_${hackathon.type.replace('-', '_')}`;

  return (
    <Link
      href={`/hackathons/${hackathon.slug}`}
      className="block group rounded-lg border border-secondary-bg bg-dark-bg hover:border-lime-primary/40 transition-all duration-200 p-6 h-full flex flex-col"
    >
      {/* Type + Stage badges */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-bg text-muted">
          {t(lang, typeKey)}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${stageColors[stage] || stageColors.draft}`}>
          {t(lang, `stage.${stage}`)}
        </span>
      </div>

      {/* Title */}
      <div className="flex items-center gap-2 mb-2">
        <TrophyIcon size={20} className="shrink-0 opacity-60" aria-hidden="true" />
        <h3 className="text-white font-heading font-bold text-lg group-hover:text-lime-primary transition-colors">
          {localize(lang, hackathon.name, hackathon.name_zh)}
        </h3>
      </div>

      {/* Tagline */}
      <div className="flex-grow">
        {hackathon.tagline && (
          <p className="text-muted text-sm line-clamp-2">
            {localize(lang, hackathon.tagline, hackathon.tagline_zh)}
          </p>
        )}
      </div>

      {/* Timeline hint */}
      {hackathon.timeline?.registration && (
        <div className="mt-4 pt-3 border-t border-secondary-bg/50 text-xs text-muted">
          {t(lang, 'stage.registration')}: {new Date(hackathon.timeline.registration.start).toLocaleDateString()} — {new Date(hackathon.timeline.registration.end).toLocaleDateString()}
        </div>
      )}
    </Link>
  );
}
