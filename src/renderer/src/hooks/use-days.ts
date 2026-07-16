import { usePaginatedQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useCallback } from 'react'

const PAGE_SIZE = 100

export function useDays() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.days.list,
    {},
    { initialNumItems: PAGE_SIZE }
  )

  const loadMorePage = useCallback(() => {
    loadMore(PAGE_SIZE)
  }, [loadMore])

  return {
    data: results,
    isLoading: status === 'LoadingFirstPage',
    status,
    loadMore: loadMorePage
  }
}
