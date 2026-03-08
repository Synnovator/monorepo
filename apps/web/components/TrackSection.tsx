import { t, localize } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface TrackSectionProps {
  track: {
    name: string;
    name_zh?: string;
    slug: string;
    description?: string;
    description_zh?: string;
    rewards?: Array<{ type: string; rank?: string; amount?: string; description?: string; count?: number }>;
    judging?: { mode: string; criteria?: Array<{ name: string; name_zh?: string; weight: number; description?: string; hard_constraint?: boolean; constraint_rule?: string }> };
    deliverables?: { required?: Array<{ type: string; description?: string }>; optional?: Array<{ type: string; description?: string }> };
  };
  lang: Lang;
}

export function TrackSection({ track, lang }: TrackSectionProps) {
  return (
    <div className="rounded-lg border border-secondary-bg bg-dark-bg p-6">
      <h3 className="text-xl font-heading font-bold text-white mb-2">
        {localize(lang, track.name, track.name_zh)}
      </h3>
      {track.description && (
        <p className="text-muted text-sm mb-6">
          {localize(lang, track.description, track.description_zh)}
        </p>
      )}

      {track.rewards && track.rewards.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-light-gray mb-3">{t(lang, 'hackathon.rewards')}</h4>
          <div className="space-y-2">
            {track.rewards.map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                {r.rank && <span className="text-lime-primary font-code font-medium w-12">{r.rank}</span>}
                {r.amount && <span className="text-white">{r.amount}</span>}
                {r.description && <span className="text-muted">{r.description}</span>}
                {r.count && r.count > 1 && <span className="text-muted">x{r.count}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {track.judging?.criteria && track.judging.criteria.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-light-gray mb-3">{t(lang, 'hackathon.criteria')}</h4>
          <div className="space-y-2">
            {track.judging.criteria.map((c, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="text-lime-primary font-code font-medium w-10 shrink-0">{c.weight}%</span>
                <div>
                  <span className="text-white">{localize(lang, c.name, c.name_zh)}</span>
                  {c.description && <p className="text-muted text-xs mt-0.5">{c.description}</p>}
                  {c.hard_constraint && (
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-error/20 text-error">
                      {c.constraint_rule || 'Hard constraint'}
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
          <h4 className="text-sm font-medium text-light-gray mb-3">{t(lang, 'hackathon.deliverables')}</h4>
          {track.deliverables.required && (
            <ul className="space-y-1 mb-2">
              {track.deliverables.required.map((d, i) => (
                <li key={i} className="text-sm text-white flex items-start gap-2">
                  <span className="text-lime-primary mt-0.5">*</span>
                  <span>{d.description || d.type}</span>
                </li>
              ))}
            </ul>
          )}
          {track.deliverables.optional && (
            <ul className="space-y-1">
              {track.deliverables.optional.map((d, i) => (
                <li key={i} className="text-sm text-muted flex items-start gap-2">
                  <span className="mt-0.5">-</span>
                  <span>{d.description || d.type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
