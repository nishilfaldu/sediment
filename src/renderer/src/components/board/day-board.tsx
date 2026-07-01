import type { JSX } from 'react'
import { CanvasItem } from '@/components/board/canvas-item'
import { useBoardDrop } from '@/hooks/use-board-drop'
import { useCreateItem, useDeleteItem, useItems, useUpdateItem } from '@/hooks/use-items'
import { usePasteModal } from '@/stores/paste-modal'

export interface DayBoardProps {
  dayId: string
}

export function DayBoard({ dayId }: DayBoardProps): JSX.Element {
  const { data: items = [], isLoading } = useItems(dayId)
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()
  const deleteItem = useDeleteItem(dayId)
  const openPasteModal = usePasteModal((s) => s.openWith)
  const { isDraggingOver, dropHandlers } = useBoardDrop(dayId)

  function handleAddNote(): void {
    createItem.mutate({ dayId, type: 'text', content: '' })
  }

  function handleAddLink(): void {
    openPasteModal('', { dayId })
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-stone-300">Loading…</div>
    )
  }

  return (
    <div
      className={`flex h-full w-full flex-col overflow-auto bg-white ${
        isDraggingOver ? 'ring-2 ring-inset ring-sky-400/50 bg-sky-50/30' : ''
      }`}
      {...dropHandlers}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-stone-100 px-6 py-3">
        <button
          type="button"
          onClick={handleAddLink}
          className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700"
        >
          Add link
        </button>
        <button
          type="button"
          onClick={handleAddNote}
          className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
        >
          Add note
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm text-stone-400">Nothing saved yet for this day.</p>
          <p className="max-w-sm text-xs text-stone-300">
            Use Add link to paste a URL with preview, Add note for text, or ⌘⇧S to capture from
            your clipboard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 p-6">
          {items.map((item, index) => (
            <CanvasItem
              key={item.id}
              item={item}
              onDelete={() => deleteItem.mutate(item.id)}
              onUpdate={(content) => updateItem.mutate({ id: item.id, patch: { content } })}
              autoFocus={item.type === 'text' && item.content === '' && index === items.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
