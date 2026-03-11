'use client';

import { useState } from 'react';
import { Button } from '@synnovator/ui';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

type PublishState = 'idle' | 'loading' | 'success' | 'error';

interface PublishButtonProps {
  type: 'platform' | 'hackathon-variant';
  themeName: string;
  hackathonSlug?: string;
  name?: string;
  nameZh?: string;
  description?: string;
  light: Record<string, string>;
  dark: Record<string, string>;
  fonts?: Record<string, string>;
  radius?: string;
  lang: Lang;
}

export function PublishButton({
  type,
  themeName,
  hackathonSlug,
  name,
  nameZh,
  description,
  light,
  dark,
  fonts,
  radius,
  lang,
}: PublishButtonProps) {
  const [state, setState] = useState<PublishState>('idle');
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePublish = async () => {
    setState('loading');
    setPrUrl(null);
    setErrorMsg(null);

    try {
      const body: Record<string, unknown> = {
        type,
        themeName,
        light,
        dark,
      };
      if (hackathonSlug) body.hackathonSlug = hackathonSlug;
      if (name) body.name = name;
      if (nameZh) body.name_zh = nameZh;
      if (description) body.description = description;
      if (fonts) body.fonts = fonts;
      if (radius) body.radius = radius;

      const res = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || `HTTP ${res.status}`,
        );
      }

      const data = (await res.json()) as { url: string; number: number };
      setPrUrl(data.url);
      setState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={handlePublish}
        disabled={!themeName || state === 'loading'}
      >
        {state === 'loading'
          ? t(lang, 'admin.theme_publishing')
          : t(lang, 'admin.theme_publish')}
      </Button>
      {state === 'success' && prUrl && (
        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary underline hover:text-primary/80"
        >
          {t(lang, 'admin.theme_publish_success')}
        </a>
      )}
      {state === 'error' && errorMsg && (
        <span className="text-xs text-destructive">{errorMsg}</span>
      )}
    </div>
  );
}
