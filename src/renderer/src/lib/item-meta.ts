import type { Item } from '@/types'

export function isMetadataLoading(item: Item): boolean {
  if (!item.sourceUrl) return false
  return (
    (item.type === 'link' || item.type === 'video' || item.type === 'social') && !item.title
  )
}
