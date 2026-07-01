import type { JSX } from 'react'
import type { WorkspaceTab } from '@shared/item-groups'

export interface WorkspaceEmptyStateProps {
  tab: WorkspaceTab
  onAddNote: () => void
}

export function WorkspaceEmptyState({ tab, onAddNote }: WorkspaceEmptyStateProps): JSX.Element {
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
