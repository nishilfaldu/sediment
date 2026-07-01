import type { JSX } from 'react'
import { BoardItem } from '@/components/board/board-item'
import { WorkspaceEmptyState } from '@/components/board/workspace-empty-state'
import { WorkspaceTabs } from '@/components/board/workspace-tabs'
import { useCreateItem, useDeleteItem, useUpdateItem } from '@/hooks/use-items'
import { useWorkspaceItems } from '@/hooks/use-workspace-items'
import { useWorkspaceTab, type WorkspaceTab } from '@/stores/workspace-tab'

export interface DayBoardProps {
  dayId: string
}

const addNoteButtonClass =
  'rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800'

export function DayBoard({ dayId }: DayBoardProps): JSX.Element {
  const { links, notes, isLoading } = useWorkspaceItems(dayId)
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()
  const deleteItem = useDeleteItem(dayId)
  const tab = useWorkspaceTab((s) => s.getTab(dayId))
  const setTab = useWorkspaceTab((s) => s.setTab)

  const visibleItems = tab === 'links' ? links : notes

  function handleTabChange(next: WorkspaceTab): void {
    setTab(dayId, next)
  }

  function handleAddNote(): void {
    setTab(dayId, 'notes')
    createItem.mutate({ dayId, type: 'text', content: '' })
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-stone-300 dark:text-stone-600">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-stone-50/60 dark:bg-stone-950">
      <div className="relative shrink-0 border-b border-stone-100 bg-white dark:border-stone-800 dark:bg-stone-900">
        <WorkspaceTabs active={tab} onChange={handleTabChange} />
        {tab === 'notes' && visibleItems.length > 0 && (
          <button
            type="button"
            onClick={handleAddNote}
            className={`absolute right-6 top-1/2 -translate-y-1/2 ${addNoteButtonClass}`}
          >
            Add note
          </button>
        )}
      </div>

      {visibleItems.length === 0 ? (
        <WorkspaceEmptyState tab={tab} onAddNote={handleAddNote} />
      ) : tab === 'links' ? (
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 p-6">
          {visibleItems.map((item) => (
            <BoardItem key={item.id} item={item} onDelete={() => deleteItem.mutate(item.id)} />
          ))}
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-6">
          {visibleItems.map((item, index) => (
            <BoardItem
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
