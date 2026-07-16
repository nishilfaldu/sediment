import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'

export function useSearch(query: string) {
  const trimmed = query.trim()
  const data = useQuery(api.search.queryItems, trimmed.length > 0 ? { query: trimmed } : 'skip')
  return {
    data: data ?? [],
    isLoading: trimmed.length > 0 && data === undefined
  }
}
