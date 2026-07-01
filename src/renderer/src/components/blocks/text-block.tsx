import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'
import { detectUrl } from '@shared/detect-url'
import { usePasteModal } from '@/stores/paste-modal'
import type { Item } from '@/types'

export interface TextBlockProps {
  item: Item
  dayId: string
  itemId: string
  onSave: (content: string) => void
  onEmpty: () => void
  autoFocus?: boolean
}

export function TextBlock({
  item,
  dayId,
  itemId,
  onSave,
  onEmpty,
  autoFocus = false
}: TextBlockProps): JSX.Element {
  const [editing, setEditing] = useState(autoFocus)
  const [draft, setDraft] = useState(item.content ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const upgradingRef = useRef(false)
  const openPasteModal = usePasteModal((s) => s.openWith)

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

  function openLinkModal(url: string): void {
    upgradingRef.current = true
    setEditing(false)
    openPasteModal(url, { dayId, upgradeItemId: itemId })
  }

  function commit(): void {
    if (upgradingRef.current) {
      upgradingRef.current = false
      return
    }
    const trimmed = draft.trim()
    const detected = detectUrl(trimmed)
    if (detected) {
      openLinkModal(detected.sourceUrl)
      return
    }
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

  function handlePaste(e: React.ClipboardEvent): void {
    const pasted = e.clipboardData.getData('text').trim()
    const detected = detectUrl(pasted)
    if (detected && !draft.trim()) {
      e.preventDefault()
      openLinkModal(detected.sourceUrl)
    }
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
        placeholder="Write something…"
        onChange={(e) => {
          setDraft(e.target.value)
          resize()
        }}
        onBlur={commit}
        onPaste={handlePaste}
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
        <p className="text-stone-300">Empty</p>
      )}
    </div>
  )
}
