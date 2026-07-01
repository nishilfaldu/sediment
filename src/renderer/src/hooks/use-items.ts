import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateItemPayload } from '@shared/contracts'
import type { Item } from '@/types'

export type { CreateItemPayload }

export function useItems(dayId: string) {
  return useQuery({
    queryKey: ['items', dayId],
    queryFn: () => window.api.items.getByDay(dayId)
  })
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateItemPayload) => window.api.items.create(payload),
    onSuccess: (item: Item) => {
      qc.invalidateQueries({ queryKey: ['items', item.dayId] })
      qc.invalidateQueries({ queryKey: ['days'] })
    }
  })
}

export function useUpdateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CreateItemPayload> }) =>
      window.api.items.update(id, patch),
    onSuccess: (item: Item) => {
      qc.invalidateQueries({ queryKey: ['items', item.dayId] })
    }
  })
}

export function useDeleteItem(dayId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => window.api.items.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items', dayId] })
    }
  })
}

export function useBringToFront() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dayId }: { id: string; dayId: string }) =>
      window.api.items.bringToFront(id, dayId),
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
  })
}

export function useMoveItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, x, y }: { id: string; x: number; y: number; dayId: string }) =>
      window.api.items.move(id, x, y),
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
    }
  })
}
