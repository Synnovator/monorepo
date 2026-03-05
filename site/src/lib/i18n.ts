import zhData from '../i18n/zh.yml';
import enData from '../i18n/en.yml';

export type Lang = 'zh' | 'en';

/**
 * Get language from URL search params. Defaults to 'zh' when missing or not 'en'.
 */
export function getLangFromUrl(url: URL): Lang {
  const lang = url.searchParams.get('lang');
  return lang === 'en' ? 'en' : 'zh';
}

const translations: Record<Lang, Record<string, unknown>> = {
  zh: zhData as Record<string, unknown>,
  en: enData as Record<string, unknown>,
};

/**
 * Get a translated string by dot-notation key.
 * Example: t('zh', 'hackathon.register') → "立即报名"
 */
export function t(lang: Lang, key: string): string {
  const keys = key.split('.');
  let result: unknown = translations[lang];
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      // Fallback to zh, then return key
      let fallback: unknown = translations['zh'];
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = (fallback as Record<string, unknown>)[fk];
        } else {
          return key;
        }
      }
      return typeof fallback === 'string' ? fallback : key;
    }
  }
  return typeof result === 'string' ? result : key;
}

/**
 * Pick localized field: returns name_zh for zh, name for en, with fallback.
 */
export function localize(lang: Lang, en?: string, zh?: string): string {
  if (lang === 'zh') return zh || en || '';
  return en || zh || '';
}

/**
 * Determine current stage from hackathon timeline.
 */
export function getCurrentStage(timeline: Record<string, { start: string; end: string } | undefined>): string {
  const now = new Date();
  const stages = ['draft', 'registration', 'development', 'submission', 'judging', 'announcement', 'award'] as const;

  for (const stage of stages) {
    const range = timeline[stage];
    if (!range) continue;
    const start = new Date(range.start);
    const end = new Date(range.end);
    if (now >= start && now <= end) return stage;
  }

  // Check if past all stages
  const lastStage = timeline['award'];
  if (lastStage && now > new Date(lastStage.end)) return 'ended';

  // Check if before all stages
  const firstStage = timeline['draft'];
  if (firstStage && now < new Date(firstStage.start)) return 'draft';

  return 'draft';
}
