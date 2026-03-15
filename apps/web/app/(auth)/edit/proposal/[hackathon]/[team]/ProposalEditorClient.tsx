'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { MdxEditor } from '@synnovator/ui/components/editor/MdxEditor';
import type { ComponentDefinition, Asset } from '@synnovator/ui/components/editor/types';
import type { Lang } from '@synnovator/shared/i18n';
import type { BilingualContent } from '@/lib/bilingual';
import { resolveBilingual } from '@/lib/bilingual';
import {
  AlertCircle,
  Image,
  PlayCircle,
  Code,
  MonitorPlay,
  Users,
} from 'lucide-react';

const proposalComponentDefs: ComponentDefinition[] = [
  {
    name: 'Callout',
    category: 'common',
    snippet: '<Callout type="info" title="Note">\nImportant detail\n</Callout>',
    description: 'Highlighted callout box',
    descriptionZh: '高亮提示框',
    icon: AlertCircle,
  },
  {
    name: 'ImageGallery',
    category: 'common',
    snippet:
      '<ImageGallery images={[{src: "./assets/screenshot.png", alt: "Screenshot"}]} />',
    description: 'Image gallery with lightbox',
    descriptionZh: '图片画廊',
    icon: Image,
  },
  {
    name: 'Video',
    category: 'common',
    snippet: '<Video src="https://..." title="Demo Video" />',
    description: 'Embedded video player',
    descriptionZh: '视频播放器',
    icon: PlayCircle,
  },
  {
    name: 'TechStack',
    category: 'proposal',
    snippet: '<TechStack technologies={["React", "TypeScript", "Node.js"]} />',
    description: 'Technology stack badges',
    descriptionZh: '技术栈标签',
    icon: Code,
  },
  {
    name: 'DemoEmbed',
    category: 'proposal',
    snippet: '<DemoEmbed url="https://demo.example.com" title="Live Demo" />',
    description: 'Live demo embed',
    descriptionZh: '在线演示嵌入',
    icon: MonitorPlay,
  },
  {
    name: 'TeamRoles',
    category: 'proposal',
    snippet:
      '<TeamRoles members={[{name: "Name", role: "Developer", avatar: "https://github.com/user.png"}]} />',
    description: 'Team member roles',
    descriptionZh: '团队角色',
    icon: Users,
  },
];

interface ProposalEditorClientProps {
  hackathonSlug: string;
  teamSlug: string;
  projectName: BilingualContent;
  description: BilingualContent;
  login: string;
  lang: Lang;
}

export function ProposalEditorClient({
  hackathonSlug,
  teamSlug,
  projectName,
  description,
  login,
  lang,
}: ProposalEditorClientProps) {
  const [submitResult, setSubmitResult] = useState<{
    type: 'success' | 'error';
    message: string;
    prUrl?: string;
  } | null>(null);

  // Resolve bilingual content
  const { primary: descPrimary, alt: descAlt } = resolveBilingual(description, lang);

  const handleSave = useCallback(
    async (contentEn: string, contentZh: string, assets: Asset[]) => {
      setSubmitResult(null);

      const basePath = `hackathons/${hackathonSlug}/submissions/${teamSlug}`;

      // Build the files array for the submit-pr API
      const files: { path: string; content?: string; base64Content?: string }[] = [];

      // Add MDX content files
      if (contentEn.trim()) {
        files.push({
          path: `${basePath}/README.mdx`,
          content: contentEn,
        });
      }
      if (contentZh.trim()) {
        files.push({
          path: `${basePath}/README.zh.mdx`,
          content: contentZh,
        });
      }

      // Add asset files as base64
      for (const asset of assets) {
        const buffer = await asset.blob.arrayBuffer();
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(buffer)),
        );
        files.push({
          path: `${basePath}/assets/${asset.filename}`,
          base64Content: base64,
        });
      }

      if (files.length === 0) {
        throw new Error('No content to save. Please write something first.');
      }

      const res = await fetch('/api/submit-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'proposal',
          slug: teamSlug,
          files,
        }),
      });

      const data = await res.json().catch(() => ({ error: 'Server error' }));

      if (!res.ok) {
        throw new Error(data.error || `Server error (${res.status})`);
      }

      setSubmitResult({
        type: 'success',
        message: 'Pull request created successfully!',
        prUrl: data.pr_url,
      });
    },
    [hackathonSlug, teamSlug],
  );

  const displayName = projectName.zh && projectName.zh !== projectName.en
    ? `${projectName.en} / ${projectName.zh}`
    : projectName.en;

  return (
    <div className="flex h-[calc(100dvh-6rem)] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link
              href={`/projects/${hackathonSlug}/${teamSlug}`}
              className="hover:text-foreground transition-colors"
            >
              {hackathonSlug}
            </Link>
            <span>/</span>
            <span>{teamSlug}</span>
          </div>
          <h1 className="text-xl font-heading font-bold text-foreground">
            Edit Proposal: {displayName}
          </h1>
        </div>
        <div className="text-sm text-muted-foreground">
          {login}
        </div>
      </div>

      {/* Submit result notification */}
      {submitResult && (
        <div
          role="alert"
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            submitResult.type === 'success'
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p>{submitResult.message}</p>
              {submitResult.prUrl && (
                <a
                  href={submitResult.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline mt-1 inline-block"
                >
                  View Pull Request
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSubmitResult(null)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity text-lg leading-none"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="min-h-0 flex-1">
        <MdxEditor
          initialContent={descPrimary}
          initialContentAlt={descAlt}
          availableComponents={proposalComponentDefs}
          onSave={handleSave}
          lang={lang}
          draftKey={`proposal-draft-${hackathonSlug}-${teamSlug}`}
        />
      </div>
    </div>
  );
}
