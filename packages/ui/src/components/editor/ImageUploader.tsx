'use client'

import * as React from 'react'
import type { Asset } from './types'

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const ALLOWED_PDF_TYPE = 'application/pdf'
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_PDF_SIZE = 20 * 1024 * 1024 // 20MB

export interface ImageUploaderProps {
  onUpload: (file: File, context: string) => Promise<{ url: string; filename: string }>
  onInserted: (markdown: string, asset: Asset) => void
  context: string
}

export interface ImageUploaderHandle {
  triggerUpload: () => void
}

const ImageUploader = React.forwardRef<ImageUploaderHandle, ImageUploaderProps>(
  ({ onUpload, onInserted, context }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = React.useState(false)

    React.useImperativeHandle(ref, () => ({
      triggerUpload: () => {
        inputRef.current?.click()
      },
    }))

    const validateFile = React.useCallback((file: File): string | null => {
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
      const isPdf = file.type === ALLOWED_PDF_TYPE

      if (!isImage && !isPdf) {
        return `Unsupported file type: ${file.type}. Allowed: png, jpg, gif, webp, pdf`
      }

      if (isImage && file.size > MAX_IMAGE_SIZE) {
        return `Image too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 5MB`
      }

      if (isPdf && file.size > MAX_PDF_SIZE) {
        return `PDF too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 20MB`
      }

      return null
    }, [])

    const handleFiles = React.useCallback(
      async (files: FileList | null) => {
        if (!files || files.length === 0) return

        setUploading(true)
        try {
          for (const file of Array.from(files)) {
            const error = validateFile(file)
            if (error) {
              console.error(error)
              continue
            }

            const { url, filename } = await onUpload(file, context)
            const tempUrl = URL.createObjectURL(file)
            const asset: Asset = { filename, blob: file, tempUrl }

            const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
            const markdown = isImage
              ? `![${filename}](${url})`
              : `[${filename}](${url})`

            onInserted(markdown, asset)
          }
        } finally {
          setUploading(false)
          // Reset input value so the same file can be selected again
          if (inputRef.current) {
            inputRef.current.value = ''
          }
        }
      },
      [onUpload, onInserted, context, validateFile]
    )

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        void handleFiles(e.target.files)
      },
      [handleFiles]
    )

    return (
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.gif,.webp,.pdf"
        multiple
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
        aria-label="Upload file"
      />
    )
  }
)

ImageUploader.displayName = 'ImageUploader'

export { ImageUploader }
