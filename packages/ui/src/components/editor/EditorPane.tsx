'use client'

import * as React from 'react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { LanguageDescription } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { ScrollArea } from '../scroll-area'
import type { Asset } from './types'

export interface EditorPaneProps {
  value: string
  onChange: (value: string) => void
  onUpload?: (file: File, context: string) => Promise<{ url: string; filename: string }>
  onAssetAdded?: (asset: Asset) => void
  theme?: 'light' | 'dark'
}

export interface EditorPaneHandle {
  insertText: (text: string) => void
}

/**
 * Read a CSS custom property value from the document root.
 * Falls back to the provided default if not available.
 */
function getCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function createEditorTheme(isDark: boolean) {
  return EditorView.theme(
    {
      '&': {
        backgroundColor: getCssVar('--color-background', isDark ? '#1a1a1a' : '#ffffff'),
        color: getCssVar('--color-foreground', isDark ? '#e5e5e5' : '#1a1a1a'),
      },
      '.cm-content': {
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
        fontSize: '14px',
        lineHeight: '1.6',
        caretColor: getCssVar('--color-foreground', isDark ? '#e5e5e5' : '#1a1a1a'),
      },
      '.cm-cursor': {
        borderLeftColor: getCssVar('--color-foreground', isDark ? '#e5e5e5' : '#1a1a1a'),
      },
      '.cm-selectionBackground': {
        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      },
      '&.cm-focused .cm-selectionBackground': {
        backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
      },
      '.cm-activeLine': {
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      },
      '.cm-gutters': {
        backgroundColor: getCssVar('--color-background', isDark ? '#1a1a1a' : '#ffffff'),
        color: isDark ? '#666' : '#999',
        borderRight: 'none',
      },
      '.cm-activeLineGutter': {
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      },
    },
    { dark: isDark }
  )
}

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

const EditorPane = React.forwardRef<EditorPaneHandle, EditorPaneProps>(
  ({ value, onChange, onUpload, onAssetAdded, theme = 'light' }, ref) => {
    const cmRef = React.useRef<ReactCodeMirrorRef>(null)
    const isDark = theme === 'dark'

    const editorTheme = React.useMemo(() => createEditorTheme(isDark), [isDark])

    const extensions = React.useMemo(
      () => [
        markdown({
          base: markdownLanguage,
          codeLanguages: [
            LanguageDescription.of({
              name: 'javascript',
              alias: ['js', 'jsx', 'ts', 'tsx', 'typescript'],
              load: async () => {
                const { javascript } = await import('@codemirror/lang-javascript')
                return javascript({ jsx: true, typescript: true })
              },
            }),
          ],
        }),
        EditorView.lineWrapping,
      ],
      []
    )

    React.useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        const view = cmRef.current?.view
        if (!view) return

        const { from, to } = view.state.selection.main
        view.dispatch({
          changes: { from, to, insert: text },
          selection: { anchor: from + text.length },
        })
        view.focus()
      },
    }))

    const handleDrop = React.useCallback(
      async (e: React.DragEvent) => {
        if (!onUpload || !onAssetAdded) return

        const files = Array.from(e.dataTransfer.files).filter(
          (f) => IMAGE_TYPES.includes(f.type) || f.type === 'application/pdf'
        )
        if (files.length === 0) return

        e.preventDefault()

        for (const file of files) {
          try {
            const { url, filename } = await onUpload(file, 'editor-drop')
            const tempUrl = URL.createObjectURL(file)
            const asset: Asset = { filename, blob: file, tempUrl }
            onAssetAdded(asset)

            const isImage = IMAGE_TYPES.includes(file.type)
            const mdText = isImage ? `![${filename}](${url})` : `[${filename}](${url})`

            const view = cmRef.current?.view
            if (view) {
              const pos = view.state.selection.main.head
              view.dispatch({
                changes: { from: pos, insert: `\n${mdText}\n` },
              })
            }
          } catch (err) {
            console.error('Upload failed:', err)
          }
        }
      },
      [onUpload, onAssetAdded]
    )

    const handlePaste = React.useCallback(
      async (e: React.ClipboardEvent) => {
        if (!onUpload || !onAssetAdded) return

        const items = Array.from(e.clipboardData.items)
        const imageItems = items.filter((item) => IMAGE_TYPES.includes(item.type))

        if (imageItems.length === 0) return

        e.preventDefault()

        for (const item of imageItems) {
          const file = item.getAsFile()
          if (!file) continue

          try {
            const { url, filename } = await onUpload(file, 'editor-paste')
            const tempUrl = URL.createObjectURL(file)
            const asset: Asset = { filename, blob: file, tempUrl }
            onAssetAdded(asset)

            const mdText = `![${filename}](${url})`

            const view = cmRef.current?.view
            if (view) {
              const pos = view.state.selection.main.head
              view.dispatch({
                changes: { from: pos, insert: mdText },
              })
            }
          } catch (err) {
            console.error('Paste upload failed:', err)
          }
        }
      },
      [onUpload, onAssetAdded]
    )

    return (
      <ScrollArea className="h-full">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onPaste={handlePaste}
        >
          <CodeMirror
            ref={cmRef}
            value={value}
            onChange={onChange}
            extensions={extensions}
            theme={editorTheme}
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              bracketMatching: true,
              closeBrackets: true,
            }}
            minHeight="400px"
            className="text-sm"
          />
        </div>
      </ScrollArea>
    )
  }
)

EditorPane.displayName = 'EditorPane'

export { EditorPane }
