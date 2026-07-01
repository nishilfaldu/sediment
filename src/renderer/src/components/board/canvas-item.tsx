import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'
import { TextBlock } from '@/components/blocks/text-block'
import type { CanvasItemProps } from '@/components/board/canvas-item-types'
import { ItemCard } from '@/components/cards/item-card'
import { CloseIcon } from '@/components/icons/close-icon'
import { ContextMenu } from '@/components/ui/context-menu'
import { useCurrentDay } from '@/stores/current-day'
import { useRecentItems } from '@/stores/recent-items'

export type { CanvasItemProps } from '@/components/board/canvas-item-types'

export function CanvasItem({ item, onDelete, onUpdate, autoFocus }: CanvasItemProps): JSX.Element {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [flash, setFlash] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const isRecent = useRecentItems((s) => s.isRecent(item.id))

  const focusItemId = useCurrentDay((s) => s.focusItemId)
  const clearFocus = useCurrentDay((s) => s.clearFocus)

  useEffect(() => {
    if (focusItemId !== item.id) return
    elementRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setFlash(true)
    clearFocus()
  }, [focusItemId, item.id, clearFocus])

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(false), 1600)
    return () => clearTimeout(t)
  }, [flash])

  function handleContextMenu(e: React.MouseEvent): void {
    e.preventDefault()
    const MENU_W = 128
    const MENU_H = 44
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - MENU_W),
      y: Math.min(e.clientY, window.innerHeight - MENU_H)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return
    if ((e.target as HTMLElement).closest('textarea,input,[contenteditable]')) return
    e.preventDefault()
    onDelete()
  }

  const shellClass = [
    'group relative outline-none',
    flash ? 'rounded-xl ring-2 ring-sky-400 ring-offset-2 ring-offset-stone-50 dark:ring-offset-stone-950' : 'min-w-0',
    isRecent ? 'animate-item-enter' : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <div
        ref={elementRef}
        data-item-id={item.id}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: focusable for keyboard delete
        tabIndex={0}
        className={shellClass}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
      >
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete"
          className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-stone-400 opacity-0 shadow-sm ring-1 ring-stone-200 transition-opacity hover:text-stone-700 group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-stone-800/90 dark:ring-stone-700 dark:hover:text-stone-200"
        >
          <CloseIcon />
        </button>

        {item.type === 'text' ? (
          <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-900">
            <TextBlock
              item={item}
              onSave={onUpdate ?? (() => undefined)}
              onEmpty={onDelete}
              autoFocus={autoFocus}
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-stone-700 dark:bg-stone-900">
            <ItemCard item={item} />
          </div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onDelete={() => {
            setContextMenu(null)
            onDelete()
          }}
          onDismiss={() => setContextMenu(null)}
        />
      )}
    </>
  )
}
