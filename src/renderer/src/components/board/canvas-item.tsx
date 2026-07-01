import type { JSX } from 'react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { CARD_WIDTH } from '@shared/constants'
import { TextBlock } from '@/components/blocks/text-block'
import { ItemCard } from '@/components/cards/item-card'
import { ContextMenu } from '@/components/ui/context-menu'
import { useCanvasDrag } from '@/hooks/use-canvas-drag'
import { useCurrentDay } from '@/stores/current-day'
import type { CanvasItemProps } from '@/components/board/canvas-item-types'

export type { CanvasItemProps } from '@/components/board/canvas-item-types'
export { CARD_WIDTH }

export function CanvasItem({
  item,
  onDelete,
  onUpdate,
  onUpgrade,
  onMove,
  onBringToFront,
  autoFocus
}: CanvasItemProps): JSX.Element {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [flash, setFlash] = useState(false)

  const { elementRef, isDragging, pointerHandlers } = useCanvasDrag({
    x: item.x,
    y: item.y,
    onMove,
    onBringToFront
  })

  const focusItemId = useCurrentDay((s) => s.focusItemId)
  const clearFocus = useCurrentDay((s) => s.clearFocus)

  useEffect(() => {
    if (focusItemId !== item.id) return
    elementRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setFlash(true)
    clearFocus()
  }, [focusItemId, item.id, clearFocus, elementRef])

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(false), 1600)
    return () => clearTimeout(t)
  }, [flash])

  useLayoutEffect(() => {
    if (elementRef.current) elementRef.current.style.transform = ''
  }, [item.x, item.y, elementRef])

  function handleContextMenu(e: React.MouseEvent): void {
    e.preventDefault()
    const MENU_W = 128
    const MENU_H = 44
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - MENU_W),
      y: Math.min(e.clientY, window.innerHeight - MENU_H)
    })
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    left: item.x,
    top: item.y,
    width: CARD_WIDTH,
    zIndex: isDragging ? 1_000_000 : item.position,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: isDragging ? 'none' : undefined
  }

  return (
    <>
      <div
        ref={elementRef}
        data-item-id={item.id}
        style={style}
        className={
          flash
            ? 'rounded-xl ring-2 ring-sky-400 ring-offset-2 ring-offset-white transition-shadow'
            : undefined
        }
        onPointerDown={pointerHandlers.onPointerDown}
        onPointerMove={pointerHandlers.onPointerMove}
        onPointerUp={pointerHandlers.onPointerUp}
        onPointerCancel={pointerHandlers.onPointerCancel}
        onClickCapture={pointerHandlers.onClickCapture}
        onContextMenu={handleContextMenu}
      >
        {item.type === 'text' ? (
          <TextBlock
            item={item}
            onSave={onUpdate}
            onUpgrade={onUpgrade}
            onEmpty={onDelete}
            autoFocus={autoFocus}
          />
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
