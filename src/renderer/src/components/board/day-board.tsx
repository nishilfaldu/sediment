import type { JSX } from 'react'
import { CanvasItem } from '@/components/board/canvas-item'
import { useBoardDrop } from '@/hooks/use-board-drop'
import {
  useBringToFront,
  useCreateItem,
  useDeleteItem,
  useItems,
  useMoveItem,
  useUpdateItem
} from '@/hooks/use-items'
import { findFreeSpot, measureCardRects } from '@/lib/layout'
import type { ItemType, Platform } from '@/types'

export interface DayBoardProps {
  dayId: string
}

export function DayBoard({ dayId }: DayBoardProps): JSX.Element {
  const { data: items = [], isLoading } = useItems(dayId)
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()
  const deleteItem = useDeleteItem(dayId)
  const moveItem = useMoveItem()
  const bringToFront = useBringToFront()
  const { isDraggingOver, dropHandlers } = useBoardDrop(dayId)

  // Highest current stacking order — used to skip a redundant bring-to-front.
  const maxPosition = items.reduce((m, it) => Math.max(m, it.position), 0)

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>): void {
    // Only fire on clicks that land directly on the canvas background
    if (e.target !== e.currentTarget) return
    const rect = e.currentTarget.getBoundingClientRect()
    // Nudge to a free spot (measuring real card heights) so a new note never
    // spawns under an existing item.
    const spot = findFreeSpot(
      measureCardRects(e.currentTarget),
      Math.round(e.clientX - rect.left),
      Math.round(e.clientY - rect.top)
    )
    createItem.mutate({ dayId, type: 'text', content: '', x: spot.x, y: spot.y })
  }

  function handleUpgrade(id: string, type: ItemType, sourceUrl: string, platform?: Platform): void {
    updateItem.mutate({ id, patch: { type, sourceUrl, content: null, platform: platform ?? null } })
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-stone-300">Loading…</div>
    )
  }

  return (
    // Scroll container — fills the main area. The inset ring is the drop-target
    // cue: it tracks the viewport, not the 4000×3000 surface, so it stays visible.
    <div
      className={`h-full w-full overflow-auto bg-white ${
        isDraggingOver ? 'ring-2 ring-inset ring-sky-400/50 bg-sky-50/30' : ''
      }`}
    >
      {/*
       * Canvas surface — large fixed size so items can be placed anywhere.
       * Absolutely positioned children don't contribute to scroll height on
       * their own, so a minimum explicit size is required.
       */}
      <div
        className="relative"
        style={{ width: 4000, height: 3000 }}
        onClick={handleCanvasClick}
        {...dropHandlers}
      >
        {items.map((item, index) => (
          <CanvasItem
            key={item.id}
            item={item}
            onDelete={() => deleteItem.mutate(item.id)}
            onUpdate={(content) => updateItem.mutate({ id: item.id, patch: { content } })}
            onUpgrade={(type, sourceUrl, platform) =>
              handleUpgrade(item.id, type, sourceUrl, platform)
            }
            onMove={(x, y) => moveItem.mutate({ id: item.id, x, y, dayId })}
            onBringToFront={() => {
              if (item.position < maxPosition) bringToFront.mutate({ id: item.id, dayId })
            }}
            autoFocus={item.type === 'text' && item.content === '' && index === items.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
