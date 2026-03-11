import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import type { PendingReview } from '@synnovator/shared/data';
import { Badge, Card } from '@synnovator/ui';
import { ReviewActions } from './ReviewActions';

interface ReviewListProps {
  items: PendingReview[];
  lang: Lang;
  type: string;
}

export function ReviewList({ items, lang }: ReviewListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t(lang, 'admin.no_pending')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <Card
          key={item.id}
          className="p-5 flex items-start justify-between gap-4"
        >
          <div className="flex-1 min-w-0">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground font-medium hover:text-primary transition-colors text-sm truncate block"
            >
              #{item.id} {item.title}
            </a>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span>{t(lang, 'admin.submitter')}: @{item.submitter}</span>
              <span>{t(lang, 'admin.created_at')}: {new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
            {item.labels.length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {item.labels.map(label => (
                  <Badge key={label} variant="secondary">{label}</Badge>
                ))}
              </div>
            )}
          </div>
          <ReviewActions prNumber={item.id} lang={lang} />
        </Card>
      ))}
    </div>
  );
}
