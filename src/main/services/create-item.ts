import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { ensureDay } from '../db/ensure-day'
import { getDb } from '../db'
import { items, type Item, type NewItem } from '../db/schema'
import { saveImageDataUrl } from './image-store'
import { fetchOgMetadata } from './og-fetcher'
import { needsOgFetch } from './item-metadata'

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

  if (needsOgFetch(item) && !item.title) {
    fetchOgMetadata(item.id, item.dayId, item.sourceUrl as string)
  }

  return item
}
