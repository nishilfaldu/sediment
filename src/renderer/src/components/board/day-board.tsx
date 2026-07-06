import type { JSX } from 'react'
import { BoardItem } from '@/components/board/board-item'
import { WorkspaceEmptyState } from '@/components/board/workspace-empty-state'
import { WorkspaceTabs } from '@/components/board/workspace-tabs'
import { useCreateItem, useDeleteItem, useUpdateItem } from '@/hooks/use-items'
import { useWorkspaceItems } from '@/hooks/use-workspace-items'
import { formatDayHeading } from '@/lib/dates'
import { secondaryButtonClass } from '@/lib/ui-classes'
import { useWorkspaceTab, type WorkspaceTab } from '@/stores/workspace-tab'

export interface DayBoardProps {
  dayId: string
}

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
      <div className="flex h-full items-center justify-center font-mono text-xs text-ghost">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-surface">
      <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-end gap-4 border-b border-ui bg-surface px-6 pb-4 pt-7">
        <h1 className="truncate font-display text-[19px] font-bold text-primary">
          {formatDayHeading(dayId)}
        </h1>
        <WorkspaceTabs active={tab} onChange={handleTabChange} />
        <div className="flex justify-end">
          {tab === 'notes' && visibleItems.length > 0 && (
            <button type="button" onClick={handleAddNote} className={secondaryButtonClass}>
              Add note
            </button>
          )}
        </div>
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
