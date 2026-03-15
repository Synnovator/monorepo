import * as React from 'react'
import { Badge } from '../../badge'

interface TechStackProps { items: string[] }

export function TechStack({ items }: TechStackProps) {
  if (!items?.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (<Badge key={item} variant="outline">{item}</Badge>))}
    </div>
  )
}
