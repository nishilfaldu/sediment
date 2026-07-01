import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { Item } from '@/types'

export interface TextBlockProps {
  item: Item
  onSave: (content: string) => void
  onEmpty: () => void
  autoFocus?: boolean
}

export function TextBlock({
  item,
  onSave,
  onEmpty,
  autoFocus = false
}: TextBlockProps): JSX.Element {
  const [editing, setEditing] = useState(autoFocus)
  const [draft, setDraft] = useState(item.content ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function resize(): void {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus()
      const len = textareaRef.current?.value.length ?? 0
      textareaRef.current?.setSelectionRange(len, len)
      resize()
    }
  }, [editing])

  function commit(): void {
    const trimmed = draft.trim()
    if (!trimmed) {
      onEmpty()
      setEditing(false)
      return
    }
    if (trimmed !== (item.content ?? '').trim()) {
      onSave(trimmed)
    }
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
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
        className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-stone-800 placeholder-stone-300 outline-none"
        value={draft}
        placeholder="Write your thoughts…"
        onChange={(e) => {
          setDraft(e.target.value)
          resize()
        }}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        rows={1}
      />
    )
  }

  return (
    <div
      className="cursor-text text-[15px] leading-relaxed text-stone-800 select-text"
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
