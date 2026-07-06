import type { ItemType } from './types'

export interface OgMetadataItem {
  sourceUrl: string | null
  type: ItemType
  title?: string | null
}

export function isOgFetchableType(type: ItemType): boolean {
  return type === 'link'
}

/** True when the item was saved but OG title/thumbnail has not arrived yet. */
export function isAwaitingOgMetadata(
  item: OgMetadataItem
): item is OgMetadataItem & { sourceUrl: string } {
  if (!item.sourceUrl) return false
  if (item.title) return false
  return isOgFetchableType(item.type)
}

export function needsOgFetch(
  item: OgMetadataItem,
  options?: { requireNoTitle?: boolean }
): boolean {
  if (!item.sourceUrl) return false
  if (options?.requireNoTitle && item.title) return false
  return isOgFetchableType(item.type)
}
