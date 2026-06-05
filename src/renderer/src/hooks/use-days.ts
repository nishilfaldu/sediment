import { useQuery } from '@tanstack/react-query'
import type { Day } from '@/types'

export function useDays() {
  return useQuery({
    queryKey: ['days'],
    queryFn: () => window.api.days.list() as Promise<Day[]>
  })
}
