import type { OgMetadataPatch } from '@shared/contracts'
import { isAwaitingOgMetadata } from '@shared/item-metadata'
import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { items } from '../db/schema'

export { isAwaitingOgMetadata, needsOgFetch } from '@shared/item-metadata'

export function fetchOgIfAwaiting(
  item: Parameters<typeof isAwaitingOgMetadata>[0],
  fetch: (id: string, dayId: string, sourceUrl: string) => void,
  ids: { id: string; dayId: string }
): void {
  if (!isAwaitingOgMetadata(item)) return
  fetch(ids.id, ids.dayId, item.sourceUrl)
}

export function patchItemMetadata(id: string, meta: OgMetadataPatch): void {
  getDb()
    .update(items)
    .set({ ...meta, updatedAt: Date.now() })
    .where(eq(items.id, id))
    .run()
}
