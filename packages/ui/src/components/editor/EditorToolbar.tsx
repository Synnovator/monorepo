'use client'

import * as React from 'react'
import {
  BoldIcon,
  ItalicIcon,
  StrikethroughIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  CodeIcon,
  LinkIcon,
  ImageIcon,
  SaveIcon,
  Loader2Icon,
} from 'lucide-react'
import { Button } from '../button'
import { Tabs, TabsList, TabsTrigger } from '../tabs'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '../tooltip'
import { Separator } from '../separator'
import { ComponentInserter } from './ComponentInserter'
import type { ComponentDefinition } from './types'

export interface EditorToolbarProps {
  onInsert: (text: string) => void
  onUploadClick: () => void
  onSave: () => void
  saving: boolean
  lang: 'en' | 'zh'
  onLangChange: (lang: 'en' | 'zh') => void
  availableComponents: ComponentDefinition[]
  hasUnsavedChanges: boolean
}

interface ToolbarButton {
  label: string
  labelZh: string
  icon: React.ElementType
  insert: string
}

const FORMATTING_BUTTONS: ToolbarButton[] = [
  { label: 'Bold', labelZh: '粗体', icon: BoldIcon, insert: '**text**' },
  { label: 'Italic', labelZh: '斜体', icon: ItalicIcon, insert: '*text*' },
  { label: 'Strikethrough', labelZh: '删除线', icon: StrikethroughIcon, insert: '~~text~~' },
]

const HEADING_BUTTONS: ToolbarButton[] = [
  { label: 'Heading 1', labelZh: '标题 1', icon: Heading1Icon, insert: '# ' },
  { label: 'Heading 2', labelZh: '标题 2', icon: Heading2Icon, insert: '## ' },
  { label: 'Heading 3', labelZh: '标题 3', icon: Heading3Icon, insert: '### ' },
]

const CODE_LINK_BUTTONS: ToolbarButton[] = [
  { label: 'Code', labelZh: '代码', icon: CodeIcon, insert: '```\ncode\n```' },
  { label: 'Link', labelZh: '链接', icon: LinkIcon, insert: '[text](url)' },
]

function EditorToolbar({
  onInsert,
  onUploadClick,
  onSave,
  saving,
  lang,
  onLangChange,
  availableComponents,
  hasUnsavedChanges,
}: EditorToolbarProps) {
  const renderButton = React.useCallback(
    (btn: ToolbarButton) => (
      <Tooltip key={btn.label}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onInsert(btn.insert)}
            aria-label={lang === 'zh' ? btn.labelZh : btn.label}
          >
            <btn.icon className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{lang === 'zh' ? btn.labelZh : btn.label}</TooltipContent>
      </Tooltip>
    ),
    [lang, onInsert]
  )

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 border-b px-2 py-1">
        {/* Formatting group */}
        {FORMATTING_BUTTONS.map(renderButton)}

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Headings group */}
        {HEADING_BUTTONS.map(renderButton)}

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Code & link group */}
        {CODE_LINK_BUTTONS.map(renderButton)}

        {/* Upload trigger */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onUploadClick}
              aria-label={lang === 'zh' ? '上传图片' : 'Upload image'}
            >
              <ImageIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {lang === 'zh' ? '上传图片' : 'Upload Image'}
          </TooltipContent>
        </Tooltip>

        {/* Component inserter */}
        <ComponentInserter
          components={availableComponents}
          onInsert={onInsert}
          lang={lang}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Language switcher */}
        <Tabs
          value={lang}
          onValueChange={(v) => onLangChange(v as 'en' | 'zh')}
        >
          <TabsList className="h-8">
            <TabsTrigger value="en" className="px-2 py-1 text-xs">
              EN
            </TabsTrigger>
            <TabsTrigger value="zh" className="px-2 py-1 text-xs">
              ZH
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Save button */}
        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          disabled={saving || !hasUnsavedChanges}
          className="ml-2"
        >
          {saving ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SaveIcon className="size-4" />
          )}
          <span className="ml-1">
            {saving
              ? lang === 'zh'
                ? '保存中...'
                : 'Saving...'
              : lang === 'zh'
                ? '保存'
                : 'Save'}
          </span>
        </Button>
      </div>
    </TooltipProvider>
  )
}

export { EditorToolbar }
