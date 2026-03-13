'use client';

import * as React from 'react';
import { MdxEditor } from '@synnovator/ui/components/editor/MdxEditor';
import type { ComponentDefinition, Asset } from '@synnovator/ui/components/editor/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@synnovator/ui';
import {
  AlertCircle,
  Image,
  PlayCircle,
  Clock,
  Trophy,
  Users,
} from 'lucide-react';

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
// Upload handler — POST file to /api/r2/upload
// ---------------------------------------------------------------------------

async function handleUpload(
  file: File,
  context: string,
): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('context', context);

  const res = await fetch('/api/r2/upload', { method: 'POST', body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(data.error ?? 'Upload failed');
  }
  const data = await res.json();
  return { url: data.url, filename: data.filename };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TrackInfo {
  slug: string;
  name: string;
  nameZh?: string;
}

interface HackathonEditorClientProps {
  slug: string;
  hackathonName: string;
  hackathonNameZh?: string;
  description: string;
  descriptionZh: string;
  tracks: TrackInfo[];
  login: string;
}

// ---------------------------------------------------------------------------
// Client component
// ---------------------------------------------------------------------------

export function HackathonEditorClient({
  slug,
  hackathonName,
  hackathonNameZh,
  description,
  descriptionZh,
  tracks,
  login,
}: HackathonEditorClientProps) {
  const [saveStatus, setSaveStatus] = React.useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle');
  const [prUrl, setPrUrl] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // -----------------------------------------------------------------------
  // Save handler — collect MDX content and submit PR
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
          const buffer = await asset.blob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
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

  const uploadHandler = React.useCallback(
    (file: File, context: string) => handleUpload(file, context),
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Edit: {hackathonName}
        </h1>
        {hackathonNameZh && (
          <p className="text-muted-foreground">{hackathonNameZh}</p>
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
              {track.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Description tab */}
        <TabsContent value="description" className="mt-4">
          <div className="h-[70vh]">
            <MdxEditor
              initialContent={description}
              initialContentAlt={descriptionZh}
              availableComponents={hackathonComponentDefs}
              onSave={handleDescriptionSave}
              lang="en"
              onUpload={uploadHandler}
              draftKey={`editor-hackathon-${slug}-description`}
            />
          </div>
        </TabsContent>

        {/* Track tabs */}
        {tracks.map((track) => (
          <TabsContent
            key={track.slug}
            value={`track-${track.slug}`}
            className="mt-4"
          >
            <div className="h-[70vh]">
              <MdxEditor
                initialContent=""
                initialContentAlt=""
                availableComponents={hackathonComponentDefs}
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
                      const buffer = await asset.blob.arrayBuffer();
                      const bytes = new Uint8Array(buffer);
                      let binary = '';
                      for (let i = 0; i < bytes.length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                      }
                      const base64 = btoa(binary);
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
                lang="en"
                onUpload={uploadHandler}
                draftKey={`editor-hackathon-${slug}-track-${track.slug}`}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
