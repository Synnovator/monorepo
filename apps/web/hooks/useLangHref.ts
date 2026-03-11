'use client';

import { useSearchParams } from 'next/navigation';
import { getLangFromSearchParams } from '@synnovator/shared/i18n';

export function useLangHref() {
  const searchParams = useSearchParams();
  const lang = getLangFromSearchParams(searchParams);

  function langHref(path: string) {
    if (lang === 'en') {
      const sep = path.includes('?') ? '&' : '?';
      return `${path}${sep}lang=en`;
    }
    return path;
  }

  return { lang, langHref };
}
