import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { SearchResult } from '@/types'

// Full-text search across all days. Caller is responsible for debouncing the
// query string so we don't fire an IPC round-trip on every keystroke.
// keepPreviousData avoids a results flash to empty while the next query runs.
export function useSearch(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: ['search', trimmed],
    queryFn: () => window.api.search.query(trimmed) as Promise<SearchResult[]>,
    enabled: trimmed.length > 0,
    placeholderData: keepPreviousData
  })
}
