'use client'

import * as React from 'react'
import { evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import remarkGfm from 'remark-gfm'
import remarkMdxRemoveEsm from 'remark-mdx-remove-esm'
import { AlertCircle } from 'lucide-react'
import { ScrollArea } from '../scroll-area'
import { Alert, AlertTitle, AlertDescription } from '../alert'

export interface PreviewPaneProps {
  source: string
  components?: Record<string, React.ComponentType<Record<string, unknown>>>
}

interface CompileResult {
  Content: React.ComponentType | null
  error: string | null
}

function PreviewPane({ source, components = {} }: PreviewPaneProps) {
  const [result, setResult] = React.useState<CompileResult>({
    Content: null,
    error: null,
  })

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (!source.trim()) {
        setResult({ Content: null, error: null })
        return
      }

      try {
        const { default: Content } = await evaluate(source, {
          ...runtime,
          remarkPlugins: [remarkGfm, remarkMdxRemoveEsm],
          useMDXComponents: () => components,
        } as Parameters<typeof evaluate>[1])

        setResult({ Content: Content as React.ComponentType, error: null })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setResult((prev) => ({ ...prev, error: message }))
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [source, components])

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        {result.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="size-4" />
            <AlertTitle>Compilation Error</AlertTitle>
            <AlertDescription>
              <pre className="mt-1 whitespace-pre-wrap break-words text-xs">
                {result.error}
              </pre>
            </AlertDescription>
          </Alert>
        )}
        {result.Content && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <result.Content />
          </div>
        )}
        {!result.Content && !result.error && !source.trim() && (
          <p className="text-sm text-muted-foreground italic">
            Start typing to see a preview...
          </p>
        )}
      </div>
    </ScrollArea>
  )
}

export { PreviewPane }
