'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../../dialog'
import { cn } from '../../../lib/utils'

interface GalleryImage {
  src: string
  alt: string
  caption?: string
}

interface ImageGalleryProps {
  images: GalleryImage[]
  columns?: 2 | 3
}

export function ImageGallery({ images, columns = 2 }: ImageGalleryProps) {
  if (!images?.length) return null

  return (
    <div className={cn('grid gap-4', columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2')}>
      {images.map((img, i) => (
        <Dialog key={i}>
          <DialogTrigger asChild>
            <button type="button" className="group relative overflow-hidden rounded-lg border border-border cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/50">
              <img src={img.src} alt={img.alt} className="w-full h-auto transition-transform duration-200 group-hover:scale-[1.02]" loading="lazy" />
              {img.caption && (
                <span className="absolute bottom-0 inset-x-0 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground">{img.caption}</span>
              )}
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <DialogTitle className="sr-only">{img.alt}</DialogTitle>
            <img src={img.src} alt={img.alt} className="w-full h-auto" />
            {img.caption && <p className="p-4 text-sm text-muted-foreground">{img.caption}</p>}
          </DialogContent>
        </Dialog>
      ))}
    </div>
  )
}
