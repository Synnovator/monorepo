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
  ama: 'bg-info/20 text-info',
  livestream: 'bg-destructive/20 text-destructive',
  workshop: 'bg-info/20 text-info',
  meetup: 'bg-mint/20 text-mint',
  deadline: 'bg-destructive/20 text-destructive',
};

export function EventCalendar({ events, lang }: EventCalendarProps) {
  return (
    <ul className="space-y-3">
      {events.map((event, i) => (
        <li key={i} className="flex items-start gap-4 px-4 py-3 rounded-lg bg-muted/50">
          <div className="text-center shrink-0 w-14">
            <div className="text-xs text-muted-foreground">{new Date(event.datetime).toLocaleDateString(undefined, { month: 'short' })}</div>
            <div className="text-xl font-code font-medium text-foreground">{new Date(event.datetime).getDate()}</div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[event.type] || 'bg-muted text-muted-foreground'}`}>
                {event.type.toUpperCase()}
              </span>
              {event.duration_minutes && (
                <span className="text-xs text-muted-foreground">{event.duration_minutes} min</span>
              )}
            </div>
            <p className="text-foreground text-sm font-medium">
              {localize(lang, event.name, event.name_zh)}
            </p>
            {event.description && <p className="text-muted-foreground text-xs mt-1">{event.description}</p>}
            {event.location && <p className="text-muted-foreground text-xs mt-1">{event.location}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
