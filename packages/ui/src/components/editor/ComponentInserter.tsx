'use client'

import * as React from 'react'
import { PuzzleIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '../dropdown-menu'
import { Button } from '../button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '../tooltip'
import type { ComponentDefinition } from './types'

export interface ComponentInserterProps {
  components: ComponentDefinition[]
  onInsert: (snippet: string) => void
  lang: 'en' | 'zh'
}

const CATEGORY_LABELS: Record<ComponentDefinition['category'], { en: string; zh: string }> = {
  common: { en: 'Common', zh: '通用' },
  hackathon: { en: 'Hackathon', zh: '黑客松' },
  proposal: { en: 'Proposal', zh: '提案' },
  profile: { en: 'Profile', zh: '个人资料' },
}

function ComponentInserter({ components, onInsert, lang }: ComponentInserterProps) {
  const grouped = React.useMemo(() => {
    const groups: Record<string, ComponentDefinition[]> = {}
    for (const comp of components) {
      if (!groups[comp.category]) {
        groups[comp.category] = []
      }
      groups[comp.category].push(comp)
    }
    return groups
  }, [components])

  const categories = Object.keys(grouped) as ComponentDefinition['category'][]

  if (components.length === 0) return null

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Insert component">
              <PuzzleIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {lang === 'zh' ? '插入组件' : 'Insert Component'}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="w-64">
        {categories.map((category, i) => (
          <React.Fragment key={category}>
            {i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                {CATEGORY_LABELS[category]?.[lang] ?? category}
              </DropdownMenuLabel>
              {grouped[category].map((comp) => {
                const Icon = comp.icon
                return (
                  <DropdownMenuItem
                    key={comp.name}
                    onSelect={() => onInsert(comp.snippet)}
                  >
                    <Icon className="size-4" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{comp.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {lang === 'zh' ? comp.descriptionZh : comp.description}
                      </span>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ComponentInserter }
