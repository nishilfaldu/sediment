import type { CreateItemPayload } from '@shared/contracts'
import { useMutation, useQuery } from 'convex/react'
import type { Id } from '@convex/_generated/dataModel'
import { api } from '@convex/_generated/api'

export type { CreateItemPayload }

function asItemId(id: string): Id<'items'> {
  return id as Id<'items'>
}

export function useItems(dayId: string) {
  const data = useQuery(api.items.getByDay, { dayId })
  return {
    data: data ?? [],
    isLoading: data === undefined
  }
}

/** Load items by id; Convex `Id` casting stays inside this hook. */
export function useItemsByIds(ids: string[] | undefined) {
  return useQuery(
    api.items.getByIds,
    ids && ids.length > 0 ? { ids: ids.map(asItemId) } : 'skip'
  )
}

export function useCreateItem() {
  return useMutation(api.items.create)
}

export function useUpdateItem() {
  const update = useMutation(api.items.update)
  return (args: { id: string; patch: Partial<CreateItemPayload> }) =>
    update({ id: asItemId(args.id), patch: args.patch })
}

export function useDeleteItem() {
  const remove = useMutation(api.items.remove)
  return (id: string) => remove({ id: asItemId(id) })
}
