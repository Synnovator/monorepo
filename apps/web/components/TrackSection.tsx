import { t, localize } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { Card } from '@synnovator/ui';

interface TrackSectionProps {
  track: {
    name: string;
    name_zh?: string;
    slug: string;
    description?: string;
    description_zh?: string;
    rewards?: Array<{ type: string; rank?: string; amount?: string; description?: string; count?: number }>;
    judging?: { mode: string; criteria?: Array<{ name: string; name_zh?: string; weight: number; description?: string; hard_constraint?: boolean; constraint_rule?: string; constraint_rule_zh?: string }> };
    deliverables?: { required?: Array<{ type: string; description?: string }>; optional?: Array<{ type: string; description?: string }> };
  };
  lang: Lang;
}

export function TrackSection({ track, lang }: TrackSectionProps) {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-heading font-bold text-foreground mb-2">
        {localize(lang, track.name, track.name_zh)}
      </h3>
      {track.description && (
        <p className="text-muted-foreground text-sm mb-6">
          {localize(lang, track.description, track.description_zh)}
        </p>
      )}

      {track.rewards && track.rewards.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-3">{t(lang, 'hackathon.rewards')}</h4>
          <div className="space-y-2">
            {track.rewards.map((r, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                {r.rank && <span className="text-primary font-code font-medium shrink-0 min-w-[120px]">{r.rank}</span>}
                <div className="flex items-center gap-2 flex-wrap">
                  {r.amount && <span className="text-foreground font-medium">{r.amount}</span>}
                  {r.description && <span className="text-muted-foreground">{r.description}</span>}
                  {r.count && r.count > 1 && <span className="text-muted-foreground">x{r.count}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {track.judging?.criteria && track.judging.criteria.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-3">{t(lang, 'hackathon.criteria')}</h4>
          <div className="space-y-2">
            {track.judging.criteria.map((c, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="text-primary font-code font-medium w-10 shrink-0">{c.weight}%</span>
                <div>
                  <span className="text-foreground">{localize(lang, c.name, c.name_zh)}</span>
                  {c.description && <p className="text-muted-foreground text-xs mt-1">{c.description}</p>}
                  {c.hard_constraint && (
                    <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">
                      {localize(lang, c.constraint_rule, c.constraint_rule_zh) || t(lang, 'score.hard_constraint_warning')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {track.deliverables && (
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">{t(lang, 'hackathon.deliverables')}</h4>
          {track.deliverables.required && (
            <ul className="space-y-1 mb-2">
              {track.deliverables.required.map((d, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">*</span>
                  <span>{d.description || d.type}</span>
                </li>
              ))}
            </ul>
          )}
          {track.deliverables.optional && (
            <ul className="space-y-1">
              {track.deliverables.optional.map((d, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="mt-0.5">-</span>
                  <span>{d.description || d.type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
