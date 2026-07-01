import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { getDb } from '../db'
import { ensureDay } from '../db/ensure-day'
import { type Item, items, type NewItem } from '../db/schema'
import { fetchOgIfAwaiting } from './item-metadata'
import { saveImageDataUrl } from './image-store'
import { fetchOgMetadata } from './og-fetcher'

export type CreateItemInput = Omit<NewItem, 'id' | 'createdAt' | 'updatedAt'>

export function hasSourceUrlOnDay(dayId: string, sourceUrl: string): boolean {
  const db = getDb()
  const existing = db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.dayId, dayId), eq(items.sourceUrl, sourceUrl)))
    .get()
  return Boolean(existing)
}

export function createItemRecord(payload: CreateItemInput): Item {
  ensureDay(payload.dayId)

  const db = getDb()
  const now = Date.now()
  const id = nanoid()

  let content = payload.content ?? null
  let imagePath: string | null = null

  if (payload.type === 'image' && typeof content === 'string' && content.startsWith('data:')) {
    try {
      imagePath = saveImageDataUrl(id, content)
      content = null
    } catch {
      // If the save fails keep the data URL in content as a fallback
    }
  }

  const item = db
    .insert(items)
    .values({
      ...payload,
      id,
      content,
      imagePath,
      createdAt: now,
      updatedAt: now
    })
    .returning()
    .get()

  fetchOgIfAwaiting(item, fetchOgMetadata, { id: item.id, dayId: item.dayId })

  return item
}
