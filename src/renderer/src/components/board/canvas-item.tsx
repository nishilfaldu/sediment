import type { JSX } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { TextBlock } from '@/components/blocks/text-block'
import { ImageCard } from '@/components/cards/image-card'
import { LinkCard } from '@/components/cards/link-card'
import { SocialCard } from '@/components/cards/social-card'
import { VideoCard } from '@/components/cards/video-card'
import { ContextMenu } from '@/components/ui/context-menu'
import { useCurrentDay } from '@/stores/current-day'
import { useDrag } from '@/stores/drag'
import type { Item, ItemType, Platform } from '@/types'

export interface CanvasItemProps {
  item: Item
  onDelete: () => void
  onUpdate: (content: string) => void
  onUpgrade: (type: ItemType, sourceUrl: string, platform?: Platform) => void
  onMove: (x: number, y: number) => void
  onBringToFront: () => void
  autoFocus: boolean
}

const DRAG_THRESHOLD = 8
export const CARD_WIDTH = 300

export function CanvasItem({
  item,
  onDelete,
  onUpdate,
  onUpgrade,
  onMove,
  onBringToFront,
  autoFocus
}: CanvasItemProps): JSX.Element {
  const [isDragging, setIsDragging] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [flash, setFlash] = useState(false)

  // Drag state in a ref — mutations here don't trigger re-renders during the move
  const drag = useRef<{
    startPointer: { x: number; y: number }
    startItem: { x: number; y: number }
    captured: boolean
  } | null>(null)

  // Direct reference to the DOM node so we can apply the drag transform without
  // going through React's render cycle on every pointermove.
  const elementRef = useRef<HTMLDivElement>(null)

  // Set when a drag actually moved the card, so the trailing click is ignored.
  const justDragged = useRef(false)

  // When this item is the search-navigation target, scroll it into view and
  // flash it, then release the focus so it doesn't re-fire.
  const focusItemId = useCurrentDay((s) => s.focusItemId)
  const clearFocus = useCurrentDay((s) => s.clearFocus)

  useEffect(() => {
    if (focusItemId !== item.id) return
    elementRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setFlash(true)
    clearFocus()
  }, [focusItemId, item.id, clearFocus])

  // Auto-clear the flash. Kept separate from the trigger effect so clearFocus
  // re-running the effect above doesn't cancel the pending timeout.
  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(false), 1600)
    return () => clearTimeout(t)
  }, [flash])

  // Clear the imperative drag transform only once the committed x/y have
  // repainted at the new position. Doing it here (after the left/top change, in
  // the same commit, before paint) avoids the one-frame flash to the origin
  // that happens if the transform is cleared in onPointerUp before state lands.
  useLayoutEffect(() => {
    if (elementRef.current) elementRef.current.style.transform = ''
  }, [item.x, item.y])

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>): void {
    // Only text-entry targets are exempt from drag (so selection/editing works).
    // Buttons/links/images stay draggable — a click still fires when the pointer
    // doesn't move past the threshold; a real drag is swallowed in onClickCapture.
    if ((e.target as HTMLElement).closest('input,textarea,[contenteditable]')) return
    justDragged.current = false
    // Raise on interaction so a click/drag surfaces a covered item (no-op upstream
    // if it's already on top).
    onBringToFront()
    drag.current = {
      startPointer: { x: e.clientX, y: e.clientY },
      startItem: { x: item.x, y: item.y },
      captured: false
    }
  }

  // After a real drag, the browser still fires a click on release. Swallow it so
  // dragging a card by its "Open" button / image doesn't also trigger the action.
  function onClickCapture(e: React.MouseEvent): void {
    if (justDragged.current) {
      justDragged.current = false
      e.preventDefault()
      e.stopPropagation()
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>): void {
    if (!drag.current) return
    const dx = e.clientX - drag.current.startPointer.x
    const dy = e.clientY - drag.current.startPointer.y
    if (!drag.current.captured) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      e.currentTarget.setPointerCapture(e.pointerId)
      drag.current.captured = true
      setIsDragging(true)
      // Pause metadata-driven query invalidations until the drag ends.
      useDrag.getState().setDragging(true)
    }
    // Mutate the DOM directly — no setState, no re-render during drag
    if (elementRef.current) {
      elementRef.current.style.transform = `translate(${dx}px, ${dy}px)`
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>): void {
    if (drag.current?.captured) {
      const dx = e.clientX - drag.current.startPointer.x
      const dy = e.clientY - drag.current.startPointer.y
      const newX = Math.max(0, drag.current.startItem.x + dx)
      const newY = Math.max(0, drag.current.startItem.y + dy)
      // Mark so the trailing click is suppressed in onClickCapture.
      justDragged.current = true
      if (newX === item.x && newY === item.y) {
        // No coordinate change is coming (e.g. clamped back to the same spot at a
        // canvas edge), so the [item.x,item.y] layout effect won't fire — clear
        // the leftover transform here instead of leaving the card offset.
        if (elementRef.current) elementRef.current.style.transform = ''
      } else {
        // Leave the transform in place; the layout effect clears it once the new
        // x/y commit, so there's no flash back to the origin.
        onMove(newX, newY)
      }
    }
    drag.current = null
    setIsDragging(false)
    useDrag.getState().setDragging(false)
  }

  function onPointerCancel(): void {
    if (elementRef.current) elementRef.current.style.transform = ''
    drag.current = null
    setIsDragging(false)
    useDrag.getState().setDragging(false)
  }

  function handleContextMenu(e: React.MouseEvent): void {
    e.preventDefault()
    // Clamp so the menu never renders outside the window
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
    // position doubles as stacking order; a dragged item floats above all.
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
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClickCapture={onClickCapture}
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
            {item.type === 'link' && <LinkCard item={item} />}
            {item.type === 'video' && <VideoCard item={item} />}
            {item.type === 'social' && <SocialCard item={item} />}
            {item.type === 'image' && <ImageCard item={item} />}
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
