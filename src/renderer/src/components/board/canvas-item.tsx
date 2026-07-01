import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'
import { TextBlock } from '@/components/blocks/text-block'
import type { CanvasItemProps } from '@/components/board/canvas-item-types'
import { ItemCard } from '@/components/cards/item-card'
import { ContextMenu } from '@/components/ui/context-menu'
import { useCurrentDay } from '@/stores/current-day'

export type { CanvasItemProps } from '@/components/board/canvas-item-types'

export function CanvasItem({ item, onDelete, onUpdate, autoFocus }: CanvasItemProps): JSX.Element {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [flash, setFlash] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

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

  return (
    <>
      <div
        ref={elementRef}
        data-item-id={item.id}
        className={
          flash
            ? 'rounded-xl ring-2 ring-sky-400 ring-offset-2 ring-offset-white transition-shadow'
            : 'min-w-0'
        }
        onContextMenu={handleContextMenu}
      >
        {item.type === 'text' ? (
          <div className="rounded-xl border border-stone-100 bg-white p-4 shadow-sm">
            <TextBlock
              item={item}
              onSave={onUpdate ?? (() => undefined)}
              onEmpty={onDelete}
              autoFocus={autoFocus}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-stone-100 bg-white p-4 shadow-sm overflow-hidden">
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
