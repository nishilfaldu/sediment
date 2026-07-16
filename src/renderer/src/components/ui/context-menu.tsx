import type { JSX } from 'react'
import { useRef } from 'react'
import { useDismiss } from '@/hooks/use-dismiss'

export type ContextMenuEntry =
  | { type: 'action'; id: string; label: string; onClick: () => void; danger?: boolean }
  | { type: 'separator'; id: string }

export interface ContextMenuProps {
  x: number
  y: number
  entries: ContextMenuEntry[]
  onDismiss: () => void
}

/** Positioned action menu — entries are supplied by the caller (board item, etc.). */
export function ContextMenu({ x, y, entries, onDismiss }: ContextMenuProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  useDismiss(ref, onDismiss)

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[168px] border border-ui bg-card py-1 shadow-popover"
      style={{ left: x, top: y }}
    >
      {entries.map((entry) => {
        if (entry.type === 'separator') {
          return <div key={entry.id} className="my-1 border-t border-ui" />
        }
        return (
          <button
            key={entry.id}
            type="button"
            className={`w-full px-3 py-1.5 text-left text-sm hover:bg-panel ${
              entry.danger ? 'text-iron' : 'text-secondary'
            }`}
            onClick={entry.onClick}
          >
            {entry.label}
          </button>
        )
      })}
    </div>
  )
}
