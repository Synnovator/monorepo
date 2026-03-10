'use client';

import { useMemo } from 'react';
import { listHackathons } from '@/app/_generated/data';
import { localize } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface ThemeSelectorProps {
  value: string;
  onChange: (target: string) => void;
  lang: Lang;
}

export function ThemeSelector({ value, onChange, lang }: ThemeSelectorProps) {
  const hackathons = useMemo(() => {
    try {
      return listHackathons();
    } catch {
      return [];
    }
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-border bg-card text-foreground px-3 py-1.5 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
    >
      <option value="global">
        {lang === 'zh' ? '全局主题' : 'Global Theme'}
      </option>
      {hackathons.length > 0 && (
        <optgroup label={lang === 'zh' ? '活动' : 'Hackathons'}>
          {hackathons.map((h) => (
            <option key={h.hackathon.slug} value={h.hackathon.slug}>
              {localize(lang, h.hackathon.name, h.hackathon.name_zh)}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
