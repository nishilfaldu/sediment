import type { JSX } from 'react'
import { DayListItem } from '@/components/calendar/day-list-item'
import { useDays } from '@/hooks/use-days'
import { todayId } from '@/lib/dates'
import { useCurrentDay } from '@/stores/current-day'
import { useUI } from '@/stores/ui'

export function Sidebar(): JSX.Element {
  const { sidebarOpen } = useUI()
  const { dayId, setDayId } = useCurrentDay()
  const { data: days = [] } = useDays()

  const today = todayId()
  // Ensure today always appears at the top even if it has no items yet
  const todayInList = days.some((d) => d.id === today)
  const allDays = todayInList
    ? days
    : [{ id: today, note: null, createdAt: 0, updatedAt: 0 }, ...days]

  return (
    // Animate width on collapse; overflow-hidden clips content during transition
    <aside
      className={`flex h-full flex-col border-r border-stone-200 bg-stone-50 transition-all duration-200 overflow-hidden ${
        sidebarOpen ? 'w-52 min-w-[13rem]' : 'w-0 min-w-0'
      }`}
    >
      <div className="flex min-w-[13rem] flex-col gap-1 overflow-y-auto p-3 pt-10">
        {allDays.map((day) => (
          <DayListItem
            key={day.id}
            day={day}
            isActive={day.id === dayId}
            onClick={() => setDayId(day.id)}
          />
        ))}
      </div>
    </aside>
  )
}
