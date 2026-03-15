import * as React from 'react'
import { Card } from '../../card'
import { Badge } from '../../badge'
import { Avatar, AvatarImage, AvatarFallback } from '../../avatar'
import { cn } from '../../../lib/utils'

interface Sponsor { name: string; logo: string; tier: 'platinum' | 'gold' | 'silver'; url?: string }
interface SponsorGridProps { sponsors: Sponsor[] }

const tierVariant = { platinum: 'brand', gold: 'highlight', silver: 'info' } as const
const tierOrder = { platinum: 0, gold: 1, silver: 2 } as const

export function SponsorGrid({ sponsors }: SponsorGridProps) {
  if (!sponsors?.length) return null
  const sorted = [...sponsors].sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier])
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {sorted.map((s, i) => {
        const content = (
          <Card key={i} className={cn('flex flex-col items-center gap-3 p-4 transition-all duration-200', s.url && 'hover:border-primary/40')}>
            <Avatar className="h-12 w-12">
              <AvatarImage src={s.logo} alt={s.name} />
              <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground text-center">{s.name}</span>
            <Badge variant={tierVariant[s.tier]}>{s.tier}</Badge>
          </Card>
        )
        return s.url ? <a key={i} href={s.url} target="_blank" rel="noopener noreferrer">{content}</a> : content
      })}
    </div>
  )
}
