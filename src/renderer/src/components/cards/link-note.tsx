import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'

export interface LinkNoteProps {
  value: string | null
  onSave: (note: string | null) => void
}

const MAX_NOTE = 160

/** Optional one-line annotation on a link card — never prompted at capture time. */
export function LinkNote({ value, onSave }: LinkNoteProps): JSX.Element {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setDraft(value ?? '')
  }, [value, editing])

  useEffect(() => {
    if (!editing) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [editing])

  function commit(): void {
    const trimmed = draft.trim().slice(0, MAX_NOTE)
    const next = trimmed.length > 0 ? trimmed : null
    if (next !== (value?.trim() || null)) onSave(next)
    setDraft(next ?? '')
    setEditing(false)
  }

  function cancel(): void {
    setDraft(value ?? '')
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        maxLength={MAX_NOTE}
        placeholder="Why this mattered…"
        aria-label="Link note"
        className="w-full border-b border-ui bg-transparent pb-0.5 font-mono text-[11px] text-primary placeholder:text-ghost outline-none"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
          if (e.key === 'Escape') {
            e.preventDefault()
            cancel()
          }
        }}
      />
    )
  }

  if (value?.trim()) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setEditing(true)
        }}
        className="w-full text-left font-mono text-[11px] leading-snug text-secondary line-clamp-2 hover:text-primary"
      >
        {value.trim()}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        setEditing(true)
      }}
      className="w-full text-left font-mono text-[11px] text-ghost opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
    >
      Add a note…
    </button>
  )
}
