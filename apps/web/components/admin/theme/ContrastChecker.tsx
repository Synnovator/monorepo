'use client';

import { useMemo } from 'react';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { contrastRatio } from '@/lib/oklch';

interface ContrastPair {
  label: string;
  fg: string;
  bg: string;
}

const CONTRAST_PAIRS: ContrastPair[] = [
  { label: 'foreground / background', fg: 'foreground', bg: 'background' },
  { label: 'primary-fg / primary', fg: 'primary-foreground', bg: 'primary' },
  { label: 'card-fg / card', fg: 'card-foreground', bg: 'card' },
  { label: 'muted-fg / background', fg: 'muted-foreground', bg: 'background' },
  { label: 'brand-fg / brand', fg: 'brand-foreground', bg: 'brand' },
  { label: 'destructive-fg / destructive', fg: 'destructive-foreground', bg: 'destructive' },
];

interface ContrastCheckerProps {
  tokens: Record<string, string>;
  lang: Lang;
}

export function ContrastChecker({ tokens, lang }: ContrastCheckerProps) {
  const results = useMemo(() => {
    return CONTRAST_PAIRS.map((pair) => {
      const fgValue = tokens[pair.fg];
      const bgValue = tokens[pair.bg];
      if (!fgValue || !bgValue) {
        return { ...pair, ratio: 0, pass: false };
      }
      const ratio = contrastRatio(fgValue, bgValue);
      return { ...pair, ratio, pass: ratio >= 4.5 };
    });
  }, [tokens]);

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {t(lang, 'admin.theme_contrast')}
      </h3>
      <div className="space-y-1.5">
        {results.map((result) => (
          <div
            key={result.label}
            className="flex items-center justify-between text-xs"
          >
            <span className="text-foreground truncate mr-2">{result.label}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-muted-foreground tabular-nums">
                {result.ratio > 0 ? `${result.ratio.toFixed(1)}:1` : '--'}
              </span>
              <span
                className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  result.pass
                    ? 'bg-highlight/15 text-highlight'
                    : 'bg-destructive/15 text-destructive'
                }`}
              >
                {result.pass ? 'AA' : 'Fail'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
