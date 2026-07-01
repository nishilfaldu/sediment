import type { JSX } from 'react'
import { isLinkArtifact, isNote } from '@shared/item-groups'
import { useMemo } from 'react'
import { CanvasItem } from '@/components/board/canvas-item'
import { WorkspaceTabs } from '@/components/board/workspace-tabs'
import { useCreateItem, useDeleteItem, useItems, useUpdateItem } from '@/hooks/use-items'
import { useWorkspaceTab, type WorkspaceTab } from '@/stores/workspace-tab'

export interface DayBoardProps {
  dayId: string
}

function EmptyState({
  tab,
  onAddNote
}: {
  tab: WorkspaceTab
  onAddNote: () => void
}): JSX.Element {
  if (tab === 'links') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-.5.5M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l.5-.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-stone-600 dark:text-stone-300">No links yet</p>
          <p className="max-w-xs text-xs leading-relaxed text-stone-400 dark:text-stone-500">
            Copy a URL from anywhere — it appears here automatically.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M7 8h10M7 12h10M7 16h6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-stone-600 dark:text-stone-300">No notes yet</p>
          <p className="max-w-xs text-xs leading-relaxed text-stone-400 dark:text-stone-500">
            Thoughts for this day live here, separate from your links.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddNote}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          Add note
        </button>
      </div>
    </div>
  )
}

export function DayBoard({ dayId }: DayBoardProps): JSX.Element {
  const { data: items = [], isLoading } = useItems(dayId)
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()
  const deleteItem = useDeleteItem(dayId)
  const tab = useWorkspaceTab((s) => s.getTab(dayId))
  const setTab = useWorkspaceTab((s) => s.setTab)

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
            className="absolute right-6 top-1/2 -translate-y-1/2 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 shadow-sm hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Add note
          </button>
        )}
      </div>

      {visibleItems.length === 0 ? (
        <EmptyState tab={tab} onAddNote={handleAddNote} />
      ) : tab === 'links' ? (
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 p-6">
          {visibleItems.map((item) => (
            <CanvasItem key={item.id} item={item} onDelete={() => deleteItem.mutate(item.id)} />
          ))}
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-6">
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
