'use client';

import { useMemo } from 'react';
import { Button } from '@synnovator/ui';
import { Badge } from '@synnovator/ui';
import { Card } from '@synnovator/ui';
import { listHackathons } from '@/app/_generated/data';

interface PagePreviewProps {
  hackathonSlug?: string;
}

export function PagePreview({ hackathonSlug }: PagePreviewProps) {
  const hackathon = useMemo(() => {
    if (!hackathonSlug) return null;
    try {
      const all = listHackathons();
      return all.find((h) => h.hackathon.slug === hackathonSlug) ?? null;
    } catch {
      return null;
    }
  }, [hackathonSlug]);

  // If a hackathon is selected and found, render a real data preview
  if (hackathon) {
    const h = hackathon.hackathon;
    const typeLabel =
      h.type === 'community'
        ? 'Community'
        : h.type === 'enterprise'
          ? 'Enterprise'
          : h.type === 'youth-league'
            ? 'Youth League'
            : 'Open Source';

    const typeColor =
      h.type === 'enterprise' ? 'var(--info)' : 'var(--brand)';

    const cardRounding =
      h.type === 'community'
        ? 'rounded-xl'
        : h.type === 'enterprise'
          ? 'rounded-sm'
          : h.type === 'youth-league'
            ? 'rounded-lg'
            : 'rounded-lg';

    const borderStyle =
      h.type === 'community'
        ? { borderTopWidth: '3px', borderTopColor: 'var(--brand)' }
        : h.type === 'enterprise'
          ? { borderLeftWidth: '3px', borderLeftColor: 'var(--info)' }
          : h.type === 'youth-league'
            ? { borderWidth: '2px', borderStyle: 'dashed', borderColor: 'var(--highlight)' }
            : {};

    return (
      <div data-hackathon={hackathonSlug} className="space-y-8">
        {/* Hero section with real hackathon data */}
        <section className="text-center py-8">
          <Badge
            className="mb-4 text-xs"
            style={{
              backgroundColor: `oklch(from ${typeColor} l c h / 0.2)`,
              color: typeColor,
            }}
          >
            {typeLabel}
          </Badge>
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

        <hr className="border-border" />

        {/* Tracks section */}
        {h.tracks && h.tracks.length > 0 && (
          <section>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
              Tracks
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {h.tracks.map((track) => (
                <Card
                  key={track.slug}
                  className={`${cardRounding} p-4`}
                  style={borderStyle}
                >
                  <h3 className="text-sm font-semibold text-card-foreground mb-1">
                    {track.name}
                  </h3>
                  {track.description && (
                    <p className="text-xs text-muted-foreground">
                      {track.description}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </section>
        )}

        {h.tracks && h.tracks.length > 0 && <hr className="border-border" />}

        {/* Detail section */}
        <section>
          <div className="flex gap-2 mb-3">
            <Badge variant="outline">{typeLabel}</Badge>
            {h.description && (
              <Badge
                className="text-xs"
                style={{
                  backgroundColor: `oklch(from var(--highlight) l c h / 0.2)`,
                  color: 'var(--highlight)',
                }}
              >
                {h.type}
              </Badge>
            )}
          </div>
          <Card className={`${cardRounding} p-4`}>
            <h3 className="text-base font-heading font-semibold text-card-foreground mb-2">
              {h.name}
            </h3>
            {h.description && (
              <p className="text-xs text-muted-foreground">
                {h.description}
              </p>
            )}
          </Card>
        </section>
      </div>
    );
  }

  // Default mock preview (no hackathon selected or not found)
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
          <Card
            className="rounded-xl p-4"
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
          </Card>

          {/* Enterprise card: rounded-sm, left border info */}
          <Card
            className="rounded-sm p-4"
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
          </Card>
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
        <Card className="p-4">
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
        </Card>
      </section>
    </div>
  );
}
