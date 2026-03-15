'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { EditorToolbar } from './EditorToolbar'
import { EditorPane, type EditorPaneHandle } from './EditorPane'
import { PreviewPane } from './PreviewPane'
import { ImageUploader, type ImageUploaderHandle } from './ImageUploader'
import type { MdxEditorProps, Asset } from './types'
import { cn } from '../../lib/utils'

const AUTOSAVE_INTERVAL = 30_000 // 30 seconds

interface DraftData {
  contentEn: string
  contentZh: string
  savedAt: number
}

/**
 * Rewrite blob:// URLs in MDX content to relative ./assets/ paths.
 * This converts preview-only blob URLs to Git-committable relative paths.
 */
function rewriteBlobUrls(content: string, assets: Asset[]): string {
  let result = content
  for (const asset of assets) {
    result = result.replaceAll(asset.tempUrl, `./assets/${asset.filename}`)
  }
  return result
}

function MdxEditor({
  initialContent,
  initialContentAlt = '',
  availableComponents,
  components,
  onSave,
  lang: initialLang,
  templateContent,
  templateContentAlt,
  draftKey,
}: MdxEditorProps) {
  const { resolvedTheme } = useTheme()
  const editorRef = React.useRef<EditorPaneHandle>(null)
  const uploaderRef = React.useRef<ImageUploaderHandle>(null)

  // Determine initial content: use template if initial is empty
  const resolveInitial = React.useCallback(
    (content: string, template?: string) => {
      return content || template || ''
    },
    []
  )

  const [lang, setLang] = React.useState<'en' | 'zh'>(initialLang)
  const [contentEn, setContentEn] = React.useState(() =>
    resolveInitial(
      initialLang === 'en' ? initialContent : (initialContentAlt ?? ''),
      templateContent
    )
  )
  const [contentZh, setContentZh] = React.useState(() =>
    resolveInitial(
      initialLang === 'zh' ? initialContent : (initialContentAlt ?? ''),
      templateContentAlt
    )
  )
  const [assets, setAssets] = React.useState<Asset[]>([])
  const [saving, setSaving] = React.useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)
  const [draftRestored, setDraftRestored] = React.useState(false)

  const currentContent = lang === 'en' ? contentEn : contentZh
  const setCurrentContent = lang === 'en' ? setContentEn : setContentZh

  // Draft persistence helpers
  const saveDraft = React.useCallback(() => {
    if (!draftKey) return
    try {
      const draft: DraftData = {
        contentEn,
        contentZh,
        savedAt: Date.now(),
      }
      localStorage.setItem(draftKey, JSON.stringify(draft))
    } catch {
      // localStorage may be unavailable
    }
  }, [draftKey, contentEn, contentZh])

  const loadDraft = React.useCallback((): DraftData | null => {
    if (!draftKey) return null
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return null
      return JSON.parse(raw) as DraftData
    } catch {
      return null
    }
  }, [draftKey])

  const clearDraft = React.useCallback(() => {
    if (!draftKey) return
    try {
      localStorage.removeItem(draftKey)
    } catch {
      // ignore
    }
  }, [draftKey])

  // Detect and restore draft on mount
  React.useEffect(() => {
    if (draftRestored) return
    setDraftRestored(true)

    const draft = loadDraft()
    if (!draft) return

    // Only offer to restore if draft is newer than 1 minute ago
    const age = Date.now() - draft.savedAt
    if (age > 24 * 60 * 60 * 1000) {
      // Discard drafts older than 24 hours
      clearDraft()
      return
    }

    const shouldRestore = window.confirm(
      lang === 'zh'
        ? `发现未保存的草稿（${new Date(draft.savedAt).toLocaleString()}）。是否恢复？`
        : `Unsaved draft found (${new Date(draft.savedAt).toLocaleString()}). Restore?`
    )

    if (shouldRestore) {
      setContentEn(draft.contentEn)
      setContentZh(draft.contentZh)
      setHasUnsavedChanges(true)
    } else {
      clearDraft()
    }
  }, [draftRestored, loadDraft, clearDraft, lang])

  // Autosave interval
  React.useEffect(() => {
    if (!draftKey || !hasUnsavedChanges) return

    const timer = setInterval(() => {
      saveDraft()
    }, AUTOSAVE_INTERVAL)

    return () => clearInterval(timer)
  }, [draftKey, hasUnsavedChanges, saveDraft])

  // Save draft on language switch
  const handleLangChange = React.useCallback(
    (newLang: 'en' | 'zh') => {
      saveDraft()
      setLang(newLang)
    },
    [saveDraft]
  )

  // Content change handler
  const handleContentChange = React.useCallback(
    (value: string) => {
      setCurrentContent(value)
      setHasUnsavedChanges(true)
    },
    [setCurrentContent]
  )

  // beforeunload warning
  React.useEffect(() => {
    if (!hasUnsavedChanges) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  // Insert text into editor
  const handleInsert = React.useCallback(
    (text: string) => {
      editorRef.current?.insertText(text)
    },
    []
  )

  // Upload trigger
  const handleUploadClick = React.useCallback(() => {
    uploaderRef.current?.triggerUpload()
  }, [])

  // Handle asset from upload
  const handleAssetAdded = React.useCallback((asset: Asset) => {
    setAssets((prev) => [...prev, asset])
    setHasUnsavedChanges(true)
  }, [])

  // Handle image inserted from uploader
  const handleImageInserted = React.useCallback(
    (markdown: string, asset: Asset) => {
      handleInsert(markdown)
      handleAssetAdded(asset)
    },
    [handleInsert, handleAssetAdded]
  )

  // Save handler — rewrites blob URLs to ./assets/ paths before calling onSave
  const handleSave = React.useCallback(async () => {
    setSaving(true)
    try {
      const finalEn = rewriteBlobUrls(contentEn, assets)
      const finalZh = rewriteBlobUrls(contentZh, assets)
      await onSave(finalEn, finalZh, assets)
      setHasUnsavedChanges(false)
      clearDraft()
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }, [onSave, contentEn, contentZh, assets, clearDraft])

  const editorTheme = resolvedTheme === 'dark' ? 'dark' : 'light'

  return (
    <div className="flex h-full flex-col rounded-lg border bg-background">
      <EditorToolbar
        onInsert={handleInsert}
        onUploadClick={handleUploadClick}
        onSave={handleSave}
        saving={saving}
        lang={lang}
        onLangChange={handleLangChange}
        availableComponents={availableComponents}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <div
        className={cn(
          'grid flex-1 overflow-hidden',
          'grid-cols-1 md:grid-cols-2',
          'divide-x'
        )}
      >
        {/* Editor pane */}
        <div className="min-h-0 overflow-hidden">
          <EditorPane
            ref={editorRef}
            value={currentContent}
            onChange={handleContentChange}
            onAssetAdded={handleAssetAdded}
            theme={editorTheme}
          />
        </div>

        {/* Preview pane */}
        <div className="hidden min-h-0 overflow-hidden md:block">
          <PreviewPane source={currentContent} components={components} />
        </div>
      </div>

      {/* Hidden file input for image upload */}
      <ImageUploader
        ref={uploaderRef}
        onInserted={handleImageInserted}
      />
    </div>
  )
}

export { MdxEditor }
