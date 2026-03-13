import * as React from 'react'
import { Badge } from '../../badge'
import { Separator } from '../../separator'
import { cn } from '../../../lib/utils'

interface TimelineItem { date: string; label: string; status: 'completed' | 'active' | 'upcoming' }
interface TimelineProps { items: TimelineItem[] }

const statusVariant = { completed: 'secondary', active: 'brand', upcoming: 'outline' } as const

export function Timeline({ items }: TimelineProps) {
  if (!items?.length) return null
  return (
    <div className="relative space-y-6 pl-8">
      <Separator orientation="vertical" className="absolute left-3 top-2 bottom-2 h-auto" />
      {items.map((item, i) => (
        <div key={i} className="relative flex items-start gap-4">
          <div className={cn('absolute left-[-20px] top-1.5 h-2.5 w-2.5 rounded-full border-2',
            item.status === 'completed' && 'bg-primary border-primary',
            item.status === 'active' && 'bg-brand border-brand',
            item.status === 'upcoming' && 'bg-background border-muted-foreground',
          )} />
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <Badge variant={statusVariant[item.status]}>{item.status}</Badge>
            </div>
            <time className="text-xs text-muted-foreground">{item.date}</time>
          </div>
        </div>
      ))}
    </div>
  )
}
