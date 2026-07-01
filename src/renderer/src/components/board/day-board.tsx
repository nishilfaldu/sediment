import type { JSX } from 'react'
import { useMemo } from 'react'
import { isLinkArtifact, isNote } from '@shared/item-groups'
import { CanvasItem } from '@/components/board/canvas-item'
import { useBoardDrop } from '@/hooks/use-board-drop'
import { useCreateItem, useDeleteItem, useItems, useUpdateItem } from '@/hooks/use-items'
import { usePasteModal } from '@/stores/paste-modal'
import { useWorkspaceTab, type WorkspaceTab } from '@/stores/workspace-tab'

export interface DayBoardProps {
  dayId: string
}

function tabClass(active: boolean): string {
  return active
    ? 'border-stone-800 text-stone-800'
    : 'border-transparent text-stone-400 hover:text-stone-600'
}

export function DayBoard({ dayId }: DayBoardProps): JSX.Element {
  const { data: items = [], isLoading } = useItems(dayId)
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()
  const deleteItem = useDeleteItem(dayId)
  const openPasteModal = usePasteModal((s) => s.openWith)
  const tab = useWorkspaceTab((s) => s.getTab(dayId))
  const setTab = useWorkspaceTab((s) => s.setTab)
  const { isDraggingOver, dropHandlers } = useBoardDrop(dayId)

  const linkItems = useMemo(() => items.filter((item) => isLinkArtifact(item.type)), [items])
  const noteItems = useMemo(() => items.filter((item) => isNote(item.type)), [items])
  const visibleItems = tab === 'links' ? linkItems : noteItems

  function handleTabChange(next: WorkspaceTab): void {
    setTab(dayId, next)
  }

  function handleAddNote(): void {
    setTab(dayId, 'notes')
    createItem.mutate({ dayId, type: 'text', content: '' })
  }

  function handleAddLink(): void {
    setTab(dayId, 'links')
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
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-stone-100 px-6 py-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => handleTabChange('links')}
            className={`border-b-2 pb-1 text-sm font-medium transition-colors ${tabClass(tab === 'links')}`}
          >
            Links
            {linkItems.length > 0 && (
              <span className="ml-1.5 text-xs text-stone-400">{linkItems.length}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('notes')}
            className={`border-b-2 pb-1 text-sm font-medium transition-colors ${tabClass(tab === 'notes')}`}
          >
            Notes
            {noteItems.length > 0 && (
              <span className="ml-1.5 text-xs text-stone-400">{noteItems.length}</span>
            )}
          </button>
        </div>

        {tab === 'links' ? (
          <button
            type="button"
            onClick={handleAddLink}
            className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-700"
          >
            Add link
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAddNote}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
          >
            Add note
          </button>
        )}
      </div>

      {visibleItems.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm text-stone-400">
            {tab === 'links' ? 'No links saved yet.' : 'No notes yet.'}
          </p>
          <p className="max-w-sm text-xs text-stone-300">
            {tab === 'links'
              ? 'Copy a link anywhere — it saves here automatically. Use Add link to preview before saving.'
              : 'Capture thoughts for this day — notes stay separate from your saved links.'}
          </p>
        </div>
      ) : tab === 'links' ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 p-6">
          {visibleItems.map((item) => (
            <CanvasItem
              key={item.id}
              item={item}
              onDelete={() => deleteItem.mutate(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
          {visibleItems.map((item, index) => (
            <CanvasItem
              key={item.id}
              item={item}
              onDelete={() => deleteItem.mutate(item.id)}
              onUpdate={(content) => updateItem.mutate({ id: item.id, patch: { content } })}
              autoFocus={item.content === '' && index === visibleItems.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
