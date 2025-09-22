import React, { useState } from 'react'
import { Bold, Italic, Code, Link, List, Image, Eye } from 'lucide-react'

interface PostEditorProps {
  onSubmit: (content: string) => void
  onCancel: () => void
  isSubmitting?: boolean
  submitText?: string
  initialContent?: string
  placeholder?: string
}

const PostEditor: React.FC<PostEditorProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitText = 'Post',
  initialContent = '',
  placeholder = 'Write your post...'
}) => {
  const [content, setContent] = useState(initialContent)
  const [showPreview, setShowPreview] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim()) {
      onSubmit(content.trim())
    }
  }

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.getElementById('post-content') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end)

    setContent(newContent)

    // Reset cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown('**', '**'), title: 'Bold' },
    { icon: Italic, action: () => insertMarkdown('*', '*'), title: 'Italic' },
    { icon: Code, action: () => insertMarkdown('`', '`'), title: 'Inline Code' },
    { icon: Link, action: () => insertMarkdown('[', '](url)'), title: 'Link' },
    { icon: List, action: () => insertMarkdown('- '), title: 'List' },
    { icon: Image, action: () => insertMarkdown('![alt](', ')'), title: 'Image' },
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center space-x-2">
          {toolbarButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              onClick={button.action}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              title={button.title}
            >
              <button.icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm ${
            showPreview
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Eye className="h-4 w-4" />
          <span>Preview</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!showPreview ? (
          <textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
            required
          />
        ) : (
          <div className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 overflow-auto">
            <div className="prose prose-sm max-w-none">
              {content || <span className="text-gray-400 italic">Nothing to preview</span>}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Supports Markdown formatting. Use ``` for code blocks.
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? 'Posting...' : submitText}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default PostEditor