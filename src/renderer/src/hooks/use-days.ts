import { useQuery } from '@tanstack/react-query'

export function useDays() {
  return useQuery({
    queryKey: ['days'],
    queryFn: () => window.api.days.list()
  })
}
