import type { DaySummary } from '@shared/day-summary'
import { useDays } from '@/hooks/use-days'
import { todayId } from '@/lib/dates'

export function useDayList(): DaySummary[] {
  const { data: days = [] } = useDays()
  const today = todayId()
  const todayInList = days.some((d) => d.id === today)
  if (todayInList) return days
  return [{ id: today, note: null, createdAt: 0, updatedAt: 0, itemCount: 0 }, ...days]
}
