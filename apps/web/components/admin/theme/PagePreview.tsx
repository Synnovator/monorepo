'use client';

import { Button } from '@synnovator/ui';
import { Badge } from '@synnovator/ui';

export function PagePreview() {
  return (
    <div className="space-y-8">
      {/* Section 1: Hero mock */}
      <section className="text-center py-8">
        <Badge variant="secondary" className="mb-4">
          AI Hackathon Platform
        </Badge>
        <h1 className="text-2xl font-heading font-bold text-foreground mb-3">
          Build the Future with AI
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          Join thousands of developers in creating innovative AI-powered
          solutions. Register your team, submit projects, and compete for prizes.
        </p>
        <div className="flex justify-center gap-3">
          <Button>Get Started</Button>
          <Button variant="outline">Learn More</Button>
        </div>
      </section>

      <hr className="border-border" />

      {/* Section 2: Hackathon cards */}
      <section>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
          Hackathon Events
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Community card: rounded-xl, top border brand */}
          <div
            className="rounded-xl border border-border bg-card p-4"
            style={{ borderTopWidth: '3px', borderTopColor: 'var(--brand)' }}
          >
            <Badge
              className="mb-2 text-xs"
              style={{ backgroundColor: 'oklch(from var(--brand) l c h / 0.2)', color: 'var(--brand)' }}
            >
              Community
            </Badge>
            <h3 className="text-sm font-semibold text-card-foreground mb-1">
              AI Innovation Challenge
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Open to all developers. Build creative AI applications.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>128 teams</span>
              <span>&middot;</span>
              <span>Mar 15–20</span>
            </div>
          </div>

          {/* Enterprise card: rounded-sm, left border info */}
          <div
            className="rounded-sm border border-border bg-card p-4"
            style={{ borderLeftWidth: '3px', borderLeftColor: 'var(--info)' }}
          >
            <Badge
              className="mb-2 text-xs"
              style={{ backgroundColor: 'oklch(from var(--info) l c h / 0.2)', color: 'var(--info)' }}
            >
              Enterprise
            </Badge>
            <h3 className="text-sm font-semibold text-card-foreground mb-1">
              Enterprise AI Solutions
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Corporate-sponsored hackathon for B2B AI solutions.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>64 teams</span>
              <span>&middot;</span>
              <span>Apr 1–7</span>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* Section 3: Detail page mock */}
      <section>
        <div className="flex gap-2 mb-3">
          <Badge variant="outline">Open</Badge>
          <Badge
            className="text-xs"
            style={{ backgroundColor: 'oklch(from var(--highlight) l c h / 0.2)', color: 'var(--highlight)' }}
          >
            Submissions Open
          </Badge>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-base font-heading font-semibold text-card-foreground mb-2">
            Project: Neural Canvas
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            An AI-powered collaborative drawing tool that transforms rough
            sketches into polished illustrations using diffusion models.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span
              className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: 'oklch(from var(--highlight) l c h / 0.15)', color: 'var(--highlight)' }}
            >
              Python
            </span>
            <span
              className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: 'oklch(from var(--info) l c h / 0.15)', color: 'var(--info)' }}
            >
              TensorFlow
            </span>
            <span
              className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: 'oklch(from var(--highlight) l c h / 0.15)', color: 'var(--highlight)' }}
            >
              React
            </span>
            <span
              className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: 'oklch(from var(--info) l c h / 0.15)', color: 'var(--info)' }}
            >
              WebSocket
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
