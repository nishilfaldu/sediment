import type { JSX } from 'react'
import { BoardItem } from '@/components/board/board-item'
import { WorkspaceEmptyState } from '@/components/board/workspace-empty-state'
import { WorkspaceTabs } from '@/components/board/workspace-tabs'
import { useCreateItem, useDeleteItem, useUpdateItem } from '@/hooks/use-items'
import { useWorkspaceItems } from '@/hooks/use-workspace-items'
import { formatDayHeading } from '@/lib/dates'
import { useWorkspaceTab, type WorkspaceTab } from '@/stores/workspace-tab'

export interface DayBoardProps {
  dayId: string
}

const addNoteButtonClass =
  'border border-ui bg-card px-3 py-1.5 text-xs font-medium text-secondary transition-colors hover:border-primary hover:text-primary'

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
      <div className="relative shrink-0 border-b border-ui bg-surface">
        <h1 className="pointer-events-none absolute left-24 top-1/2 -translate-y-1/2 select-none font-display text-[19px] font-bold text-primary">
          {formatDayHeading(dayId)}
        </h1>
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
