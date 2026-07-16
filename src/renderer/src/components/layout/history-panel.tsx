import type { JSX } from 'react'
import { DayListItem } from '@/components/calendar/day-list-item'
import { useDayList } from '@/hooks/use-day-list'
import { useCurrentDay } from '@/stores/current-day'
import { useUI } from '@/stores/ui'

export function HistoryPanel(): JSX.Element {
  const { historyOpen, toggleHistory } = useUI()
  const { dayId, setDayId } = useCurrentDay()
  const allDays = useDayList()

  return (
    <aside
      className={`flex h-full flex-col border-l border-ui bg-panel transition-all duration-200 overflow-hidden ${
        historyOpen ? 'w-52 min-w-[13rem]' : 'w-0 min-w-0'
      }`}
    >
      <div className="flex min-w-[13rem] flex-col h-full">
        <div className="app-drag flex shrink-0 items-center justify-between border-b border-ui px-4 pt-4 pb-2.5">
          <span className="font-mono text-[10px] font-medium tracking-[0.22em] text-muted uppercase">
            History
          </span>
          <button
            type="button"
            onClick={toggleHistory}
            className="app-no-drag p-0.5 text-ghost hover:text-secondary transition-colors"
            aria-label="Collapse history"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M5 2.5l3.5 4L5 10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Days read as strata: newest at the surface, dotted bed boundaries. */}
        <div className="flex flex-col overflow-y-auto pb-4">
          {allDays.map((day) => (
            <DayListItem
              key={day.id}
              day={day}
              isActive={day.id === dayId}
              onClick={() => setDayId(day.id)}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}
