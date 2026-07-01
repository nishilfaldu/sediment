import { eq } from 'drizzle-orm'
import type { MetadataPatch } from '@shared/contracts'
import type { ItemType } from '@shared/types'
import { getDb } from '../db'
import { items } from '../db/schema'

export function needsOgFetch(
  item: { sourceUrl: string | null; type: ItemType; title?: string | null },
  options?: { requireNoTitle?: boolean }
): boolean {
  if (!item.sourceUrl) return false
  if (options?.requireNoTitle && item.title) return false
  return item.type === 'link' || item.type === 'video' || item.type === 'social'
}

export function patchItemMetadata(id: string, meta: MetadataPatch): void {
  getDb()
    .update(items)
    .set({ ...meta, updatedAt: Date.now() })
    .where(eq(items.id, id))
    .run()
}
