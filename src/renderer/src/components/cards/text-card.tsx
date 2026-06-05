import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { Item } from '@/types'

export interface TextCardProps {
  item: Item
  onSave: (content: string) => void
  autoFocus?: boolean
}

export function TextCard({ item, onSave, autoFocus = false }: TextCardProps): JSX.Element {
  const [editing, setEditing] = useState(autoFocus)
  const [draft, setDraft] = useState(item.content ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus()
      // Place cursor at end of existing text
      const len = textareaRef.current?.value.length ?? 0
      textareaRef.current?.setSelectionRange(len, len)
    }
  }, [editing])

  function commit(): void {
    const trimmed = draft.trim()
    if (trimmed !== (item.content ?? '').trim()) {
      onSave(trimmed)
    }
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    // Cmd+Enter or Ctrl+Enter to save; plain Enter adds a newline
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      commit()
    }
    if (e.key === 'Escape') {
      setDraft(item.content ?? '')
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        className="w-full resize-none bg-transparent text-sm text-stone-800 placeholder-stone-300 outline-none"
        style={{ minHeight: '4rem' }}
        value={draft}
        placeholder="Write something…"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        // Allow text selection inside the card without triggering drag
        onPointerDown={(e) => e.stopPropagation()}
      />
    )
  }

  return (
    <div
      className="cursor-text text-sm leading-relaxed text-stone-700 select-text"
      onClick={() => setEditing(true)}
    >
      {item.content ? (
        <p className="whitespace-pre-wrap">{item.content}</p>
      ) : (
        <p className="text-stone-300">Empty note</p>
      )}
    </div>
  )
}
