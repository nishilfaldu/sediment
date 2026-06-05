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
      className={`w-full rounded px-3 py-1.5 text-left text-sm transition-colors ${
        isActive ? 'font-medium text-stone-900' : 'text-stone-400 hover:text-stone-700'
      }`}
    >
      {formatDaySidebar(day.id)}
    </button>
  )
}
