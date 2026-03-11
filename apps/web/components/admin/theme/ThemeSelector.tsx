'use client';

import { useMemo } from 'react';
import { listHackathons } from '@/app/_generated/data';
import { t, localize } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import type { PlatformThemeMeta } from '@synnovator/shared/schemas/theme';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@synnovator/ui';
import { Button } from '@synnovator/ui';

interface ThemeSelectorProps {
  themes: PlatformThemeMeta[];
  selectedTheme: string;
  selectedVariant: string | null;
  onThemeChange: (themeId: string) => void;
  onVariantChange: (hackathonSlug: string | null) => void;
  onCreate: () => void;
  lang: Lang;
}

export function ThemeSelector({
  themes,
  selectedTheme,
  selectedVariant,
  onThemeChange,
  onVariantChange,
  onCreate,
  lang,
}: ThemeSelectorProps) {
  const hackathons = useMemo(() => {
    try {
      return listHackathons();
    } catch {
      return [];
    }
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Platform theme selector */}
      <Select value={selectedTheme} onValueChange={onThemeChange}>
        <SelectTrigger
          className="w-48"
          size="sm"
          aria-label={t(lang, 'admin.theme_select_theme')}
        >
          <SelectValue placeholder={t(lang, 'admin.theme_select_theme')} />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          <SelectGroup>
            <SelectLabel>{t(lang, 'admin.theme_platform_themes')}</SelectLabel>
            {themes.map((theme) => (
              <SelectItem key={theme.id} value={theme.id}>
                {theme.name_zh && lang === 'zh'
                  ? theme.name_zh
                  : theme.name}
                {theme.active ? ' \u2726' : ''}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Hackathon variant selector */}
      <Select
        value={selectedVariant ?? '__none__'}
        onValueChange={(val) =>
          onVariantChange(val === '__none__' ? null : val)
        }
      >
        <SelectTrigger
          className="w-48"
          size="sm"
          aria-label={t(lang, 'admin.theme_select_variant')}
        >
          <SelectValue placeholder={t(lang, 'admin.theme_select_variant')} />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          <SelectGroup>
            <SelectLabel>
              {t(lang, 'admin.theme_hackathon_variants')}
            </SelectLabel>
            <SelectItem value="__none__">
              {t(lang, 'admin.theme_no_variant')}
            </SelectItem>
            {hackathons.map((h) => (
              <SelectItem key={h.hackathon.slug} value={h.hackathon.slug}>
                {localize(lang, h.hackathon.name, h.hackathon.name_zh)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Create theme button */}
      <Button variant="outline" size="sm" onClick={onCreate}>
        {t(lang, 'admin.theme_create')}
      </Button>
    </div>
  );
}
