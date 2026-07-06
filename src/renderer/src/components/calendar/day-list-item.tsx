import type { DaySummary } from '@shared/day-summary'
import type { JSX } from 'react'
import { formatDaySidebar } from '@/lib/dates'

export interface DayListItemProps {
  day: DaySummary
  isActive: boolean
  onClick: () => void
}

export function DayListItem({ day, isActive, onClick }: DayListItemProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
        isActive
          ? 'bg-stone-100 font-medium text-stone-900'
          : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
      }`}
    >
      <span>{formatDaySidebar(day.id)}</span>
      {day.itemCount > 0 && <span className="text-xs text-stone-400">{day.itemCount}</span>}
    </button>
  )
}
