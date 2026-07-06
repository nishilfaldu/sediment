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
      className={`flex w-full items-baseline justify-between border-b border-dotted border-ui px-4 py-2.5 text-left transition-colors ${
        isActive ? 'bg-accent text-accent-fg' : 'text-secondary hover:bg-surface hover:text-primary'
      }`}
    >
      <span className={`text-[13px] ${isActive ? 'font-medium' : ''}`}>
        {formatDaySidebar(day.id)}
      </span>
      {day.itemCount > 0 && (
        <span
          className={`font-mono text-[10.5px] ${isActive ? 'text-accent-fg/70' : 'text-muted'}`}
        >
          {day.itemCount}
        </span>
      )}
    </button>
  )
}
