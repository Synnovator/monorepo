'use client';

// 重要：一定要复用 HackathonCard / ProjectCard 等真实组件渲染预览！！！
// 不要手写 mock HTML，否则预览和实际页面的样式会不一致。

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getLangFromSearchParams } from '@synnovator/shared/i18n';
import { Button, Badge, Separator } from '@synnovator/ui';
import { HackathonCard } from '@/components/HackathonCard';
import { ProjectCard } from '@/components/ProjectCard';
import { listHackathons, listSubmissions } from '@/app/_generated/data';

interface PagePreviewProps {
  hackathonSlug?: string;
}

type MockHackathon = {
  name: string;
  name_zh: string;
  slug: string;
  tagline: string;
  tagline_zh: string;
  type: string;
  timeline: Record<string, { start: string; end: string }>;
};

const MOCK_HACKATHONS: MockHackathon[] = [
  {
    name: 'AI Innovation Challenge',
    name_zh: 'AI 创新挑战赛',
    slug: 'mock-community',
    tagline: 'Open to all developers. Build creative AI applications.',
    tagline_zh: '面向所有开发者，构建创新的 AI 应用',
    type: 'community',
    timeline: {
      registration: {
        start: new Date(Date.now() - 7 * 86400000).toISOString(),
        end: new Date(Date.now() + 30 * 86400000).toISOString(),
      },
    },
  },
  {
    name: 'Enterprise AI Solutions',
    name_zh: '企业级 AI 解决方案',
    slug: 'mock-enterprise',
    tagline: 'Corporate-sponsored hackathon for B2B AI solutions.',
    tagline_zh: '企业赞助的 B2B AI 解决方案挑战赛',
    type: 'enterprise',
    timeline: {
      development: {
        start: new Date(Date.now() - 3 * 86400000).toISOString(),
        end: new Date(Date.now() + 14 * 86400000).toISOString(),
      },
    },
  },
];

const MOCK_PROJECT = {
  name: 'Neural Canvas',
  name_zh: '神经画布',
  tagline: 'AI-powered collaborative drawing tool',
  tagline_zh: 'AI 驱动的协作绘图工具',
  track: 'AI Applications',
  team_ref: 'mock-team',
  tech_stack: ['Python', 'TensorFlow', 'React', 'WebSocket'],
  likes: 42,
};

export function PagePreview({ hackathonSlug }: PagePreviewProps) {
  const searchParams = useSearchParams();
  const lang = getLangFromSearchParams(searchParams);

  const hackathon = useMemo(() => {
    if (!hackathonSlug) return null;
    try {
      const all = listHackathons();
      return all.find((h) => h.hackathon.slug === hackathonSlug) ?? null;
    } catch {
      return null;
    }
  }, [hackathonSlug]);

  const submission = useMemo(() => {
    if (!hackathonSlug) return null;
    try {
      const all = listSubmissions();
      return all.find((s) => s._hackathonSlug === hackathonSlug) ?? null;
    } catch {
      return null;
    }
  }, [hackathonSlug]);

  if (hackathon) {
    const h = hackathon.hackathon;
    return (
      <div className="space-y-8 [&_a]:pointer-events-none" data-hackathon={hackathonSlug}>
        <section className="text-center py-8">
          <h1 className="text-2xl font-heading font-bold text-foreground mb-3">
            {h.name}
          </h1>
          {h.tagline && (
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              {h.tagline}
            </p>
          )}
          <div className="flex justify-center gap-3">
            <Button>Register</Button>
            <Button variant="outline">Details</Button>
          </div>
        </section>

        <Separator />

        <section>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
            Hackathon Card
          </h2>
          <div className="max-w-sm">
            <HackathonCard hackathon={h} lang={lang} />
          </div>
        </section>

        {submission && (
          <>
            <Separator />
            <section>
              <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
                Project Card
              </h2>
              <div className="max-w-sm">
                <ProjectCard
                  project={submission.project}
                  hackathonSlug={submission._hackathonSlug}
                  teamSlug={submission._teamSlug}
                  lang={lang}
                />
              </div>
            </section>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 [&_a]:pointer-events-none">
      {/* Mini layout preview — SlimHeader + Sidebar skeleton */}
      <div className="flex border border-border rounded-lg overflow-hidden mb-6">
        {/* Mini sidebar */}
        <div className="w-10 shrink-0 bg-sidebar border-r border-border flex flex-col items-center py-2 gap-2">
          <div className="w-5 h-5 rounded bg-primary/20" />
          <div className="w-5 h-5 rounded bg-muted" />
          <div className="w-5 h-5 rounded bg-muted" />
          <div className="w-5 h-5 rounded bg-muted" />
        </div>
        {/* Mini header + content area */}
        <div className="flex-1">
          {/* Mini SlimHeader */}
          <div className="flex items-center gap-2 h-8 px-2 border-b border-border bg-background/80">
            <div className="w-4 h-4 rounded bg-muted" />
            <div className="flex-1 h-5 rounded bg-muted/50 max-w-[120px]" />
            <div className="h-5 px-2 rounded bg-primary/20 text-[8px] text-primary-foreground flex items-center">+ 创建</div>
            <div className="w-4 h-4 rounded-full bg-muted" />
          </div>
          {/* Content placeholder */}
          <div className="p-3">
            <div className="h-3 w-24 rounded bg-muted mb-2" />
            <div className="h-2 w-32 rounded bg-muted/50" />
          </div>
        </div>
      </div>

      <section className="text-center py-8">
        <Badge variant="secondary" className="mb-4">
          AI Hackathon Platform
        </Badge>
        <h1 className="text-2xl font-heading font-bold text-foreground mb-3">
          Build the Future with AI
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          Join thousands of developers in creating innovative AI-powered
          solutions.
        </p>
        <div className="flex justify-center gap-3">
          <Button>Get Started</Button>
          <Button variant="outline">Learn More</Button>
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
          Hackathon Events
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {MOCK_HACKATHONS.map((h) => (
            <HackathonCard key={h.slug} hackathon={h} lang={lang} />
          ))}
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
          Project Card
        </h2>
        <div className="max-w-sm">
          <ProjectCard
            project={MOCK_PROJECT}
            hackathonSlug="mock-community"
            teamSlug="mock-team"
            lang={lang}
          />
        </div>
      </section>
    </div>
  );
}
