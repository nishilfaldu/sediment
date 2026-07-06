import type { WorkspaceTab } from '@shared/item-groups'
import type { JSX } from 'react'
import { secondaryButtonClass } from '@/lib/ui-classes'

export interface WorkspaceEmptyStateProps {
  tab: WorkspaceTab
  onAddNote: () => void
}

export function WorkspaceEmptyState({ tab, onAddNote }: WorkspaceEmptyStateProps): JSX.Element {
  if (tab === 'links') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center border border-ui bg-card text-muted">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-.5.5M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l.5-.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="space-y-1.5">
          <p className="font-display text-[15px] font-bold text-primary">Nothing deposited yet</p>
          <p className="max-w-xs font-mono text-[11px] leading-relaxed text-muted">
            Copy a URL from anywhere — it settles here automatically.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center border border-ui bg-card text-muted">
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
        <div className="space-y-1.5">
          <p className="font-display text-[15px] font-bold text-primary">No notes yet</p>
          <p className="max-w-xs font-mono text-[11px] leading-relaxed text-muted">
            Thoughts for this day live here, separate from your links.
          </p>
        </div>
        <button type="button" onClick={onAddNote} className={secondaryButtonClass}>
          Add note
        </button>
      </div>
    </div>
  )
}
