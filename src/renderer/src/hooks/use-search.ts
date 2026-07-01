import { useQuery } from '@tanstack/react-query'

export function useSearch(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: ['search', trimmed],
    queryFn: () => window.api.search.query(trimmed),
    enabled: trimmed.length > 0,
    placeholderData: (prev) => prev
  })
}
