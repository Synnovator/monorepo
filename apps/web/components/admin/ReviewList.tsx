import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import type { PendingReview } from '@synnovator/shared/data';
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
        <p className="text-muted">{t(lang, 'admin.no_pending')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <div
          key={item.id}
          className="bg-dark-bg border border-secondary-bg rounded-lg p-5 flex items-start justify-between gap-4"
        >
          <div className="flex-1 min-w-0">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-medium hover:text-lime-primary transition-colors text-sm truncate block"
            >
              #{item.id} {item.title}
            </a>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
              <span>{t(lang, 'admin.submitter')}: @{item.submitter}</span>
              <span>{t(lang, 'admin.created_at')}: {new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
            {item.labels.length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {item.labels.map(label => (
                  <span
                    key={label}
                    className="px-2 py-0.5 text-xs rounded-full bg-secondary-bg text-light-gray"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <ReviewActions prNumber={item.id} lang={lang} />
        </div>
      ))}
    </div>
  );
}
