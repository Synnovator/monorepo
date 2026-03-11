'use client';

import { useState } from 'react';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { Button } from '@synnovator/ui';
import { Badge } from '@synnovator/ui';
import { Card } from '@synnovator/ui';
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

interface ComponentPreviewProps {
  lang: Lang;
}

export function ComponentPreview({ lang }: ComponentPreviewProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="space-y-8">
      {/* Section 1: Buttons */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">{t(lang, 'admin.theme_comp_buttons')}</h3>
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
        <h3 className="text-sm font-semibold text-foreground mb-3">{t(lang, 'admin.theme_comp_badges')}</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="brand">Brand</Badge>
          <Badge variant="highlight">Highlight</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="warning">Warning</Badge>
        </div>
      </section>

      {/* Section 3: Cards */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">{t(lang, 'admin.theme_comp_cards')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <h4 className="text-sm font-semibold text-card-foreground mb-1">Card Title</h4>
            <p className="text-xs text-muted-foreground mb-3">
              This card uses bg-card with card-foreground text.
            </p>
            <Button size="sm">Action</Button>
          </Card>
          <Card className="bg-muted p-4">
            <h4 className="text-sm font-semibold text-foreground mb-1">Muted Card</h4>
            <p className="text-xs text-muted-foreground mb-3">
              This card uses bg-muted with muted-foreground text.
            </p>
            <Button size="sm" variant="secondary">Action</Button>
          </Card>
        </div>
      </section>

      {/* Section 4: Form Controls */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">{t(lang, 'admin.theme_comp_forms')}</h3>
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
              <SelectTrigger className="w-full" aria-label="Preview select">
                <SelectValue placeholder="Choose an option" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
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
        <h3 className="text-sm font-semibold text-foreground mb-3">{t(lang, 'admin.theme_comp_tabs')}</h3>
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
        <h3 className="text-sm font-semibold text-foreground mb-3">{t(lang, 'admin.theme_comp_accordion')}</h3>
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
        <h3 className="text-sm font-semibold text-foreground mb-3">{t(lang, 'admin.theme_comp_alerts')}</h3>
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
        <h3 className="text-sm font-semibold text-foreground mb-3">{t(lang, 'admin.theme_comp_dropdown')}</h3>
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
        <h3 className="text-sm font-semibold text-foreground mb-3">{t(lang, 'admin.theme_comp_palette')}</h3>
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
