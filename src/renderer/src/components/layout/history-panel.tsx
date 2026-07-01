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
      className={`flex h-full flex-col border-l border-stone-100 bg-white transition-all duration-200 overflow-hidden ${
        historyOpen ? 'w-48 min-w-[12rem]' : 'w-0 min-w-0'
      }`}
    >
      <div className="flex min-w-[12rem] flex-col h-full">
        <div className="flex shrink-0 items-center justify-between px-4 pt-5 pb-3">
          <span className="text-[11px] font-semibold tracking-widest text-stone-300 uppercase">
            History
          </span>
          <button
            type="button"
            onClick={toggleHistory}
            className="rounded p-0.5 text-stone-300 hover:text-stone-500 transition-colors"
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

        <div className="flex flex-col gap-0.5 overflow-y-auto px-2 pb-4">
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
