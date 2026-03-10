import { t, getCurrentStage } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface TimelineProps {
  timeline: Record<string, { start: string; end: string } | undefined>;
  lang: Lang;
}

const stages = ['draft', 'registration', 'development', 'submission', 'judging', 'announcement', 'award'] as const;

export function Timeline({ timeline, lang }: TimelineProps) {
  const currentStage = getCurrentStage(timeline);

  function isPast(stage: string): boolean {
    const idx = stages.indexOf(stage as typeof stages[number]);
    const currentIdx = stages.indexOf(currentStage as typeof stages[number]);
    if (currentStage === 'ended') return true;
    return idx < currentIdx;
  }

  return (
    <ul className="flex flex-col gap-1">
      {stages.map((stage) => {
        const range = timeline[stage];
        const isCurrent = stage === currentStage;
        const past = isPast(stage);
        return (
          <li key={stage} className={`flex items-center gap-3 py-2 px-3 rounded-md ${isCurrent ? 'bg-primary/10 border border-primary/30' : ''}`}>
            <div className={`w-3 h-3 rounded-full shrink-0 ${isCurrent ? 'bg-primary' : past ? 'bg-muted-foreground' : 'bg-muted border border-muted-foreground'}`} />
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${isCurrent ? 'text-primary' : past ? 'text-muted-foreground' : 'text-foreground'}`}>
                {t(lang, `stage.${stage}`)}
              </span>
            </div>
            {range && (
              <span className="text-xs text-muted-foreground shrink-0">
                {new Date(range.start).toLocaleDateString()} — {new Date(range.end).toLocaleDateString()}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
