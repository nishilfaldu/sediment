import type { JSX } from 'react'

export interface EmptyStateProps {
  onAdd: () => void
}

export function EmptyState({ onAdd }: EmptyStateProps): JSX.Element {
  return (
    <div
      className="flex h-full w-full cursor-text items-center justify-center text-center"
      onClick={onAdd}
    >
      <p className="text-sm text-stone-300">Click anywhere or press ⌘⇧S to add something</p>
    </div>
  )
}
