import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useDrag } from '@/stores/drag'

// Listens for item:metadataUpdated events pushed from the main process after
// async OG fetches complete, then invalidates the affected day's item query
// so the card re-renders with the fetched title/description/thumbnail.
//
// OG fetches for a freshly-added link often land while the user is still
// dragging that card. Re-rendering mid-drag causes flicker, so invalidations
// that arrive during a drag are queued and flushed once the drag ends.
export function useMetadataSync(): void {
  const qc = useQueryClient()

  useEffect(() => {
    const pending = new Set<string>()

    function flush(): void {
      for (const dayId of pending) qc.invalidateQueries({ queryKey: ['items', dayId] })
      pending.clear()
    }

    const unsubEvent = window.api.on.itemMetadataUpdated(({ dayId }) => {
      if (useDrag.getState().dragging) pending.add(dayId)
      else qc.invalidateQueries({ queryKey: ['items', dayId] })
    })

    const unsubDrag = useDrag.subscribe((state, prev) => {
      if (prev.dragging && !state.dragging) flush()
    })

    return () => {
      unsubEvent()
      unsubDrag()
    }
  }, [qc])
}
