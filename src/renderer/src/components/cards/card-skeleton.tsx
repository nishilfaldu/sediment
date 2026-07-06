import type { JSX } from 'react'

export function CardSkeleton(): JSX.Element {
  return (
    <div className="flex flex-col overflow-hidden">
      <div className="h-40 animate-pulse bg-panel" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse bg-panel" />
        <div className="h-3 w-full animate-pulse bg-panel" />
        <div className="h-3 w-2/3 animate-pulse bg-panel" />
      </div>
    </div>
  )
}
