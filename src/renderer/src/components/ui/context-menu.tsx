import type { JSX } from 'react'
import { useRef } from 'react'
import { useDismiss } from '@/hooks/use-dismiss'

export interface ContextMenuProps {
  x: number
  y: number
  onDelete: () => void
  onDismiss: () => void
}

export function ContextMenu({ x, y, onDelete, onDismiss }: ContextMenuProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  useDismiss(ref, onDismiss)

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[120px] border border-ui bg-card py-1 shadow-[3px_3px_0_rgba(38,42,34,0.1)]"
      style={{ left: x, top: y }}
    >
      <button
        type="button"
        className="w-full px-3 py-1.5 text-left text-sm text-iron hover:bg-panel"
        onClick={onDelete}
      >
        Delete
      </button>
    </div>
  )
}
