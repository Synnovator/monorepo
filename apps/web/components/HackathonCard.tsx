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
  draft: 'bg-muted/20 text-muted-foreground',
  registration: 'bg-brand/20 text-brand',
  development: 'bg-info/20 text-info',
  submission: 'bg-brand/20 text-brand',
  judging: 'bg-info/20 text-info',
  announcement: 'bg-highlight/20 text-highlight-foreground',
  award: 'bg-highlight/20 text-highlight-foreground',
  ended: 'bg-muted/20 text-muted-foreground',
};

export function HackathonCard({ hackathon, lang }: HackathonCardProps) {
  const stage = hackathon.timeline ? getCurrentStage(hackathon.timeline) : 'draft';
  const typeKey = `hackathon.type_${hackathon.type.replace('-', '_')}`;

  return (
    <Link
      href={`/hackathons/${hackathon.slug}`}
      className="block group rounded-lg border border-border bg-card hover:border-primary/40 transition-all duration-200 p-6 h-full flex flex-col"
    >
      {/* Type + Stage badges */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {t(lang, typeKey)}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${stageColors[stage] || stageColors.draft}`}>
          {t(lang, `stage.${stage}`)}
        </span>
      </div>

      {/* Title */}
      <div className="flex items-center gap-2 mb-2">
        <TrophyIcon size={20} className="shrink-0 opacity-60" aria-hidden="true" />
        <h3 className="text-foreground font-heading font-bold text-lg group-hover:text-primary transition-colors">
          {localize(lang, hackathon.name, hackathon.name_zh)}
        </h3>
      </div>

      {/* Tagline */}
      <div className="flex-grow">
        {hackathon.tagline && (
          <p className="text-muted-foreground text-sm line-clamp-2">
            {localize(lang, hackathon.tagline, hackathon.tagline_zh)}
          </p>
        )}
      </div>

      {/* Timeline hint */}
      {hackathon.timeline?.registration && (
        <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground">
          {t(lang, 'stage.registration')}: {new Date(hackathon.timeline.registration.start).toLocaleDateString()} — {new Date(hackathon.timeline.registration.end).toLocaleDateString()}
        </div>
      )}
    </Link>
  );
}
