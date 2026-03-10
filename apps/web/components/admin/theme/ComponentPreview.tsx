'use client';

import { useState } from 'react';
import { Button } from '@synnovator/ui';
import { Badge } from '@synnovator/ui';
import { Input } from '@synnovator/ui';
import { Textarea } from '@synnovator/ui';
import { Label } from '@synnovator/ui';
import { Checkbox } from '@synnovator/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@synnovator/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@synnovator/ui';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@synnovator/ui';
import { Alert, AlertTitle, AlertDescription } from '@synnovator/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@synnovator/ui';

const COLOR_SWATCHES = [
  { label: 'Primary', cssVar: '--primary' },
  { label: 'Brand', cssVar: '--brand' },
  { label: 'Highlight', cssVar: '--highlight' },
  { label: 'Info', cssVar: '--info' },
  { label: 'Destructive', cssVar: '--destructive' },
  { label: 'Muted', cssVar: '--muted' },
] as const;

export function ComponentPreview() {
  const [checked, setChecked] = useState(false);

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

      {/* Section 4: Form Controls */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">Form Controls</h3>
        <div className="space-y-4 max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="preview-input">Input</Label>
            <Input id="preview-input" placeholder="Normal input" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preview-textarea">Textarea</Label>
            <Textarea id="preview-textarea" placeholder="Write something..." rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="preview-checkbox"
              checked={checked}
              onCheckedChange={(v) => setChecked(v === true)}
            />
            <Label htmlFor="preview-checkbox">Checkbox option</Label>
          </div>
          <div className="space-y-1.5">
            <Label>Select</Label>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option-1">Option 1</SelectItem>
                <SelectItem value="option-2">Option 2</SelectItem>
                <SelectItem value="option-3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Section 5: Tabs */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">Tabs</h3>
        <Tabs defaultValue="tab-1" className="max-w-sm">
          <TabsList>
            <TabsTrigger value="tab-1">Overview</TabsTrigger>
            <TabsTrigger value="tab-2">Details</TabsTrigger>
            <TabsTrigger value="tab-3">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="tab-1" className="text-xs text-muted-foreground p-3">
            Overview tab content preview.
          </TabsContent>
          <TabsContent value="tab-2" className="text-xs text-muted-foreground p-3">
            Details tab content preview.
          </TabsContent>
          <TabsContent value="tab-3" className="text-xs text-muted-foreground p-3">
            Settings tab content preview.
          </TabsContent>
        </Tabs>
      </section>

      {/* Section 6: Accordion */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">Accordion</h3>
        <Accordion type="single" collapsible className="max-w-sm">
          <AccordionItem value="item-1">
            <AccordionTrigger>How do I register?</AccordionTrigger>
            <AccordionContent>
              <p className="text-xs text-muted-foreground">
                Submit a registration Issue through the platform.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Can I join multiple teams?</AccordionTrigger>
            <AccordionContent>
              <p className="text-xs text-muted-foreground">
                No, each participant can only be on one team per hackathon.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Section 7: Alerts */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">Alerts</h3>
        <div className="space-y-3 max-w-sm">
          <Alert>
            <AlertTitle>Default Alert</AlertTitle>
            <AlertDescription className="text-xs">
              This is a default alert with neutral styling.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Destructive Alert</AlertTitle>
            <AlertDescription className="text-xs">
              Something went wrong. Please try again.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Section 8: Dropdown Menu */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">Dropdown Menu</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">Open Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </section>

      {/* Section 9: Color Palette */}
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
