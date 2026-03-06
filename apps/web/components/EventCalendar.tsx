import { localize } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface EventCalendarProps {
  events: Array<{
    name: string;
    name_zh?: string;
    type: string;
    datetime: string;
    duration_minutes?: number;
    url?: string;
    location?: string;
    description?: string;
  }>;
  lang: Lang;
}

const typeColors: Record<string, string> = {
  ama: 'bg-cyan/20 text-cyan',
  livestream: 'bg-pink/20 text-pink',
  workshop: 'bg-neon-blue/20 text-neon-blue',
  meetup: 'bg-mint/20 text-mint',
  deadline: 'bg-error/20 text-error',
};

export function EventCalendar({ events, lang }: EventCalendarProps) {
  return (
    <div className="space-y-3">
      {events.map((event, i) => (
        <div key={i} className="flex items-start gap-4 p-4 rounded-lg border border-secondary-bg bg-dark-bg">
          <div className="text-center shrink-0 w-14">
            <div className="text-xs text-muted">{new Date(event.datetime).toLocaleDateString(undefined, { month: 'short' })}</div>
            <div className="text-xl font-code font-medium text-white">{new Date(event.datetime).getDate()}</div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[event.type] || 'bg-secondary-bg text-muted'}`}>
                {event.type.toUpperCase()}
              </span>
              {event.duration_minutes && (
                <span className="text-xs text-muted">{event.duration_minutes} min</span>
              )}
            </div>
            <p className="text-white text-sm font-medium">
              {localize(lang, event.name, event.name_zh)}
            </p>
            {event.description && <p className="text-muted text-xs mt-1">{event.description}</p>}
            {event.location && <p className="text-muted text-xs mt-1">{event.location}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
