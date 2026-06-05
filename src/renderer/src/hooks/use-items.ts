import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Item, ItemType, WidthHint } from '@/types'

export function useItems(dayId: string) {
  return useQuery({
    queryKey: ['items', dayId],
    queryFn: () => window.api.items.getByDay(dayId) as Promise<Item[]>
  })
}

export interface CreatePayload {
  dayId: string
  type: ItemType
  content?: string
  sourceUrl?: string
  platform?: string
  dataUrl?: string
  widthHint?: WidthHint
  x?: number
  y?: number
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreatePayload) => {
      // Ensure the day row exists before inserting the item (FK constraint)
      await window.api.days.getOrCreate(payload.dayId)
      return window.api.items.create(payload) as Promise<Item>
    },
    onSuccess: (item: Item) => {
      qc.invalidateQueries({ queryKey: ['items', item.dayId] })
      // Invalidate days list so sidebar reflects the new day if it's the first item
      qc.invalidateQueries({ queryKey: ['days'] })
    }
  })
}

export function useUpdateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Item> }) =>
      window.api.items.update(id, patch) as Promise<Item>,
    onSuccess: (item: Item) => {
      qc.invalidateQueries({ queryKey: ['items', item.dayId] })
    }
  })
}

export function useDeleteItem(dayId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => window.api.items.delete(id) as Promise<void>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items', dayId] })
    }
  })
}

export function useBringToFront() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dayId }: { id: string; dayId: string }) =>
      window.api.items.bringToFront(id, dayId) as Promise<Item>,
    // Optimistically bump position above the current max so the z-index updates
    // instantly on click — no wait for the IPC round-trip.
    onMutate: async ({ id, dayId }) => {
      await qc.cancelQueries({ queryKey: ['items', dayId] })
      const previous = qc.getQueryData<Item[]>(['items', dayId])
      const maxPosition = (previous ?? []).reduce((m, it) => Math.max(m, it.position), 0)
      qc.setQueryData<Item[]>(['items', dayId], (old = []) =>
        old.map((item) => (item.id === id ? { ...item, position: maxPosition + 1 } : item))
      )
      return { previous, dayId }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(['items', context.dayId], context.previous)
    }
    // No onSettled invalidate: this fires on every click of a non-top card, and
    // the optimistic position bump already matches what the server computes
    // (max + 1). Skipping the refetch avoids re-rendering every card on a click.
  })
}

export function useMoveItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, x, y }: { id: string; x: number; y: number; dayId: string }) =>
      window.api.items.move(id, x, y) as Promise<Item>,
    // Optimistically update the cache so the item renders at the new position
    // immediately — no snap-back while the IPC round-trip is in-flight.
    onMutate: async ({ id, x, y, dayId }) => {
      await qc.cancelQueries({ queryKey: ['items', dayId] })
      const previous = qc.getQueryData<Item[]>(['items', dayId])
      qc.setQueryData<Item[]>(['items', dayId], (old = []) =>
        old.map((item) => (item.id === id ? { ...item, x, y } : item))
      )
      return { previous, dayId }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(['items', context.dayId], context.previous)
      }
    },
    onSettled: (_data, _err, { dayId }) => {
      qc.invalidateQueries({ queryKey: ['items', dayId] })
    }
  })
}
