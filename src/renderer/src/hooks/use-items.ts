import type { CreateItemPayload } from '@shared/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Item } from '@/types'

export type { CreateItemPayload }

function invalidateDay(qc: ReturnType<typeof useQueryClient>, dayId: string): void {
  qc.invalidateQueries({ queryKey: ['items', dayId] })
  qc.invalidateQueries({ queryKey: ['days'] })
}

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
      invalidateDay(qc, item.dayId)
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
      invalidateDay(qc, dayId)
    }
  })
}
