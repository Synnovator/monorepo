import * as React from 'react'
import { Card, CardContent } from '../../card'
import { Button } from '../../button'

interface DemoEmbedProps { url: string; height?: number; title?: string }

export function DemoEmbed({ url, height = 400, title }: DemoEmbedProps) {
  if (!url) return null
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <iframe src={url} title={title || 'Demo'} style={{ height: `${height}px` }} className="w-full border-0" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" loading="lazy" />
      </CardContent>
      {title && (
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <Button variant="ghost" size="sm" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">Open in new tab</a>
          </Button>
        </div>
      )}
    </Card>
  )
}
