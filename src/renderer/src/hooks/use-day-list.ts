import type { DaySummary } from '@shared/day-summary'
import { useDays } from '@/hooks/use-days'
import { todayId } from '@/lib/dates'

export function useDayList(): {
  days: DaySummary[]
  isLoading: boolean
  status: ReturnType<typeof useDays>['status']
  loadMore: () => void
} {
  const { data: days = [], isLoading, status, loadMore } = useDays()
  const today = todayId()
  const todayInList = days.some((d) => d.id === today)
  return {
    days: todayInList ? days : [{ id: today, itemCount: 0 }, ...days],
    isLoading,
    status,
    loadMore
  }
}
