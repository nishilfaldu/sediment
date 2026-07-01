import type { JSX } from 'react'
import { ChevronRightIcon } from '@/components/icons/chevron-right-icon'
import { ExportMenu } from '@/components/layout/export-menu'
import { useItems } from '@/hooks/use-items'
import { formatDayHeading, todayId } from '@/lib/dates'
import { useCurrentDay } from '@/stores/current-day'
import { useUI } from '@/stores/ui'

export function BottomBar(): JSX.Element {
  const { dayId, goToToday } = useCurrentDay()
  const { toggleHistory, historyOpen } = useUI()
  const { data: items = [] } = useItems(dayId)

  const isToday = dayId === todayId()
  const count = items.length

  return (
    <div className="flex h-8 shrink-0 items-center justify-between border-t border-stone-100 bg-white px-4 text-xs text-stone-400">
      <span>{count === 0 ? 'Nothing yet' : `${count} ${count === 1 ? 'item' : 'items'}`}</span>

      <button
        type="button"
        onClick={isToday ? undefined : goToToday}
        className={isToday ? 'cursor-default' : 'hover:text-stone-600 transition-colors'}
      >
        {formatDayHeading(dayId)}
        {!isToday && <span className="ml-1 text-stone-300">↩ today</span>}
      </button>

      <div className="flex items-center gap-3">
        {count > 0 && <ExportMenu dayId={dayId} />}
        <span className="hidden sm:inline">⌘⇧S to capture · Add link for URLs</span>
        {!historyOpen && (
          <button
            type="button"
            onClick={toggleHistory}
            className="flex items-center gap-1 hover:text-stone-600 transition-colors"
            aria-label="Open history"
          >
            History
            <ChevronRightIcon />
          </button>
        )}
      </div>
    </div>
  )
}
