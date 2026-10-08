'use client'

import { useCallback, useRef, useState, type ChangeEvent, type RefObject } from 'react'
import type { Editor } from '@tiptap/react'
import { toast } from 'sonner'

export type ImageUploader = (file: File) => Promise<string>

export const EDITOR_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'

const ACCEPTED_TYPES = new Set(EDITOR_IMAGE_ACCEPT.split(','))
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

/** "dubai-marina_night.jpg" -> "dubai marina night", a starting alt the author can edit. */
function altFromFileName(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The image files in a paste or drop, ignoring text and other files. */
export function imageFilesFrom(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter((file) => file.type.startsWith('image/'))
}

function rejectionFor(file: File): string | null {
  if (!ACCEPTED_TYPES.has(file.type)) return `${file.name}: use a JPG, PNG or WebP image.`
  if (file.size > MAX_IMAGE_BYTES) return `${file.name}: keep images under 10 MB.`
  return null
}

interface TiptapImageUpload {
  uploading: boolean
  /** Uploads each file and inserts it at `pos`, or at the cursor when omitted. */
  insertFiles: (files: File[], pos?: number) => Promise<void>
  inputRef: RefObject<HTMLInputElement | null>
  openPicker: () => void
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void
}

/**
 * Uploads images picked, pasted or dropped into the editor and inserts them
 * by public URL. The editor never holds a `data:` URL: it would be dropped by
 * the image extension and would blow the section length limit anyway.
 */
export function useTiptapImageUpload(editor: Editor | null, upload: ImageUploader | undefined): TiptapImageUpload {
  const [pending, setPending] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const insertFiles = useCallback(
    async (files: File[], pos?: number) => {
      if (!editor || !upload) return

      for (const file of files) {
        const rejection = rejectionFor(file)
        if (rejection) {
          toast.error(rejection)
          continue
        }

        setPending((n) => n + 1)
        try {
          const src = await upload(file)
          const image = { type: 'image', attrs: { src, alt: altFromFileName(file.name) } }
          // The document may have changed while the upload ran, so clamp the drop point.
          const at = pos === undefined ? null : Math.min(pos, editor.state.doc.content.size)
          const chain = editor.chain().focus()
          ;(at === null ? chain.insertContent(image) : chain.insertContentAt(at, image)).run()
        } catch (error: unknown) {
          toast.error(error instanceof Error ? error.message : 'Image upload failed. Try again.')
        } finally {
          setPending((n) => n - 1)
        }
      }
    },
    [editor, upload]
  )

  const openPicker = useCallback(() => inputRef.current?.click(), [])

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = imageFilesFrom(event.target.files)
      // Reset so picking the same file twice still fires a change.
      event.target.value = ''
      void insertFiles(files)
    },
    [insertFiles]
  )

  return { uploading: pending > 0, insertFiles, inputRef, openPicker, onInputChange }
}
