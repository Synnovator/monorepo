import * as React from 'react'
import { Badge } from '../../badge'

interface Skill {
  name: string
  level: 'expert' | 'intermediate' | 'beginner'
}

interface SkillBadgesProps {
  skills: Skill[]
}

const levelVariant = {
  expert: 'brand',
  intermediate: 'highlight',
  beginner: 'outline',
} as const

export function SkillBadges({ skills }: SkillBadgesProps) {
  if (!skills?.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((s) => (
        <Badge key={s.name} variant={levelVariant[s.level]}>
          {s.name}
          <span className="ml-1 opacity-60">· {s.level}</span>
        </Badge>
      ))}
    </div>
  )
}
