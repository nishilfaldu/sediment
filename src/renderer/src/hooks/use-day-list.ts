import { useDays } from '@/hooks/use-days'
import { todayId } from '@/lib/dates'
import type { Day } from '@/types'

export function useDayList(): Day[] {
  const { data: days = [] } = useDays()
  const today = todayId()
  const todayInList = days.some((d) => d.id === today)
  return todayInList ? days : [{ id: today, note: null, createdAt: 0, updatedAt: 0 }, ...days]
}
