import { partitionWorkspaceItems } from '@shared/item-groups'
import { useMemo } from 'react'
import { useItems } from '@/hooks/use-items'

export function useWorkspaceItems(dayId: string) {
  const query = useItems(dayId)
  const partitioned = useMemo(() => partitionWorkspaceItems(query.data ?? []), [query.data])

  return { ...query, ...partitioned }
}
