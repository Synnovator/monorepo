'use client'

import * as React from 'react'
import { Card } from '../../card'
import { Badge } from '../../badge'
import { Avatar, AvatarImage, AvatarFallback } from '../../avatar'

interface TeamMember { github: string; role: string; contribution?: string }
interface TeamRolesProps { members: TeamMember[] }

const roleVariant: Record<string, 'brand' | 'highlight' | 'info' | 'outline'> = {
  leader: 'brand', developer: 'highlight', designer: 'info', researcher: 'info', mentor: 'outline',
}

export function TeamRoles({ members }: TeamRolesProps) {
  if (!members?.length) return null
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {members.map((m) => (
        <Card key={m.github} className="flex items-start gap-3 p-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://github.com/${m.github}.png?size=80`} alt={m.github} />
            <AvatarFallback>{m.github.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <a href={`https://github.com/${m.github}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate">
                @{m.github}
              </a>
              <Badge variant={roleVariant[m.role] ?? 'outline'}>{m.role}</Badge>
            </div>
            {m.contribution && <p className="text-xs text-muted-foreground">{m.contribution}</p>}
          </div>
        </Card>
      ))}
    </div>
  )
}
