import * as React from 'react'
import { Alert, AlertTitle, AlertDescription } from '../../alert'
import { InfoIcon, AlertTriangleIcon, LightbulbIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'

const icons = {
  info: <InfoIcon className="h-4 w-4" />,
  warning: <AlertTriangleIcon className="h-4 w-4" />,
  tip: <LightbulbIcon className="h-4 w-4" />,
}

const variantMap = {
  info: 'default',
  warning: 'destructive',
  tip: 'default',
} as const

interface CalloutProps {
  type?: 'info' | 'warning' | 'tip'
  title?: string
  children: React.ReactNode
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  return (
    <Alert variant={variantMap[type]} className={cn(type === 'tip' && 'border-highlight/40')}>
      {icons[type]}
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}
