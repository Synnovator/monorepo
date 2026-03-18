'use client';

import { useState } from 'react';
import { Badge } from '@synnovator/ui';
import type { Lang } from '@synnovator/shared/i18n';

interface VisibilityItem {
  name: string;
  slug: string;
  visibility: string;
}

interface VisibilitySectionProps {
  items: VisibilityItem[];
  type: 'hackathon' | 'submission';
  lang: Lang;
  translations: {
    title: string;
    publish: string;
    unpublish: string;
    private: string;
    public: string;
    success: string;
    error: string;
    warningParentPrivate?: string;
  };
  privateHackathonSlugs?: string[];
}

export function VisibilitySection({
  items,
  type,
  lang,
  translations: tr,
  privateHackathonSlugs = [],
}: VisibilitySectionProps) {
  const privateSet = new Set(privateHackathonSlugs);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ slug: string; text: string; url?: string } | null>(null);

  async function toggleVisibility(slug: string, currentVisibility: string) {
    setLoading(slug);
    setMessage(null);

    const newVisibility = currentVisibility === 'public' ? 'private' : 'public';

    try {
      const res = await fetch('/api/admin/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, slug, visibility: newVisibility }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tr.error);
      setMessage({ slug, text: tr.success, url: data.url });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tr.error;
      setMessage({ slug, text: msg });
    } finally {
      setLoading(null);
    }
  }

  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-heading text-foreground mb-4">{tr.title}</h2>
      <div className="space-y-2">
        {items.map(item => {
          const isPrivate = item.visibility === 'private';
          const showParentWarning =
            type === 'submission' &&
            !isPrivate &&
            privateSet.has(item.slug.split('/')[0]);

          return (
            <div key={item.slug} className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-foreground font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{item.slug}</span>
                  <Badge variant={isPrivate ? 'warning' : 'brand'}>
                    {isPrivate ? tr.private : tr.public}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {message?.slug === item.slug && (
                    <span className="text-xs text-muted-foreground">
                      {message.url ? (
                        <a href={message.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                          {message.text}
                        </a>
                      ) : message.text}
                    </span>
                  )}
                  <button
                    onClick={() => toggleVisibility(item.slug, item.visibility)}
                    disabled={loading === item.slug}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    {loading === item.slug ? '...' : isPrivate ? tr.publish : tr.unpublish}
                  </button>
                </div>
              </div>
              {showParentWarning && tr.warningParentPrivate && (
                <p className="text-xs text-warning mt-1">{tr.warningParentPrivate}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
