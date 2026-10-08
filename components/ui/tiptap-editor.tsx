'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import TiptapImage from '@tiptap/extension-image'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { TableKit } from '@tiptap/extension-table'
import { common, createLowlight } from 'lowlight'
import { useEffect, useCallback, useRef } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  ImageUp,
  LoaderCircle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  Undo,
  Redo,
} from 'lucide-react'
import { ToolbarButton, ToolbarSeparator } from './tiptap-toolbar-button'
import { TiptapTableControls } from './tiptap-table-controls'
import { EDITOR_IMAGE_ACCEPT, imageFilesFrom, useTiptapImageUpload, type ImageUploader } from './tiptap-image-upload'

const lowlight = createLowlight(common)

interface TiptapEditorProps {
  value: string
  onChange: (value: string) => void
  /** Table button and table paste. Off by default: only pages whose public CSS styles tables turn it on. */
  tables?: boolean
  /** Turns on image upload from the toolbar, paste and drop. Resolves to the public URL. */
  onUploadImage?: ImageUploader
}

export function TiptapEditor({ value, onChange, tables = false, onUploadImage }: TiptapEditorProps) {
  // editorProps are bound once at creation, so paste and drop reach the upload through a ref.
  const insertFilesRef = useRef<(files: File[], pos?: number) => void>(() => {})

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Start writing your blog post...',
      }),
      TiptapImage.configure({
        HTMLAttributes: { class: 'rounded-lg' },
      }),
      CodeBlockLowlight.configure({ lowlight }),
      // Resizing would write pixel widths into the saved HTML, which breaks on phones.
      ...(tables ? [TableKit.configure({ table: { resizable: false } })] : []),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
      handlePaste: (_view, event) => {
        if (!onUploadImage) return false
        const files = imageFilesFrom(event.clipboardData?.files)
        if (files.length === 0) return false
        event.preventDefault()
        insertFilesRef.current(files)
        return true
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!onUploadImage || moved) return false
        const files = imageFilesFrom(event.dataTransfer?.files)
        if (files.length === 0) return false
        event.preventDefault()
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
        insertFilesRef.current(files, pos)
        return true
      },
    },
  })

  const imageUpload = useTiptapImageUpload(editor, onUploadImage)
  const { insertFiles } = imageUpload

  useEffect(() => {
    insertFilesRef.current = (files, pos) => void insertFiles(files, pos)
  }, [insertFiles])

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '')
    }
    // Only sync when value changes externally (e.g., form reset)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL', previousUrl || 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt('Enter image URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  if (!editor) return null

  const iconSize = 16

  return (
    <div className="tiptap-editor rounded-md border border-input bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border p-2">
        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={iconSize} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Inline formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough size={iconSize} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered size={iconSize} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Block elements */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus size={iconSize} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Link & Image */}
        <ToolbarButton
          onClick={setLink}
          isActive={editor.isActive('link')}
          title="Link"
        >
          <LinkIcon size={iconSize} />
        </ToolbarButton>
        {onUploadImage && (
          <>
            <ToolbarButton
              onClick={imageUpload.openPicker}
              disabled={imageUpload.uploading}
              title={imageUpload.uploading ? 'Uploading image' : 'Upload image'}
            >
              {imageUpload.uploading ? (
                <LoaderCircle size={iconSize} className="animate-spin" />
              ) : (
                <ImageUp size={iconSize} />
              )}
            </ToolbarButton>
            <input
              ref={imageUpload.inputRef}
              type="file"
              accept={EDITOR_IMAGE_ACCEPT}
              multiple
              hidden
              onChange={imageUpload.onInputChange}
            />
          </>
        )}
        <ToolbarButton onClick={addImage} title="Image from URL">
          <ImageIcon size={iconSize} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight size={iconSize} />
        </ToolbarButton>

        {tables && <TiptapTableControls editor={editor} iconSize={iconSize} />}

        <ToolbarSeparator />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          <Redo size={iconSize} />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  )
}
