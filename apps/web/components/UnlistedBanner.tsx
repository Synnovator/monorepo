import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

export function UnlistedBanner({ lang }: { lang: Lang }) {
  return (
    <div className="bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 mb-6">
      <p className="text-sm text-warning-foreground">
        {t(lang, 'common.unlisted_banner')}
      </p>
    </div>
  );
}
