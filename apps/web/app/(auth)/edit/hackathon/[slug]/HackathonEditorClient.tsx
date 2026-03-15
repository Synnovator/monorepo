'use client';

import * as React from 'react';
import { MdxEditor } from '@synnovator/ui/components/editor/MdxEditor';
import type { ComponentDefinition, Asset } from '@synnovator/ui/components/editor/types';
import { hackathonComponents } from '@synnovator/ui/components/mdx-components';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@synnovator/ui';
import {
  AlertCircle,
  Image,
  PlayCircle,
  Clock,
  Trophy,
  Users,
} from 'lucide-react';
import type { Lang } from '@synnovator/shared/i18n';
import type { BilingualContent } from '@/lib/bilingual';
import { resolveBilingual } from '@/lib/bilingual';

// ---------------------------------------------------------------------------
// Component definitions available for hackathon MDX editing
// ---------------------------------------------------------------------------

const hackathonComponentDefs: ComponentDefinition[] = [
  {
    name: 'Callout',
    category: 'common',
    snippet:
      '<Callout type="info" title="Title">\nContent here\n</Callout>',
    description: 'Highlighted callout box',
    descriptionZh: '高亮提示框',
    icon: AlertCircle,
  },
  {
    name: 'ImageGallery',
    category: 'common',
    snippet:
      '<ImageGallery images={[{src: "./assets/photo.jpg", alt: "Photo"}]} />',
    description: 'Image gallery with lightbox',
    descriptionZh: '图片画廊（含灯箱）',
    icon: Image,
  },
  {
    name: 'Video',
    category: 'common',
    snippet: '<Video src="https://..." title="Video Title" />',
    description: 'Embedded video player',
    descriptionZh: '嵌入式视频播放器',
    icon: PlayCircle,
  },
  {
    name: 'Timeline',
    category: 'hackathon',
    snippet:
      '<Timeline events={[{date: "2026-01-01", title: "Start", description: "Event begins"}]} />',
    description: 'Event timeline',
    descriptionZh: '时间线',
    icon: Clock,
  },
  {
    name: 'PrizeTable',
    category: 'hackathon',
    snippet:
      '<PrizeTable prizes={[{rank: "1st", award: "$1000", description: "Grand prize"}]} />',
    description: 'Prize breakdown table',
    descriptionZh: '奖项表',
    icon: Trophy,
  },
  {
    name: 'SponsorGrid',
    category: 'hackathon',
    snippet:
      '<SponsorGrid sponsors={[{name: "Sponsor", logo: "./assets/logo.png", tier: "gold"}]} />',
    description: 'Sponsor logo grid',
    descriptionZh: '赞助商网格',
    icon: Users,
  },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TrackInfo {
  slug: string;
  name: BilingualContent;
  description: BilingualContent;
}

interface HackathonEditorClientProps {
  slug: string;
  name: BilingualContent;
  description: BilingualContent;
  tracks: TrackInfo[];
  login: string;
  lang: Lang;
}

// ---------------------------------------------------------------------------
// Helper — encode asset blob to base64
// ---------------------------------------------------------------------------

async function assetToBase64(asset: Asset): Promise<string> {
  const buffer = await asset.blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ---------------------------------------------------------------------------
// Client component
// ---------------------------------------------------------------------------

export function HackathonEditorClient({
  slug,
  name,
  description,
  tracks,
  login,
  lang,
}: HackathonEditorClientProps) {
  const [saveStatus, setSaveStatus] = React.useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle');
  const [prUrl, setPrUrl] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Resolve bilingual content for description tab
  const { primary: descPrimary, alt: descAlt } = resolveBilingual(description, lang);

  // -----------------------------------------------------------------------
  // Save handler — collect MDX content and submit PR
  // MDX content already has blob URLs rewritten to ./assets/ paths by MdxEditor
  // -----------------------------------------------------------------------
  const handleDescriptionSave = React.useCallback(
    async (contentEn: string, contentZh: string, assets: Asset[]) => {
      setSaveStatus('saving');
      setErrorMessage(null);
      setPrUrl(null);

      try {
        const files: Array<{
          path: string;
          content?: string;
          base64Content?: string;
        }> = [
          {
            path: `hackathons/${slug}/description.mdx`,
            content: contentEn,
          },
          {
            path: `hackathons/${slug}/description.zh.mdx`,
            content: contentZh,
          },
        ];

        // Add asset files as base64
        for (const asset of assets) {
          const base64 = await assetToBase64(asset);
          files.push({
            path: `hackathons/${slug}/assets/${asset.filename}`,
            base64Content: base64,
          });
        }

        const res = await fetch('/api/submit-pr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'hackathon',
            slug,
            files,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? 'Failed to create PR');
        }

        setPrUrl(data.pr_url);
        setSaveStatus('success');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to save';
        setErrorMessage(message);
        setSaveStatus('error');
        throw err; // re-throw so MdxEditor knows the save failed
      }
    },
    [slug],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Edit: {name.en}
        </h1>
        {name.zh && name.zh !== name.en && (
          <p className="text-muted-foreground">{name.zh}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          Editing as <span className="font-medium text-foreground">{login}</span>
        </p>
      </div>

      {/* Status banner */}
      {saveStatus === 'success' && prUrl && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            PR created successfully!{' '}
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View PR
            </a>
          </p>
        </div>
      )}
      {saveStatus === 'error' && errorMessage && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            {errorMessage}
          </p>
        </div>
      )}

      {/* Tabs: Description + Tracks */}
      <Tabs defaultValue="description">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          {tracks.map((track) => (
            <TabsTrigger key={track.slug} value={`track-${track.slug}`}>
              {lang === 'zh' ? track.name.zh : track.name.en}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Description tab */}
        <TabsContent value="description" className="mt-4">
          <div className="h-[70vh]">
            <MdxEditor
              initialContent={descPrimary}
              initialContentAlt={descAlt}
              availableComponents={hackathonComponentDefs}
              components={hackathonComponents}
              onSave={handleDescriptionSave}
              lang={lang}
              draftKey={`editor-hackathon-${slug}-description`}
            />
          </div>
        </TabsContent>

        {/* Track tabs */}
        {tracks.map((track) => {
          const { primary: trackPrimary, alt: trackAlt } = resolveBilingual(track.description, lang);
          return (
            <TabsContent
              key={track.slug}
              value={`track-${track.slug}`}
              className="mt-4"
            >
              <div className="h-[70vh]">
                <MdxEditor
                  initialContent={trackPrimary}
                  initialContentAlt={trackAlt}
                  availableComponents={hackathonComponentDefs}
                  components={hackathonComponents}
                  onSave={async (contentEn, contentZh, assets) => {
                    setSaveStatus('saving');
                    setErrorMessage(null);
                    setPrUrl(null);

                    try {
                      const files: Array<{
                        path: string;
                        content?: string;
                        base64Content?: string;
                      }> = [
                        {
                          path: `hackathons/${slug}/tracks/${track.slug}.mdx`,
                          content: contentEn,
                        },
                        {
                          path: `hackathons/${slug}/tracks/${track.slug}.zh.mdx`,
                          content: contentZh,
                        },
                      ];

                      for (const asset of assets) {
                        const base64 = await assetToBase64(asset);
                        files.push({
                          path: `hackathons/${slug}/assets/${asset.filename}`,
                          base64Content: base64,
                        });
                      }

                      const res = await fetch('/api/submit-pr', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          type: 'hackathon',
                          slug,
                          files,
                        }),
                      });

                      const data = await res.json();
                      if (!res.ok) {
                        throw new Error(data.error ?? 'Failed to create PR');
                      }

                      setPrUrl(data.pr_url);
                      setSaveStatus('success');
                    } catch (err) {
                      const message =
                        err instanceof Error ? err.message : 'Failed to save';
                      setErrorMessage(message);
                      setSaveStatus('error');
                      throw err;
                    }
                  }}
                  lang={lang}
                  draftKey={`editor-hackathon-${slug}-track-${track.slug}`}
                />
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
