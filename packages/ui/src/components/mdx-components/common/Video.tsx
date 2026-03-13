import * as React from 'react'
import { Card, CardContent } from '../../card'

interface VideoProps {
  url: string
  title?: string
}

function getEmbedUrl(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  const biliMatch = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/)
  if (biliMatch) return `https://player.bilibili.com/player.html?bvid=${biliMatch[1]}`
  return null
}

export function Video({ url, title }: VideoProps) {
  const embedUrl = getEmbedUrl(url)
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {embedUrl ? (
          <iframe src={embedUrl} title={title || 'Video'} className="w-full aspect-video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <video src={url} controls className="w-full aspect-video" title={title}>
            <track kind="captions" />
          </video>
        )}
      </CardContent>
      {title && <p className="px-4 py-2 text-sm text-muted-foreground">{title}</p>}
    </Card>
  )
}
