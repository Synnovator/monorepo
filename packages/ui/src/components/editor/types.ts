import type { LucideIcon } from 'lucide-react'

export interface MdxEditorProps {
  /** Initial MDX source content */
  initialContent: string
  /** Initial content for the other language tab */
  initialContentAlt?: string
  /** Available custom components for this scene */
  availableComponents: ComponentDefinition[]
  /** Called when user submits (both languages + assets) */
  onSave: (content: string, contentAlt: string, assets: Asset[]) => Promise<void>
  /** Current language */
  lang: 'en' | 'zh'
  /** Template content to use when initialContent is empty */
  templateContent?: string
  templateContentAlt?: string
  /** Upload handler — POST file to /api/r2/upload */
  onUpload: (file: File, context: string) => Promise<{ url: string; filename: string }>
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
