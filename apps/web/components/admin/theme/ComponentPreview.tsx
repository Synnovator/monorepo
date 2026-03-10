'use client';

import { Button } from '@synnovator/ui';
import { Badge } from '@synnovator/ui';
import { Input } from '@synnovator/ui';

const COLOR_SWATCHES = [
  { label: 'Primary', cssVar: '--primary' },
  { label: 'Brand', cssVar: '--brand' },
  { label: 'Highlight', cssVar: '--highlight' },
  { label: 'Info', cssVar: '--info' },
  { label: 'Destructive', cssVar: '--destructive' },
  { label: 'Muted', cssVar: '--muted' },
] as const;

export function ComponentPreview() {
  return (
    <div className="space-y-8">
      {/* Section 1: Buttons */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">Buttons</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>

      {/* Section 2: Badges */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">Badges</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: 'oklch(from var(--brand) l c h / 0.2)', color: 'var(--brand)' }}
          >
            Brand
          </span>
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: 'oklch(from var(--highlight) l c h / 0.2)', color: 'var(--highlight)' }}
          >
            Highlight
          </span>
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: 'oklch(from var(--info) l c h / 0.2)', color: 'var(--info)' }}
          >
            Info
          </span>
        </div>
      </section>

      {/* Section 3: Cards */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">Cards</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="text-sm font-semibold text-card-foreground mb-1">Card Title</h4>
            <p className="text-xs text-muted-foreground mb-3">
              This card uses bg-card with card-foreground text.
            </p>
            <Button size="sm">Action</Button>
          </div>
          <div className="rounded-lg border border-border bg-muted p-4">
            <h4 className="text-sm font-semibold text-foreground mb-1">Muted Card</h4>
            <p className="text-xs text-muted-foreground mb-3">
              This card uses bg-muted with muted-foreground text.
            </p>
            <Button size="sm" variant="secondary">Action</Button>
          </div>
        </div>
      </section>

      {/* Section 4: Inputs */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">Inputs</h3>
        <div className="space-y-2 max-w-xs">
          <Input placeholder="Normal input" />
          <Input placeholder="Disabled input" disabled />
        </div>
      </section>

      {/* Section 5: Color Palette */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">Color Palette</h3>
        <div className="grid grid-cols-3 gap-3">
          {COLOR_SWATCHES.map(({ label, cssVar }) => (
            <div key={cssVar} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-md border border-border shrink-0"
                style={{ backgroundColor: `var(${cssVar})` }}
              />
              <span className="text-xs text-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
