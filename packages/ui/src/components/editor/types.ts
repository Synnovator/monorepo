import type { LucideIcon } from 'lucide-react'

export interface MdxEditorProps {
  /** Initial MDX source content */
  initialContent: string
  /** Initial content for the other language tab */
  initialContentAlt?: string
  /** Available custom components for this scene */
  availableComponents: ComponentDefinition[]
  /** Called when user submits (both languages + assets). MDX content has blob URLs already rewritten to ./assets/ paths. */
  onSave: (content: string, contentAlt: string, assets: Asset[]) => Promise<void>
  /** Current language */
  lang: 'en' | 'zh'
  /** Template content to use when initialContent is empty */
  templateContent?: string
  templateContentAlt?: string
  /** Draft storage key for localStorage autosave */
  draftKey?: string
}

export interface ComponentDefinition {
  name: string
  category: 'common' | 'hackathon' | 'proposal' | 'profile'
  snippet: string
  description: string
  descriptionZh: string
  icon: LucideIcon
}

export interface Asset {
  filename: string
  blob: Blob
  tempUrl: string
}

/** Generate a unique filename preserving the original extension */
export function generateAssetFilename(file: File): string {
  const ext = file.name.split('.').pop() || 'bin'
  const hash = Math.random().toString(36).slice(2, 10)
  return `${Date.now()}-${hash}.${ext}`
}
