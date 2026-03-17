'use client';

import { useCallback, useState } from 'react';
import { MdxEditor } from '@synnovator/ui/components/editor/MdxEditor';
import type { ComponentDefinition, Asset } from '@synnovator/ui/components/editor/types';
import { profileComponents } from '@synnovator/ui/components/mdx-components';
import {
  AlertCircle,
  Image,
  PlayCircle,
  FolderOpen,
  Tag,
} from 'lucide-react';

const profileComponentDefs: ComponentDefinition[] = [
  {
    name: 'Callout',
    category: 'common',
    snippet: '<Callout type="info" title="About">\nDetails here\n</Callout>',
    description: 'Highlighted callout box',
    descriptionZh: '高亮提示框',
    icon: AlertCircle,
  },
  {
    name: 'ImageGallery',
    category: 'common',
    snippet:
      '<ImageGallery images={[{src: "./assets/photo.jpg", alt: "Photo"}]} />',
    description: 'Image gallery',
    descriptionZh: '图片画廊',
    icon: Image,
  },
  {
    name: 'Video',
    category: 'common',
    snippet: '<Video src="https://..." title="Introduction" />',
    description: 'Embedded video',
    descriptionZh: '嵌入视频',
    icon: PlayCircle,
  },
  {
    name: 'ProjectShowcase',
    category: 'profile',
    snippet:
      '<ProjectShowcase projects={[{name: "Project", description: "Description", url: "https://..."}]} />',
    description: 'Project portfolio grid',
    descriptionZh: '项目展示网格',
    icon: FolderOpen,
  },
  {
    name: 'SkillBadges',
    category: 'profile',
    snippet:
      '<SkillBadges skills={[{name: "TypeScript", level: "expert"}, {name: "React", level: "intermediate"}]} />',
    description: 'Skill level badges',
    descriptionZh: '技能等级标签',
    icon: Tag,
  },
];

const PROFILE_BIO_TEMPLATE = `# About Me

Write your bio here. You can use Markdown and custom components.

## Highlights

- Your key achievements
- Areas of expertise

## Projects

<ProjectShowcase projects={[{name: "My Project", description: "A brief description", url: "https://github.com/..."}]} />
`;

const PROFILE_BIO_TEMPLATE_ZH = `# 关于我

在这里撰写你的个人简介。你可以使用 Markdown 和自定义组件。

## 亮点

- 你的主要成就
- 专业领域

## 项目

<ProjectShowcase projects={[{name: "我的项目", description: "简要描述", url: "https://github.com/..."}]} />
`;

interface ProfileEditorClientProps {
  username: string;
  displayName: string;
  displayNameZh?: string;
  login: string;
}

export function ProfileEditorClient({
  username,
  displayName,
  displayNameZh,
  login,
}: ProfileEditorClientProps) {
  const [submitResult, setSubmitResult] = useState<{
    type: 'success' | 'error';
    message: string;
    prUrl?: string;
  } | null>(null);

  const handleSave = useCallback(
    async (contentEn: string, contentZh: string, assets: Asset[]) => {
      setSubmitResult(null);

      const files: { path: string; content?: string; base64Content?: string }[] = [];

      // Add bio MDX files
      if (contentEn.trim()) {
        files.push({
          path: `profiles/${username}/bio.mdx`,
          content: contentEn,
        });
      }

      if (contentZh.trim()) {
        files.push({
          path: `profiles/${username}/bio.zh.mdx`,
          content: contentZh,
        });
      }

      // Add asset files (binary -> base64)
      for (const asset of assets) {
        const buffer = await asset.blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        files.push({
          path: `profiles/${username}/assets/${asset.filename}`,
          base64Content: base64,
        });
      }

      if (files.length === 0) {
        throw new Error('No content to save. Please write some content first.');
      }

      const res = await fetch('/api/submit-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'profile',
          slug: username,
          files,
          metadata: {},
        }),
      });

      const text = await res.text();
      let data: { pr_url?: string; error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 200) || `Server error (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error || `Server error (${res.status})`);
      }

      setSubmitResult({
        type: 'success',
        message: 'Pull Request created successfully!',
        prUrl: data.pr_url,
      });

      // Open PR in new tab
      if (data.pr_url) {
        window.open(data.pr_url, '_blank', 'noopener,noreferrer');
      }
    },
    [username],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Edit Profile: {displayNameZh || displayName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Editing bio for <span className="text-primary">@{username}</span>.
          Changes will create a Pull Request for review.
        </p>
      </div>

      {submitResult && (
        <div
          role="alert"
          className={`rounded-lg border px-4 py-3 text-sm ${
            submitResult.type === 'success'
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-destructive/40 bg-destructive/10 text-destructive'
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
                  className="text-xs underline hover:no-underline mt-1 inline-block"
                >
                  View Pull Request
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSubmitResult(null)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity text-lg leading-none"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      <div className="h-[calc(100vh-16rem)]">
        <MdxEditor
          initialContent=""
          initialContentAlt=""
          availableComponents={profileComponentDefs}
          components={profileComponents}
          onSave={handleSave}
          lang="en"
          templateContent={PROFILE_BIO_TEMPLATE}
          templateContentAlt={PROFILE_BIO_TEMPLATE_ZH}
          draftKey={`profile-bio-${username}`}
        />
      </div>
    </div>
  );
}
