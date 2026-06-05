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
      className="fixed z-50 min-w-[120px] rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
      style={{ left: x, top: y }}
    >
      <button
        type="button"
        className="w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-stone-50"
        onClick={onDelete}
      >
        Delete
      </button>
    </div>
  )
}
