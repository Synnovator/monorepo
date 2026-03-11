import Link from 'next/link';
import { getCurrentStage, t, localize } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { Card, Badge } from '@synnovator/ui';
import { TrophyIcon } from './icons';
import { hackathonCardClass, hackathonHoverClass, hackathonTypeIcon } from '@/lib/hackathon-theme';
import { SketchCircle } from '@/components/sketch';

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

type StageVariant = 'secondary' | 'brand' | 'highlight' | 'info' | 'warning';

function stageVariant(stage: string): StageVariant {
  switch (stage) {
    case 'registration': return 'brand';
    case 'development':
    case 'submission': return 'highlight';
    case 'judging': return 'info';
    case 'announcement':
    case 'award': return 'warning';
    default: return 'secondary';
  }
}

export function HackathonCard({ hackathon, lang }: HackathonCardProps) {
  const stage = hackathon.timeline ? getCurrentStage(hackathon.timeline) : 'draft';
  const typeKey = `hackathon.type_${hackathon.type.replace('-', '_')}`;
  const TypeIcon = hackathonTypeIcon(hackathon.type);

  return (
    <Card
      data-hackathon={hackathon.slug}
      className={`hover:border-primary/40 transition-all duration-200 h-full flex flex-col ${hackathonCardClass(hackathon.type)} ${hackathonHoverClass(hackathon.type)}`}
    >
      <Link
        href={`/hackathons/${hackathon.slug}`}
        className="block p-6 h-full flex flex-col group"
      >
      {/* Type + Stage badges */}
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="secondary" className="gap-1">
          <TypeIcon size={14} className="shrink-0" />
          {t(lang, typeKey)}
        </Badge>
        <span className="relative">
          <Badge variant={stageVariant(stage)}>
            {t(lang, `stage.${stage}`)}
          </Badge>
          {['registration', 'development', 'submission'].includes(stage) && (
            <SketchCircle className="absolute -inset-1" delay={200} />
          )}
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
    </Card>
  );
}
