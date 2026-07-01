import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

// Listens for item:metadataUpdated events pushed from the main process after
// async OG fetches complete, then invalidates the affected day's item query
// so the card re-renders with the fetched title/description/thumbnail.
export function useMetadataSync(): void {
  const qc = useQueryClient()

  useEffect(() => {
    const unsub = window.api.on.itemMetadataUpdated(({ dayId }) => {
      qc.invalidateQueries({ queryKey: ['items', dayId] })
    })
    return unsub
  }, [qc])
}
