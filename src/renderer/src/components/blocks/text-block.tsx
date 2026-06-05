import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'
import { detectUrl } from '@/lib/url-detect'
import type { Item, ItemType, Platform } from '@/types'

export interface TextBlockProps {
  item: Item
  onSave: (content: string) => void
  onUpgrade: (type: ItemType, sourceUrl: string, platform?: Platform) => void
  onEmpty: () => void
  autoFocus?: boolean
}

export function TextBlock({
  item,
  onSave,
  onUpgrade,
  onEmpty,
  autoFocus = false
}: TextBlockProps): JSX.Element {
  const [editing, setEditing] = useState(autoFocus)
  const [draft, setDraft] = useState(item.content ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Set to true synchronously in upgrade() so that the blur-triggered commit()
  // that fires immediately after a paste does not double-fire onEmpty().
  const upgradingRef = useRef(false)

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

  function upgrade(type: ItemType, sourceUrl: string, platform?: Platform): void {
    upgradingRef.current = true
    setEditing(false)
    onUpgrade(type, sourceUrl, platform)
  }

  function commit(): void {
    // A paste-triggered upgrade already fired; the blur that follows is spurious
    if (upgradingRef.current) {
      upgradingRef.current = false
      return
    }
    const trimmed = draft.trim()
    // URL typed/pasted and committed → upgrade to rich card
    const detected = detectUrl(trimmed)
    if (detected) {
      upgrade(detected.type, detected.sourceUrl, detected.platform)
      return
    }
    // Empty → delete the item (covers "created but never typed" case)
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
    // Auto-upgrade when a URL is pasted into an empty block.
    // upgradingRef is set synchronously so the subsequent blur-commit is a no-op.
    if (detected && !draft.trim()) {
      e.preventDefault()
      upgrade(detected.type, detected.sourceUrl, detected.platform)
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
        onPointerDown={(e) => e.stopPropagation()}
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
