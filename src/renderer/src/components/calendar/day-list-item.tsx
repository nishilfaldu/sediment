import type { JSX } from 'react'
import { formatDaySidebar } from '@/lib/dates'
import type { Day } from '@/types'

export interface DayListItemProps {
  day: Day
  isActive: boolean
  onClick: () => void
}

export function DayListItem({ day, isActive, onClick }: DayListItemProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
        isActive
          ? 'bg-stone-100 font-medium text-stone-900'
          : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
      }`}
    >
      {formatDaySidebar(day.id)}
    </button>
  )
}
