// apps/web/lib/bilingual.ts

import type { Lang } from '@synnovator/shared/i18n';

/** Bilingual content pair: raw MDX source for en and zh */
export interface BilingualContent {
  en: string;
  zh: string;
}

/**
 * Maps BilingualContent to MdxEditor's initialContent / initialContentAlt.
 *
 * MdxEditor internals (MdxEditor.tsx:54-66):
 *   contentEn = (lang === 'en') ? initialContent : initialContentAlt
 *   contentZh = (lang === 'zh') ? initialContent : initialContentAlt
 *
 * So initialContent always maps to the current lang, initialContentAlt to the other.
 */
export function resolveBilingual(
  content: BilingualContent,
  lang: Lang,
): { primary: string; alt: string } {
  return lang === 'zh'
    ? { primary: content.zh, alt: content.en }
    : { primary: content.en, alt: content.zh };
}
